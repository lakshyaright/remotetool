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
  private mediaCall: MediaConnection | null = null;
  private sessionId: string = '';
  private role: 'host' | 'client' = 'client';
  private localStream: MediaStream | null = null;
  private onRemoteStreamCb: ((stream: MediaStream) => void) | null = null;
  private onDataMessageCb: ((data: any) => void) | null = null;
  private onStatusChangeCb: ((status: string) => void) | null = null;

  constructor(
    role: 'host' | 'client',
    sessionId: string,
    callbacks: {
      onRemoteStream?: (stream: MediaStream) => void;
      onDataMessage?: (data: any) => void;
      onStatusChange?: (status: string) => void;
    }
  ) {
    this.role = role;
    this.sessionId = sessionId.replace(/[^a-zA-Z0-9]/g, '');
    this.onRemoteStreamCb = callbacks.onRemoteStream || null;
    this.onDataMessageCb = callbacks.onDataMessage || null;
    this.onStatusChangeCb = callbacks.onStatusChange || null;
  }

  // Prefix so room IDs on public signaling do not collide
  private getPeerId(id: string) {
    return `techrescue-${id}`;
  }

  public async initHost(localStream: MediaStream) {
    this.localStream = localStream;
    const hostPeerId = this.getPeerId(this.sessionId);

    try {
      this.peer = new Peer(hostPeerId, {
        config: ICE_CONFIG,
      });

      this.peer.on('open', (id) => {
        if (this.onStatusChangeCb) this.onStatusChangeCb('host_ready');
      });

      // When a remote technician connects for data (mouse, clicks, hotkeys, chat)
      this.peer.on('connection', (conn) => {
        this.dataConn = conn;
        this.setupDataConnection(conn);
      });

      // When a remote technician calls for screen video stream
      this.peer.on('call', (call) => {
        this.mediaCall = call;
        call.answer(localStream); // Send local screen stream to the caller
        call.on('close', () => {
          if (this.onStatusChangeCb) this.onStatusChangeCb('call_closed');
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Host PeerJS notice:', err);
        // Fallback for same-tab / multi-tab test
        this.listenSameOriginSignaling();
      });
    } catch (err) {
      console.warn('PeerJS initHost error:', err);
      this.listenSameOriginSignaling();
    }
  }

  public async initClient() {
    const hostPeerId = this.getPeerId(this.sessionId);
    // Client gets random peer ID
    const clientPeerId = `client-${Date.now().toString().slice(-6)}`;

    try {
      this.peer = new Peer(clientPeerId, {
        config: ICE_CONFIG,
      });

      this.peer.on('open', () => {
        if (this.onStatusChangeCb) this.onStatusChangeCb('connecting');

        // 1. Establish Data connection for mouse/keyboard control & chat
        const conn = this.peer!.connect(hostPeerId, { reliable: true });
        this.dataConn = conn;
        this.setupDataConnection(conn);

        // 2. Call host to receive their screen stream
        // Create empty media stream or request stream
        const emptyStream = new MediaStream();
        const call = this.peer!.call(hostPeerId, emptyStream);
        this.mediaCall = call;

        call.on('stream', (remoteStream) => {
          if (this.onRemoteStreamCb) {
            this.onRemoteStreamCb(remoteStream);
          }
        });

        call.on('error', (err) => {
          console.warn('Call error:', err);
        });
      });

      this.peer.on('error', (err) => {
        console.warn('Client PeerJS error, using local fallback:', err);
        this.listenSameOriginSignaling();
      });
    } catch (err) {
      console.warn('Client PeerJS init error:', err);
      this.listenSameOriginSignaling();
    }
  }

  private setupDataConnection(conn: DataConnection) {
    conn.on('open', () => {
      if (this.onStatusChangeCb) this.onStatusChangeCb('connected');
    });

    conn.on('data', (data) => {
      if (this.onDataMessageCb) {
        this.onDataMessageCb(data);
      }
    });

    conn.on('close', () => {
      if (this.onStatusChangeCb) this.onStatusChangeCb('disconnected');
    });
  }

  private listenSameOriginSignaling() {
    signalingHub.subscribe((msg) => {
      if (msg.deviceId === this.sessionId && msg.sender !== this.role) {
        if (this.onDataMessageCb && msg.payload) {
          this.onDataMessageCb(msg.payload);
        }
      }
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

    // Also broadcast across tabs
    signalingHub.send({
      type: 'CHAT_MESSAGE',
      deviceId: this.sessionId,
      sender: this.role,
      payload: data,
    });
  }

  public destroy() {
    if (this.dataConn) {
      try { this.dataConn.close(); } catch {}
      this.dataConn = null;
    }
    if (this.mediaCall) {
      try { this.mediaCall.close(); } catch {}
      this.mediaCall = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }
  }
}
