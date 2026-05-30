const https = require('https');

// Schema matches what the frontend's geminiRecommend() expects to parse
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    primary: {
      type: "object",
      properties: {
        card: { type: "string" },
        rate: { type: "number" },
        reason: { type: "string" },
        tags: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              type: { type: "string", enum: ["good", "warning"] }
            },
            required: ["text", "type"]
          }
        }
      },
      required: ["card", "rate", "reason", "tags"]
    },
    runner_up: {
      type: "object",
      properties: {
        card: { type: "string" },
        rate: { type: "number" },
        reason: { type: "string" }
      },
      required: ["card", "rate", "reason"]
    },
    tip: { type: "string" }
  },
  required: ["primary", "runner_up", "tip"]
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env['GEMINI_API_KEY'];
  if (!key) return res.status(500).json({ error: 'API key not configured' });

  // Inject generationConfig server-side so the frontend stays unchanged.
  // Forces JSON output matching our schema, caps tokens, and uses low thinking budget for speed.
  const payload = {
    ...req.body,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 400,
      temperature: 0.4,
      thinkingConfig: { thinkingBudget: 0 }  // disable thinking for Flash-Lite-style speed
    }
  };

  const body = JSON.stringify(payload);

  const options = {
    hostname: 'generativelanguage.googleapis.com',
    // Switched from gemini-2.5-flash → gemini-2.5-flash-lite (~2-3x faster for simple JSON tasks)
    path: '/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + encodeURIComponent(key),
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
