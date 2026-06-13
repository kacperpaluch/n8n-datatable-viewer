import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const N8N_URL = process.env.N8N_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const PORT = process.env.PORT || 3000;

if (!N8N_URL || !N8N_API_KEY) {
  console.error('ERROR: N8N_URL and N8N_API_KEY environment variables are required');
  process.exit(1);
}

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
