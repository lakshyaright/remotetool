// Cross-tab and Peer signaling using BroadcastChannel with event hub
export interface SignalMessage {
  type: 
    | 'HOST_ANNOUNCE'
    | 'HOST_SCREEN_STARTED'
    | 'HOST_SCREEN_STOPPED'
    | 'CLIENT_JOIN_REQUEST'
    | 'HOST_ACCEPT_CLIENT'
    | 'HOST_REJECT_CLIENT'
    | 'MOUSE_MOVE'
    | 'MOUSE_CLICK'
    | 'KEY_PRESS'
    | 'ANNOTATION'
    | 'CHAT_MESSAGE'
    | 'CLIPBOARD_SYNC'
    | 'FILE_OFFER'
    | 'SESSION_DISCONNECT';
  deviceId: string;
  sender: 'host' | 'client';
  payload?: any;
  timestamp: number;
}

type SignalListener = (msg: SignalMessage) => void;

class SignalingHub {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SignalListener> = new Set();
  private channelName = 'omnidesk_remote_signaling';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event) => {
          this.notify(event.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel error, falling back to storage:', err);
      }
    }

    // Storage fallback for broader browser compatibility
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === this.channelName && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            this.notify(data);
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  public subscribe(listener: SignalListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(msg: SignalMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Signal listener error:', err);
      }
    });
  }

  public send(msg: Omit<SignalMessage, 'timestamp'>) {
    const fullMsg: SignalMessage = {
      ...msg,
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(fullMsg);
      } catch {
        // fallback
      }
    }

    // Also update localStorage so cross-origin tabs on same origin pick it up
    try {
      localStorage.setItem(this.channelName, JSON.stringify(fullMsg));
    } catch {
      // storage quota / disabled
    }

    // Also notify current tab listeners so single-tab emulation works seamlessly
    this.notify(fullMsg);
  }
}

export const signalingHub = new SignalingHub();
