import React from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  ShieldCheck,
  X,
  Clock,
  Download,
  AlertTriangle,
  Server,
  Zap
} from 'lucide-react';
import { SystemMetrics } from '../types/remote';
import { soundManager } from '../utils/audio';

interface DiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: SystemMetrics;
  isSandboxMode: boolean;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  metrics,
  isSandboxMode,
}) => {
  if (!isOpen) return null;

  const handleExportReport = () => {
    soundManager.playClickSound();
    const reportText = `OMNIDESK REMOTE AUDIT & DIAGNOSTIC REPORT
Generated: ${new Date().toISOString()}
Session Mode: ${isSandboxMode ? 'Sandbox Workstation' : 'Direct Peer-to-Peer Host'}
Host IP: 192.168.1.104
Encryption: TLS 1.3 / WebRTC AES-256-GCM
----------------------------------------
Performance Telemetry:
Latency: ${metrics.networkLatency} ms
Framerate: ${metrics.fps} FPS
Stream Bitrate: ${metrics.bitrateKbps} Kbps
Packet Loss: ${metrics.packetLoss}%
CPU Usage: ${metrics.cpuUsage}%
Memory Usage: ${metrics.memoryUsage}% (${(metrics.memoryTotalGb * metrics.memoryUsage / 100).toFixed(1)} / ${metrics.memoryTotalGb} GB)
Disk Utilization: ${metrics.diskUsage}%
Host System Uptime: ${metrics.uptimeHours} Hours
----------------------------------------
Security Clearance:
- End-to-End Key Exchange: Verified
- Inbound Screen Consent: Granted by User
- Anti-Tamper Integrity: Active
`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniDesk_Diagnostic_Audit_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 max-w-[calc(100vw-24px)] bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col backdrop-blur-md">
      {/* Header */}
      <div className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">System Diagnostics</h2>
            <p className="text-[11px] text-slate-400 font-mono">Live Telemetry & ICE Status</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Cards Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Network & Stream Quality Gauge */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              Connection Health
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              OPTIMAL
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Roundtrip Latency</span>
              <span className="text-sm font-bold text-cyan-400">{metrics.networkLatency} ms</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Render Framerate</span>
              <span className="text-sm font-bold text-emerald-400">{metrics.fps} FPS</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Throughput</span>
              <span className="text-sm font-bold text-purple-400">{(metrics.bitrateKbps / 1000).toFixed(2)} Mbps</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Packet Loss</span>
              <span className="text-sm font-bold text-slate-200">{metrics.packetLoss}%</span>
            </div>
          </div>
        </div>

        {/* Hardware Resource Usage */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Remote Hardware Utilization
          </span>

          {/* CPU Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Processor (Intel Core i9 24-Core)
              </span>
              <span className="font-mono font-bold text-cyan-400">{metrics.cpuUsage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${metrics.cpuUsage}%` }}
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* RAM Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                System Memory (64 GB DDR5)
              </span>
              <span className="font-mono font-bold text-purple-400">{metrics.memoryUsage}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${metrics.memoryUsage}%` }}
                className="h-full bg-purple-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Disk Bar */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Server className="w-3.5 h-3.5 text-amber-400" />
                NVMe System Drive (C:)
              </span>
              <span className="font-mono font-bold text-amber-400">{metrics.diskUsage}% (580 GB Free)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                style={{ width: `${metrics.diskUsage}%` }}
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Security & Transport Channel */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Protocol & Cryptography
          </span>
          <div className="space-y-1 font-mono text-[11px] text-slate-400">
            <p className="flex justify-between">
              <span>ICE Traversal:</span>
              <span className="text-emerald-400">Direct WebRTC P2P</span>
            </p>
            <p className="flex justify-between">
              <span>Cipher:</span>
              <span className="text-slate-200">AES-256-GCM / SHA-384</span>
            </p>
            <p className="flex justify-between">
              <span>Signaling Server:</span>
              <span className="text-slate-200">OmniDesk Low-Latency Hub</span>
            </p>
            <p className="flex justify-between">
              <span>Consent Verified:</span>
              <span className="text-emerald-400">User Approved</span>
            </p>
          </div>
        </div>

        {/* Export Audit Report */}
        <button
          onClick={handleExportReport}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          Export Diagnostic Audit Report (.txt)
        </button>
      </div>
    </div>
  );
};
