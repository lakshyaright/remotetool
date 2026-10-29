import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  MousePointer,
  PenTool,
  Send,
  Maximize2,
  Minimize2,
  Settings,
  Activity,
  Folder,
  MessageSquare,
  Power,
  Shield,
  Wifi,
  Keyboard,
  Layers,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
  Eraser,
  Sliders,
  Radio,
  FileText
} from 'lucide-react';
import { InteractiveDesktop } from './InteractiveDesktop';
import { SystemMetrics, AnnotationStroke, RemotePointerEvent } from '../types/remote';
import { soundManager } from '../utils/audio';

interface ClientViewProps {
  isConnected: boolean;
  isConnecting: boolean;
  isSandboxMode: boolean;
  targetDeviceId: string;
  setTargetDeviceId: (id: string) => void;
  targetPin: string;
  setTargetPin: (pin: string) => void;
  onConnect: () => void;
  onConnectSandbox: () => void;
  onDisconnect: () => void;
  remoteStream: MediaStream | null;
  metrics: SystemMetrics;
  onSendPointer: (event: RemotePointerEvent) => void;
  onSendHotkey: (hotkey: string) => void;
  onOpenFileTransfer: () => void;
  onOpenChat: () => void;
  onOpenDiagnostics: () => void;
  unreadChatCount: number;
}

