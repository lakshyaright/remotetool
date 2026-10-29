import React, { useState, useRef, useEffect } from 'react';
import {
  Monitor,
  MousePointer,
  PenTool,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Power,
  Folder,
  MessageSquare,
  Activity,
  Keyboard,
  Sparkles,
  Share2,
  Eraser,
  Copy,
  Radio,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { SystemMetrics, AnnotationStroke, RemotePointerEvent } from '../types/remote';
import { soundManager } from '../utils/audio';

interface RealScreenViewerProps {
  stream: MediaStream | null;
  onStartScreenShare: () => Promise<void>;
  onDisconnect: () => void;
  targetDeviceId: string;
  metrics: SystemMetrics;
  onSendPointer: (event: RemotePointerEvent) => void;
  onSendHotkey: (hotkey: string) => void;
  onOpenFileTransfer: () => void;
  onOpenChat: () => void;
  onOpenDiagnostics: () => void;
  unreadChatCount: number;
}

export const RealScreenViewer: React.FC<RealScreenViewerProps> = ({
  stream,
  onStartScreenShare,
  onDisconnect,
  targetDeviceId,
  metrics,
  onSendPointer,
  onSendHotkey,
  onOpenFileTransfer,
  onOpenChat,
  onOpenDiagnostics,
  unreadChatCount,
}) => {
  const [toolMode, setToolMode] = useState<'control' | 'laser' | 'draw'>('control');
  const [laserColor, setLaserColor] = useState<string>('#ef4444');
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<AnnotationStroke | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showHotkeyMenu, setShowHotkeyMenu] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [clickRipples, setClickRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [resolution, setResolution] = useState<string>('1920x1080');

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Hook up video stream
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      const track = stream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        if (settings.width && settings.height) {
          setResolution(`${settings.width}x${settings.height}`);
        }
      }
    }
  }, [stream]);

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

  // Canvas drawing for annotations
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

    // Trigger visual click ripple effect
    const rippleId = Date.now();
    setClickRipples(prev => [...prev, { id: rippleId, x, y }]);
    setTimeout(() => {
      setClickRipples(prev => prev.filter(r => r.id !== rippleId));
    }, 600);

    soundManager.playClickSound();
    onSendPointer({ x, y, type: 'click' });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPos({ x, y });

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

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[calc(100vh-56px)] flex flex-col bg-black overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : ''
      }`}
    >
      {/* Top Floating Remote Desktop Action Toolbar */}
      <div className="h-12 bg-slate-950/95 border-b border-slate-800/80 px-4 flex items-center justify-between z-30 backdrop-blur">
        {/* Left: Remote Host Name & Live Resolution */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
              <span>HOST: #{targetDeviceId || '482-910-374'}</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800">
                LIVE SCREEN
              </span>
            </span>
          </div>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-[11px] font-mono text-cyan-400 hidden sm:inline">
            {metrics.networkLatency}ms • {metrics.fps} FPS • {resolution}
          </span>
        </div>

        {/* Center: Remote Control & Annotation Tools */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => { setToolMode('control'); soundManager.playClickSound(); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              toolMode === 'control' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Interactive Mouse Pointer Mode"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mouse Control</span>
          </button>

          <button
            onClick={() => { setToolMode('draw'); soundManager.playClickSound(); }}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              toolMode === 'draw' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Laser Marker & Screen Annotations"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Laser / Draw</span>
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
                title="Clear Drawings"
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
                  Win + D (Desktop)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Audio, Files, Diagnostics, Chat, Fullscreen, Disconnect */}
        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(prev => !prev)}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title={isMuted ? 'Unmute Remote Audio' : 'Mute Remote Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-slate-300" />}
          </button>

          {/* File Transfer */}
          <button
            onClick={onOpenFileTransfer}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="File Transfer"
          >
            <Folder className="w-4 h-4 text-amber-400" />
          </button>

          {/* Telemetry */}
          <button
            onClick={onOpenDiagnostics}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="System Diagnostics"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
          </button>

          {/* Chat with badge */}
          <button
            onClick={onOpenChat}
            className="relative p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Live Chat & Clipboard"
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
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Disconnect */}
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-rose-950/40"
            title="Terminate Remote Session"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Disconnect</span>
          </button>
        </div>
      </div>

      {/* Main Screen Stream Display Container */}
      <div 
        className="flex-1 relative overflow-hidden bg-slate-950 flex items-center justify-center cursor-crosshair"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
      >
        {stream ? (
          /* Real Screen Video Element */
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="max-w-full max-h-full object-contain pointer-events-none shadow-2xl"
            />
          </div>
        ) : (
          /* Host Screen Not Started Prompt */
          <div className="text-center p-6 space-y-4 max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Share2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Live Screen Broadcast Ready</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                To see the real-world screen live, start browser screen capture on the host device. You can share your entire desktop, a single application window, or a tab.
              </p>
            </div>
            <button
              onClick={onStartScreenShare}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition"
            >
              <Monitor className="w-4 h-4" />
              <span>Select Screen to Stream Now (Real Life)</span>
            </button>
          </div>
        )}

        {/* Click Ripples Animation on Remote Screen */}
        {clickRipples.map(ripple => (
          <div
            key={ripple.id}
            style={{ left: ripple.x, top: ripple.y }}
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
          >
            <div className="w-10 h-10 rounded-full border-2 border-cyan-400 animate-ping opacity-75"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-400 -translate-x-1/2 -translate-y-1/2 absolute top-1/2 left-1/2"></div>
          </div>
        ))}

        {/* Annotation Overlay Canvas */}
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          className="absolute inset-0 pointer-events-none z-20"
        />

        {/* Live Remote Pointer Position Indicator */}
        {cursorPos && (
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-[10px] font-mono text-slate-400 pointer-events-none z-30">
            X: {Math.round(cursorPos.x)} Y: {Math.round(cursorPos.y)}
          </div>
        )}
      </div>
    </div>
  );
};
