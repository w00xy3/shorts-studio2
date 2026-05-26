'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import {
  Folder,
  FolderOpen,
  FileCode2,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  Shield,
  Clock,
  Zap,
  Lock,
  CheckCircle2,
  Layers,
  Activity,
  Monitor,
  Server,
  ArrowLeftRight,
  Box,
  Cpu,
  CalendarClock,
  Upload,
  Video,
  KeyRound,
  Settings2,
  Play,
  Scissors,
  Loader2,
  XCircle,
  Gauge,
  Trash2,
  LayoutDashboard,
  Film,
  Users,
  Calendar,
  HardDrive,
  TrendingUp,
  Clock4,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  Grid3X3,
  List,
  Filter,
  SquareStack,
  Smartphone,
  SlidersHorizontal,
  ChevronUp,
  Plus,
  Send,
  Pause,
  StopCircle,
  Eye,
  MoreVertical,
  Globe,
  AlertTriangle,
  Heart,
  MessageSquare,
  Share2,
  FileText,
  Save,
  Info,
  X,
  PartyPopper,
  Sun,
  Moon,
  BarChart3,
  FileVideo,
  TrendingDown,
  AlertCircle,
  ThumbsUp,
  Rocket,
  Timer,
  RotateCcw,
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// ─── Animation variants ─────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
}

// ─── Shared types for mock data ─────────────────────────────────────────────

type Platform = 'tiktok' | 'youtube' | 'instagram'
type ClipStatus = 'pending' | 'processing' | 'done' | 'error'
type CropMode = 'center' | 'blur'
type AccountStatus = 'active' | 'expired' | 'revoked' | 'error'
type PostStatus = 'draft' | 'scheduled' | 'uploading' | 'published' | 'failed'
type SchedulerStatus = 'running' | 'paused' | 'stopped'

// ─── Platform config ────────────────────────────────────────────────────────

const platformConfig: Record<Platform, { label: string; color: string; bgClass: string; textClass: string; borderClass: string; icon: React.ReactNode }> = {
  tiktok: {
    label: 'TikTok',
    color: 'rose',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200',
    icon: <Globe className="size-4" />,
  },
  youtube: {
    label: 'YouTube',
    color: 'red',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
    borderClass: 'border-red-200',
    icon: <Play className="size-4" />,
  },
  instagram: {
    label: 'Instagram',
    color: 'orange',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-200',
    icon: <CameraIcon className="size-4" />,
  },
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  )
}

function FilmIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <line x1="7" x2="7" y1="3" y2="21" />
      <line x1="17" x2="17" y1="3" y2="21" />
      <line x1="3" x2="7" y1="8" y2="8" />
      <line x1="17" x2="21" y1="8" y2="8" />
      <line x1="3" x2="7" y1="16" y2="16" />
      <line x1="17" x2="21" y1="16" y2="16" />
    </svg>
  )
}

// ─── Status badge helpers ────────────────────────────────────────────────────

