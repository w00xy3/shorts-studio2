/**
 * LocalScheduler custom error classes.
 *
 * Each error maps directly to an IpcErrorCode from the shared type system.
 */

import type { IpcErrorCode } from "@/shared/types/ipc";

// ─── Base class ──────────────────────────────────────────────────────────────

/**
 * Base error for all LocalScheduler operations.
 */
export class SchedulerError extends Error {
  public readonly code: IpcErrorCode;
  public readonly details?: string;
  public readonly retryable: boolean;

  constructor(params: {
    code: IpcErrorCode;
    message: string;
    details?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = "SchedulerError";
    this.code = params.code;
    this.details = params.details;
    this.retryable = params.retryable ?? false;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when trying to start a scheduler that is already running */
export class SchedulerAlreadyRunningError extends SchedulerError {
  constructor() {
    super({
      code: "SCHEDULER_ALREADY_RUNNING",
      message: "Scheduler is already running",
      retryable: false,
    });
    this.name = "SchedulerAlreadyRunningError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when trying to control a scheduler that is not running */
export class SchedulerNotRunningError extends SchedulerError {
  constructor(action: string) {
    super({
      code: "SCHEDULER_NOT_RUNNING",
      message: `Cannot ${action}: scheduler is not running`,
      retryable: false,
    });
    this.name = "SchedulerNotRunningError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
