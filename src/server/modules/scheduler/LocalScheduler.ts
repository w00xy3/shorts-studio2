/**
 * LocalScheduler — Background queue worker for Shorts Studio.
 *
 * Architecture:
 *   - Runs a local background loop using setInterval in the Main process.
 *   - Every tick (configurable interval, default 30s), checks the post queue
 *     for scheduled posts whose scheduledAt time has passed.
 *   - When a post is due, triggers PostingModule.uploadVideo flow.
 *   - Emits scheduler:tick events with each check.
 *   - Emits scheduler:post-due when a post's time arrives.
 *   - Tracks post status transitions: scheduled → uploading → published / failed
 *   - Supports pause/resume/stop controls.
 *
 * Event emission model:
 *   In production Electron: BrowserWindow.webContents.send(channel, payload)
 *   In web preview: stored in a tick log that can be polled via API
 *
 * Mock behavior:
 *   - Uses mock posts from the in-memory store
 *   - "Publish now" action immediately marks a post as due
 *   - Scheduler tick finds due posts and triggers the PostingModule mock upload
 */

import type { Platform } from "@/shared/types/account";
import type { SchedulerStatus, PostStatus } from "@/shared/types/post";
import type { IpcResult } from "@/shared/types/ipc";

// ─── Scheduler event types ───────────────────────────────────────────────────

export interface SchedulerTickLog {
  id: string;
  timestamp: string;
  postsChecked: number;
  postsDue: number;
  status: SchedulerStatus;
  processedPostIds: string[];
}

export interface PostTransitionLog {
  id: string;
  postId: string;
  platform: Platform;
  previousStatus: PostStatus;
  newStatus: PostStatus;
  timestamp: string;
  error?: string;
}

// ─── Scheduled post in queue ─────────────────────────────────────────────────

export interface ScheduledPost {
  id: string;
  clipTitle: string;
  platform: Platform;
  accountDisplayName: string;
  status: PostStatus;
  scheduledAt: string;
  uploadProgress: number;
  errorMessage: string | null;
  platformPostId: string | null;
}

// ─── LocalScheduler class ────────────────────────────────────────────────────

export class LocalScheduler {
  private status: SchedulerStatus = "stopped";
  private intervalSeconds: number = 30;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private publishedCount: number = 0;
  private failedCount: number = 0;
  private lastTickAt: string | null = null;

  /** Tick log — recent scheduler ticks (capped at 50) */
  private tickLog: SchedulerTickLog[] = [];

  /** Post transition log — recent status changes (capped at 100) */
  private transitionLog: PostTransitionLog[] = [];

  /** Post queue — in-memory store of scheduled posts */
  private postQueue: ScheduledPost[] = [];

  /** Active upload promises — keyed by postId */
  private activeUploads = new Map<string, Promise<void>>();

  /** Callback invoked on each scheduler tick */
  private onTickCallback?: (tick: SchedulerTickLog) => void;

  /** Callback invoked when a post status transitions */
  private onPostTransition?: (transition: PostTransitionLog) => void;

  /** Callback to get upload progress (provided by PostingModule integration) */
  private getUploadProgressFn?: (postId: string) => { percent: number; chunkIndex: number; totalChunks: number } | null;

  // ─── Constructor ────────────────────────────────────────────────────────

  constructor(options?: {
    intervalSeconds?: number;
    onTick?: (tick: SchedulerTickLog) => void;
    onPostTransition?: (transition: PostTransitionLog) => void;
    getUploadProgress?: (postId: string) => { percent: number; chunkIndex: number; totalChunks: number } | null;
  }) {
    if (options?.intervalSeconds) {
      this.intervalSeconds = Math.max(5, Math.min(3600, options.intervalSeconds));
    }
    this.onTickCallback = options?.onTick;
    this.onPostTransition = options?.onPostTransition;
    this.getUploadProgressFn = options?.getUploadProgress;
  }

  // ─── Start / Stop / Control ─────────────────────────────────────────────

  /**
   * Starts the scheduler background loop.
   * Returns IpcResult with the current state.
   */
  start(): IpcResult<{ status: SchedulerStatus }> {
    if (this.status === "running") {
      return {
        ok: false,
        error: { code: "SCHEDULER_ALREADY_RUNNING", message: "Scheduler is already running", retryable: false },
      };
    }

    this.status = "running";
    this.startTickLoop();

    return { ok: true, data: { status: this.status } };
  }

  /**
   * Pauses the scheduler. Tick loop stops but state is preserved.
   */
  pause(): IpcResult<{ status: SchedulerStatus }> {
    if (this.status !== "running") {
      return {
        ok: false,
        error: { code: "SCHEDULER_NOT_RUNNING", message: "Cannot pause: scheduler is not running", retryable: false },
      };
    }

    this.status = "paused";
    this.stopTickLoop();

    return { ok: true, data: { status: this.status } };
  }

