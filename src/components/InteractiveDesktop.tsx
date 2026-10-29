import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Activity,
  Folder,
  FileText,
  Settings,
  Globe,
  Maximize2,
  Minimize2,
  X,
  Cpu,
  HardDrive,
  Wifi,
  Volume2,
  Clock,
  ShieldCheck,
  Search,
  RefreshCw,
  Power,
  Play,
  Trash2,
  Send,
  AlertTriangle,
  Lock,
  Download,
  Upload
} from 'lucide-react';
import { ProcessItem, RemoteFileItem } from '../types/remote';

interface WindowState {
  id: string;
  title: string;
  icon: any;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface InteractiveDesktopProps {
  onPointerAction?: (x: number, y: number, action: string) => void;
  externalCursor?: { x: number; y: number; active: boolean };
  readOnly?: boolean;
}

const INITIAL_PROCESSES: ProcessItem[] = [
  { pid: 1044, name: 'System Core Engine', cpu: 1.8, memoryMb: 142, status: 'running', user: 'SYSTEM' },
  { pid: 2890, name: 'OmniDesk Remote Host Agent', cpu: 4.2, memoryMb: 210, status: 'running', user: 'SYSTEM' },
  { pid: 3412, name: 'Windows Defender Antivirus', cpu: 0.9, memoryMb: 180, status: 'running', user: 'SYSTEM' },
  { pid: 4892, name: 'WebRTC Signaling Relay', cpu: 2.1, memoryMb: 95, status: 'running', user: 'Admin' },
  { pid: 5120, name: 'Chrome Browser (8 tabs)', cpu: 7.5, memoryMb: 680, status: 'running', user: 'Admin' },
  { pid: 6301, name: 'SQL Server Database', cpu: 3.4, memoryMb: 450, status: 'running', user: 'NetworkService' },
  { pid: 7810, name: 'Node.js Microservice', cpu: 1.2, memoryMb: 115, status: 'running', user: 'Admin' },
  { pid: 8204, name: 'Windows Explorer Shell', cpu: 0.8, memoryMb: 78, status: 'running', user: 'Admin' },
];

const INITIAL_FILES: RemoteFileItem[] = [
  { id: '1', name: 'System_Report_Oct2026.log', type: 'file', size: '24 KB', modified: 'Today at 09:14', extension: 'log', content: `=== REMOTE SYSTEM DIAGNOSTIC LOG ===\nTimestamp: 2026-10-28 09:14:22 UTC\nOS: Windows 11 Enterprise x64 Build 26100\nCPU: Intel Core i9-14900K (24 Cores / 32 Threads) @ 3.4GHz\nRAM: 64.0 GB DDR5-6000MHz\nStorage: 2TB NVMe M.2 SSD (71% free)\nNetwork: 2.5Gbps Ethernet (192.168.1.104)\nRemote Access Protocol: TLS 1.3 + WebRTC AES-GCM-256\nStatus: All core security modules verified. No critical errors detected.` },
  { id: '2', name: 'Network_Topology.json', type: 'file', size: '4.8 KB', modified: 'Yesterday', extension: 'json', content: `{\n  "gateway": "192.168.1.1",\n  "dns_primary": "1.1.1.1",\n  "dns_secondary": "8.8.8.8",\n  "firewall": "Enterprise Rule #42 Enabled",\n  "allowed_remote_ports": [443, 8443, 3000],\n  "active_tunnels": 1\n}` },
  { id: '3', name: 'Server_Configuration.ini', type: 'file', size: '1.2 KB', modified: '3 days ago', extension: 'ini', content: `[OmniDesk]\nlisten_port = 8443\nallow_unattended_access = true\nrequire_pin = true\nidle_timeout_mins = 30\nencryption = AES-256-GCM\nlog_level = verbose` },
  { id: '4', name: 'Maintenance_Scripts', type: 'folder', size: '3 items', modified: 'Oct 20, 2026' },
  { id: '5', name: 'Security_Audit.pdf', type: 'file', size: '1.8 MB', modified: 'Oct 18, 2026', extension: 'pdf', content: '[Binary PDF Document - Security Compliance Passed - Level 4 Verification]' },
];

export const InteractiveDesktop: React.FC<InteractiveDesktopProps> = ({
  onPointerAction,
  externalCursor,
  readOnly = false,
}) => {
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'terminal',
      title: 'PowerShell / Remote Terminal',
      icon: TerminalIcon,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      x: 32,
      y: 28,
      width: 580,
      height: 380,
      zIndex: 10,
    },
    {
      id: 'taskmgr',
      title: 'Task Manager & Resource Monitor',
      icon: Activity,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 360,
      y: 60,
      width: 540,
      height: 400,
      zIndex: 9,
    },
    {
      id: 'files',
      title: 'File Explorer - Local Disk (C:)',
      icon: Folder,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 120,
      y: 90,
      width: 620,
      height: 390,
      zIndex: 8,
    },
    {
      id: 'editor',
      title: 'Text Editor - System_Report_Oct2026.log',
      icon: FileText,
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      x: 200,
      y: 110,
      width: 560,
      height: 380,
      zIndex: 7,
    },
  ]);

  const [topZ, setTopZ] = useState(15);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    'OmniDesk Remote Management Subsystem [Version 10.0.26100.1742]',
    '(c) 2026 Enterprise Remote Solutions. All rights reserved.',
    '',
    'Session: AUTHENTICATED [Remote Host: Workstation-Alpha-99]',
    'Security context: Administrator (E2E Encrypted Channel)',
    'Type "help" to see available remote administration commands.',
    ''
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Processes state
  const [processes, setProcesses] = useState<ProcessItem[]>(INITIAL_PROCESSES);
  const [cpuHistory, setCpuHistory] = useState<number[]>([12, 18, 15, 22, 19, 25, 21, 16, 28, 20, 18, 22]);
  const [ramHistory, setRamHistory] = useState<number[]>([34, 34, 35, 35, 36, 35, 35, 36, 36, 35, 35, 36]);
  
  // Files state
  const [files, setFiles] = useState<RemoteFileItem[]>(INITIAL_FILES);
  const [selectedFile, setSelectedFile] = useState<RemoteFileItem | null>(INITIAL_FILES[0]);
  const [editorContent, setEditorContent] = useState<string>(INITIAL_FILES[0].content || '');

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // CPU / RAM fluctuation simulation for realistic live workstation
  useEffect(() => {
    const interval = setInterval(() => {
      const baseCpu = 14 + Math.sin(Date.now() / 3000) * 8 + (Math.random() * 6);
      const normalizedCpu = Math.max(8, Math.min(65, Math.round(baseCpu)));
      
      setCpuHistory(prev => [...prev.slice(1), normalizedCpu]);
      
      const normalizedRam = Math.round(35 + Math.sin(Date.now() / 7000) * 2 + (Math.random() * 1.5));
      setRamHistory(prev => [...prev.slice(1), normalizedRam]);

      setProcesses(prev => prev.map(p => {
        if (p.pid === 2890) {
          return { ...p, cpu: +(3.5 + Math.random() * 2).toFixed(1) };
        }
        if (p.pid === 5120) {
          return { ...p, cpu: +(5.0 + Math.random() * 4).toFixed(1) };
        }
        return p;
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const bringToFront = (id: string) => {
    const newZ = topZ + 1;
    setTopZ(newZ);
    setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: newZ, isMinimized: false } : w));
  };

  const toggleWindow = (id: string) => {
    setWindows(prev => prev.map(w => {
      if (w.id === id) {
        if (!w.isOpen) return { ...w, isOpen: true, isMinimized: false, zIndex: topZ + 1 };
        if (w.isMinimized) return { ...w, isMinimized: false, zIndex: topZ + 1 };
        return { ...w, isMinimized: true };
      }
      return w;
    }));
    setTopZ(z => z + 1);
  };

  const closeWindow = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isOpen: false } : w));
  };

  const toggleMaximize = (id: string) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  // Terminal command handling
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const parts = cmd.split(' ');
    const root = parts[0].toLowerCase();

    const newLogs = [...terminalHistory, `PS C:\\RemoteAdmin> ${cmd}`];

    switch (root) {
      case 'help':
        newLogs.push(
          'Available Remote Commands:',
          '  sysinfo          - Show detailed hardware, OS and network specifications',
          '  ps, top          - List active processes with CPU & RAM utilization',
          '  kill <pid>       - Terminate a running process by ID',
          '  ping <host>      - Test network latency to a destination',
          '  netstat          - View active TCP/UDP ports and listening sockets',
          '  dir, ls          - List files in current directory',
          '  cat <filename>   - Read contents of a text file',
          '  whoami           - Display current authenticated security principal',
          '  ipconfig         - Display network adapter IP and MAC addresses',
          '  taskmgr          - Launch GUI Task Manager window',
          '  explorer         - Launch File Explorer window',
          '  clear, cls       - Clear terminal output'
        );
        break;

      case 'clear':
      case 'cls':
        setTerminalHistory([]);
        setTerminalInput('');
        return;

      case 'whoami':
        newLogs.push('WORKSTATION-ALPHA99\\Administrator (High Integrity Level)');
        break;

      case 'sysinfo':
        newLogs.push(
          'Host Name:                 WORKSTATION-ALPHA99',
          'OS Name:                   Microsoft Windows 11 Enterprise x64',
          'OS Version:                10.0.26100 N/A Build 26100',
          'System Manufacturer:       OmniDesk Virtual Hardware Inc.',
          'System Type:               x64-based PC',
          'Processor(s):              1 Processor(s) Installed.',
          '                           [01]: Intel64 Family 6 Model 183 Stepping 1 ~3400 Mhz (24 Cores)',
          'Total Physical Memory:     65,536 MB (64 GB DDR5)',
          'Available Memory:          42,108 MB',
          'Virtual Memory: Max Size:  74,752 MB',
          'Network Card(s):           [01]: Intel(R) Ethernet Controller I225-V (2.5 Gbps) - Active'
        );
        break;

      case 'ps':
      case 'top':
        newLogs.push(
          ' PID   PROCESS NAME                     CPU%   MEM (MB)   STATUS',
          ' ----  -------------------------------  -----  ---------  -------'
        );
        processes.forEach(p => {
          newLogs.push(
            ` ${p.pid.toString().padEnd(6)} ${p.name.padEnd(32)} ${p.cpu.toString().padStart(4)}%  ${p.memoryMb.toString().padStart(7)} MB   ${p.status}`
          );
        });
        break;

      case 'kill':
        const targetPid = parseInt(parts[1], 10);
        if (!targetPid) {
          newLogs.push('ERROR: Missing PID argument. Usage: kill <pid>');
        } else {
          const exists = processes.find(p => p.pid === targetPid);
          if (exists) {
            setProcesses(prev => prev.filter(p => p.pid !== targetPid));
            newLogs.push(`SUCCESS: Process ${targetPid} (${exists.name}) terminated successfully.`);
          } else {
            newLogs.push(`ERROR: Process ID ${targetPid} not found or access denied.`);
          }
        }
        break;

      case 'ping':
        const host = parts[1] || '8.8.8.8';
        newLogs.push(
          `Pinging ${host} with 32 bytes of data:`,
          `Reply from ${host}: bytes=32 time=12ms TTL=117`,
          `Reply from ${host}: bytes=32 time=14ms TTL=117`,
          `Reply from ${host}: bytes=32 time=11ms TTL=117`,
          `Reply from ${host}: bytes=32 time=13ms TTL=117`,
          `Ping statistics for ${host}: Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`,
          `Approximate round trip times: Minimum = 11ms, Maximum = 14ms, Average = 12ms`
        );
        break;

      case 'netstat':
        newLogs.push(
          'Active Connections',
          '  Proto  Local Address          Foreign Address        State',
          '  TCP    0.0.0.0:443            0.0.0.0:0              LISTENING',
          '  TCP    0.0.0.0:8443           0.0.0.0:0              LISTENING (OmniDesk)',
          '  TCP    192.168.1.104:54210    104.18.21.90:443       ESTABLISHED',
          '  TCP    192.168.1.104:54890    34.120.44.11:8443      ESTABLISHED (Peer)'
        );
        break;

      case 'ipconfig':
      case 'ifconfig':
        newLogs.push(
          'Ethernet adapter Local Area Connection:',
          '   Connection-specific DNS Suffix  . : localdomain',
          '   IPv4 Address. . . . . . . . . . . : 192.168.1.104',
          '   Subnet Mask . . . . . . . . . . . : 255.255.255.0',
          '   Default Gateway . . . . . . . . . : 192.168.1.1',
          '   Physical Address. . . . . . . . . : 00-1B-44-11-3A-B7'
        );
        break;

      case 'dir':
      case 'ls':
        newLogs.push(
          ' Directory of C:\\RemoteAdmin',
          '',
          ' Mode                LastWriteTime         Length Name',
          ' ----                -------------         ------ ----',
          ' d-----        10/20/2026  09:14 AM                Maintenance_Scripts',
          ' -a----        10/28/2026  09:14 AM          24576 System_Report_Oct2026.log',
          ' -a----        10/27/2026  04:22 PM           4915 Network_Topology.json',
          ' -a----        10/25/2026  11:05 AM           1228 Server_Configuration.ini',
          ' -a----        10/18/2026  02:30 PM        1887436 Security_Audit.pdf'
        );
        break;

      case 'cat':
        const fname = parts[1];
        if (!fname) {
          newLogs.push('Usage: cat <filename>');
        } else {
          const f = files.find(item => item.name.toLowerCase() === fname.toLowerCase());
          if (f && f.content) {
            newLogs.push(...f.content.split('\n'));
          } else {
            newLogs.push(`File not found: ${fname}`);
          }
        }
        break;

      case 'taskmgr':
        toggleWindow('taskmgr');
        newLogs.push('Task Manager launched.');
        break;

      case 'explorer':
        toggleWindow('files');
        newLogs.push('File Explorer launched.');
        break;

      default:
        newLogs.push(`'${cmd}' is not recognized as an internal or external command. Type 'help' for options.`);
        break;
    }

    setTerminalHistory(newLogs);
    setTerminalInput('');
  };

  const handleOpenFile = (f: RemoteFileItem) => {
    setSelectedFile(f);
    if (f.content) {
      setEditorContent(f.content);
      // open editor window
      setWindows(prev => prev.map(w => w.id === 'editor' ? { ...w, isOpen: true, isMinimized: false, zIndex: topZ + 1 } : w));
      setTopZ(z => z + 1);
    }
  };

  const handleKillProcess = (pid: number) => {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
    setTerminalHistory(prev => [...prev, `[TaskMgr] Terminated Process PID: ${pid}`]);
  };

  return (
    <div 
      className="relative w-full h-full min-h-[580px] bg-slate-900 overflow-hidden select-none flex flex-col font-sans"
      onClick={() => setStartMenuOpen(false)}
    >
      {/* Remote Desktop Wallpaper Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        {/* Subtle glowing center crest */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Remote Host Watermark badge */}
        <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800/80 backdrop-blur text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>HOST: WORKSTATION-ALPHA99</span>
          <span className="text-slate-600">|</span>
          <span>IP: 192.168.1.104</span>
        </div>
      </div>

      {/* Desktop Workspace Icons Grid */}
      <div className="relative z-0 p-6 grid grid-cols-1 auto-rows-max gap-6 w-32">
        <button
          onClick={(e) => { e.stopPropagation(); toggleWindow('terminal'); }}
          className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition group text-xs text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-cyan-500/60 transition">
            <TerminalIcon className="w-6 h-6 text-cyan-400" />
          </div>
          <span className="drop-shadow font-medium">Terminal</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); toggleWindow('taskmgr'); }}
          className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition group text-xs text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-emerald-500/60 transition">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <span className="drop-shadow font-medium">Task Manager</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); toggleWindow('files'); }}
          className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition group text-xs text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-amber-500/60 transition">
            <Folder className="w-6 h-6 text-amber-400" />
          </div>
          <span className="drop-shadow font-medium">Explorer (C:)</span>
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); toggleWindow('editor'); }}
          className="flex flex-col items-center gap-1.5 p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition group text-xs text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-sky-500/60 transition">
            <FileText className="w-6 h-6 text-sky-400" />
          </div>
          <span className="drop-shadow font-medium">System Logs</span>
        </button>
      </div>

      {/* Floating Windows Area */}
      <div className="flex-1 relative overflow-hidden pointer-events-auto">
        {windows.map(win => {
          if (!win.isOpen || win.isMinimized) return null;

          const IconComponent = win.icon;

          return (
            <div
              key={win.id}
              onClick={(e) => { e.stopPropagation(); bringToFront(win.id); }}
              style={{
                position: 'absolute',
                left: win.isMaximized ? 0 : `${win.x}px`,
                top: win.isMaximized ? 0 : `${win.y}px`,
                width: win.isMaximized ? '100%' : `${win.width}px`,
                height: win.isMaximized ? 'calc(100% - 44px)' : `${win.height}px`,
                zIndex: win.zIndex,
              }}
              className={`rounded-xl border shadow-2xl flex flex-col backdrop-blur-md transition-all duration-150 ${
                win.zIndex === topZ
                  ? 'border-cyan-500/40 bg-slate-900/95 shadow-cyan-950/40'
                  : 'border-slate-700/60 bg-slate-900/85 shadow-black/50'
              }`}
            >
              {/* Window Header / Title Bar */}
              <div 
                className="h-10 px-3 bg-slate-800/90 border-b border-slate-700/70 rounded-t-xl flex items-center justify-between cursor-move select-none"
                onMouseDown={() => bringToFront(win.id)}
              >
                <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                  <IconComponent className="w-4 h-4 text-cyan-400" />
                  <span className="truncate max-w-[320px]">{win.title}</span>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleWindow(win.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/70 transition"
                    title="Minimize"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleMaximize(win.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/70 transition"
                    title="Maximize / Restore"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => closeWindow(win.id)}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/80 transition"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Window Content Body */}
              <div className="flex-1 overflow-auto bg-slate-950/60 p-0 text-slate-200 rounded-b-xl">
                {/* 1. Terminal Content */}
                {win.id === 'terminal' && (
                  <div className="h-full flex flex-col font-mono text-xs p-3 bg-slate-950">
                    <div className="flex-1 overflow-y-auto space-y-1 text-slate-300">
                      {terminalHistory.map((line, idx) => (
                        <div key={idx} className="whitespace-pre-wrap leading-relaxed">
                          {line.startsWith('PS C:') ? (
                            <span className="text-cyan-400 font-semibold">{line}</span>
                          ) : line.startsWith('SUCCESS:') ? (
                            <span className="text-emerald-400">{line}</span>
                          ) : line.startsWith('ERROR:') ? (
                            <span className="text-rose-400">{line}</span>
                          ) : line.startsWith('===') ? (
                            <span className="text-amber-300">{line}</span>
                          ) : (
                            line
                          )}
                        </div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>

                    <form onSubmit={handleTerminalSubmit} className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-2">
                      <span className="text-cyan-400 font-bold whitespace-nowrap">PS C:\RemoteAdmin&gt;</span>
                      <input
                        type="text"
                        value={terminalInput}
                        onChange={(e) => setTerminalInput(e.target.value)}
                        placeholder="Type 'help', 'sysinfo', 'ps', 'kill <pid>', 'ping google.com'..."
                        disabled={readOnly}
                        className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none font-mono text-xs"
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={readOnly || !terminalInput.trim()}
                        className="px-2.5 py-1 rounded bg-cyan-600/30 text-cyan-300 hover:bg-cyan-600/50 text-[11px] font-sans flex items-center gap-1 transition disabled:opacity-30"
                      >
                        <Send className="w-3 h-3" />
                        Run
                      </button>
                    </form>
                  </div>
                )}

                {/* 2. Task Manager Content */}
                {win.id === 'taskmgr' && (
                  <div className="h-full flex flex-col p-3 bg-slate-950 space-y-3">
                    {/* Live Performance Graph Mini-Panel */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* CPU Metric Card */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="flex items-center gap-1.5 font-medium text-slate-200">
                            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                            CPU Utilization
                          </span>
                          <span className="font-mono font-bold text-cyan-400">{cpuHistory[cpuHistory.length - 1]}%</span>
                        </div>
                        {/* Mini SVG graph */}
                        <div className="h-10 w-full flex items-end gap-1 bg-slate-950/70 p-1 rounded border border-slate-800/80">
                          {cpuHistory.map((val, i) => (
                            <div
                              key={i}
                              style={{ height: `${Math.max(10, val)}%` }}
                              className="flex-1 bg-cyan-500/80 rounded-t-sm transition-all duration-300"
                            />
                          ))}
                        </div>
                      </div>

                      {/* RAM Metric Card */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                          <span className="flex items-center gap-1.5 font-medium text-slate-200">
                            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                            Memory (RAM)
                          </span>
                          <span className="font-mono font-bold text-purple-400">{ramHistory[ramHistory.length - 1]}% (23.4 / 64 GB)</span>
                        </div>
                        <div className="h-10 w-full flex items-end gap-1 bg-slate-950/70 p-1 rounded border border-slate-800/80">
                          {ramHistory.map((val, i) => (
                            <div
                              key={i}
                              style={{ height: `${Math.max(15, val)}%` }}
                              className="flex-1 bg-purple-500/80 rounded-t-sm transition-all duration-300"
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Process Table */}
                    <div className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-900/60">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="py-2 px-3 font-semibold">PID</th>
                            <th className="py-2 px-3 font-semibold">Process Name</th>
                            <th className="py-2 px-3 font-semibold text-right">CPU</th>
                            <th className="py-2 px-3 font-semibold text-right">Memory</th>
                            <th className="py-2 px-3 font-semibold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {processes.map((proc) => (
                            <tr key={proc.pid} className="hover:bg-slate-800/50 transition">
                              <td className="py-1.5 px-3 text-slate-500">{proc.pid}</td>
                              <td className="py-1.5 px-3 text-slate-200 font-sans font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                {proc.name}
                              </td>
                              <td className="py-1.5 px-3 text-right text-cyan-400">{proc.cpu}%</td>
                              <td className="py-1.5 px-3 text-right text-purple-300">{proc.memoryMb} MB</td>
                              <td className="py-1.5 px-3 text-center">
                                <button
                                  onClick={() => handleKillProcess(proc.pid)}
                                  disabled={readOnly}
                                  className="px-2 py-0.5 rounded text-[11px] font-sans bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 transition disabled:opacity-30"
                                >
                                  End Task
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 3. File Explorer Content */}
                {win.id === 'files' && (
                  <div className="h-full flex flex-col bg-slate-950">
                    {/* Explorer address bar */}
                    <div className="p-2 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2 text-xs">
                      <span className="text-slate-400 font-mono">Location:</span>
                      <div className="flex-1 px-2.5 py-1 rounded bg-slate-950 border border-slate-700/70 font-mono text-slate-200 text-xs">
                        C:\RemoteAdmin\SystemStorage
                      </div>
                      <button
                        onClick={() => {
                          const newF: RemoteFileItem = {
                            id: Date.now().toString(),
                            name: `Diagnostic_Snapshot_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.txt`,
                            type: 'file',
                            size: '1.4 KB',
                            modified: 'Just now',
                            extension: 'txt',
                            content: `Snapshot captured at ${new Date().toLocaleString()}\nHost is healthy.`
                          };
                          setFiles(prev => [newF, ...prev]);
                        }}
                        className="px-2 py-1 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 font-sans text-xs flex items-center gap-1 transition"
                      >
                        <Upload className="w-3 h-3" />
                        Create File
                      </button>
                    </div>

                    {/* Files list */}
                    <div className="flex-1 overflow-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {files.map(file => (
                        <div
                          key={file.id}
                          onDoubleClick={() => handleOpenFile(file)}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition"
                        >
                          {file.type === 'folder' ? (
                            <Folder className="w-8 h-8 text-amber-400 shrink-0" />
                          ) : (
                            <FileText className="w-8 h-8 text-cyan-400 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-200 truncate">{file.name}</p>
                            <p className="text-[11px] text-slate-500">{file.size} • {file.modified}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Text Editor Content */}
                {win.id === 'editor' && (
                  <div className="h-full flex flex-col bg-slate-950 p-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400 px-1">
                      <span>Editing: <strong className="text-slate-200">{selectedFile?.name || 'File'}</strong></span>
                      <button
                        onClick={() => {
                          if (selectedFile) {
                            setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, content: editorContent, modified: 'Just now' } : f));
                            setTerminalHistory(prev => [...prev, `[FileEditor] Saved changes to ${selectedFile.name}`]);
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 text-xs flex items-center gap-1 transition"
                      >
                        Save Changes
                      </button>
                    </div>
                    <textarea
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                      disabled={readOnly}
                      className="flex-1 w-full bg-slate-950 text-slate-200 font-mono text-xs p-2.5 focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* External Virtual Pointer Overlay (for Technician remote movements) */}
      {externalCursor && externalCursor.active && (
        <div
          style={{
            transform: `translate(${externalCursor.x}px, ${externalCursor.y}px)`,
            transition: 'transform 0.05s ease-out',
          }}
          className="absolute top-0 left-0 pointer-events-none z-50 flex items-center gap-1.5"
        >
          <div className="w-4 h-4 text-cyan-400 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="1.5">
              <path d="M3 3l7 18 3-7 7-3L3 3z" />
            </svg>
          </div>
          <span className="px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950 text-[10px] font-bold shadow">
            Technician
          </span>
        </div>
      )}

      {/* Windows Start Menu Popup */}
      {startMenuOpen && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-12 left-2 w-80 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-xl p-4 z-40 space-y-4"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <Search className="w-3.5 h-3.5" />
            <input 
              type="text" 
              placeholder="Type to search apps, settings..." 
              className="bg-transparent focus:outline-none text-slate-200 text-xs w-full"
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Pinned Remote Tools</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { toggleWindow('terminal'); setStartMenuOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <TerminalIcon className="w-6 h-6 text-cyan-400" />
                <span className="text-[11px]">Terminal</span>
              </button>
              <button
                onClick={() => { toggleWindow('taskmgr'); setStartMenuOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <Activity className="w-6 h-6 text-emerald-400" />
                <span className="text-[11px]">Task Mgr</span>
              </button>
              <button
                onClick={() => { toggleWindow('files'); setStartMenuOpen(false); }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition"
              >
                <Folder className="w-6 h-6 text-amber-400" />
                <span className="text-[11px]">Explorer</span>
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-600/40 border border-cyan-500/50 flex items-center justify-center font-bold text-cyan-300 text-xs">
                AD
              </div>
              <div>
                <p className="font-semibold text-xs leading-none">Admin Workstation</p>
                <p className="text-[10px] text-slate-500 leading-tight">Elevated Privileges</p>
              </div>
            </div>

            <button
              onClick={() => {
                setTerminalHistory(prev => [...prev, '[SYSTEM] Workstation Locked by Remote Technician.']);
                setStartMenuOpen(false);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
              title="Lock Machine"
            >
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Taskbar at the bottom */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="h-11 bg-slate-950/90 border-t border-slate-800/90 backdrop-blur px-3 flex items-center justify-between z-30 select-none"
      >
        {/* Left: Start button & Pinned apps */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setStartMenuOpen(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-lg flex items-center gap-2 transition ${
              startMenuOpen ? 'bg-cyan-500 text-slate-950' : 'hover:bg-slate-800 text-cyan-400'
            }`}
          >
            {/* Windows-like 4-quadrant icon */}
            <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
              <div className="bg-current rounded-[2px]"></div>
              <div className="bg-current rounded-[2px]"></div>
              <div className="bg-current rounded-[2px]"></div>
              <div className="bg-current rounded-[2px]"></div>
            </div>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1"></div>

          {/* Active app tabs */}
          {windows.map(win => {
            const Icon = win.icon;
            const isActive = win.isOpen && !win.isMinimized && win.zIndex === topZ;
            return (
              <button
                key={win.id}
                onClick={() => toggleWindow(win.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs transition border ${
                  isActive
                    ? 'bg-slate-800/90 border-cyan-500/50 text-white shadow-sm'
                    : win.isOpen
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/70'
                    : 'hidden'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="truncate max-w-[120px]">{win.title.split('-')[0].trim()}</span>
              </button>
            );
          })}
        </div>

        {/* Right: System Tray & Clock */}
        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-900 border border-slate-800/60">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="text-right leading-tight">
            <div className="text-slate-200 font-medium">{currentTime}</div>
            <div className="text-[10px] text-slate-500">{currentDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
