import express from 'express';

const app = express();
app.use(express.json());

// In-memory signaling store for WebRTC remote access sessions
interface SessionState {
  id: string;
  pin: string;
  hostName: string;
  isSharing: boolean;
  signals: Array<{ sender: string; data: any; timestamp: number }>;
  updatedAt: number;
}

const sessions = new Map<string, SessionState>();

// API: Register host session
app.post('/api/session/register', (req, res) => {
  const { id, pin, hostName } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing session ID' });

  const cleanId = id.replace(/[^a-zA-Z0-9]/g, '');
  const session: SessionState = {
    id: cleanId,
    pin: pin || '1234',
    hostName: hostName || 'Remote Host',
    isSharing: false,
    signals: [],
    updatedAt: Date.now(),
  };

  sessions.set(cleanId, session);
  res.json({ success: true, sessionId: cleanId });
});

// API: Verify session
app.post('/api/session/verify', (req, res) => {
  const { id, pin } = req.body;
  const cleanId = (id || '').replace(/[^a-zA-Z0-9]/g, '');
  const session = sessions.get(cleanId);

  if (!session) {
    return res.json({ success: true, exists: false, isDynamic: true });
  }

  if (pin && session.pin && session.pin !== pin) {
    return res.status(401).json({ error: 'Invalid Session PIN' });
  }

  res.json({
    success: true,
    sessionId: cleanId,
    hostName: session.hostName,
    isSharing: session.isSharing,
  });
});

// API: Post WebRTC signal (SDP offer/answer, ICE candidates)
app.post('/api/session/:id/signal', (req, res) => {
  const cleanId = req.params.id.replace(/[^a-zA-Z0-9]/g, '');
  const { sender, data } = req.body;

  let session = sessions.get(cleanId);
  if (!session) {
    session = {
      id: cleanId,
      pin: '0000',
      hostName: 'Remote Host',
      isSharing: true,
      signals: [],
      updatedAt: Date.now(),
    };
    sessions.set(cleanId, session);
  }

  session.signals.push({
    sender,
    data,
    timestamp: Date.now(),
  });
  session.updatedAt = Date.now();

  if (session.signals.length > 50) {
    session.signals = session.signals.slice(-50);
  }

  res.json({ success: true });
});

// API: Poll signals
app.get('/api/session/:id/signals', (req, res) => {
  const cleanId = req.params.id.replace(/[^a-zA-Z0-9]/g, '');
  const since = parseInt(req.query.since as string, 10) || 0;
  const senderFilter = req.query.excludeSender as string;

  const session = sessions.get(cleanId);
  if (!session) {
    return res.json({ signals: [] });
  }

  const filtered = session.signals.filter((s) => {
    return s.timestamp > since && (!senderFilter || s.sender !== senderFilter);
  });

  res.json({ signals: filtered });
});

export default app;