  /**
   * Resumes the scheduler from a paused state.
   */
  resume(): IpcResult<{ status: SchedulerStatus }> {
    if (this.status !== "paused") {
      return {
        ok: false,
        error: { code: "SCHEDULER_NOT_RUNNING", message: "Cannot resume: scheduler is not paused", retryable: false },
      };
    }

    this.status = "running";
    this.startTickLoop();

    return { ok: true, data: { status: this.status } };
  }

  /**
   * Stops the scheduler completely. All state is reset.
   */
  stop(): IpcResult<{ status: SchedulerStatus }> {
    this.status = "stopped";
    this.stopTickLoop();

    return { ok: true, data: { status: this.status } };
  }

  /**
   * Updates the tick interval.
   */
  setInterval(seconds: number): IpcResult<{ intervalSeconds: number }> {
    if (seconds < 5 || seconds > 3600) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Interval must be between 5 and 3600 seconds", retryable: false },
      };
    }

    this.intervalSeconds = seconds;

    // Restart tick loop if running
    if (this.status === "running") {
      this.stopTickLoop();
      this.startTickLoop();
    }

    return { ok: true, data: { intervalSeconds: this.intervalSeconds } };
  }

  // ─── Post Queue Management ──────────────────────────────────────────────

  /**
   * Adds a post to the scheduler queue.
   */
  addPost(post: ScheduledPost): void {
    // Check if already in queue
    const existing = this.postQueue.find((p) => p.id === post.id);
    if (existing) {
      // Update existing
      Object.assign(existing, post);
    } else {
      this.postQueue.push(post);
    }
  }

  /**
   * Removes a post from the queue.
   */
  removePost(postId: string): boolean {
    const index = this.postQueue.findIndex((p) => p.id === postId);
    if (index === -1) return false;
    this.postQueue.splice(index, 1);
    return true;
  }

  /**
   * Triggers immediate publishing of a specific post.
   * Used by the "Publish now" button in the UI.
   */
  publishNow(postId: string): IpcResult<{ started: boolean; postId: string }> {
    const post = this.postQueue.find((p) => p.id === postId);
    if (!post) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: `Post not found: ${postId}`, retryable: false },
      };
    }

    if (post.status === "uploading") {
      return {
        ok: false,
        error: { code: "INVALID_POST_STATE", message: `Post ${postId} is already uploading`, retryable: false },
      };
    }

    if (post.status === "published") {
      return {
        ok: false,
        error: { code: "INVALID_POST_STATE", message: `Post ${postId} is already published`, retryable: false },
      };
    }

    // Trigger upload immediately
    this.triggerPostUpload(post);

    return { ok: true, data: { started: true, postId } };
  }

  /**
   * Retries a failed post.
   */
  retryPost(postId: string): IpcResult<{ started: boolean; postId: string }> {
    const post = this.postQueue.find((p) => p.id === postId);
    if (!post) {
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: `Post not found: ${postId}`, retryable: false },
      };
    }

    if (post.status !== "failed") {
      return {
        ok: false,
        error: { code: "INVALID_POST_STATE", message: `Can only retry failed posts. Current status: ${post.status}`, retryable: false },
      };
    }

    // Reset status and retry
    post.status = "scheduled";
    post.errorMessage = null;
    post.uploadProgress = 0;
    this.triggerPostUpload(post);

    return { ok: true, data: { started: true, postId } };
  }

  // ─── Getters ────────────────────────────────────────────────────────────

  getState() {
    const scheduledPosts = this.postQueue.filter((p) => p.status === "scheduled");
    const nextScheduled = scheduledPosts.length > 0
      ? scheduledPosts.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0].scheduledAt
      : null;

    return {
      status: this.status,
      queueLength: this.postQueue.filter((p) => p.status === "scheduled").length,
      nextScheduledAt: nextScheduled,
      lastTickAt: this.lastTickAt,
      publishedCount: this.publishedCount,
      failedCount: this.failedCount,
      intervalSeconds: this.intervalSeconds,
      activeUploads: this.activeUploads.size,
    };
  }

  getPostQueue(): ScheduledPost[] {
    return [...this.postQueue];
  }

  getTickLog(): SchedulerTickLog[] {
    return [...this.tickLog];
  }

  getTransitionLog(): PostTransitionLog[] {
    return [...this.transitionLog];
  }

  // ─── Private: Tick Loop ────────────────────────────────────────────────

  private startTickLoop(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);

    // Run first tick immediately
    this.performTick();

    // Then run on interval
    this.tickInterval = setInterval(() => {
      this.performTick();
    }, this.intervalSeconds * 1000);
  }

  private stopTickLoop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  private performTick(): void {
    const now = new Date();
    this.lastTickAt = now.toISOString();

    // Check for due posts (scheduled time has passed)
    const duePosts = this.postQueue.filter((post) => {
      if (post.status !== "scheduled") return false;
      if (!post.scheduledAt) return false;
      return new Date(post.scheduledAt) <= now;
    });

    // Create tick log entry
    const tickEntry: SchedulerTickLog = {
      id: `tick_${Date.now()}`,
      timestamp: now.toISOString(),
      postsChecked: this.postQueue.filter((p) => p.status === "scheduled").length,
      postsDue: duePosts.length,
      status: this.status,
      processedPostIds: duePosts.map((p) => p.id),
    };

    this.addTickLog(tickEntry);

    // Notify callback
    if (this.onTickCallback) {
      this.onTickCallback(tickEntry);
    }

    // Trigger uploads for due posts
    for (const post of duePosts) {
      this.triggerPostUpload(post);
    }
  }

  // ─── Private: Post Upload ──────────────────────────────────────────────

  private triggerPostUpload(post: ScheduledPost): void {
    // Don't double-upload
    if (this.activeUploads.has(post.id)) return;

    // Transition: scheduled → uploading
    this.transitionPost(post.id, "scheduled", "uploading");
    post.status = "uploading";

    // Start mock chunked upload simulation
    const uploadPromise = this.simulateUpload(post);
    this.activeUploads.set(post.id, uploadPromise);

    uploadPromise
      .then((success) => {
        this.activeUploads.delete(post.id);
        if (success) {
          // Transition: uploading → published
          this.transitionPost(post.id, "uploading", "published");
          post.status = "published";
          post.uploadProgress = 100;
          post.platformPostId = this.generatePlatformPostId(post.platform);
          post.errorMessage = null;
          this.publishedCount++;
        } else {
          // Transition: uploading → failed
          this.transitionPost(post.id, "uploading", "failed", "Simulated upload failure");
          post.status = "failed";
          post.errorMessage = "Upload failed — simulated error";
          this.failedCount++;
        }
      })
      .catch(() => {
        this.activeUploads.delete(post.id);
        this.transitionPost(post.id, "uploading", "failed", "Upload threw an exception");
        post.status = "failed";
        post.errorMessage = "Upload failed — exception";
        this.failedCount++;
      });
  }

  /**
   * Simulates a chunked upload by incrementing progress over time.
   * Returns true on success, false on simulated failure.
   */
  private simulateUpload(post: ScheduledPost): Promise<boolean> {
    return new Promise((resolve) => {
      const totalChunks = 5;
      let currentChunk = 0;

      const uploadInterval = setInterval(() => {
        currentChunk++;
        post.uploadProgress = Math.round((currentChunk / totalChunks) * 100);

        // Update progress via callback
        if (this.getUploadProgressFn) {
          // External progress tracking handled by PostingModule
        }

        if (currentChunk >= totalChunks) {
          clearInterval(uploadInterval);

          // ~90% success rate for simulation
          const success = Math.random() > 0.10;
          resolve(success);
        }
      }, 700 + Math.random() * 500); // 700-1200ms per chunk
    });
  }

  // ─── Private: Helpers ──────────────────────────────────────────────────

  private transitionPost(
    postId: string,
    previousStatus: PostStatus,
    newStatus: PostStatus,
    error?: string,
  ): void {
    const post = this.postQueue.find((p) => p.id === postId);
    const transition: PostTransitionLog = {
      id: `trans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      postId,
      platform: post?.platform ?? "tiktok",
      previousStatus,
      newStatus,
      timestamp: new Date().toISOString(),
      error,
    };

    this.addTransitionLog(transition);

    if (this.onPostTransition) {
      this.onPostTransition(transition);
    }
  }

  private addTickLog(tick: SchedulerTickLog): void {
    this.tickLog.unshift(tick);
    if (this.tickLog.length > 50) {
      this.tickLog = this.tickLog.slice(0, 50);
    }
  }

  private addTransitionLog(transition: PostTransitionLog): void {
    this.transitionLog.unshift(transition);
    if (this.transitionLog.length > 100) {
      this.transitionLog = this.transitionLog.slice(0, 100);
    }
  }

  private generatePlatformPostId(platform: Platform): string {
    const id = Math.random().toString(36).slice(2, 10);
    switch (platform) {
      case "tiktok":
        return `tiktok_post_${id}`;
      case "youtube":
        return `yt_short_${id}`;
      case "instagram":
        return `ig_reel_${id}`;
    }
  }

  /**
   * Loads initial mock posts into the queue.
   */
  loadMockPosts(posts: ScheduledPost[]): void {
    this.postQueue = [...posts];
  }
}
