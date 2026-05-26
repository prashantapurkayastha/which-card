const https = require('https');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env['GEMINI_API_KEY'];
  if (!key) return res.status(500).json({ error: 'API key not configured' });

  const body = JSON.stringify(req.body);
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(key),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  return new Promise((resolve) => {
    const proxyReq = https.request(options, (proxyRes) => {
      let data = '';
      proxyRes.on('data', chunk => data += chunk);
      proxyRes.on('end', () => {
        try {
          res.status(200).json(JSON.parse(data));
        } catch (e) {
          res.status(500).json({ error: 'Invalid response from Gemini' });
        }
        resolve();
      });
    });
    proxyReq.on('error', (e) => {
      res.status(500).json({ error: e.message });
      resolve();
    });
    proxyReq.write(body);
    proxyReq.end();
  });
};
