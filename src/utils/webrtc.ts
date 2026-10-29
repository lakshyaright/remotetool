// Real-world WebRTC Peer-to-Peer Remote Access with PeerJS & Google STUN
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { signalingHub } from './signaling';

export const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export class WebRTCManager {
  private peer: Peer | null = null;
  private dataConn: DataConnection | null = null;
  private activeCalls: MediaConnection[] = [];
  private sessionId: string = '';
  private role: 'host' | 'client' = 'client';
  private localStream: MediaStream | null = null;
  private connectedPeerIds: Set<string> = new Set();

  private onRemoteStreamCb: ((stream: MediaStream) => void) | null = null;
  private onDataMessageCb: ((data: any) => void) | null = null;
  private onStatusChangeCb: ((status: string, details?: any) => void) | null = null;
  private onHostNeedScreenCb: (() => void) | null = null;

  constructor(
    role: 'host' | 'client',
    sessionId: string,
    callbacks: {
      onRemoteStream?: (stream: MediaStream) => void;
      onDataMessage?: (data: any) => void;
      onStatusChange?: (status: string, details?: any) => void;
      onHostNeedScreen?: () => void;
    }
  ) {
    this.role = role;
    this.sessionId = sessionId.replace(/[^a-zA-Z0-9]/g, '');
    this.onRemoteStreamCb = callbacks.onRemoteStream || null;
    this.onDataMessageCb = callbacks.onDataMessage || null;
    this.onStatusChangeCb = callbacks.onStatusChange || null;
    this.onHostNeedScreenCb = callbacks.onHostNeedScreen || null;
  }

  private getPeerId(id: string) {
    return `techrescue-${id}`;
  }

  // ================= HOST INITIALIZATION =================
  public async initHost(localStream?: MediaStream | null) {
    if (localStream) {
      this.localStream = localStream;
    }
    const hostPeerId = this.getPeerId(this.sessionId);

    try {
      if (this.peer) {
        this.peer.destroy();
      }

      this.peer = new Peer(hostPeerId, {
        config: ICE_CONFIG,
      });

      this.peer.on('open', (id) => {
        if (this.onStatusChangeCb) this.onStatusChangeCb('host_ready', { id });
      });

      // Remote client connects for data channel
      this.peer.on('connection', (conn) => {
        this.dataConn = conn;
        this.connectedPeerIds.add(conn.peer);
        this.setupDataConnection(conn);

        if (this.onStatusChangeCb) {
          this.onStatusChangeCb('client_connected', { clientPeerId: conn.peer });
        }

        // If host already has screen stream, immediately call the client!
        if (this.localStream) {
          this.callClientWithStream(conn.peer, this.localStream);
        } else {
          // Notify client that host needs to pick screen, and trigger host prompt
          conn.send({ type: 'WAITING_FOR_HOST_SCREEN' });
          if (this.onHostNeedScreenCb) {
            this.onHostNeedScreenCb();
          }
        }
      });

      // Handle direct media calls if initiated by client
      this.peer.on('call', (call) => {
        if (this.localStream) {
          call.answer(this.localStream);
          this.activeCalls.push(call);
        }
      });

      this.peer.on('error', (err) => {
        console.warn('Host PeerJS notice:', err);
      });
    } catch (err) {
      console.warn('Host PeerJS error:', err);
    }
  }

  // When Host starts or changes screen sharing stream, push to all connected clients
  public updateHostStream(stream: MediaStream) {
    this.localStream = stream;

    // Call all connected clients with the new screen stream
    this.connectedPeerIds.forEach((clientPeerId) => {
      this.callClientWithStream(clientPeerId, stream);
    });

    if (this.dataConn && this.dataConn.open) {
      this.dataConn.send({ type: 'HOST_SCREEN_STARTED' });
    }
  }

  private callClientWithStream(clientPeerId: string, stream: MediaStream) {
    if (!this.peer) return;
    try {
      const call = this.peer.call(clientPeerId, stream);
      this.activeCalls.push(call);
      call.on('close', () => {
        this.activeCalls = this.activeCalls.filter((c) => c !== call);
      });
    } catch (err) {
      console.warn('Error calling client with stream:', err);
    }
  }

  // ================= CLIENT INITIALIZATION =================
  public async initClient() {
    const hostPeerId = this.getPeerId(this.sessionId);
    const clientPeerId = `client-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    try {
      if (this.peer) {
        this.peer.destroy();
      }

      this.peer = new Peer(clientPeerId, {
        config: ICE_CONFIG,
      });

      this.peer.on('open', (id) => {
        if (this.onStatusChangeCb) this.onStatusChangeCb('client_registered', { id });

        // Connect data channel to Host
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.dataConn = conn;
        this.setupDataConnection(conn);
      });

      // Client listens for incoming media call from Host containing Host's screen
      this.peer.on('call', (call) => {
        // Answer without local stream since client is the viewer
        call.answer();

        call.on('stream', (remoteStream) => {
          if (this.onRemoteStreamCb) {
            this.onRemoteStreamCb(remoteStream);
          }
          if (this.onStatusChangeCb) {
            this.onStatusChangeCb('stream_received');
          }
        });

        call.on('close', () => {
          if (this.onStatusChangeCb) this.onStatusChangeCb('call_closed');
        });

        call.on('error', (err) => {
          console.warn('Call error:', err);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Client PeerJS error:', err);
        if (this.onStatusChangeCb) this.onStatusChangeCb('error', { error: err.type });
      });
    } catch (err) {
      console.warn('Client init error:', err);
    }
  }

  private setupDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      if (this.onStatusChangeCb) this.onStatusChangeCb('connected');
      conn.send({ type: 'HANDSHAKE_READY', role: this.role });
    });

    conn.on('data', (data: any) => {
      if (this.onDataMessageCb) {
        this.onDataMessageCb(data);
      }

      // If client receives notice that host started screen
      if (data?.type === 'HOST_SCREEN_STARTED' && this.role === 'client') {
        if (this.onStatusChangeCb) this.onStatusChangeCb('host_screen_started');
      }
    });

    conn.on('close', () => {
      if (this.onStatusChangeCb) this.onStatusChangeCb('disconnected');
    });
  }

  public sendData(data: any) {
    if (this.dataConn && this.dataConn.open) {
      try {
        this.dataConn.send(data);
      } catch (err) {
        console.warn('DataConn send error:', err);
      }
    }

    // Also relay via BroadcastChannel for multi-tab testing
    signalingHub.send({
      type: 'CHAT_MESSAGE',
      deviceId: this.sessionId,
      sender: this.role,
      payload: data,
    });
  }

  public destroy() {
    this.activeCalls.forEach((call) => {
      try { call.close(); } catch {}
    });
    this.activeCalls = [];

    if (this.dataConn) {
      try { this.dataConn.close(); } catch {}
      this.dataConn = null;
    }

    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
  }
}