const clipStatusConfig: Record<ClipStatus, { label: string; className: string }> = {
  pending: { label: 'Ожидание', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  processing: { label: 'Обработка', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  done: { label: 'Готово', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  error: { label: 'Ошибка', className: 'bg-rose-100 text-rose-800 border-rose-200' },
}

const accountStatusConfig: Record<AccountStatus, { label: string; className: string }> = {
  active: { label: 'Активен', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  expired: { label: 'Истёк', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  revoked: { label: 'Отозван', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  error: { label: 'Ошибка', className: 'bg-red-100 text-red-800 border-red-200' },
}

const postStatusConfig: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  scheduled: { label: 'Запланирован', className: 'bg-teal-100 text-teal-800 border-teal-200' },
  uploading: { label: 'Загрузка', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  published: { label: 'Опубликован', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  failed: { label: 'Ошибка', className: 'bg-rose-100 text-rose-800 border-rose-200' },
}

// ─── Mock data ──────────────────────────────────────────────────────────────

const mockClips = [
  { id: 'clip_001', title: 'Interview Highlight — Key Quote', startTime: 120, endTime: 180, cropMode: 'center' as CropMode, status: 'done' as ClipStatus, postedTo: ['tiktok', 'youtube'] as Platform[], duration: 60 },
  { id: 'clip_002', title: 'Funny Reaction Moment', startTime: 450, endTime: 520, cropMode: 'blur' as CropMode, status: 'done' as ClipStatus, postedTo: ['instagram'] as Platform[], duration: 70 },
  { id: 'clip_003', title: 'Product Demo — Feature Showcase', startTime: 780, endTime: 860, cropMode: 'center' as CropMode, status: 'processing' as ClipStatus, postedTo: [] as Platform[], duration: 80 },
  { id: 'clip_004', title: 'Behind the Scenes Bloopers', startTime: 1200, endTime: 1280, cropMode: 'blur' as CropMode, status: 'pending' as ClipStatus, postedTo: [] as Platform[], duration: 80 },
  { id: 'clip_005', title: 'Tutorial Step 1 — Setup', startTime: 30, endTime: 90, cropMode: 'center' as CropMode, status: 'done' as ClipStatus, postedTo: ['tiktok', 'youtube', 'instagram'] as Platform[], duration: 60 },
  { id: 'clip_006', title: 'Tutorial Step 2 — Configuration', startTime: 95, endTime: 155, cropMode: 'blur' as CropMode, status: 'error' as ClipStatus, postedTo: [] as Platform[], duration: 60 },
  { id: 'clip_007', title: 'Travel Vlog — Sunset Scene', startTime: 2000, endTime: 2070, cropMode: 'blur' as CropMode, status: 'done' as ClipStatus, postedTo: ['instagram', 'tiktok'] as Platform[], duration: 70 },
  { id: 'clip_008', title: 'Street Food Review — Best Tacos', startTime: 2500, endTime: 2580, cropMode: 'center' as CropMode, status: 'done' as ClipStatus, postedTo: ['youtube'] as Platform[], duration: 80 },
]

const mockAccounts = [
  { id: 'acc_001', platform: 'tiktok' as Platform, displayName: '@CreativeStudio', status: 'active' as AccountStatus, connectedAt: '15 мая 2026', tokenExpiresAt: '21 мая 2026', lastRefreshedAt: '20 мая 2026, 09:00' },
  { id: 'acc_002', platform: 'youtube' as Platform, displayName: 'Tech Reviews HD', status: 'active' as AccountStatus, connectedAt: '10 мая 2026', tokenExpiresAt: '20 мая 2026, 16:00', lastRefreshedAt: '20 мая 2026, 12:00' },
  { id: 'acc_003', platform: 'instagram' as Platform, displayName: '@TravelVibes.official', status: 'expired' as AccountStatus, connectedAt: '5 мая 2026', tokenExpiresAt: '19 мая 2026', lastRefreshedAt: '18 мая 2026, 10:00' },
]

const mockPosts = [
  { id: 'post_001', clipTitle: 'Interview Highlight — Key Quote', platform: 'tiktok' as Platform, accountName: '@CreativeStudio', status: 'published' as PostStatus, scheduledAt: '20 мая, 12:00', description: 'The most inspiring moment! 🔥', tags: '#interview,#motivation' },
  { id: 'post_002', clipTitle: 'Interview Highlight — Key Quote', platform: 'youtube' as Platform, accountName: 'Tech Reviews HD', status: 'published' as PostStatus, scheduledAt: '20 мая, 12:00', description: 'Full interview highlight!', tags: '#interview,#shorts' },
  { id: 'post_003', clipTitle: 'Funny Reaction Moment', platform: 'instagram' as Platform, accountName: '@TravelVibes.official', status: 'failed' as PostStatus, scheduledAt: '20 мая, 14:00', description: 'You won\'t believe this 😂', tags: '#funny,#reaction' },
  { id: 'post_004', clipTitle: 'Tutorial Step 1 — Setup', platform: 'tiktok' as Platform, accountName: '@CreativeStudio', status: 'scheduled' as PostStatus, scheduledAt: '21 мая, 10:00', description: 'Get started in 60 seconds!', tags: '#tutorial,#setup' },
  { id: 'post_005', clipTitle: 'Tutorial Step 1 — Setup', platform: 'youtube' as Platform, accountName: 'Tech Reviews HD', status: 'scheduled' as PostStatus, scheduledAt: '21 мая, 10:30', description: 'Step-by-step tutorial', tags: '#tutorial,#beginners' },
  { id: 'post_006', clipTitle: 'Travel Vlog — Sunset Scene', platform: 'tiktok' as Platform, accountName: '@CreativeStudio', status: 'scheduled' as PostStatus, scheduledAt: '22 мая, 18:00', description: 'Golden hour vibes 🌅', tags: '#travel,#sunset' },
]

const recentActivity = [
  { id: '1', text: 'Клип «Interview Highlight» обработан — 2 мин назад', icon: <CheckCircle2 className="size-4 text-emerald-500" />, color: 'emerald' },
  { id: '2', text: 'Аккаунт TikTok подключён — 1 час назад', icon: <Globe className="size-4 text-rose-500" />, color: 'rose' },
  { id: '3', text: 'Пост опубликован на YouTube — 3 часа назад', icon: <Play className="size-4 text-red-500" />, color: 'red' },
  { id: '4', text: 'Клип «Funny Reaction» обработан — 5 часов назад', icon: <CheckCircle2 className="size-4 text-emerald-500" />, color: 'emerald' },
  { id: '5', text: 'Ошибка публикации в Instagram — вчера', icon: <XCircle className="size-4 text-rose-500" />, color: 'rose' },
  { id: '6', text: 'Видео «Full Interview» импортировано — вчера', icon: <Video className="size-4 text-teal-500" />, color: 'teal' },
]

// ─── Architecture data (condensed from old tabs) ────────────────────────────

interface TreeNode {
  name: string
  comment?: string
  children?: TreeNode[]
  isFile?: boolean
}

const folderTree: TreeNode[] = [
  {
    name: 'src/',
    children: [
      { name: 'app/', comment: 'Next.js App Router', children: [
        { name: 'page.tsx', isFile: true, comment: 'Main UI' },
        { name: 'api/', comment: 'API routes', children: [
          { name: 'video/', children: [{ name: 'render/route.ts', isFile: true }, { name: 'progress/route.ts', isFile: true }] },
          { name: 'posting/', children: [{ name: 'upload/route.ts', isFile: true }, { name: 'progress/route.ts', isFile: true }] },
          { name: 'clips/route.ts', isFile: true },
          { name: 'accounts/route.ts', isFile: true },
          { name: 'posts/route.ts', isFile: true },
          { name: 'scheduler/route.ts', isFile: true },
        ] },
      ] },
      { name: 'server/', comment: 'Main process', children: [
        { name: 'modules/', children: [
          { name: 'video/', comment: 'VideoProcessingModule', children: [{ name: 'VideoProcessingModule.ts', isFile: true }, { name: 'errors.ts', isFile: true }] },
          { name: 'token-manager/', comment: 'TokenManager', children: [{ name: 'TokenManager.ts', isFile: true }, { name: 'errors.ts', isFile: true }] },
          { name: 'posting/', comment: 'PostingModule', children: [{ name: 'PostingModule.ts', isFile: true }, { name: 'errors.ts', isFile: true }] },
          { name: 'scheduler/', comment: 'LocalScheduler', children: [{ name: 'LocalScheduler.ts', isFile: true }, { name: 'errors.ts', isFile: true }] },
        ] },
      ] },
      { name: 'shared/', comment: 'Shared types', children: [
        { name: 'types/', children: [{ name: 'ipc.ts', isFile: true }, { name: 'video.ts', isFile: true }, { name: 'account.ts', isFile: true }, { name: 'post.ts', isFile: true }, { name: 'events.ts', isFile: true }] },
        { name: 'validators/', children: [{ name: 'schemas.ts', isFile: true }] },
      ] },
      { name: 'components/ui/', comment: 'shadcn/ui' },
    ],
  },
]

interface IpcContract {
  channel: string
  direction: string
  payload: string
  response: string
  description: string
}

const ipcContracts: Record<string, IpcContract[]> = {
  Video: [
    { channel: 'video:import', direction: 'Renderer → Main', payload: 'ImportVideoPayload', response: 'SourceVideo', description: 'Импорт исходного видео' },
    { channel: 'video:get', direction: 'Renderer → Main', payload: '{ videoId }', response: 'SourceVideo', description: 'Получить видео по ID' },
    { channel: 'video:list', direction: 'Renderer → Main', payload: '{ filter? }', response: 'SourceVideo[]', description: 'Список видео' },
    { channel: 'video:delete', direction: 'Renderer → Main', payload: '{ videoId, deleteFiles? }', response: '{ deleted }', description: 'Удалить видео' },
    { channel: 'video:analyze', direction: 'Renderer → Main', payload: '{ filePath }', response: 'VideoMetadata', description: 'Анализ через FFprobe' },
  ],
  Clip: [
    { channel: 'clip:create', direction: 'Renderer → Main', payload: 'CreateClipPayload', response: 'Clip', description: 'Создать клип' },
    { channel: 'clip:process', direction: 'Renderer → Main', payload: 'ProcessClipPayload', response: '{ started, clipId }', description: 'Запустить обработку' },
    { channel: 'clip:cancel', direction: 'Renderer → Main', payload: 'CancelClipPayload', response: '{ cancelled }', description: 'Отменить обработку' },
    { channel: 'clip:list', direction: 'Renderer → Main', payload: '{ sourceVideoId?, status? }', response: 'Clip[]', description: 'Список клипов' },
  ],
  Account: [
    { channel: 'account:connect', direction: 'Renderer → Main', payload: 'ConnectAccountPayload', response: '{ oauthUrl, state }', description: 'OAuth-подключение' },
    { channel: 'account:list', direction: 'Renderer → Main', payload: '{ filter? }', response: 'Account[]', description: 'Список аккаунтов' },
    { channel: 'account:refresh-token', direction: 'Renderer → Main', payload: 'RefreshTokenPayload', response: 'TokenRefreshResult', description: 'Обновить токен' },
    { channel: 'account:validate-token', direction: 'Renderer → Main', payload: '{ accountId }', response: '{ isValid, needsRefresh }', description: 'Проверить токен' },
  ],
  Post: [
    { channel: 'post:create', direction: 'Renderer → Main', payload: 'CreatePostPayload', response: 'Post', description: 'Создать пост' },
    { channel: 'post:publish', direction: 'Renderer → Main', payload: 'PublishPostPayload', response: '{ started, postId }', description: 'Опубликовать' },
    { channel: 'post:queue', direction: 'Renderer → Main', payload: '{ limit? }', response: 'PostQueueItem[]', description: 'Очередь постов' },
  ],
  Scheduler: [
    { channel: 'scheduler:get-state', direction: 'Renderer → Main', payload: 'void', response: 'SchedulerState', description: 'Состояние планировщика' },
    { channel: 'scheduler:control', direction: 'Renderer → Main', payload: 'SchedulerControlPayload', response: '{ success }', description: 'Управление планировщиком' },
  ],
}

interface EventStream {
  channel: string
  payloadFields: string
  whenFires: string
}

const eventStreams: Record<string, EventStream[]> = {
  Video: [
    { channel: 'video:imported', payloadFields: 'sourceVideoId, fileName, duration', whenFires: 'Видео импортировано' },
    { channel: 'video:metadata-ready', payloadFields: 'sourceVideoId, width, height, codec', whenFires: 'FFprobe готов' },
  ],
  Clip: [
    { channel: 'clip:progress', payloadFields: 'clipId, percent, speed, eta', whenFires: 'Прогресс обработки' },
    { channel: 'clip:completed', payloadFields: 'clipId, outputFilePath', whenFires: 'Клип обработан' },
    { channel: 'clip:error', payloadFields: 'clipId, error, retryable', whenFires: 'Ошибка обработки' },
  ],
  Account: [
    { channel: 'account:connected', payloadFields: 'accountId, platform', whenFires: 'Аккаунт подключён' },
    { channel: 'account:token-refreshed', payloadFields: 'accountId, newExpiresAt', whenFires: 'Токен обновлён' },
    { channel: 'account:token-expired', payloadFields: 'accountId, reason', whenFires: 'Токен истёк' },
  ],
  Post: [
    { channel: 'post:upload-progress', payloadFields: 'postId, percent, speed', whenFires: 'Прогресс загрузки' },
    { channel: 'post:published', payloadFields: 'postId, platformPostId', whenFires: 'Пост опубликован' },
    { channel: 'post:failed', payloadFields: 'postId, error, retryable', whenFires: 'Ошибка публикации' },
  ],
  Scheduler: [
    { channel: 'scheduler:tick', payloadFields: 'timestamp, postsDue', whenFires: 'Тик планировщика' },
    { channel: 'scheduler:post-due', payloadFields: 'postId, scheduledAt', whenFires: 'Пост готов к публикации' },
  ],
}

const principles = [
  { icon: ArrowLeftRight, title: 'IPC-based Communication', description: 'Типизированные IPC каналы для Renderer ↔ Main', accent: 'text-emerald-600', bgAccent: 'bg-emerald-50', borderAccent: 'border-emerald-200' },
  { icon: Lock, title: 'Tokens in Keytar', description: 'OAuth-токены в системном keystore, БД содержит только tokenKeyRef', accent: 'text-rose-600', bgAccent: 'bg-rose-50', borderAccent: 'border-rose-200' },
  { icon: Clock, title: 'Local Scheduler Worker', description: 'Встроенный планировщик с настраиваемым интервалом', accent: 'text-amber-600', bgAccent: 'bg-amber-50', borderAccent: 'border-amber-200' },
  { icon: CheckCircle2, title: 'Result<T> Pattern', description: 'IpcResult<T> — дискриминированный union для всех IPC команд', accent: 'text-teal-600', bgAccent: 'bg-teal-50', borderAccent: 'border-teal-200' },
  { icon: Shield, title: 'Zod Validation', description: 'Валидация Zod-схемами на границе IPC', accent: 'text-orange-600', bgAccent: 'bg-orange-50', borderAccent: 'border-orange-200' },
]

const domainColors: Record<string, string> = {
  Video: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Clip: 'bg-teal-100 text-teal-800 border-teal-200',
  Account: 'bg-rose-100 text-rose-800 border-rose-200',
  Post: 'bg-amber-100 text-amber-800 border-amber-200',
  Scheduler: 'bg-orange-100 text-orange-800 border-orange-200',
}

// ─── Tree Node component ─────────────────────────────────────────────────────

function TreeNodeComponent({ node, depth = 0, defaultOpen = true }: { node: TreeNode; depth?: number; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen && depth < 3)
  const hasChildren = node.children && node.children.length > 0
  const isFile = node.isFile

  const handleToggle = useCallback(() => {
    if (hasChildren) setIsOpen((prev) => !prev)
  }, [hasChildren])

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1.5 py-0.5 px-1 rounded hover:bg-white/5 cursor-pointer group transition-colors ${depth === 0 ? 'font-semibold' : ''}`}
        style={{ paddingLeft: `${depth * 20 + 4}px` }}
        onClick={handleToggle}
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onKeyDown={(e) => { if (hasChildren && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleToggle() } }}
      >
        {hasChildren ? (isOpen ? <ChevronDown className="size-3.5 text-emerald-400 shrink-0" /> : <ChevronRight className="size-3.5 text-emerald-400 shrink-0" />) : <span className="w-3.5 shrink-0" />}
        {isFile ? <FileCode2 className="size-3.5 text-slate-400 shrink-0" /> : hasChildren ? (isOpen ? <FolderOpen className="size-3.5 text-amber-400 shrink-0" /> : <Folder className="size-3.5 text-amber-400 shrink-0" />) : <Folder className="size-3.5 text-amber-400/60 shrink-0" />}
        <span className={`font-mono text-sm ${isFile ? 'text-slate-300' : hasChildren ? 'text-emerald-300' : 'text-emerald-300/60'}`}>{node.name}</span>
        {node.comment && <span className="text-slate-500 text-xs ml-2 hidden sm:inline">{node.comment}</span>}
      </div>
      {hasChildren && isOpen && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}>
          {node.children!.map((child, i) => (<TreeNodeComponent key={`${child.name}-${i}`} node={child} depth={depth + 1} defaultOpen={defaultOpen} />))}
        </motion.div>
      )}
    </div>
  )
}

// ─── Dashboard Tab ──────────────────────────────────────────────────────────

function DashboardTab() {
  const [schedulerState, setSchedulerState] = useState<{ status: SchedulerStatus; queueLength: number }>({ status: 'running', queueLength: 3 })

  useEffect(() => {
    fetch('/api/scheduler')
      .then(r => r.json())
      .then(data => { if (data.ok) setSchedulerState(data.data) })
      .catch(() => {})
  }, [])

  const statsCards = [
    { label: 'Видео импортировано', value: '3', icon: <Video className="size-5 text-emerald-600" />, bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200', valueColor: 'text-emerald-700' },
    { label: 'Клипов создано', value: '8', icon: <FilmIcon className="size-5 text-teal-600" />, bg: 'from-teal-50 to-teal-100/50', border: 'border-teal-200', valueColor: 'text-teal-700' },
    { label: 'Аккаунтов подключено', value: '2', icon: <Users className="size-5 text-amber-600" />, bg: 'from-amber-50 to-amber-100/50', border: 'border-amber-200', valueColor: 'text-amber-700' },
    { label: 'Постов опубликовано', value: '2', icon: <Send className="size-5 text-rose-600" />, bg: 'from-rose-50 to-rose-100/50', border: 'border-rose-200', valueColor: 'text-rose-700' },
  ]

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Hero */}
      <motion.div variants={fadeInUp}>
        <div className="rounded-xl overflow-hidden animated-gradient-border p-0.5">
          <Card className="border-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-800 dark:via-teal-800 dark:to-emerald-900 text-white overflow-hidden relative rounded-lg">
            <CardContent className="p-8 sm:p-10 relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Добро пожаловать в Shorts Studio</h2>
                  <p className="text-emerald-100 mt-3 text-base sm:text-lg max-w-lg leading-relaxed">Нарезка видео и автопостинг для TikTok, YouTube Shorts и Instagram Reels</p>
                </div>
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                        <Video className="size-4 mr-1.5" /> Импорт видео
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Импортировать новое видео для нарезки</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                        <Scissors className="size-4 mr-1.5" /> Создать клип
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Создать новый клип из видео</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
            {/* Dot pattern overlay */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          </Card>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <motion.div key={stat.label} variants={fadeInUp} custom={i}>
            <Card className={`bg-gradient-to-br ${stat.bg} ${stat.border} transition-all duration-200 hover:shadow-md`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className={`text-2xl sm:text-3xl font-bold ${stat.valueColor}`}>{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-5 text-teal-600" /> Последние действия
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-80">
                <div className="px-6 pb-4 space-y-1">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded transition-colors">
                      <div className="shrink-0">{item.icon}</div>
                      <span className="text-sm text-slate-700 flex-1">{item.text}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status + Quick Actions */}
        <motion.div variants={fadeInUp} className="space-y-4">
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="size-5 text-orange-600" /> Статус системы
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-muted-foreground">FFmpeg</span>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">Доступен</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-muted-foreground">Планировщик</span>
                <Badge className={schedulerState.status === 'running' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100'}>
                  {schedulerState.status === 'running' ? 'Работает' : schedulerState.status === 'paused' ? 'Пауза' : 'Остановлен'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-muted-foreground">Очередь постов</span>
                <span className="text-sm font-semibold text-slate-700">{schedulerState.queueLength}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Хранилище</span>
                <span className="text-sm font-semibold text-slate-700">4.2 GB / 50 GB</span>
              </div>
              <Progress value={8.4} className="h-2" />
            </CardContent>
          </Card>

          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="size-5 text-amber-600" /> Быстрые действия
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700 text-white" size="sm">
                    <Video className="size-4 mr-2" /> Импорт видео
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Импортировать видеофайл для обработки</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="w-full justify-start bg-teal-600 hover:bg-teal-700 text-white" size="sm">
                    <Scissors className="size-4 mr-2" /> Создать клип
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Нарезать клип из видео</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button className="w-full justify-start bg-amber-600 hover:bg-amber-700 text-white" size="sm">
                    <Users className="size-4 mr-2" /> Подключить аккаунт
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Подключить аккаунт через OAuth</TooltipContent>
              </Tooltip>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─── Video Manager Tab ──────────────────────────────────────────────────────

interface RenderHistoryItem {
  id: string
  clipName: string
  cropMode: 'center' | 'blur'
  duration: number
  status: 'done' | 'error'
  outputFilePath: string
}

function VideoManagerTab() {
  const [clipTitle, setClipTitle] = useState('Clip 1 — Highlight')
  const [startTime, setStartTime] = useState(120)
  const [endTime, setEndTime] = useState(180)
  const [cropMode, setCropMode] = useState<'center' | 'blur'>('center')
  const [blurStrength, setBlurStrength] = useState(20)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [renderStatus, setRenderStatus] = useState<'idle' | 'pending' | 'processing' | 'done' | 'error'>('idle')
  const [progressPercent, setProgressPercent] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [eta, setEta] = useState(0)
  const [bitrate, setBitrate] = useState(0)
  const [outputFilePath, setOutputFilePath] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [renderHistory, setRenderHistory] = useState<RenderHistoryItem[]>([])
  const [ffmpegSettingsOpen, setFfmpegSettingsOpen] = useState(false)
  const [ffmpegPreset, setFfmpegPreset] = useState('medium')
  const [ffmpegCrf, setFfmpegCrf] = useState(23)
  const [ffmpegAudioBitrate, setFfmpegAudioBitrate] = useState(128)
  const [showConfetti, setShowConfetti] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [])

  const handleCancelRender = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    setRenderStatus('idle')
    setProgressPercent(0)
  }, [])

  const handleStartRender = useCallback(async () => {
    setIsSubmitting(true)
    setRenderStatus('pending')
    setProgressPercent(0)
    setSpeed(0); setEta(0); setBitrate(0)
    setOutputFilePath(null); setErrorMessage(null)

    toast.info('Запуск обработки видео...')
    try {
      const response = await fetch('/api/video/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipId: `clip_${Date.now()}`, sourcePath: '/videos/sample_interview_full_episode.mp4', startTime, endTime, cropMode, width: 1080, height: 1920, blurStrength }),
      })
      const result = await response.json()
      if (!result.ok) { setRenderStatus('error'); setErrorMessage(result.error?.message || 'Unknown error'); setIsSubmitting(false); toast.error('Ошибка запуска рендеринга'); return }
      const newJobId = result.data.jobId
      setJobId(newJobId); setRenderStatus('processing'); setIsSubmitting(false)
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(async () => {
        try {
          const progressRes = await fetch(`/api/video/progress?jobId=${newJobId}`)
          const data = await progressRes.json()
          if (data.type === 'progress') { setProgressPercent(data.percent); setSpeed(data.speed); setEta(data.eta); setBitrate(data.bitrate); setRenderStatus('processing') }
          else if (data.type === 'complete') {
            setProgressPercent(100); setRenderStatus('done'); setOutputFilePath(data.outputFilePath); setShowConfetti(true)
            toast.success('Рендер завершён!', { description: data.outputFilePath })
            setTimeout(() => setShowConfetti(false), 3000)
            if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
            setRenderHistory((prev) => [{ id: newJobId, clipName: clipTitle, cropMode: data.cropMode || cropMode, duration: endTime - startTime, status: 'done', outputFilePath: data.outputFilePath }, ...prev])
          } else if (data.type === 'error') {
            setRenderStatus('error'); setErrorMessage(data.message || 'Render failed')
            toast.error('Ошибка рендеринга', { description: data.message || 'Render failed' })
            if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
            setRenderHistory((prev) => [{ id: newJobId, clipName: clipTitle, cropMode, duration: endTime - startTime, status: 'error', outputFilePath: '' }, ...prev])
          }
        } catch { /* retry on next interval */ }
      }, 300)
    } catch { setRenderStatus('error'); setErrorMessage('Failed to start rendering'); setIsSubmitting(false); toast.error('Не удалось запустить рендеринг') }
  }, [clipTitle, startTime, endTime, cropMode, blurStrength])

  const statusBadgeMap: Record<string, { label: string; className: string }> = {
    idle: { label: 'Idle', className: 'bg-slate-100 text-slate-700 border-slate-200' },
    pending: { label: 'Pending', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    processing: { label: 'Processing', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    done: { label: 'Done', className: 'bg-teal-100 text-teal-800 border-teal-200' },
    error: { label: 'Error', className: 'bg-rose-100 text-rose-800 border-rose-200' },
  }
  const currentStatus = statusBadgeMap[renderStatus] || statusBadgeMap.idle

  // Timeline visualization
  const totalDuration = 2730 // 45:30 in seconds
  const sourceClips = [
    { title: 'Key Quote', start: 120, end: 180, color: 'bg-emerald-400' },
    { title: 'Reaction', start: 450, end: 520, color: 'bg-teal-400' },
    { title: 'Demo', start: 780, end: 860, color: 'bg-amber-400' },
    { title: 'Bloopers', start: 1200, end: 1280, color: 'bg-rose-400' },
  ]

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Video Upload Dropzone */}
      <motion.div variants={fadeInUp}>
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${
            isDragOver
              ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 scale-[1.01] shadow-lg shadow-emerald-100/50'
              : 'border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-300 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setIsDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) { setUploadedFileName(file.name); toast.success('Видео загружено!', { description: file.name }) }
          }}
          onClick={() => {
            const input = document.createElement('input'); input.type = 'file'; input.accept = '.mp4,.mov,.avi,.mkv'
            input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { setUploadedFileName(f.name); toast.success('Видео загружено!', { description: f.name }) } }
            input.click()
          }}
          role="button"
          tabIndex={0}
        >
          <div className="flex flex-col items-center gap-3">
            <div className={`size-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragOver ? 'bg-emerald-100 dark:bg-emerald-900 scale-110' : 'bg-slate-100 dark:bg-slate-700'}`}>
              {isDragOver ? <FileVideo className="size-7 text-emerald-500" /> : <Upload className="size-7 text-slate-400" />}
            </div>
            <div>
              <p className={`text-sm font-medium ${isDragOver ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-300'}`}>
                {isDragOver ? 'Отпустите для загрузки' : 'Перетащите видео сюда или нажмите для выбора'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                MP4, MOV, AVI, MKV • Макс. 2 GB
              </p>
            </div>
            {uploadedFileName && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-200 dark:border-emerald-700">
                <FileVideo className="size-3 mr-1" /> {uploadedFileName}
              </Badge>
            )}
          </div>
          {isDragOver && <div className="absolute inset-0 rounded-xl ring-2 ring-emerald-400/50 animate-pulse pointer-events-none" />}
        </div>
      </motion.div>

      {/* Top: Source Video + Clip Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <Card className="h-full border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Video className="size-5 text-emerald-600" /> Исходное видео</CardTitle>
              <CardDescription>Источник для нарезки клипов</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-teal-900/40" />
                  <div className="relative flex flex-col items-center gap-2 text-white/80">
                    <Play className="size-12 opacity-60" />
                    <span className="text-xs font-mono opacity-60">16:9 Preview</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-sm font-medium truncate">Sample Interview — Full Episode.mp4</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/80 rounded-lg p-3 border border-emerald-100"><div className="text-xs text-muted-foreground mb-1">Разрешение</div><div className="font-semibold text-teal-700">1920×1080</div></div>
                  <div className="bg-white/80 rounded-lg p-3 border border-emerald-100"><div className="text-xs text-muted-foreground mb-1">Длительность</div><div className="font-semibold text-teal-700">00:45:30</div></div>
                  <div className="bg-white/80 rounded-lg p-3 border border-emerald-100"><div className="text-xs text-muted-foreground mb-1">Кодек</div><div className="font-semibold text-teal-700">H.264 / AAC</div></div>
                  <div className="bg-white/80 rounded-lg p-3 border border-emerald-100"><div className="text-xs text-muted-foreground mb-1">Размер</div><div className="font-semibold text-teal-700">2.4 GB</div></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card className="h-full border-teal-200 bg-gradient-to-br from-teal-50/50 to-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scissors className="size-5 text-teal-600" /> Параметры клипа</CardTitle>
              <CardDescription>Настройка нарезки и обрезки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clip-title" className="text-sm font-medium">Название клипа</Label>
                <Input id="clip-title" value={clipTitle} onChange={(e) => setClipTitle(e.target.value)} placeholder="Название клипа" className="border-teal-200 focus:border-teal-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-time" className="text-sm font-medium">Начало (сек)</Label>
                  <Input id="start-time" type="number" value={startTime} onChange={(e) => setStartTime(Number(e.target.value))} className="border-teal-200 focus:border-teal-400" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time" className="text-sm font-medium">Конец (сек)</Label>
                  <Input id="end-time" type="number" value={endTime} onChange={(e) => setEndTime(Number(e.target.value))} className="border-teal-200 focus:border-teal-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Режим обрезки</Label>
                <RadioGroup value={cropMode} onValueChange={(v) => setCropMode(v as 'center' | 'blur')} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="center" id="crop-center" /><Label htmlFor="crop-center" className="text-sm cursor-pointer">Smart Crop (центр)</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="blur" id="crop-blur" /><Label htmlFor="crop-blur" className="text-sm cursor-pointer">Blur Background</Label></div>
                </RadioGroup>
              </div>
              {cropMode === 'blur' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
                  <Label className="text-sm font-medium">Сила размытия: {blurStrength}</Label>
                  <Slider value={[blurStrength]} onValueChange={(v) => setBlurStrength(v[0])} min={0} max={40} step={1} />
                </motion.div>
              )}
              <div className="bg-teal-50 rounded-lg p-3 border border-teal-100 text-sm">
                <span className="text-muted-foreground">Выход: </span><span className="font-semibold text-teal-700">1080×1920 (9:16)</span>
              </div>

              {/* FFmpeg Settings Collapsible */}
              <Collapsible open={ffmpegSettingsOpen} onOpenChange={setFfmpegSettingsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                    <span className="flex items-center gap-2"><SlidersHorizontal className="size-4" /> Настройки FFmpeg</span>
                    <ChevronRight className={`size-4 transition-transform ${ffmpegSettingsOpen ? 'rotate-90' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 pt-2 border-t border-slate-100 mt-2">
                    <div className="space-y-2">
                      <Label className="text-sm">Preset</Label>
                      <Select value={ffmpegPreset} onValueChange={setFfmpegPreset}>
                        <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ultrafast">Ultrafast</SelectItem>
                          <SelectItem value="veryfast">Veryfast</SelectItem>
                          <SelectItem value="fast">Fast</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="slow">Slow</SelectItem>
                          <SelectItem value="veryslow">Veryslow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">CRF: {ffmpegCrf}</Label>
                      <Slider value={[ffmpegCrf]} onValueChange={(v) => setFfmpegCrf(v[0])} min={0} max={51} step={1} />
                      <div className="flex justify-between text-xs text-muted-foreground"><span>Лучшее (0)</span><span>Быстрее (51)</span></div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Аудио битрейт (kbps)</Label>
                      <Select value={String(ffmpegAudioBitrate)} onValueChange={(v) => setFfmpegAudioBitrate(Number(v))}>
                        <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="96">96</SelectItem>
                          <SelectItem value="128">128</SelectItem>
                          <SelectItem value="192">192</SelectItem>
                          <SelectItem value="256">256</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button onClick={handleStartRender} disabled={isSubmitting || renderStatus === 'processing'} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Play className="size-4 mr-2" />}
                {isSubmitting ? 'Запуск...' : 'Запустить нарезку'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Timeline Visualization */}
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><SquareStack className="size-5 text-amber-600" /> Таймлайн исходного видео</CardTitle>
            <CardDescription>00:00 — 45:30 • Клипы показаны цветными сегментами</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
                {sourceClips.map((clip, i) => {
                  const left = (clip.start / totalDuration) * 100
                  const width = ((clip.end - clip.start) / totalDuration) * 100
                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <div className={`absolute top-0 h-full ${clip.color} opacity-70 rounded cursor-pointer hover:opacity-100 transition-opacity flex items-center justify-center`} style={{ left: `${left}%`, width: `${width}%` }}>
                          <span className="text-[10px] font-medium text-white truncate px-1">{clip.title}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{clip.title}: {formatSeconds(clip.start)} — {formatSeconds(clip.end)}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>00:00</span><span>10:00</span><span>20:00</span><span>30:00</span><span>40:00</span><span>45:30</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Output Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeInUp}>
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Smartphone className="size-5 text-orange-600" /> Превью выхода</CardTitle>
              <CardDescription>Как будет выглядеть клип (9:16)</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-40 h-[280px] bg-slate-900 rounded-2xl border-4 border-slate-700 overflow-hidden relative flex items-center justify-center shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-slate-900 to-teal-900/30" />
                {cropMode === 'blur' && <div className="absolute inset-0 bg-slate-500/30 backdrop-blur-md" />}
                <div className="relative w-24 h-14 bg-slate-700/50 rounded border border-white/10 flex items-center justify-center">
                  <Play className="size-4 text-white/40" />
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-center">
                  <span className="text-[10px] text-white/50 font-mono">1080×1920</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Bar Section */}
        <motion.div variants={fadeInUp}>
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Gauge className="size-5 text-amber-600" /> Прогресс обработки</CardTitle>
                <Badge className={`${currentStatus.className} ${renderStatus === 'processing' || renderStatus === 'pending' ? 'processing-badge' : ''}`}>{currentStatus.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Progress value={progressPercent} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:via-teal-500 [&>div]:to-emerald-500" />
                {renderStatus === 'processing' && (
                  <div className="absolute -top-1 -bottom-1 left-0 right-0 rounded-full overflow-hidden pointer-events-none">
                    <div className="h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{ width: `${progressPercent}%` }} />
                  </div>
                )}
              </div>
              {(renderStatus === 'processing' || renderStatus === 'pending') && (
                <Button variant="outline" size="sm" onClick={handleCancelRender} className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                  <X className="size-3.5 mr-1" /> Отменить
                </Button>
              )}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-2"><div className="text-lg font-bold text-slate-800">{progressPercent}%</div><div className="text-xs text-muted-foreground">Прогресс</div></div>
                <div className="bg-slate-50 rounded-lg p-2"><div className="text-lg font-bold text-slate-800">{speed.toFixed(1)}×</div><div className="text-xs text-muted-foreground">Скорость</div></div>
                <div className="bg-slate-50 rounded-lg p-2"><div className="text-lg font-bold text-slate-800">{eta}s</div><div className="text-xs text-muted-foreground">ETA</div></div>
                <div className="bg-slate-50 rounded-lg p-2"><div className="text-lg font-bold text-slate-800">{bitrate > 0 ? `${Math.round(bitrate)}` : '—'}</div><div className="text-xs text-muted-foreground">kbps</div></div>
              </div>
              {renderStatus === 'error' && errorMessage && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg"><XCircle className="size-4 text-rose-600 shrink-0" /><span className="text-sm text-rose-700">{errorMessage}</span></div>
              )}
              {renderStatus === 'done' && outputFilePath && (
                <div className="relative">
                  {showConfetti && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center gap-1 pointer-events-none">
                      {[...Array(12)].map((_, i) => (
                        <span key={i} className="confetti-dot inline-block size-2 rounded-full" style={{ backgroundColor: ['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6], animationDelay: `${i * 0.08}s` }} />
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <PartyPopper className="size-4 text-emerald-600 shrink-0" />
                    <span className="text-sm text-emerald-700 truncate">{outputFilePath}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Render History */}
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base"><Clock4 className="size-5 text-slate-600" /> История рендеринга</CardTitle>
              {renderHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setRenderHistory([])} className="text-muted-foreground hover:text-rose-600"><Trash2 className="size-4 mr-1" /> Очистить</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {renderHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock4 className="size-10 opacity-30 mb-3" />
                <p className="text-sm font-medium">Нет завершённых рендеров</p>
                <p className="text-xs mt-1">Запустите нарезку, чтобы увидеть историю</p>
              </div>
            ) : (
              <ScrollArea className="max-h-48 custom-scrollbar">
                <div className="space-y-2">
                  {renderHistory.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                      {item.status === 'done' ? <CheckCircle2 className="size-4 text-emerald-500 shrink-0" /> : <XCircle className="size-4 text-rose-500 shrink-0" />}
                      <span className="text-sm font-medium flex-1 truncate">{item.clipName}</span>
                      <Badge variant="outline" className="text-xs">{item.cropMode}</Badge>
                      <span className="text-xs text-muted-foreground">{item.duration}s</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Clip List */}
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><FilmIcon className="size-5 text-teal-600" /> Клипы из этого видео</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-2">
                {sourceClips.map((clip, i) => {
                  const mockStatus: ClipStatus = i === 2 ? 'processing' : 'done'
                  const badge = clipStatusConfig[mockStatus]
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                      <div className={`size-2 rounded-full ${clip.color.replace('bg-', 'text-')} ${clip.color}`} />
                      <span className="text-sm font-medium flex-1">{clip.title}</span>
                      <span className="text-xs text-muted-foreground">{formatSeconds(clip.start)} — {formatSeconds(clip.end)}</span>
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ─── Clips Library Tab ──────────────────────────────────────────────────────

function ClipsLibraryTab() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cropFilter, setCropFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set())

  const filteredClips = mockClips.filter(clip => {
    if (statusFilter !== 'all' && clip.status !== statusFilter) return false
    if (cropFilter !== 'all' && clip.cropMode !== cropFilter) return false
    if (searchQuery && !clip.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const toggleSelect = (id: string) => {
    setSelectedClips(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedClips.size === filteredClips.length) { setSelectedClips(new Set()) }
    else { setSelectedClips(new Set(filteredClips.map(c => c.id))) }
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Toolbar */}
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex flex-1 flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
                <div className="relative flex-1 w-full sm:w-auto sm:min-w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Поиск клипов..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 border-slate-200" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-36 border-slate-200"><Filter className="size-4 mr-1.5" /><SelectValue placeholder="Статус" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="pending">Ожидание</SelectItem>
                    <SelectItem value="processing">Обработка</SelectItem>
                    <SelectItem value="done">Готово</SelectItem>
                    <SelectItem value="error">Ошибка</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={cropFilter} onValueChange={setCropFilter}>
                  <SelectTrigger className="w-full sm:w-36 border-slate-200"><SelectValue placeholder="Обрезка" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все режимы</SelectItem>
                    <SelectItem value="center">Smart Crop</SelectItem>
                    <SelectItem value="blur">Blur BG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 items-center shrink-0">
                <Button variant="ghost" size="sm" onClick={selectAll} className="text-muted-foreground">
                  {selectedClips.size === filteredClips.length ? 'Снять всё' : 'Выбрать все'}
                </Button>
                <div className="flex border border-slate-200 rounded-md overflow-hidden">
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="rounded-none"><Grid3X3 className="size-4" /></Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-none"><List className="size-4" /></Button>
                </div>
              </div>
            </div>
            {selectedClips.size > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <span className="text-sm text-muted-foreground self-center mr-2">Выбрано: {selectedClips.size}</span>
                <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="size-3.5 mr-1" /> Удалить</Button>
                <Button variant="outline" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"><RefreshCw className="size-3.5 mr-1" /> Перерендерить</Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Clips Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClips.map((clip) => (
            <motion.div key={clip.id} variants={scaleIn}>
              <Card className={`cursor-pointer hover:shadow-md transition-all ${selectedClips.has(clip.id) ? 'ring-2 ring-emerald-400 border-emerald-300' : 'border-slate-200'}`} onClick={() => toggleSelect(clip.id)}>
                <CardContent className="p-4">
                  {/* Thumbnail */}
                  <div className="relative aspect-[9/16] max-h-36 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                    <FilmIcon className="size-8 text-slate-400" />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge className={clipStatusConfig[clip.status].className}>{clipStatusConfig[clip.status].label}</Badge>
                    </div>
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="outline" className="bg-black/60 text-white border-0 text-xs">{clip.duration}s</Badge>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium truncate mb-2">{clip.title}</h4>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{clip.cropMode === 'center' ? 'Smart Crop' : 'Blur BG'}</Badge>
                    {clip.postedTo.map(p => (
                      <span key={p} className={`size-5 rounded-full ${platformConfig[p].bgClass} flex items-center justify-center`}>
                        {platformConfig[p].icon}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div variants={fadeInUp}>
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <div className="divide-y divide-slate-100">
                  {filteredClips.map((clip) => (
                    <div key={clip.id} className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedClips.has(clip.id) ? 'bg-emerald-50/50' : ''}`} onClick={() => toggleSelect(clip.id)}>
                      <div className={`size-5 rounded border-2 flex items-center justify-center ${selectedClips.has(clip.id) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                        {selectedClips.has(clip.id) && <CheckCircle2 className="size-3.5 text-white" />}
                      </div>
                      <div className="size-12 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                        <FilmIcon className="size-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{clip.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{clip.duration}s</span>
                          <Badge variant="outline" className="text-xs py-0">{clip.cropMode === 'center' ? 'Smart Crop' : 'Blur BG'}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {clip.postedTo.map(p => (
                          <span key={p} className={`size-6 rounded-full ${platformConfig[p].bgClass} flex items-center justify-center`}>{platformConfig[p].icon}</span>
                        ))}
                      </div>
                      <Badge className={clipStatusConfig[clip.status].className}>{clipStatusConfig[clip.status].label}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Accounts Tab ────────────────────────────────────────────────────────────

function AccountsTab() {
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null)
  const [oauthDialogOpen, setOauthDialogOpen] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set())

  // Загружаем реальные аккаунты из базы данных через API
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      const json = await res.json()
      if (json.ok) {
        setAccounts(json.data)
      }
    } catch (err) {
      console.error("Не удалось загрузить аккаунты:", err)
      toast.error("Ошибка при получении аккаунтов")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [])

  const tokenHealth = (expiresAt: string | null, status: string): 'green' | 'yellow' | 'red' => {
    if (status === 'revoked' || status === 'error' || !expiresAt) return 'red'
    const expiry = new Date(expiresAt).getTime()
    const now = Date.now()
    const hoursLeft = (expiry - now) / (1000 * 60 * 60)
    if (hoursLeft < 0) return 'red'
    if (hoursLeft < 24) return 'yellow'
    return 'green'
  }

  const healthDot = (health: 'green' | 'yellow' | 'red') => {
    const colors = { green: 'bg-emerald-400', yellow: 'bg-amber-400', red: 'bg-rose-400' }
    const pulseClass = health !== 'red' ? 'animate-pulse' : ''
    return <span className={`size-2.5 rounded-full ${colors[health]} ${pulseClass}`} />
  }

  // Реальное подключение через наш бэкенд
  const handleConnect = async (platform: Platform) => {
    setConnectingPlatform(platform)
    setOauthDialogOpen(true) // Показываем диалог загрузки

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      })
      const json = await res.json()

      if (json.ok && json.data.oauthUrl) {
        // Делаем небольшую задержку для красоты анимации, затем редиректим
        setTimeout(() => {
          window.location.href = json.data.oauthUrl
        }, 1000)
      } else {
        setOauthDialogOpen(false)
        toast.error(json.error?.message || 'Ошибка генерации ссылки')
      }
    } catch (err) {
      console.error(err)
      setOauthDialogOpen(false)
      toast.error('Критическая ошибка при подключении')
    }
  }

  const handleRefreshToken = (accountId: string) => {
    setRefreshingIds(prev => new Set(prev).add(accountId))
    setTimeout(() => {
      setRefreshingIds(prev => { const next = new Set(prev); next.delete(accountId); return next })
      toast.success('Токен обновлён')
    }, 1500)
  }

  // Хелпер форматирования дат
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const platforms: { id: Platform; label: string; description: string; icon: React.ReactNode; bgClass: string; textClass: string; borderClass: string }[] = [
    { id: 'tiktok', label: 'TikTok', description: 'Публикация Shorts и управление контентом', icon: <Globe className="size-8" />, bgClass: 'bg-rose-50 dark:bg-rose-950/20', textClass: 'text-rose-700 dark:text-rose-400', borderClass: 'border-rose-200 dark:border-rose-900/50' },
    { id: 'youtube', label: 'YouTube', description: 'Загрузка YouTube Shorts через Data API v3', icon: <Play className="size-8" />, bgClass: 'bg-red-50 dark:bg-red-950/20', textClass: 'text-red-700 dark:text-red-400', borderClass: 'border-red-200 dark:border-red-900/50' },
    { id: 'instagram', label: 'Instagram', description: 'Публикация Reels через Graph API', icon: <CameraIcon className="size-8" />, bgClass: 'bg-orange-50 dark:bg-orange-950/20', textClass: 'text-orange-700 dark:text-orange-400', borderClass: 'border-orange-200 dark:border-orange-900/50' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-2 text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-amber-600" />
        <span className="text-sm">Загрузка ваших аккаунтов...</span>
      </div>
    )
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Platform Connection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {platforms.map((p, i) => {
          const account = accounts.find(a => a.platform === p.id)
          const health = account ? tokenHealth(account.tokenExpiresAt, account.status) : 'red'
          
          return (
            <motion.div key={p.id} variants={fadeInUp} custom={i}>
              <Card className={`${p.borderClass} ${p.bgClass} transition-all duration-200 hover:shadow-md`}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`${p.textClass} flex justify-center`}>{p.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg">{p.label}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                  </div>
                  {account ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        {healthDot(health)}
                        <Badge className={accountStatusConfig[account.status as AccountStatus]?.className || ''}>
                          {accountStatusConfig[account.status as AccountStatus]?.label || account.status}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{account.displayName}</p>
                      <p className="text-xs text-muted-foreground">Истекает: {account.tokenExpiresAt ? formatDate(account.tokenExpiresAt) : 'Неизвестно'}</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => handleRefreshToken(account.id)} disabled={refreshingIds.has(account.id)}>
                        <RefreshCw className={`size-3.5 mr-1 ${refreshingIds.has(account.id) ? 'animate-spin' : ''}`} />
                        {refreshingIds.has(account.id) ? 'Обновление...' : 'Обновить токен'}
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(p.id)} 
                      className={`${p.textClass} bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border ${p.borderClass}`}
                      disabled={p.id !== 'tiktok'} // Разрешаем кликать пока только на TikTok
                    >
                      <Plus className="size-4 mr-1" /> {p.id === 'tiktok' ? 'Подключить' : 'В разработке'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Account List */}
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="size-5 text-amber-600" /> Подключённые аккаунты</CardTitle>
            <CardDescription>Все подключённые платформы и статус токенов</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-64 custom-scrollbar">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {accounts.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Нет подключенных аккаунтов. Нажмите «Подключить» выше.
                  </div>
                ) : (
                  accounts.map((account) => {
                    const health = tokenHealth(account.tokenExpiresAt, account.status)
                    return (
                      <div key={account.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className={`size-10 rounded-full ${platformConfig[account.platform as Platform].bgClass} flex items-center justify-center`}>
                          {platformConfig[account.platform as Platform].icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{account.displayName}</span>
                            {healthDot(health)}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground">{platformConfig[account.platform as Platform].label}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">Подключён: {formatDate(account.connectedAt)}</span>
                          </div>
                        </div>
                        <Badge className={accountStatusConfig[account.status as AccountStatus]?.className || ''}>
                          {accountStatusConfig[account.status as AccountStatus]?.label || account.status}
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => handleRefreshToken(account.id)} disabled={refreshingIds.has(account.id)}>
                          <RefreshCw className={`size-4 ${refreshingIds.has(account.id) ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                    )
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Token Health Legend */}
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 dark:border-slate-800 transition-all duration-200 hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm">
              <span className="text-muted-foreground font-medium">Здоровье токена:</span>
              <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" /> <span className="text-muted-foreground">Активен (&gt;24ч)</span></div>
              <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-amber-400 animate-pulse" /> <span className="text-muted-foreground">Скоро истекает (&lt;24ч)</span></div>
              <div className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-rose-400" /> <span className="text-muted-foreground">Истёк / ошибка</span></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* OAuth Connection Dialog */}
      <Dialog open={oauthDialogOpen} onOpenChange={setOauthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-amber-600" /> Подключение {connectingPlatform && platformConfig[connectingPlatform]?.label}
            </DialogTitle>
            <DialogDescription>OAuth авторизация</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-col items-center py-8 gap-4">
              <div className={`size-16 rounded-full ${connectingPlatform ? platformConfig[connectingPlatform].bgClass : 'bg-slate-100'} flex items-center justify-center`}>
                {connectingPlatform ? platformConfig[connectingPlatform].icon : <Globe className="size-8" />}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm">Перенаправление на TikTok OAuth...</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Posts & Schedule Tab ───────────────────────────────────────────────────

function PostsScheduleTab() {
  const [schedulerState, setSchedulerState] = useState<{
    status: SchedulerStatus; queueLength: number; intervalSeconds: number;
    publishedCount: number; failedCount: number; activeUploads: number; lastTickAt: string | null;
  }>({ status: 'running', queueLength: 3, intervalSeconds: 60, publishedCount: 2, failedCount: 1, activeUploads: 0, lastTickAt: null })
  const [schedulerInterval, setSchedulerInterval] = useState(60)
  const [posts, setPosts] = useState(mockPosts)
  const [createPostDialogOpen, setCreatePostDialogOpen] = useState(false)
  const [newPostClip, setNewPostClip] = useState('')
  const [newPostAccounts, setNewPostAccounts] = useState<Set<string>>(new Set())
  const [newPostCaption, setNewPostCaption] = useState('')
  const [newPostHashtags, setNewPostHashtags] = useState('')
  const [newPostSchedule, setNewPostSchedule] = useState('')

  // Upload progress state: postId → { percent, currentChunk, totalChunks }
  const [uploadProgress, setUploadProgress] = useState<Record<string, { percent: number; currentChunk: number; totalChunks: number }>>({})

  // Tick and transition logs from scheduler
  const [tickLog, setTickLog] = useState<Array<{ id: string; timestamp: string; postsChecked: number; postsDue: number }>>([])
  const [transitionLog, setTransitionLog] = useState<Array<{ id: string; postId: string; platform: string; previousStatus: string; newStatus: string; timestamp: string; error?: string }>>([])

  // Post queue from scheduler (real-time tracked posts)
  const [schedulerPostQueue, setSchedulerPostQueue] = useState<Array<{
    id: string; clipTitle: string; platform: Platform; accountDisplayName: string;
    status: PostStatus; scheduledAt: string | null; uploadProgress: number;
    errorMessage: string | null; platformPostId: string | null;
  }>>([])

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Fetch scheduler state + post queue + logs
  const fetchSchedulerData = useCallback(async () => {
    try {
      const res = await fetch('/api/scheduler')
      const data = await res.json()
      if (data.ok) {
        const s = data.data.state
        setSchedulerState(prev => {
          // Detect transitions and show toasts
          if (prev.activeUploads > 0 && s.activeUploads === 0) {
            // Uploads completed
          }
          if (s.publishedCount > prev.publishedCount) {
            toast.success('Пост опубликован!', { description: `Опубликовано: ${s.publishedCount}, Ошибки: ${s.failedCount}` })
          }
          if (s.failedCount > prev.failedCount) {
            toast.error('Ошибка публикации', { description: `Не удалось опубликовать пост. Всего ошибок: ${s.failedCount}` })
          }
          return s
        })
        setTickLog(data.data.tickLog || [])
        setTransitionLog(data.data.transitionLog || [])
        setSchedulerPostQueue(data.data.postQueue || [])

        // Update upload progress from post queue
        const progressMap: Record<string, { percent: number; currentChunk: number; totalChunks: number }> = {}
        for (const post of data.data.postQueue || []) {
          if (post.status === 'uploading' && post.uploadProgress > 0) {
            const totalChunks = 5
            const currentChunk = Math.round((post.uploadProgress / 100) * totalChunks)
            progressMap[post.id] = { percent: post.uploadProgress, currentChunk, totalChunks }
          }
        }
        setUploadProgress(prev => {
          // Keep entries that are still uploading or just completed
          const next: typeof prev = {}
          for (const post of data.data.postQueue || []) {
            if (post.status === 'uploading') {
              next[post.id] = progressMap[post.id] || prev[post.id] || { percent: 0, currentChunk: 0, totalChunks: 5 }
            }
          }
          return next
        })
      }
    } catch { /* retry on next poll */ }
  }, [])

  // Poll scheduler every 1 second when tab is active
  useEffect(() => {
    // First fetch immediately, then poll every 1s
    const doFetch = async () => { await fetchSchedulerData() }
    doFetch()
    pollingRef.current = setInterval(fetchSchedulerData, 1000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [fetchSchedulerData])

  const handleSchedulerControl = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.ok) {
        setSchedulerState(data.data.state)
        toast.info(`Планировщик: ${action === 'pause' ? 'пауза' : action === 'resume' || action === 'start' ? 'запущен' : 'остановлен'}`)
      }
    } catch { /* ignore */ }
  }

  const handleIntervalChange = async (seconds: number) => {
    setSchedulerInterval(seconds)
    try {
      await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalSeconds: seconds }),
      })
      toast.info(`Интервал: ${seconds < 60 ? seconds + ' сек' : (seconds / 60) + ' мин'}`)
    } catch { /* ignore */ }
  }

  const handlePublishNow = async (postId: string) => {
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishNow: true, postId }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.info('Загрузка начата...', { description: `Пост загружается на платформу` })
        // Start client-side upload simulation
        simulateUpload(postId)
      } else {
        toast.error('Ошибка', { description: data.error?.message || 'Не удалось начать загрузку' })
      }
    } catch {
      toast.error('Ошибка', { description: 'Не удалось начать загрузку' })
    }
  }

  const handleRetryPost = async (postId: string) => {
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ retry: true, postId }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.info('Повторная загрузка...', { description: `Пост загружается заново` })
        // Start client-side upload simulation
        simulateUpload(postId)
      } else {
        toast.error('Ошибка', { description: data.error?.message || 'Не удалось повторить загрузку' })
      }
    } catch {
      toast.error('Ошибка', { description: 'Не удалось повторить загрузку' })
    }
  }

  // Client-side upload simulation — drives progress via API
  const simulateUpload = useCallback((postId: string) => {
    const totalChunks = 5
    let currentChunk = 0

    const uploadInterval = setInterval(async () => {
      currentChunk++
      const progress = Math.round((currentChunk / totalChunks) * 100)

      // Send progress update to API
      try {
        await fetch('/api/scheduler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updateUpload: true, postId, uploadProgress: progress }),
        })
      } catch { /* retry next tick */ }

      if (currentChunk >= totalChunks) {
        clearInterval(uploadInterval)

        // Finalize after a short delay
        setTimeout(async () => {
          // 90% success rate
          const success = Math.random() > 0.10
          try {
            await fetch('/api/scheduler', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                updateUpload: true,
                postId,
                uploadProgress: success ? 100 : progress,
                uploadStatus: success ? 'published' : 'failed',
                errorMessage: success ? undefined : 'Upload failed — simulated platform error',
              }),
            })
          } catch { /* ignore */ }
        }, 1000)
      }
    }, 1500) // 1.5s per chunk
  }, [])

  // Simple calendar - May 2026
  const calendarDays = Array.from({ length: 31 }, (_, i) => i + 1)
  const scheduledDays = [20, 21, 22, 25, 28]
  const publishedDays = [15, 18, 20]

  const handleCreatePost = () => {
    const selectedClip = mockClips.find(c => c.id === newPostClip)
    if (!selectedClip || newPostAccounts.size === 0) return

    newPostAccounts.forEach(accId => {
      const account = mockAccounts.find(a => a.id === accId)
      if (!account) return
      const newPost = {
        id: `post_${Date.now()}_${accId}`,
        clipTitle: selectedClip.title,
        platform: account.platform,
        accountName: account.displayName,
        status: 'scheduled' as PostStatus,
        scheduledAt: newPostSchedule || 'Сразу',
        description: newPostCaption,
        tags: newPostHashtags,
      }
      setPosts(prev => [...prev, newPost])
    })

    setCreatePostDialogOpen(false)
    setNewPostClip('')
    setNewPostAccounts(new Set())
    setNewPostCaption('')
    setNewPostHashtags('')
    setNewPostSchedule('')
    toast.success('Пост создан!')
  }

  // Merge scheduler post queue with local posts for display
  const allPosts = [
    ...schedulerPostQueue.map(p => ({
      id: p.id,
      clipTitle: p.clipTitle,
      platform: p.platform,
      accountName: p.accountDisplayName,
      status: p.status,
      scheduledAt: p.scheduledAt || '',
      uploadProgress: p.uploadProgress,
      errorMessage: p.errorMessage,
      platformPostId: p.platformPostId,
    })),
    ...posts.filter(p => !schedulerPostQueue.find(sp => sp.id === p.id)),
  ]

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Scheduler Controls */}
      <motion.div variants={fadeInUp}>
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50/30 to-white dark:from-orange-950/20 dark:to-slate-900 transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><CalendarClock className="size-5 text-orange-600" /> Планировщик</CardTitle>
              <div className="flex items-center gap-2">
                {schedulerState.activeUploads > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 processing-badge">
                    <Loader2 className="size-3 mr-1 animate-spin" /> {schedulerState.activeUploads} загрузк{schedulerState.activeUploads === 1 ? 'а' : 'и'}
                  </Badge>
                )}
                <Badge className={schedulerState.status === 'running' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : schedulerState.status === 'paused' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-rose-100 text-rose-800 border-rose-200'}>
                  {schedulerState.status === 'running' ? 'Работает' : schedulerState.status === 'paused' ? 'Пауза' : 'Остановлен'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                {schedulerState.status === 'running' ? (
                  <Button variant="outline" size="sm" onClick={() => handleSchedulerControl('pause')} className="border-amber-200 text-amber-700 hover:bg-amber-50"><Pause className="size-4 mr-1" /> Пауза</Button>
                ) : schedulerState.status === 'paused' ? (
                  <Button variant="outline" size="sm" onClick={() => handleSchedulerControl('resume')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"><Play className="size-4 mr-1" /> Продолжить</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleSchedulerControl('start')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"><Play className="size-4 mr-1" /> Запустить</Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleSchedulerControl('stop')} className="border-rose-200 text-rose-700 hover:bg-rose-50"><StopCircle className="size-4 mr-1" /> Стоп</Button>
              </div>
              <div className="flex items-center gap-3">
                <Timer className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Интервал:</span>
                <Select value={String(schedulerInterval)} onValueChange={(v) => handleIntervalChange(Number(v))}>
                  <SelectTrigger className="w-24 border-orange-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 сек</SelectItem>
                    <SelectItem value="30">30 сек</SelectItem>
                    <SelectItem value="60">1 мин</SelectItem>
                    <SelectItem value="300">5 мин</SelectItem>
                    <SelectItem value="600">10 мин</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4 text-sm">
                <div><span className="text-muted-foreground">Очередь: </span><span className="font-semibold">{schedulerState.queueLength}</span></div>
                <div><span className="text-muted-foreground">Опубликовано: </span><span className="font-semibold text-emerald-600">{schedulerState.publishedCount}</span></div>
                <div><span className="text-muted-foreground">Ошибки: </span><span className="font-semibold text-rose-600">{schedulerState.failedCount}</span></div>
              </div>
            </div>

            {/* Scheduler Tick Indicator */}
            {schedulerState.status === 'running' && (
              <div className="mt-4 pt-3 border-t border-orange-100 dark:border-orange-900/50">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex size-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                    </span>
                    <span>Тик планировщика активен</span>
                  </div>
                  {schedulerState.lastTickAt && (
                    <span>• Последний тик: {new Date(schedulerState.lastTickAt).toLocaleTimeString('ru-RU')}</span>
                  )}
                  <span>• Интервал: {schedulerState.intervalSeconds}с</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Post Queue */}
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Send className="size-5 text-teal-600" /> Очередь постов</CardTitle>
                  <CardDescription>Запланированные, загружаемые и опубликованные посты</CardDescription>
                </div>
                {schedulerState.activeUploads > 0 && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 processing-badge">
                    <Loader2 className="size-3 mr-1 animate-spin" /> {schedulerState.activeUploads} активн{schedulerState.activeUploads === 1 ? 'ая' : 'ых'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[28rem]">
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allPosts.map((post) => (
                    <div key={post.id} className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`size-10 rounded-lg ${platformConfig[post.platform]?.bgClass || 'bg-slate-100'} flex items-center justify-center shrink-0`}>
                          {platformConfig[post.platform]?.icon || <Globe className="size-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate">{post.clipTitle}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{post.accountName}</span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{post.scheduledAt || 'Не запланирован'}</span>
                          </div>
                          {/* Upload Progress Bar */}
                          {post.status === 'uploading' && (
                            <div className="mt-2 space-y-1.5">
                              <Progress value={post.uploadProgress || 0} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-amber-400 [&>div]:via-orange-400 [&>div]:to-amber-500" />
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-amber-700 font-medium">{post.uploadProgress || 0}%</span>
                                {uploadProgress[post.id] && (
                                  <span className="text-muted-foreground">
                                    Чанк {uploadProgress[post.id].currentChunk}/{uploadProgress[post.id].totalChunks}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Error message */}
                          {post.status === 'failed' && post.errorMessage && (
                            <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                              <XCircle className="size-3" /> {post.errorMessage}
                            </p>
                          )}
                          {/* Platform Post ID on success */}
                          {post.status === 'published' && post.platformPostId && (
                            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                              <CheckCircle2 className="size-3" /> ID: {post.platformPostId}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={postStatusConfig[post.status]?.className || 'bg-slate-100 text-slate-700 border-slate-200'}>
                            {post.status === 'uploading' && <Loader2 className="size-3 mr-1 animate-spin" />}
                            {postStatusConfig[post.status]?.label || post.status}
                          </Badge>
                          {post.status === 'scheduled' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handlePublishNow(post.id)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 shrink-0">
                                  <Rocket className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Опубликовать сейчас</TooltipContent>
                            </Tooltip>
                          )}
                          {post.status === 'failed' && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => handleRetryPost(post.id)} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 shrink-0">
                                  <RotateCcw className="size-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Повторить загрузку</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Column: Tick Log + Calendar */}
        <motion.div variants={fadeInUp} className="space-y-4">
          {/* Scheduler Tick Log */}
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Activity className="size-5 text-orange-600" /> Тик лог</CardTitle>
              <CardDescription>Последние проверки планировщика</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-36">
                <div className="px-4 pb-3 space-y-1">
                  {tickLog.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">Нет записей</p>
                  ) : (
                    tickLog.map((tick, i) => (
                      <div key={tick.id} className="flex items-center gap-2 py-1.5 text-xs">
                        <span className="text-muted-foreground">{new Date(tick.timestamp).toLocaleTimeString('ru-RU')}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tick.postsDue > 0 ? 'border-amber-300 text-amber-700' : 'border-slate-200 text-slate-500'}`}>
                          {tick.postsDue > 0 ? `${tick.postsDue} к публикации` : 'Нет постов'}
                        </Badge>
                        <span className="text-muted-foreground">({tick.postsChecked} проверено)</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Post Transitions */}
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><ArrowRight className="size-5 text-teal-600" /> Переходы статусов</CardTitle>
              <CardDescription>Изменения статусов постов</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-36">
                <div className="px-4 pb-3 space-y-1.5">
                  {transitionLog.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2 text-center">Нет переходов</p>
                  ) : (
                    transitionLog.slice(0, 10).map((trans) => (
                      <div key={trans.id} className="flex items-center gap-2 py-1 text-xs">
                        <span className="text-muted-foreground shrink-0">{new Date(trans.timestamp).toLocaleTimeString('ru-RU')}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 ${postStatusConfig[trans.previousStatus as PostStatus]?.className || 'bg-slate-100 text-slate-500'}`}>
                          {postStatusConfig[trans.previousStatus as PostStatus]?.label || trans.previousStatus}
                        </Badge>
                        <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                        <Badge className={`text-[10px] px-1.5 py-0 ${postStatusConfig[trans.newStatus as PostStatus]?.className || 'bg-slate-100 text-slate-500'}`}>
                          {postStatusConfig[trans.newStatus as PostStatus]?.label || trans.newStatus}
                        </Badge>
                        {trans.error && <span className="text-rose-500 truncate ml-1">⚠ {trans.error}</span>}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Calendar className="size-5 text-emerald-600" /> Май 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
                  <div key={d} className="text-muted-foreground font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {Array.from({ length: 4 }, (_, i) => <div key={`empty-${i}`} />)}
                {calendarDays.map(day => {
                  const isScheduled = scheduledDays.includes(day)
                  const isPublished = publishedDays.includes(day)
                  const isToday = day === 20
                  return (
                    <div key={day} className={`py-1.5 rounded-md text-xs relative ${isToday ? 'bg-emerald-600 text-white font-bold' : isPublished ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' : isScheduled ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                      {day}
                      {isScheduled && !isPublished && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-amber-400" />}
                      {isPublished && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-emerald-400" />}
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-400" /> Опубликовано</div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" /> Запланировано</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Create Post Section */}
      <motion.div variants={fadeInUp}>
        <Card className="border-teal-200 bg-gradient-to-br from-teal-50/50 to-white dark:from-teal-950/20 dark:to-slate-900 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Plus className="size-5 text-teal-600" /> Создать пост</CardTitle>
                <CardDescription>Выберите клип, аккаунт и расписание</CardDescription>
              </div>
              <Dialog open={createPostDialogOpen} onOpenChange={setCreatePostDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white" size="sm">
                    <Plus className="size-4 mr-1.5" /> Создать пост
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Создать новый пост</DialogTitle>
                    <DialogDescription>Выберите клип, аккаунты и настройки публикации</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Клип</Label>
                      <Select value={newPostClip} onValueChange={setNewPostClip}>
                        <SelectTrigger className="border-teal-200"><SelectValue placeholder="Выберите клип" /></SelectTrigger>
                        <SelectContent>
                          {mockClips.filter(c => c.status === 'done').map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Аккаунты</Label>
                      <div className="space-y-2">
                        {mockAccounts.map(a => (
                          <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-800">
                            <input
                              type="checkbox"
                              checked={newPostAccounts.has(a.id)}
                              onChange={(e) => {
                                setNewPostAccounts(prev => {
                                  const next = new Set(prev)
                                  if (e.target.checked) next.add(a.id); else next.delete(a.id)
                                  return next
                                })
                              }}
                              className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                            />
                            <div className={`size-6 rounded-full ${platformConfig[a.platform].bgClass} flex items-center justify-center`}>
                              {platformConfig[a.platform].icon}
                            </div>
                            <span className="text-sm">{a.displayName}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Описание</Label>
                      <Textarea placeholder="Добавьте описание поста..." value={newPostCaption} onChange={(e) => setNewPostCaption(e.target.value)} className="border-teal-200 min-h-20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Хэштеги</Label>
                      <Input placeholder="#shorts #viral #trending" value={newPostHashtags} onChange={(e) => setNewPostHashtags(e.target.value)} className="border-teal-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Время публикации</Label>
                      <Input type="datetime-local" value={newPostSchedule} onChange={(e) => setNewPostSchedule(e.target.value)} className="border-teal-200" />
                    </div>
                    <Button onClick={handleCreatePost} disabled={!newPostClip || newPostAccounts.size === 0} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                      <Send className="size-4 mr-1.5" /> Создать
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Клип</Label>
                <Select value={newPostClip} onValueChange={setNewPostClip}>
                  <SelectTrigger className="border-teal-200"><SelectValue placeholder="Выберите клип" /></SelectTrigger>
                  <SelectContent>
                    {mockClips.filter(c => c.status === 'done').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Аккаунт</Label>
                <Select>
                  <SelectTrigger className="border-teal-200"><SelectValue placeholder="Выберите аккаунт" /></SelectTrigger>
                  <SelectContent>
                    {mockAccounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.displayName} ({platformConfig[a.platform].label})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Время публикации</Label>
                <Input type="datetime-local" className="border-teal-200" />
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <Button onClick={handleCreatePost} disabled={!newPostClip || newPostAccounts.size === 0} className="bg-teal-600 hover:bg-teal-700 text-white"><Send className="size-4 mr-1.5" /> Создать</Button>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Описание</Label>
                <Textarea placeholder="Добавьте описание поста..." value={newPostCaption} onChange={(e) => setNewPostCaption(e.target.value)} className="border-teal-200 min-h-20" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Хэштеги</Label>
                <Input placeholder="#shorts #viral #trending" value={newPostHashtags} onChange={(e) => setNewPostHashtags(e.target.value)} className="border-teal-200" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ─── Architecture Tab (Condensed) ───────────────────────────────────────────

function ArchitectureTab() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="size-5 text-emerald-600" /> Архитектура Shorts Studio</CardTitle>
            <CardDescription>Структура проекта, IPC контракты, события и модули</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {/* Folder Tree */}
              <AccordionItem value="folder-tree">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  <span className="flex items-center gap-2"><Folder className="size-4 text-amber-500" /> Структура проекта</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-slate-900 text-slate-100 rounded-lg p-4 mt-2">
                    {folderTree.map((node, i) => (
                      <TreeNodeComponent key={`root-${i}`} node={node} depth={0} defaultOpen={false} />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* IPC Contracts */}
              <AccordionItem value="ipc-contracts">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  <span className="flex items-center gap-2"><ArrowLeftRight className="size-4 text-emerald-500" /> IPC контракты ({Object.values(ipcContracts).flat().length} каналов)</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    {Object.entries(ipcContracts).map(([domain, contracts]) => (
                      <div key={domain}>
                        <div className="flex items-center gap-2 mb-2"><Badge className={domainColors[domain]}>{domain}</Badge><span className="text-sm text-muted-foreground">{contracts.length} каналов</span></div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b border-slate-200"><th className="text-left py-2 pr-3 font-medium text-muted-foreground">Канал</th><th className="text-left py-2 pr-3 font-medium text-muted-foreground">Payload</th><th className="text-left py-2 pr-3 font-medium text-muted-foreground">Response</th><th className="text-left py-2 font-medium text-muted-foreground">Описание</th></tr></thead>
                            <tbody>
                              {contracts.map((c) => (
                                <tr key={c.channel} className="border-b border-slate-100 hover:bg-slate-50">
                                  <td className="py-2 pr-3 font-mono text-xs text-emerald-700">{c.channel}</td>
                                  <td className="py-2 pr-3 font-mono text-xs text-teal-700">{c.payload}</td>
                                  <td className="py-2 pr-3 font-mono text-xs text-amber-700">{c.response}</td>
                                  <td className="py-2 text-muted-foreground">{c.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Event Streams */}
              <AccordionItem value="event-streams">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  <span className="flex items-center gap-2"><Activity className="size-4 text-teal-500" /> Потоки событий ({Object.values(eventStreams).flat().length} событий)</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 mt-2">
                    {Object.entries(eventStreams).map(([domain, events]) => (
                      <div key={domain}>
                        <div className="flex items-center gap-2 mb-2"><Badge className={domainColors[domain]}>{domain}</Badge><span className="text-sm text-muted-foreground">{events.length} событий</span></div>
                        <div className="space-y-1">
                          {events.map((e) => (
                            <div key={e.channel} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 text-sm">
                              <code className="text-xs font-mono text-emerald-700 min-w-44">{e.channel}</code>
                              <code className="text-xs font-mono text-teal-700 flex-1">{e.payloadFields}</code>
                              <span className="text-muted-foreground text-xs">{e.whenFires}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Module Diagram */}
              <AccordionItem value="module-diagram">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  <span className="flex items-center gap-2"><Box className="size-4 text-amber-500" /> Модульная диаграмма</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="w-full overflow-x-auto py-4">
                    <div className="min-w-[500px] flex flex-col items-center gap-6">
                      {/* Renderer */}
                      <div className="flex items-center gap-3 px-6 py-3 rounded-xl border-2 border-emerald-300 bg-emerald-50/80 shadow-md">
                        <Monitor className="size-5 text-emerald-600" />
                        <div><div className="font-bold text-emerald-800">Renderer (UI)</div><div className="text-xs text-emerald-600">React • Zustand • shadcn/ui</div></div>
                      </div>
                      {/* IPC */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-px h-4 bg-emerald-300" />
                        <Badge variant="outline" className="text-xs font-mono border-emerald-300 text-emerald-700">IPC Bridge</Badge>
                        <div className="w-px h-4 bg-teal-300" />
                      </div>
                      {/* Main Process */}
                      <div className="w-full max-w-lg">
                        <div className="flex items-center gap-2 mb-2"><Server className="size-4 text-teal-600" /><span className="font-semibold text-teal-800">Main Process</span></div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { icon: <Video className="size-4 text-emerald-500" />, title: 'VideoProcessingModule', desc: 'FFmpeg: crop, blur, 9:16', bg: 'bg-emerald-50 border-emerald-200' },
                            { icon: <Lock className="size-4 text-rose-500" />, title: 'TokenManager', desc: 'keytar: хранение токенов', bg: 'bg-rose-50 border-rose-200' },
                            { icon: <Upload className="size-4 text-amber-500" />, title: 'PostingModule', desc: 'TikTok, YouTube, Instagram', bg: 'bg-amber-50 border-amber-200' },
                            { icon: <CalendarClock className="size-4 text-orange-500" />, title: 'Scheduler', desc: 'Worker: очередь, публикация', bg: 'bg-orange-50 border-orange-200' },
                          ].map(m => (
                            <div key={m.title} className={`rounded-lg border p-3 ${m.bg}`}>
                              <div className="flex items-center gap-2 mb-1">{m.icon}<span className="font-semibold text-xs">{m.title}</span></div>
                              <p className="text-xs text-muted-foreground">{m.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Data Flow */}
                      <div className="flex items-center gap-2 flex-wrap justify-center text-sm">
                        {[
                          { label: 'Source Video', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                          { label: 'Clip', bg: 'bg-teal-100 text-teal-800 border-teal-300' },
                          { label: 'Post', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
                          { label: 'Platform', bg: 'bg-orange-100 text-orange-800 border-orange-300' },
                        ].map((step, i, arr) => (
                          <React.Fragment key={step.label}>
                            <span className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${step.bg}`}>{step.label}</span>
                            {i < arr.length - 1 && <ArrowRight className="size-4 text-slate-400" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </motion.div>

      {/* Architecture Principles */}
      <motion.div variants={fadeInUp}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {principles.map((p) => {
            const Icon = p.icon
            return (
              <Card key={p.title} className={`${p.borderAccent} ${p.bgAccent} hover:shadow-md transition-shadow`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2"><Icon className={`size-5 ${p.accent}`} /><span className="font-semibold text-sm">{p.title}</span></div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{p.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab() {
  const [ffmpegPath, setFfmpegPath] = useState('/usr/local/bin/ffmpeg')
  const [outputDir, setOutputDir] = useState('/output/clips')
  const [defaultCropMode, setDefaultCropMode] = useState<'center' | 'blur'>('center')
  const [schedulerInterval, setSchedulerInterval] = useState('60')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [minimizeToTray, setMinimizeToTray] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><HardDrive className="size-5 text-emerald-600" /> Пути и файлы</CardTitle>
            <CardDescription>Настройка путей к FFmpeg и выходным директориям</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Путь к FFmpeg</Label>
              <div className="flex gap-2">
                <Input value={ffmpegPath} onChange={(e) => setFfmpegPath(e.target.value)} className="border-slate-200" />
                <Button variant="outline" size="sm" className="shrink-0"><Eye className="size-4" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">Автоопределение: /usr/local/bin/ffmpeg</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Директория вывода</Label>
              <div className="flex gap-2">
                <Input value={outputDir} onChange={(e) => setOutputDir(e.target.value)} className="border-slate-200" />
                <Button variant="outline" size="sm" className="shrink-0"><Eye className="size-4" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="size-5 text-teal-600" /> Настройки по умолчанию</CardTitle>
            <CardDescription>Параметры для новых клипов и постов</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Режим обрезки по умолчанию</Label>
              <RadioGroup value={defaultCropMode} onValueChange={(v) => setDefaultCropMode(v as 'center' | 'blur')} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="center" id="settings-center" /><Label htmlFor="settings-center" className="text-sm cursor-pointer">Smart Crop (центр)</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="blur" id="settings-blur" /><Label htmlFor="settings-blur" className="text-sm cursor-pointer">Blur Background</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Интервал планировщика (сек)</Label>
              <Select value={schedulerInterval} onValueChange={setSchedulerInterval}>
                <SelectTrigger className="w-48 border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 секунд</SelectItem>
                  <SelectItem value="60">1 минута</SelectItem>
                  <SelectItem value="300">5 минут</SelectItem>
                  <SelectItem value="600">10 минут</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BellIcon className="size-5 text-amber-600" /> Уведомления</CardTitle>
            <CardDescription>Настройка уведомлений и поведения</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Системные уведомления</p><p className="text-xs text-muted-foreground">Показывать уведомления при завершении обработки</p></div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Сворачивать в трей</p><p className="text-xs text-muted-foreground">Закрытие окна сворачивает приложение в системный трей</p></div>
              <Switch checked={minimizeToTray} onCheckedChange={setMinimizeToTray} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Автообновление токенов</p><p className="text-xs text-muted-foreground">Автоматически обновлять токены до истечения</p></div>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 transition-all duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="size-5 text-slate-600" /> О программе</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Версия</span><span className="font-medium">1.0.0-beta</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Среда</span><span className="font-medium">Next.js 16 (Web Preview)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Electron</span><span className="font-medium">— (недоступно в веб-режиме)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">FFmpeg</span><span className="font-medium">Mock (эмуляция)</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">База данных</span><span className="font-medium">SQLite (Prisma)</span></div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

function BellIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// ─── Analytics Tab ──────────────────────────────────────────────────────────

interface AnalyticsData {
  clipsCreatedByDay: Array<{ date: string; count: number }>
  postsByPlatform: Array<{ platform: string; count: number; color: string }>
  processingTimes: Array<{ clipName: string; duration: number; cropMode: string }>
  successRate: { total: number; success: number; failed: number; rate: number }
  platformStats: Array<{
    platform: string
    postsPublished: number
    postsScheduled: number
    postsFailed: number
    avgViews: number
    avgLikes: number
    followers: number
  }>
  weeklyActivity: Array<{ day: string; clips: number; posts: number }>
  recentErrors: Array<{ timestamp: string; error: string; platform: string; clipTitle: string }>
}

function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(result => { if (result.ok) setData(result.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {[1, 2, 3].map(i => (
          <motion.div key={i} variants={fadeInUp}>
            <Card className="border-slate-200 dark:border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                  <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    )
  }

  const maxClipCount = Math.max(...data.clipsCreatedByDay.map(d => d.count))
  const maxWeeklyActivity = Math.max(...data.weeklyActivity.flatMap(d => [d.clips, d.posts]))

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Всего клипов', value: data.clipsCreatedByDay.reduce((s, d) => s + d.count, 0), icon: <FilmIcon className="size-5 text-emerald-600" />, bg: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-950/50 dark:to-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', valueColor: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Всего постов', value: data.postsByPlatform.reduce((s, d) => s + d.count, 0), icon: <Send className="size-5 text-teal-600" />, bg: 'from-teal-50 to-teal-100/50 dark:from-teal-950/50 dark:to-teal-900/30', border: 'border-teal-200 dark:border-teal-800', valueColor: 'text-teal-700 dark:text-teal-400' },
          { label: 'Успешность', value: `${data.successRate.rate}%`, icon: <CheckCircle2 className="size-5 text-amber-600" />, bg: 'from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30', border: 'border-amber-200 dark:border-amber-800', valueColor: 'text-amber-700 dark:text-amber-400' },
          { label: 'Просмотры', value: data.platformStats.reduce((s, d) => s + d.avgViews, 0).toLocaleString(), icon: <Eye className="size-5 text-rose-600" />, bg: 'from-rose-50 to-rose-100/50 dark:from-rose-950/50 dark:to-rose-900/30', border: 'border-rose-200 dark:border-rose-800', valueColor: 'text-rose-700 dark:text-rose-400' },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={fadeInUp} custom={i}>
            <Card className={`bg-gradient-to-br ${stat.bg} ${stat.border} transition-all duration-200 hover:shadow-md`}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className={`text-2xl sm:text-3xl font-bold ${stat.valueColor}`}>{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clips Created by Day */}
        <motion.div variants={fadeInUp}>
          <Card className="border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-5 text-emerald-600" /> Клипы по дням
              </CardTitle>
              <CardDescription>Создано клипов за последние 7 дней</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.clipsCreatedByDay.map((d) => (
                <div key={d.date} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{d.date}</span>
                  <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${maxClipCount > 0 ? (d.count / maxClipCount) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-md"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-700 dark:text-slate-300">{d.count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Posts by Platform */}
        <motion.div variants={fadeInUp}>
          <Card className="border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Share2 className="size-5 text-teal-600" /> Посты по платформам
              </CardTitle>
              <CardDescription>Распределение публикаций</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Distribution bar */}
              <div className="flex h-8 rounded-lg overflow-hidden">
                {data.postsByPlatform.map((p) => {
                  const total = data.postsByPlatform.reduce((s, d) => s + d.count, 0)
                  const pct = total > 0 ? (p.count / total) * 100 : 0
                  return (
                    <motion.div
                      key={p.platform}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`${p.color} flex items-center justify-center`}
                    >
                      {pct > 15 && <span className="text-xs font-bold text-white">{Math.round(pct)}%</span>}
                    </motion.div>
                  )
                })}
              </div>
              {/* Platform breakdown */}
              <div className="space-y-3">
                {data.postsByPlatform.map((p) => (
                  <div key={p.platform} className="flex items-center gap-3">
                    <div className={`size-3 rounded-full ${p.color}`} />
                    <span className="text-sm font-medium flex-1">{p.platform}</span>
                    <span className="text-sm text-muted-foreground">{p.count} постов</span>
                    <Badge variant="outline" className="text-xs">{Math.round((p.count / data.postsByPlatform.reduce((s, d) => s + d.count, 0)) * 100)}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <motion.div variants={fadeInUp}>
          <Card className="border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="size-5 text-amber-600" /> Активность за неделю
              </CardTitle>
              <CardDescription>Клипы и посты по дням недели</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.weeklyActivity.map((d) => (
                  <div key={d.day} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8 shrink-0">{d.day}</span>
                    <div className="flex-1 flex gap-1 h-6 items-end">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden relative h-6">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${maxWeeklyActivity > 0 ? (d.clips / maxWeeklyActivity) * 100 : 0}%` }}
                          transition={{ duration: 0.6 }}
                          className="absolute bottom-0 left-0 right-0 bg-emerald-400 rounded-sm"
                        />
                      </div>
                      <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden relative h-6">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${maxWeeklyActivity > 0 ? (d.posts / maxWeeklyActivity) * 100 : 0}%` }}
                          transition={{ duration: 0.6, delay: 0.1 }}
                          className="absolute bottom-0 left-0 right-0 bg-teal-400 rounded-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs shrink-0 w-16 justify-end">
                      <span className="text-emerald-600 font-medium">{d.clips}</span>
                      <span className="text-teal-600 font-medium">{d.posts}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-400" /> Клипы</div>
                <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-teal-400" /> Посты</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Processing Times */}
        <motion.div variants={fadeInUp}>
          <Card className="border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="size-5 text-orange-600" /> Время обработки
              </CardTitle>
              <CardDescription>Длительность обработки клипов (сек)</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {data.processingTimes.map((p, i) => {
                    const maxDuration = Math.max(...data.processingTimes.map(d => d.duration))
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground flex-1 truncate min-w-0">{p.clipName}</span>
                        <div className="w-24 h-5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden relative">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${maxDuration > 0 ? (p.duration / maxDuration) * 100 : 0}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className={`h-full rounded-sm ${p.cropMode === 'center' ? 'bg-emerald-400' : 'bg-amber-400'}`}
                          />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{p.duration}s</span>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Platform Stats */}
      <motion.div variants={fadeInUp}>
        <CardHeader className="pb-3 px-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ThumbsUp className="size-5 text-emerald-600" /> Статистика платформ
          </CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {data.platformStats.map((p) => {
            const config = platformConfig[p.platform as Platform] || platformConfig.tiktok
            const totalPosts = p.postsPublished + p.postsScheduled + p.postsFailed
            return (
              <motion.div key={p.platform} variants={scaleIn}>
                <Card className={`border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`size-8 rounded-lg ${config.bgClass} dark:bg-opacity-30 flex items-center justify-center`}>{config.icon}</div>
                      <span className="font-semibold text-sm">{config.label}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="bg-emerald-50 dark:bg-emerald-950/50 rounded p-1.5"><div className="font-bold text-emerald-700 dark:text-emerald-400">{p.postsPublished}</div><div className="text-muted-foreground">Публик.</div></div>
                      <div className="bg-amber-50 dark:bg-amber-950/50 rounded p-1.5"><div className="font-bold text-amber-700 dark:text-amber-400">{p.postsScheduled}</div><div className="text-muted-foreground">План.</div></div>
                      <div className="bg-rose-50 dark:bg-rose-950/50 rounded p-1.5"><div className="font-bold text-rose-700 dark:text-rose-400">{p.postsFailed}</div><div className="text-muted-foreground">Ошиб.</div></div>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Просмотры</span><span className="font-medium">{p.avgViews.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Лайки</span><span className="font-medium">{p.avgLikes.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Подписчики</span><span className="font-medium">{p.followers.toLocaleString()}</span></div>
                    </div>
                    <Progress value={totalPosts > 0 ? (p.postsPublished / totalPosts) * 100 : 0} className="h-1.5" />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Recent Errors */}
      {data.recentErrors.length > 0 && (
        <motion.div variants={fadeInUp}>
          <Card className="border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/20 dark:to-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="size-5 text-rose-600" /> Последние ошибки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentErrors.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-rose-100 dark:border-rose-900/50">
                    <XCircle className="size-4 text-rose-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.error}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs py-0">{e.platform}</Badge>
                        <span className="text-xs text-muted-foreground">{e.clipTitle}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{e.timestamp}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Success Rate */}
      <motion.div variants={fadeInUp}>
        <Card className="border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="size-5 text-emerald-600" /> Общая успешность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative size-24 shrink-0">
                <svg className="size-24 -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-slate-100 dark:text-slate-700" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="3" strokeDasharray={`${data.successRate.rate}, 100`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-emerald-600">{data.successRate.rate}%</span>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-4">
                <div className="text-center"><div className="text-2xl font-bold text-slate-700 dark:text-slate-300">{data.successRate.total}</div><div className="text-xs text-muted-foreground">Всего</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-emerald-600">{data.successRate.success}</div><div className="text-xs text-muted-foreground">Успешно</div></div>
                <div className="text-center"><div className="text-2xl font-bold text-rose-600">{data.successRate.failed}</div><div className="text-xs text-muted-foreground">Ошибки</div></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ShortsStudioPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <Scissors className="size-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">Shorts Studio</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Video clipping & autoposting</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={cycleTheme} className="size-9">
                    {theme === 'dark' ? <Moon className="size-4" /> : theme === 'light' ? <Sun className="size-4" /> : <Monitor className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {theme === 'dark' ? 'Тёмная тема' : theme === 'light' ? 'Светлая тема' : 'Системная тема'} — нажмите для переключения
                </TooltipContent>
              </Tooltip>
            )}
            <Badge variant="outline" className="text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50">
              <span className="size-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Online
            </Badge>
          </div>
        </div>
      </header>
      <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <LayoutDashboard className="size-4" /> Дашборд
            </TabsTrigger>
            <TabsTrigger value="video-manager" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <Video className="size-4" /> Видео
            </TabsTrigger>
            <TabsTrigger value="clips-library" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <Film className="size-4" /> Клипы
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <Users className="size-4" /> Аккаунты
            </TabsTrigger>
            <TabsTrigger value="posts-schedule" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <CalendarClock className="size-4" /> Посты
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <BarChart3 className="size-4" /> Аналитика
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <Layers className="size-4" /> Архитектура
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs sm:text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
              <Settings2 className="size-4" /> Настройки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="video-manager"><VideoManagerTab /></TabsContent>
          <TabsContent value="clips-library"><ClipsLibraryTab /></TabsContent>
          <TabsContent value="accounts"><AccountsTab /></TabsContent>
          <TabsContent value="posts-schedule"><PostsScheduleTab /></TabsContent>
          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="architecture"><ArchitectureTab /></TabsContent>
          <TabsContent value="settings"><SettingsTab /></TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Shorts Studio v1.0.0-beta • Video clipping & autoposting</span>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-400" /> FFmpeg: Mock</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-400" /> Scheduler: Running</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-400" /> Storage: 8%</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-teal-400" /> DB: SQLite</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
