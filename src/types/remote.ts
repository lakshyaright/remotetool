export type ConnectionMode = 'idle' | 'host' | 'client' | 'demo';

export interface HostSessionInfo {
  deviceId: string;
  pin: string;
  deviceName: string;
  os: string;
  ipAddress: string;
  isSharingScreen: boolean;
  connectedClientName?: string;
  connectedAt?: number;
  permissions: SessionPermissions;
}

export interface SessionPermissions {
  allowControl: boolean;
  allowClipboard: boolean;
  allowFileTransfer: boolean;
  allowAudio: boolean;
  allowSystemCommands: boolean;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotalGb: number;
  diskUsage: number;
  networkLatency: number;
  fps: number;
  bitrateKbps: number;
  packetLoss: number;
  uptimeHours: number;
}

export interface ProcessItem {
  pid: number;
  name: string;
  cpu: number;
  memoryMb: number;
  status: 'running' | 'sleeping' | 'suspended';
  user: string;
}

export interface RemoteFileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  size: string;
  modified: string;
  extension?: string;
  content?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'host' | 'technician' | 'system';
  senderName: string;
  text: string;
  timestamp: string;
  isFile?: boolean;
  fileName?: string;
  fileSize?: string;
}

export interface RemotePointerEvent {
  x: number;
  y: number;
  type: 'move' | 'click' | 'dblclick' | 'contextmenu';
  color?: string;
}

export interface AnnotationStroke {
  points: { x: number; y: number }[];
  color: string;
  width: number;
}
