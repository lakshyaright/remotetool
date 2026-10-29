import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  ExternalLink,
  Power,
  Users,
  Settings,
  AlertCircle,
  Eye,
  Radio,
  FileCheck,
  Clipboard,
  Volume2,
  Cpu
} from 'lucide-react';
import { HostSessionInfo, SessionPermissions } from '../types/remote';
import { soundManager } from '../utils/audio';

interface HostViewProps {
  session: HostSessionInfo;
  onUpdatePermissions: (perms: SessionPermissions) => void;
  onStartScreenShare: () => Promise<void>;
  onStopScreenShare: () => void;
  stream: MediaStream | null;
  logs: string[];
}

export const HostView: React.FC<HostViewProps> = ({
  session,
  onUpdatePermissions,
  onStartScreenShare,
  onStopScreenShare,
  stream,
  logs,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef && stream) {
      videoRef.srcObject = stream;
    }
  }, [videoRef, stream]);

  const copyId = () => {
    navigator.clipboard.writeText(session.deviceId.replace(/-/g, ''));
    setCopiedId(true);
    soundManager.playClickSound();
    setTimeout(() => setCopiedId(false), 2000);
  };

  const copyInviteLink = () => {
    const rawId = session.deviceId.replace(/-/g, '');
    const url = `${window.location.origin}${window.location.pathname}?connect=${rawId}&pin=${session.pin}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    soundManager.playClickSound();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const openViewerInNewTab = () => {
    const rawId = session.deviceId.replace(/-/g, '');
    const url = `${window.location.origin}${window.location.pathname}?connect=${rawId}&pin=${session.pin}`;
    window.open(url, '_blank');
  };

  const handleTogglePerm = (key: keyof SessionPermissions) => {
    onUpdatePermissions({
      ...session.permissions,
      [key]: !session.permissions[key],
    });
    soundManager.playClickSound();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Top Banner / Hero status */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-cyan-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
                HOST MODE ACTIVE
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Workstation: {session.deviceName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Share Your Machine for Remote Assistance
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Provide this Device ID and Security PIN to a trusted support technician. All connections require your approval and browser screen sharing authorization.
            </p>
          </div>

          {/* Quick 1-click Test in New Tab Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={openViewerInNewTab}
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition group"
            >
              <ExternalLink className="w-4 h-4 group-hover:scale-110 transition" />
              <span>Test Remote in New Tab</span>
            </button>
            <button
              onClick={copyInviteLink}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy Direct Link'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Device ID & Security Card */}
        <div className="space-y-6 lg:col-span-1">
          {/* Credentials Card */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Connection Credentials
            </h2>

            {/* Device ID Display */}
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                Your OmniDesk ID
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 group hover:border-cyan-500/50 transition">
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-cyan-400 tracking-wider">
                  {session.deviceId}
                </span>
                <button
                  onClick={copyId}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition"
                  title="Copy ID"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security PIN Display */}
            <div>
              <label className="text-[11px] text-slate-400 font-medium block mb-1">
                One-Time Session PIN
              </label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="font-mono text-xl font-bold text-amber-400 tracking-widest">
                  {session.pin}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Dynamic Token</span>
              </div>
            </div>

            {/* Screen Share Action Button */}
            <div className="pt-2">
              {!stream ? (
                <button
                  onClick={onStartScreenShare}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 flex items-center justify-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4" />
                  Start Screen Sharing (Host)
                </button>
              ) : (
                <button
                  onClick={onStopScreenShare}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition"
                >
                  <Power className="w-4 h-4" />
                  Stop Screen Sharing
                </button>
              )}
            </div>
          </div>

          {/* Access Control & Permissions Card */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Settings className="w-4 h-4 text-indigo-400" />
              Inbound Remote Permissions
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Control exactly what actions the remote technician is allowed to perform on your machine.
            </p>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Monitor className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Remote Mouse & Key Input</p>
                    <p className="text-[10px] text-slate-500">Allow pointer control and typing</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={session.permissions.allowControl}
                  onChange={() => handleTogglePerm('allowControl')}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Clipboard className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Clipboard Sync</p>
                    <p className="text-[10px] text-slate-500">Allow shared copy & paste buffer</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={session.permissions.allowClipboard}
                  onChange={() => handleTogglePerm('allowClipboard')}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">File Transfers</p>
                    <p className="text-[10px] text-slate-500">Allow uploading/downloading files</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={session.permissions.allowFileTransfer}
                  onChange={() => handleTogglePerm('allowFileTransfer')}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Volume2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Transmit System Audio</p>
                    <p className="text-[10px] text-slate-500">Stream audio to technician</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={session.permissions.allowAudio}
                  onChange={() => handleTogglePerm('allowAudio')}
                  className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Live Video Feed Preview & Session Telemetry */}
        <div className="space-y-6 lg:col-span-2">
          {/* Screen Broadcast Preview Monitor */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                Host Video Stream Broadcast
              </h2>
              {stream ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  LIVE BROADCAST (WebRTC)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400">
                  SHARING OFF
                </span>
              )}
            </div>

            {/* Video Canvas Container */}
            <div className="relative aspect-video w-full rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
              {stream ? (
                <video
                  ref={(ref) => setVideoRef(ref)}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <Monitor className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Screen Broadcast Not Started</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1">
                      Click "Start Screen Sharing" above to grant browser screen capture permission. You can choose your entire desktop, a single application window, or a tab.
                    </p>
                  </div>
                  <button
                    onClick={onStartScreenShare}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition"
                  >
                    Select Screen to Share
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Connected Session & Audit Log */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Connected Technician Box */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Connected Remote Endpoint
              </h3>
              
              {session.connectedClientName ? (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{session.connectedClientName}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300">
                      Active
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono space-y-0.5">
                    <p>Channel: WebRTC DataChannel (E2EE)</p>
                    <p>Role: Level 2 Support Technician</p>
                    <p>Connected: {session.connectedAt ? new Date(session.connectedAt).toLocaleTimeString() : 'Just now'}</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  Waiting for incoming technician handshake...
                </div>
              )}
            </div>

            {/* Real-time Security Audit Log */}
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2 shadow-lg flex flex-col">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Security Audit Log
              </h3>
              <div className="flex-1 max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                {logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-slate-600">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span> {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
