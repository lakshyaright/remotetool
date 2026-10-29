/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ThreeMethodsLanding } from './components/ThreeMethodsLanding';
import { RealScreenViewer } from './components/RealScreenViewer';
import { HostView } from './components/HostView';
import { FileTransferModal } from './components/FileTransferModal';
import { SessionChat } from './components/SessionChat';
import { DiagnosticsDrawer } from './components/DiagnosticsDrawer';
import {
  ConnectionMode,
  HostSessionInfo,
  SessionPermissions,
  SystemMetrics,
  ChatMessage,
  RemotePointerEvent,
} from './types/remote';
import { signalingHub, SignalMessage } from './utils/signaling';
import { soundManager } from './utils/audio';
import { WebRTCManager } from './utils/webrtc';
import { Bell, Monitor, Share2, X } from 'lucide-react';

const DEFAULT_PERMISSIONS: SessionPermissions = {
  allowControl: true,
  allowClipboard: true,
  allowFileTransfer: true,
  allowAudio: true,
  allowSystemCommands: true,
};

const INITIAL_METRICS: SystemMetrics = {
  cpuUsage: 18,
  memoryUsage: 36,
  memoryTotalGb: 64,
  diskUsage: 29,
  networkLatency: 14,
  fps: 60,
  bitrateKbps: 3450,
  packetLoss: 0,
  uptimeHours: 142,
};

