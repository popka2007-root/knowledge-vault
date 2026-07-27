import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;
const WS_PORT = process.env.WS_PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Database persistence file
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'vault.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ notes: [], revision: 0 }));
}

// Read Vault Data
const getVaultData = () => {
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    return { notes: [], revision: 0 };
  }
};

// Save Vault Data
const saveVaultData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// REST Sync Endpoint
app.post('/api/sync', (req, res) => {
  const { clientNotes, clientRevision } = req.body;
  const serverData = getVaultData();

  // Merge Notes based on latest updatedAt timestamp
  const mergedMap = new Map();
  serverData.notes.forEach(note => mergedMap.set(note.id, note));

  if (Array.isArray(clientNotes)) {
    clientNotes.forEach(note => {
      const existing = mergedMap.get(note.id);
      if (!existing || note.updatedAt > existing.updatedAt) {
        mergedMap.set(note.id, note);
      }
    });
  }

  const newNotes = Array.from(mergedMap.values());
  const newRevision = serverData.revision + 1;
  saveVaultData({ notes: newNotes, revision: newRevision });

  // Broadcast to all WebSocket clients
  broadcastSyncUpdate({ revision: newRevision, notesCount: newNotes.length });

  res.json({
    success: true,
    revision: newRevision,
    notes: newNotes
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// WebSocket Real-time Notification Server
const wss = new WebSocketServer({ port: Number(WS_PORT) });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('🔗 Client connected to Sync WebSocket');

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function broadcastSyncUpdate(data) {
  const payload = JSON.stringify({ type: 'VAULT_SYNC_UPDATE', ...data });
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Knowledge Vault Sync Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket Sync Server running on ws://localhost:${WS_PORT}`);
});
