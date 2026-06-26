import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const N8N_URL = process.env.N8N_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const PORT = process.env.PORT || 3000;

// ponytail: WEBHOOKS={"ang_anki":"uuid-path"} — table name → n8n webhook path (UUID). Backend holds the secret, browser never sees the path.
const WEBHOOKS = (() => {
  try { return JSON.parse(process.env.WEBHOOKS || '{}'); }
  catch (e) { console.warn('WEBHOOKS env var is not valid JSON, ignoring:', e.message); return {}; }
})();

if (!N8N_URL || !N8N_API_KEY) {
  console.error('ERROR: N8N_URL and N8N_API_KEY environment variables are required');
  process.exit(1);
}

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/webhooks', (req, res) => {
  res.json({ tables: Object.keys(WEBHOOKS) });
});

app.post('/trigger-webhook/:tableName', async (req, res) => {
  const webhookPath = WEBHOOKS[req.params.tableName];
  if (!webhookPath) {
    return res.status(404).json({ error: `No webhook configured for table "${req.params.tableName}"` });
  }
  try {
    const url = `${N8N_URL}/webhook/${webhookPath}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: req.params.tableName, ts: Date.now() }),
    });
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
    res.status(r.status).json({ status: r.ok ? 'ok' : 'error', httpStatus: r.status, body });
  } catch (err) {
    console.error('Webhook trigger error:', err.message);
    res.status(502).json({ error: 'Failed to call n8n webhook', details: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.use(
  '/n8n-api',
  createProxyMiddleware({
    target: `${N8N_URL}/api/v1`,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq) => {
        proxyReq.setHeader('X-N8N-API-KEY', N8N_API_KEY);
        proxyReq.setHeader('Accept', 'application/json');
      },
      error: (err, req, res) => {
        console.error('Proxy error:', err.message);
        res.status(502).json({ error: 'Failed to connect to n8n', details: err.message });
      },
    },
  })
);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`n8n DataTable Viewer running on port ${PORT}`);
  console.log(`Proxying to n8n at: ${N8N_URL}`);
});
