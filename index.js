const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (/\.github\.io$/.test(origin) || /localhost/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS: ' + origin));
  }
}));

app.use(express.json());

app.post('/ask', async (req, res) => {
  const key = process.env['GEMINI_API_KEY'];
  if (!key) return res.status(500).json({ error: 'API key not configured' });

  const body = JSON.stringify(req.body);
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models/gemini-2.5-flash:generateContent?key=' + key,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const proxyReq = https.request(options, (proxyRes) => {
    let data = '';
    proxyRes.on('data', chunk => data += chunk);
    proxyRes.on('end', () => {
      try {
        res.json(JSON.parse(data));
      } catch (e) {
        res.status(500).json({ error: 'Invalid response from Gemini' });
      }
    });
  });

  proxyReq.on('error', (e) => res.status(500).json({ error: e.message }));
  proxyReq.write(body);
  proxyReq.end();
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Proxy running on port ' + PORT));