export default function App() {
  // Navigation / View state
  const [viewState, setViewState] = useState<'landing' | 'remote_viewer' | 'host_dashboard'>('landing');

  // Host configuration
  const [hostSession, setHostSession] = useState<HostSessionInfo>({
    deviceId: '482-910-374',
    pin: '8392',
    deviceName: 'Workstation-Alpha-99',
    os: 'Windows 11 Enterprise x64',
    ipAddress: '192.168.1.104',
    isSharingScreen: false,
    permissions: DEFAULT_PERMISSIONS,
  });

  // Client connection inputs
  const [targetDeviceId, setTargetDeviceId] = useState('482-910-374');
  const [targetPin, setTargetPin] = useState('8392');

  // Active Streams
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);

  // Incoming client alert modal on Host side
  const [incomingClientPrompt, setIncomingClientPrompt] = useState(false);

  // WebRTC Instance Ref
  const webrtcRef = useRef<WebRTCManager | null>(null);

  // Metrics & Audit
  const [metrics, setMetrics] = useState<SystemMetrics>(INITIAL_METRICS);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    'OmniDesk Remote Subsystem active.',
    'PeerJS Global WebRTC Signaling Ready.',
    'Google STUN Server NAT traversal active (stun:stun.l.google.com:19302).',
  ]);

  // Chat & Clipboard
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'system',
      senderName: 'OmniDesk Relay',
      text: 'Secure session established. Peer-to-peer channel is active.',
      timestamp: 'Just now',
    },
  ]);
  const [remoteClipboard, setRemoteClipboard] = useState<string>('https://support.corp/update');
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Modals
  const [fileTransferOpen, setFileTransferOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);

  // Parse URL on mount:
  // If URL has session parameter -> THIS DEVICE IS THE REMOTE VIEWER (CLIENT)
  // If URL does NOT have session parameter -> THIS DEVICE IS THE HOST
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlSession = params.get('session') || params.get('connect');
      const urlPin = params.get('pin');

      if (urlSession) {
        // CLIENT MODE: Connect to remote host
        setTargetDeviceId(urlSession);
        if (urlPin) setTargetPin(urlPin);
        
        setViewState('remote_viewer');
        soundManager.playConnectChime();
        initWebRTCClient(urlSession);
      } else {
        // HOST MODE: Initialize Host PeerJS immediately so host is online and waiting!
        initWebRTCHost();
      }
    } catch {
      // fallback
      initWebRTCHost();
    }
  }, []);

  // Listen to peer signals across tabs/windows (for same-machine multi-tab testing)
  useEffect(() => {
    const unsubscribe = signalingHub.subscribe((msg: SignalMessage) => {
      if (msg.type === 'HOST_SCREEN_STARTED') {
        setAuditLogs(prev => ['Host screen broadcast detected.', ...prev]);
      }

      if (msg.type === 'CHAT_MESSAGE' && msg.payload?.text) {
        setMessages(prev => [...prev, msg.payload]);
        if (!chatOpen) setUnreadChatCount(c => c + 1);
      }

      if (msg.type === 'CLIPBOARD_SYNC') {
        setRemoteClipboard(msg.payload.text);
      }
    });

    return () => unsubscribe();
  }, [chatOpen]);

  // Periodic metrics jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        networkLatency: Math.max(8, Math.min(26, Math.round(14 + (Math.random() * 6 - 3)))),
        fps: Math.round(59 + Math.random() * 2),
        bitrateKbps: Math.round(3400 + Math.random() * 300),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ================= HOST INITIALIZATION =================
  const initWebRTCHost = (stream?: MediaStream | null) => {
    if (webrtcRef.current) webrtcRef.current.destroy();

    const cleanId = hostSession.deviceId.replace(/-/g, '');
    webrtcRef.current = new WebRTCManager('host', cleanId, {
      onStatusChange: (status, details) => {
        if (status === 'client_connected') {
          soundManager.playNotification();
          setAuditLogs(prev => [`Remote client connected from public network!`, ...prev]);
          setIncomingClientPrompt(true);
        }
      },
      onHostNeedScreen: () => {
        soundManager.playNotification();
        setIncomingClientPrompt(true);
      },
      onDataMessage: (data) => {
        if (data.type === 'CHAT') {
          setMessages(prev => [...prev, data.message]);
        }
      },
    });

    webrtcRef.current.initHost(stream || localScreenStream);
  };

  // ================= CLIENT INITIALIZATION =================
  const initWebRTCClient = (sessionId: string) => {
    if (webrtcRef.current) webrtcRef.current.destroy();

    webrtcRef.current = new WebRTCManager('client', sessionId, {
      onRemoteStream: (stream) => {
        setRemoteScreenStream(stream);
        soundManager.playConnectChime();
        setAuditLogs(prev => ['Remote video stream received. Real-time screen active.', ...prev]);
      },
      onStatusChange: (status) => {
        setAuditLogs(prev => [`WebRTC connection status: ${status}`, ...prev]);
      },
      onDataMessage: (data) => {
        if (data.type === 'CHAT') {
          setMessages(prev => [...prev, data.message]);
        }
      },
    });

    webrtcRef.current.initClient();
  };

  // Start real browser screen capture on Host
  const handleStartScreenShare = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Screen sharing API is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          frameRate: 60,
        } as MediaTrackConstraints,
        audio: true,
      });

      setLocalScreenStream(stream);
      setHostSession(prev => ({ ...prev, isSharingScreen: true }));
      setIncomingClientPrompt(false);
      soundManager.playConnectChime();
      setAuditLogs(prev => ['Screen capture active. Broadcasting to connected peers.', ...prev]);

      // Push stream to WebRTC manager
      if (webrtcRef.current) {
        webrtcRef.current.updateHostStream(stream);
      } else {
        initWebRTCHost(stream);
      }

      // Relay via BroadcastChannel for multi-tab
      signalingHub.send({
        type: 'HOST_SCREEN_STARTED',
        deviceId: hostSession.deviceId,
        sender: 'host',
      });

      // Handle user stopping screen share via browser floating bar
      stream.getVideoTracks()[0].onended = () => {
        handleStopScreenShare();
      };
    } catch (err) {
      console.warn('Screen share request cancelled:', err);
    }
  };

  const handleStopScreenShare = () => {
    if (localScreenStream) {
      localScreenStream.getTracks().forEach(t => t.stop());
      setLocalScreenStream(null);
    }
    setHostSession(prev => ({ ...prev, isSharingScreen: false }));
    soundManager.playDisconnectChime();
    setAuditLogs(prev => ['Screen sharing broadcast stopped.', ...prev]);
  };

  // Connect via Method 2 (Unique Code)
  const handleConnectByCode = () => {
    if (!targetDeviceId.trim()) return;
    setViewState('remote_viewer');
    soundManager.playConnectChime();
    initWebRTCClient(targetDeviceId.trim());
  };

  // Method 1 quick preview test
  const handleTakeRemoteViaUrl = () => {
    setViewState('remote_viewer');
    soundManager.playConnectChime();
    initWebRTCClient(hostSession.deviceId);
  };

  // Disconnect & Return to 3 methods landing
  const handleDisconnect = () => {
    if (webrtcRef.current) {
      webrtcRef.current.destroy();
      webrtcRef.current = null;
    }
    handleStopScreenShare();
    setRemoteScreenStream(null);
    setViewState('landing');
    soundManager.playDisconnectChime();

    // Re-initialize Host peer on landing
    initWebRTCHost();
  };

  // Chat message send
  const handleSendMessage = (text: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'technician',
      senderName: 'Remote User',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMsg]);

    if (webrtcRef.current) {
      webrtcRef.current.sendData({ type: 'CHAT', message: newMsg });
    }

    signalingHub.send({
      type: 'CHAT_MESSAGE',
      deviceId: hostSession.deviceId,
      sender: 'client',
      payload: newMsg,
    });
  };

  const handleUpdateRemoteClipboard = (text: string) => {
    setRemoteClipboard(text);
    if (webrtcRef.current) {
      webrtcRef.current.sendData({ type: 'CLIPBOARD', text });
    }
    setAuditLogs(prev => [`Clipboard synced: "${text.slice(0, 30)}..."`, ...prev]);
  };

  const handleSendPointer = (event: RemotePointerEvent) => {
    if (webrtcRef.current) {
      webrtcRef.current.sendData({ type: 'POINTER', event });
    }
  };

  const handleSendHotkey = (hotkey: string) => {
    soundManager.playClickSound();
    handleSendMessage(`[Hotkey Dispatched] ${hotkey}`);
    setAuditLogs(prev => [`Dispatched hotkey: ${hotkey}`, ...prev]);
  };

  const handleSendFile = (fileName: string, size: string) => {
    handleSendMessage(`[File Sent] ${fileName} (${size})`);
    setAuditLogs(prev => [`File transferred: ${fileName}`, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Navbar with mode switch & quick return */}
      <Navbar
        mode={viewState === 'host_dashboard' ? 'host' : 'client'}
        onSelectMode={(newMode) => {
          if (newMode === 'host') {
            setViewState('host_dashboard');
          } else {
            setViewState('landing');
          }
        }}
        isConnected={viewState === 'remote_viewer' || !!localScreenStream}
        sessionId={targetDeviceId || hostSession.deviceId}
        metrics={metrics}
        onDisconnect={handleDisconnect}
        onOpenQuickDemo={handleTakeRemoteViaUrl}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col overflow-auto">
        {viewState === 'landing' && (
          <ThreeMethodsLanding
            deviceId={hostSession.deviceId}
            pin={hostSession.pin}
            targetDeviceId={targetDeviceId}
            setTargetDeviceId={setTargetDeviceId}
            targetPin={targetPin}
            setTargetPin={setTargetPin}
            onConnectByCode={handleConnectByCode}
            onStartHostScreenShare={() => {
              if (hostSession.isSharingScreen) {
                handleStopScreenShare();
              } else {
                handleStartScreenShare();
              }
            }}
            isSharingScreen={hostSession.isSharingScreen}
            onTakeRemoteViaUrl={handleTakeRemoteViaUrl}
          />
        )}

        {viewState === 'remote_viewer' && (
          <RealScreenViewer
            stream={remoteScreenStream || localScreenStream}
            onStartScreenShare={handleStartScreenShare}
            onDisconnect={handleDisconnect}
            targetDeviceId={targetDeviceId}
            metrics={metrics}
            onSendPointer={handleSendPointer}
            onSendHotkey={handleSendHotkey}
            onOpenFileTransfer={() => setFileTransferOpen(true)}
            onOpenChat={() => {
              setChatOpen(true);
              setUnreadChatCount(0);
            }}
            onOpenDiagnostics={() => setDiagnosticsOpen(true)}
            unreadChatCount={unreadChatCount}
          />
        )}

        {viewState === 'host_dashboard' && (
          <HostView
            session={hostSession}
            onUpdatePermissions={(perms) =>
              setHostSession(prev => ({ ...prev, permissions: perms }))
            }
            onStartScreenShare={handleStartScreenShare}
            onStopScreenShare={handleStopScreenShare}
            stream={localScreenStream}
            logs={auditLogs}
          />
        )}
      </main>

      {/* Host Incoming Client Alert Modal */}
      {incomingClientPrompt && !hostSession.isSharingScreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-cyan-500/50 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-white">Remote User Connected!</h3>
              <p className="text-xs text-slate-300">
                A remote user has connected via your Access URL or Code. Click below to choose which screen or window to stream to them.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIncomingClientPrompt(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Dismiss
              </button>
              <button
                onClick={handleStartScreenShare}
                className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950/50 transition"
              >
                <Monitor className="w-4 h-4" />
                <span>Share Screen Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Transfer Modal */}
      <FileTransferModal
        isOpen={fileTransferOpen}
        onClose={() => setFileTransferOpen(false)}
        onSendFile={handleSendFile}
      />

      {/* In-Session Chat & Clipboard Drawer */}
      <SessionChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={messages}
        onSendMessage={handleSendMessage}
        remoteClipboard={remoteClipboard}
        onUpdateRemoteClipboard={handleUpdateRemoteClipboard}
      />

      {/* System Diagnostics Drawer */}
      <DiagnosticsDrawer
        isOpen={diagnosticsOpen}
        onClose={() => setDiagnosticsOpen(false)}
        metrics={metrics}
        isSandboxMode={false}
      />
    </div>
  );
}
