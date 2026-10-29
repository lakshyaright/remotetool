import React, { useState } from 'react';
import {
  Folder,
  FileText,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  RefreshCw,
  File
} from 'lucide-react';
import { RemoteFileItem } from '../types/remote';
import { soundManager } from '../utils/audio';

interface FileTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendFile: (fileName: string, size: string) => void;
}

export const FileTransferModal: React.FC<FileTransferModalProps> = ({
  isOpen,
  onClose,
  onSendFile,
}) => {
  const [activeTab, setActiveTab] = useState<'remote' | 'transfers'>('remote');
  const [transferProgress, setTransferProgress] = useState<number | null>(null);
  const [transfers, setTransfers] = useState<Array<{ name: string; size: string; status: 'completed' | 'uploading'; direction: 'up' | 'down' }>>([
    { name: 'System_Report_Oct2026.log', size: '24 KB', status: 'completed', direction: 'down' },
    { name: 'Server_Configuration.ini', size: '1.2 KB', status: 'completed', direction: 'down' }
  ]);

  if (!isOpen) return null;

  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    setTransferProgress(10);
    soundManager.playNotification();

    const interval = setInterval(() => {
      setTransferProgress(prev => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          setTransfers(t => [{ name: file.name, size: sizeStr, status: 'completed', direction: 'up' }, ...t]);
          onSendFile(file.name, sizeStr);
          soundManager.playConnectChime();
          return null;
        }
        return prev + 30;
      });
    }, 300);
  };

  const handleDownloadFile = (fileName: string, size: string) => {
    soundManager.playClickSound();
    setTransfers(t => [{ name: fileName, size, status: 'completed', direction: 'down' }, ...t]);
    
    // Create actual simulated text download
    const blob = new Blob([`[OmniDesk Remote Transfer]\nFilename: ${fileName}\nFetched from Remote Host at: ${new Date().toISOString()}\nSize: ${size}\nStatus: Verified 256-bit hash`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Remote File Transfer Manager</h2>
              <p className="text-[11px] text-slate-400">Bidirectional encrypted stream between endpoints</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('remote')}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'remote' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Remote Host Files (C:\RemoteAdmin)
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`pb-2.5 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'transfers' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Transfer History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300 font-mono">
              {transfers.length}
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'remote' ? (
            <div className="space-y-4">
              {/* Upload Drop Zone */}
              <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition">
                <Upload className="w-7 h-7 text-cyan-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Drop files here or click to send to Remote Host</p>
                  <p className="text-[11px] text-slate-500">Supports scripts, patches, diagnostic utilities up to 2 GB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleSimulateUpload}
                />
              </label>

              {/* Progress if active */}
              {transferProgress !== null && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Transferring file...</span>
                    <span className="text-cyan-400 font-mono">{transferProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      style={{ width: `${transferProgress}%` }} 
                      className="h-full bg-cyan-500 transition-all duration-300"
                    />
                  </div>
                </div>
              )}

              {/* Remote Available Files to Pull */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Remote Files</p>
                <div className="space-y-2">
                  {[
                    { name: 'System_Report_Oct2026.log', size: '24 KB', type: 'log' },
                    { name: 'Network_Topology.json', size: '4.8 KB', type: 'json' },
                    { name: 'Server_Configuration.ini', size: '1.2 KB', type: 'ini' },
                    { name: 'Security_Audit.pdf', size: '1.8 MB', type: 'pdf' },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-cyan-400 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-slate-200">{f.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{f.size}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadFile(f.name, f.size)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Transfers Tab */
            <div className="space-y-2">
              {transfers.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">No transfers completed yet in this session.</p>
              ) : (
                transfers.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.direction === 'up' ? (
                        <Upload className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Download className="w-4 h-4 text-emerald-400" />
                      )}
                      <div>
                        <p className="text-xs font-medium text-slate-200">{item.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{item.size} • {item.direction === 'up' ? 'Uploaded to Host' : 'Downloaded from Host'}</p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono">
          <span>Encryption: End-to-End TLS 1.3</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-sans transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