export const ClientView: React.FC<ClientViewProps> = ({
  isConnected,
  isConnecting,
  isSandboxMode,
  targetDeviceId,
  setTargetDeviceId,
  targetPin,
  setTargetPin,
  onConnect,
  onConnectSandbox,
  onDisconnect,
  remoteStream,
  metrics,
  onSendPointer,
  onSendHotkey,
  onOpenFileTransfer,
  onOpenChat,
  onOpenDiagnostics,
  unreadChatCount,
}) => {
  // Remote toolbar states
  const [toolMode, setToolMode] = useState<'control' | 'laser' | 'draw'>('control');
  const [laserColor, setLaserColor] = useState<string>('#ef4444');
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<AnnotationStroke | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHotkeyMenu, setShowHotkeyMenu] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'1080p' | '720p' | 'adaptive'>('adaptive');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hook up incoming video stream if any
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Canvas drawing for annotations/whiteboard
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });

    if (currentStroke && currentStroke.points.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = currentStroke.color;
      ctx.lineWidth = currentStroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
      for (let i = 1; i < currentStroke.points.length; i++) {
        ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  // Handle pointer interactions on remote view
  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === 'draw') {
      setCurrentStroke({
        points: [{ x, y }],
        color: laserColor,
        width: 3,
      });
      return;
    }

    if (toolMode === 'laser') {
      soundManager.playClickSound();
      return;
    }

    // Normal control mode: transmit click to host
    onSendPointer({ x, y, type: 'click' });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (toolMode === 'draw' && currentStroke) {
      setCurrentStroke(prev => prev ? {
        ...prev,
        points: [...prev.points, { x, y }],
      } : null);
      return;
    }

    if (toolMode === 'control') {
      onSendPointer({ x, y, type: 'move' });
    }
  };

  const handlePointerUp = () => {
    if (toolMode === 'draw' && currentStroke) {
      setStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const clearDrawings = () => {
    setStrokes([]);
    setCurrentStroke(null);
    soundManager.playClickSound();
  };

  // If NOT connected, show sleek Connect Form
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
            DIRECT PEER-TO-PEER REMOTE PROTOCOL
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Connect to Remote Workstation
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Provide the 9-digit Device ID and Session PIN generated on the host machine to initiate an encrypted remote assistance session.
          </p>
        </div>

        {/* Two Options: Form Card & Instant Sandbox Button */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Option 1: Connect with Credentials */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between shadow-2xl space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-cyan-400" />
                  Remote Host Credentials
                </span>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                  AES-256-GCM
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    Target Device ID (9 Digits)
                  </label>
                  <input
                    type="text"
                    value={targetDeviceId}
                    onChange={(e) => setTargetDeviceId(e.target.value)}
                    placeholder="e.g. 482-910-374"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none font-mono text-lg text-cyan-300 placeholder-slate-600 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    One-Time Session PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={targetPin}
                    onChange={(e) => setTargetPin(e.target.value)}
                    placeholder="4-digit PIN"
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none font-mono text-lg text-amber-300 placeholder-slate-600 tracking-widest transition"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onConnect}
              disabled={isConnecting || !targetDeviceId.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 transition disabled:opacity-40"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Establishing Encrypted Tunnel...
                </>
              ) : (
                <>
                  Connect to Host
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Option 2: Instant Sandbox Workstation */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 p-6 flex flex-col justify-between shadow-2xl space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
                  No 2nd Device Needed
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Instant Interactive Sandbox Host
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Launch a simulated live Windows/Linux remote workstation inside this session immediately.
                Interact with a live PowerShell terminal, task manager, process killer, file explorer, and system diagnostics without needing two separate computers!
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Real command prompt execution (`sysinfo`, `ping`, `kill`)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Live animated CPU / RAM graphs & process killer
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Remote file browser & text log editor
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Remote laser pointer & whiteboard markup
                </div>
              </div>
            </div>

            <button
              onClick={onConnectSandbox}
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-950/40 flex items-center justify-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              Launch Live Sandbox Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Once CONNECTED: Full Remote Desktop Workspace Viewer
  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-[calc(100vh-56px)] flex flex-col bg-slate-950 overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''
      }`}
    >
      {/* Top Floating Remote Action Toolbar */}
      <div className="h-12 bg-slate-900/90 border-b border-slate-800 px-4 flex items-center justify-between z-30 backdrop-blur select-none">
        {/* Left: Remote Host Name & Latency */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wide">
              {isSandboxMode ? 'DEMO-WORKSTATION-ALPHA99' : `REMOTE HOST #${targetDeviceId || '482-910-374'}`}
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-[11px] font-mono text-cyan-400">
            {metrics.networkLatency}ms • {metrics.fps} FPS • {(metrics.bitrateKbps / 1000).toFixed(1)} Mbps
          </span>
        </div>

        {/* Center: Remote Control & Annotation Tools */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => { setToolMode('control'); soundManager.playClickSound(); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              toolMode === 'control' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Interactive Mouse & Keyboard Mode"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Control</span>
          </button>

          <button
            onClick={() => { setToolMode('draw'); soundManager.playClickSound(); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              toolMode === 'draw' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
            title="Draw Whiteboard / Laser Annotations"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Annotate</span>
          </button>

          {toolMode === 'draw' && (
            <>
              <div className="flex items-center gap-1 pl-1">
                {['#ef4444', '#eab308', '#06b6d4', '#10b981'].map(color => (
                  <button
                    key={color}
                    onClick={() => setLaserColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-3.5 h-3.5 rounded-full transition ${laserColor === color ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
                  />
                ))}
              </div>
              <button
                onClick={clearDrawings}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Clear Markup"
              >
                <Eraser className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          {/* Quick Remote Hotkeys Menu */}
          <div className="relative">
            <button
              onClick={() => setShowHotkeyMenu(prev => !prev)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 flex items-center gap-1 transition"
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Hotkeys</span>
            </button>

            {showHotkeyMenu && (
              <div 
                onClick={() => setShowHotkeyMenu(false)}
                className="absolute top-9 left-0 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 space-y-1 text-xs"
              >
                <button
                  onClick={() => onSendHotkey('Ctrl+Alt+Del')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-mono"
                >
                  Ctrl + Alt + Del
                </button>
                <button
                  onClick={() => onSendHotkey('Win+R')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-mono"
                >
                  Win + R (Run Dialog)
                </button>
                <button
                  onClick={() => onSendHotkey('Ctrl+Shift+Esc')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-mono"
                >
                  Ctrl+Shift+Esc (TaskMgr)
                </button>
                <button
                  onClick={() => onSendHotkey('Alt+Tab')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-mono"
                >
                  Alt + Tab (Switch Window)
                </button>
                <button
                  onClick={() => onSendHotkey('Win+D')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white font-mono"
                >
                  Win + D (Show Desktop)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Drawer Actions (Files, Chat, Telemetry, Fullscreen, Disconnect) */}
        <div className="flex items-center gap-2">
          {/* File Transfer */}
          <button
            onClick={onOpenFileTransfer}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Remote File Transfer"
          >
            <Folder className="w-4 h-4 text-amber-400" />
          </button>

          {/* Telemetry Drawer */}
          <button
            onClick={onOpenDiagnostics}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="System Diagnostics & Telemetry"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Chat & Clipboard Drawer with badge */}
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Chat & Clipboard Sync"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[10px] flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Disconnect */}
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-rose-950/40"
            title="End Session"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End Session</span>
          </button>
        </div>
      </div>

      {/* Main Remote Workspace Canvas */}
      <div 
        className="flex-1 relative overflow-hidden bg-black flex items-center justify-center"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
      >
        {/* If live WebRTC screen stream from real host is available: */}
        {remoteStream ? (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>
        ) : (
          /* Render full interactive simulated desktop workstation */
          <InteractiveDesktop readOnly={toolMode === 'draw'} />
        )}

        {/* Transparent Annotation Overlay Canvas for Drawings */}
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          className="absolute inset-0 pointer-events-none z-20"
        />
      </div>
    </div>
  );
};
