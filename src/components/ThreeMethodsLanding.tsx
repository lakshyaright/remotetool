import React, { useState } from 'react';
import {
  Link as LinkIcon,
  KeyRound,
  Monitor,
  Copy,
  Check,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Radio,
  Share2,
  Lock,
  Sparkles,
  Laptop
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ThreeMethodsLandingProps {
  deviceId: string;
  pin: string;
  targetDeviceId: string;
  setTargetDeviceId: (id: string) => void;
  targetPin: string;
  setTargetPin: (pin: string) => void;
  onConnectByCode: () => void;
  onStartHostScreenShare: () => void;
  isSharingScreen: boolean;
  onTakeRemoteViaUrl: () => void;
}

export const ThreeMethodsLanding: React.FC<ThreeMethodsLandingProps> = ({
  deviceId,
  pin,
  targetDeviceId,
  setTargetDeviceId,
  targetPin,
  setTargetPin,
  onConnectByCode,
  onStartHostScreenShare,
  isSharingScreen,
  onTakeRemoteViaUrl,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Generate full shareable URL
  const rawId = deviceId.replace(/-/g, '');
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?session=${rawId}&pin=${pin}`
    : `https://app/?session=${rawId}&pin=${pin}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    soundManager.playClickSound();
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedCode(true);
    soundManager.playClickSound();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const openUrlInNewTab = () => {
    soundManager.playClickSound();
    window.open(shareUrl, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 space-y-10 font-sans">
      {/* Hero Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          REAL-WORLD BROWSER REMOTE ACCESS PROTOCOL
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Choose How to Take Remote Access
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Connect to any remote computer across any network using WebRTC peer-to-peer streaming with real screen visibility.
        </p>
      </div>

      {/* The 3 Core Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ================= METHOD 1: GENERATE URL ================= */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 p-6 flex flex-col justify-between shadow-2xl relative group hover:border-cyan-500/60 transition">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-500/40 font-mono">
                01
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Any Network
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                <h3 className="text-lg font-bold text-white">Generate Remote URL</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send this link to ANY system (phone, laptop, or desktop). Opening this link instantly connects to this machine's screen.
              </p>
            </div>

            {/* Generated URL Box */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">
                Instant Access Link
              </span>
              <div className="font-mono text-xs text-cyan-300 break-all bg-slate-900/80 p-2 rounded border border-slate-800 select-all">
                {shareUrl}
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-2.5">
            <button
              onClick={copyUrl}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition active:scale-98"
            >
              {copiedUrl ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedUrl ? 'Link Copied to Clipboard!' : 'Copy Remote Access URL'}</span>
            </button>

            <button
              onClick={openUrlInNewTab}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Test Remote in New Tab</span>
            </button>
          </div>
        </div>

        {/* ================= METHOD 2: CONNECT VIA UNIQUE CODE ================= */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-indigo-500/30 p-6 flex flex-col justify-between shadow-2xl relative group hover:border-indigo-500/60 transition">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/40 font-mono">
                02
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                Direct Pairing
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Connect via Unique Code</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter the remote host's 9-digit Device ID and session PIN to take control and view their screen in real time.
              </p>
            </div>

            {/* Inputs for Device ID and PIN */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Target Unique Code (9 Digits)
                </label>
                <input
                  type="text"
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value)}
                  placeholder="e.g. 482-910-374"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono text-sm text-indigo-300 placeholder-slate-600 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Session Security PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={targetPin}
                  onChange={(e) => setTargetPin(e.target.value)}
                  placeholder="4-digit PIN (e.g. 8392)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none font-mono text-sm text-amber-300 placeholder-slate-600 tracking-wider transition"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={onConnectByCode}
              disabled={!targetDeviceId.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition active:scale-98 disabled:opacity-40"
            >
              <span>Connect & Take Remote Screen</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= METHOD 3: SHARE SCREEN (HOST THIS MACHINE) ================= */}
        <div className="rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 p-6 flex flex-col justify-between shadow-2xl relative group hover:border-emerald-500/60 transition">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-500/40 font-mono">
                03
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Host Machine
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <h3 className="text-lg font-bold text-white">Share My Screen</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Allow a remote user to take control of this computer. Captures entire desktop, window, or tab with audio.
              </p>
            </div>

            {/* This Machine's ID and PIN */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">
                    Your Machine ID
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-400">
                    {deviceId}
                  </span>
                </div>
                <button
                  onClick={copyCode}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  title="Copy ID"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-900 font-mono">
                <span className="text-slate-500">Security PIN:</span>
                <span className="font-bold text-amber-300">{pin}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button
              onClick={onStartHostScreenShare}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-98 ${
                isSharingScreen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>{isSharingScreen ? 'Broadcasting (Click to Stop)' : 'Start Sharing Screen (Real Host)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security notice & Quick demonstration */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>Peer-to-Peer Encrypted</strong>: Connections use browser WebRTC (TLS 1.3 + AES-GCM-256) directly between endpoints.
          </span>
        </div>
        <button
          onClick={onTakeRemoteViaUrl}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold transition shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick 1-Click Remote Preview</span>
        </button>
      </div>
    </div>
  );
};
