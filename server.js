const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Load .env file automatically if it exists
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
        process.env[key.trim()] = val;
      }
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff2': 'font/woff2'
};

// Hugging Face Language Mapping for NLLB-200
const NLLB_LANG_MAP = {
  'en': 'eng_Latn',
  'es': 'spa_Latn',
  'hi': 'hin_Deva',
  'fr': 'fra_Latn',
  'de': 'deu_Latn',
  'zh': 'zho_Hans',
  'it': 'ita_Latn',
  'pt': 'por_Latn',
  'ja': 'jpn_Jpan',
  'ar': 'ara_Arab',
  'ru': 'rus_Cyrl',
  'bn': 'ben_Beng',
  'pa': 'pan_Guru'
};

// Hugging Face AI Translation Function
function translateWithHuggingFace(text, sourceLang = 'en', targetLang = 'es', userToken = '') {
  return new Promise((resolve) => {
    if (!text || text.trim() === '') {
      return resolve(text);
    }

    if (sourceLang === targetLang) {
      return resolve(text);
    }

    const token = userToken || process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || '';
    const srcNllb = NLLB_LANG_MAP[sourceLang] || 'eng_Latn';
    const tgtNllb = NLLB_LANG_MAP[targetLang] || 'spa_Latn';

    const postData = JSON.stringify({
      inputs: text,
      parameters: {
        src_lang: srcNllb,
        tgt_lang: tgtNllb
      }
    });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: 'api-inference.huggingface.co',
      path: '/models/facebook/nllb-200-distilled-600M',
      method: 'POST',
      headers: headers,
      timeout: 4000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed) && parsed[0] && parsed[0].translation_text) {
            return resolve(parsed[0].translation_text);
          } else if (parsed && parsed.translation_text) {
            return resolve(parsed.translation_text);
          }
        } catch (e) {}

        // Fallback to free translation endpoint if HF model is cold or key is missing
        fallbackTranslate(text, sourceLang, targetLang).then(resolve);
      });
    });

    req.on('error', () => {
      fallbackTranslate(text, sourceLang, targetLang).then(resolve);
    });

    req.on('timeout', () => {
      req.destroy();
      fallbackTranslate(text, sourceLang, targetLang).then(resolve);
    });

    req.write(postData);
    req.end();
  });
}

// Lightweight fallback translation service for zero-friction out-of-the-box experience
function fallbackTranslate(text, sourceLang, targetLang) {
  return new Promise((resolve) => {
    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodedText}`;

    https.get(url, { timeout: 3500 }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed && parsed[0]) {
            const translated = parsed[0].map(item => item[0]).join('');
            if (translated) return resolve(translated);
          }
        } catch (e) {}
        resolve(text);
      });
    }).on('error', () => {
      resolve(text);
    });
  });
}

// HTTP Server
const server = http.createServer((req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let reqUrl = req.url.split('?')[0];

  // API Endpoint: /api/translate
  if (reqUrl === '/api/translate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { text, sourceLang, targetLang, hfToken } = JSON.parse(body);
        const translatedText = await translateWithHuggingFace(text, sourceLang, targetLang, hfToken);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          original: text,
          translated: translatedText,
          sourceLang: sourceLang || 'en',
          targetLang: targetLang || 'es'
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
      }
    });
    return;
  }

  // Static files
  if (reqUrl === '/' || reqUrl === '') {
    reqUrl = '/index.html';
  }

  const filePath = path.normalize(path.join(PUBLIC_DIR, reqUrl));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (err2, content) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(content);
    });
  });
});

// WebSocket Signaling Server
const wss = new WebSocketServer({ server });
const rooms = new Map();
const clientMeta = new Map();

function sendTo(client, message) {
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomId, message, excludeClient = null) {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const client of room) {
    if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
      sendTo(client, message);
    }
  }
}

wss.on('connection', (ws) => {
  ws.isAlive = true;

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (rawData) => {
    let data;
    try {
      data = JSON.parse(rawData);
    } catch (e) {
      return;
    }

    const { type, roomId, userId, userName, mode, payload } = data;

    switch (type) {
      case 'join': {
        if (!roomId || !userId) return;

        const existingMeta = clientMeta.get(ws);
        if (existingMeta && existingMeta.roomId) {
          leaveRoom(ws, existingMeta.roomId);
        }

        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        const room = rooms.get(roomId);
        room.add(ws);

        clientMeta.set(ws, { roomId, userId, userName: userName || 'Friend', mode: mode || 'senior' });

        const peers = [];
        for (const peerSocket of room) {
          if (peerSocket !== ws && peerSocket.readyState === WebSocket.OPEN) {
            const peerMeta = clientMeta.get(peerSocket);
            if (peerMeta) {
              peers.push({
                userId: peerMeta.userId,
                userName: peerMeta.userName,
                mode: peerMeta.mode
              });
            }
          }
        }

        sendTo(ws, {
          type: 'joined-room',
          roomId,
          userId,
          peers
        });

        broadcastToRoom(
          roomId,
          {
            type: 'user-joined',
            roomId,
            userId,
            userName: userName || 'Friend',
            mode: mode || 'senior'
          },
          ws
        );
        break;
      }

      case 'offer':
      case 'answer':
      case 'ice-candidate': {
        const { targetUserId } = data;
        const meta = clientMeta.get(ws);
        if (!meta) return;

        const room = rooms.get(meta.roomId);
        if (!room) return;

        for (const peerSocket of room) {
          const peerMeta = clientMeta.get(peerSocket);
          if (peerMeta && peerMeta.userId === targetUserId) {
            sendTo(peerSocket, {
              type,
              fromUserId: meta.userId,
              fromUserName: meta.userName,
              payload
            });
            break;
          }
        }
        break;
      }

      case 'draw-stroke':
      case 'draw-clear':
      case 'reaction':
      case 'live-caption':
      case 'helper-alert':
      case 'ring-call': {
        const meta = clientMeta.get(ws);
        if (!meta || !meta.roomId) return;
        broadcastToRoom(
          meta.roomId,
          {
            type,
            fromUserId: meta.userId,
            fromUserName: meta.userName,
            payload
          },
          ws
        );
        break;
      }

      case 'leave': {
        const meta = clientMeta.get(ws);
        if (meta && meta.roomId) {
          leaveRoom(ws, meta.roomId);
        }
        break;
      }

      default:
        break;
    }
  });

  ws.on('close', () => {
    const meta = clientMeta.get(ws);
    if (meta && meta.roomId) {
      leaveRoom(ws, meta.roomId);
    }
    clientMeta.delete(ws);
  });
});

function leaveRoom(clientSocket, roomId) {
  const meta = clientMeta.get(clientSocket);
  const room = rooms.get(roomId);
  if (room) {
    room.delete(clientSocket);
    if (meta) {
      broadcastToRoom(
        roomId,
        {
          type: 'user-left',
          roomId,
          userId: meta.userId,
          userName: meta.userName
        },
        clientSocket
      );
    }
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  }
}

// Heartbeat ping/pong
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      const meta = clientMeta.get(ws);
      if (meta && meta.roomId) {
        leaveRoom(ws, meta.roomId);
      }
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌟 KINDRED MEET running with Hugging Face AI!`);
  console.log(`📡 Open in browser: http://localhost:${PORT}`);
  console.log(`🤖 AI Live Translation: Ready`);
  console.log(`====================================================`);
});
