import React from 'react';
import {
  Monitor,
  ShieldCheck,
  Wifi,
  WifiOff,
  Radio,
  Lock,
  Power,
  Layers,
  Sparkles,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ConnectionMode, SystemMetrics } from '../types/remote';

interface NavbarProps {
  mode: ConnectionMode;
  onSelectMode: (mode: ConnectionMode) => void;
  isConnected: boolean;
  sessionId?: string;
  metrics: SystemMetrics;
  onDisconnect: () => void;
  onOpenQuickDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  onSelectMode,
  isConnected,
  sessionId,
  metrics,
  onDisconnect,
  onOpenQuickDemo
}) => {
  return (
    <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-4 flex items-center justify-between z-40 sticky top-0">
      {/* Brand & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Monitor className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                OmniDesk
                <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Remote
                </span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans hidden sm:block">
              Web-Based Remote Support & Desktop Protocol
            </p>
          </div>
        </div>

        {/* Real-time Session Indicator */}
        <div className="h-5 w-px bg-slate-800 hidden md:block"></div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>CONNECTED {sessionId ? `(#${sessionId})` : ''}</span>
              <span className="text-slate-600 hidden lg:inline">|</span>
              <span className="text-slate-400 hidden lg:inline">{metrics.networkLatency}ms • {metrics.fps} FPS</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>STANDBY</span>
            </div>
          )}

          {/* Security Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>TLS 1.3 / AES-256</span>
          </div>
        </div>
      </div>

      {/* Mode Switches & Action Controls */}
      <div className="flex items-center gap-2">
        {/* Navigation Mode Pill */}
        <div className="bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 flex items-center text-xs">
          <button
            onClick={() => onSelectMode('client')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              mode === 'client'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Remote Desktop</span>
          </button>
          
          <button
            onClick={() => onSelectMode('host')}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              mode === 'host'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Share Screen (Host)</span>
          </button>

          <button
            onClick={onOpenQuickDemo}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              mode === 'demo'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Reset Sandbox Session"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Reset Sandbox</span>
          </button>
        </div>

        {/* Disconnect or End Session button if connected */}
        {isConnected && (
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Power className="w-3.5 h-3.5" />
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
};
