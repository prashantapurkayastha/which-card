# Card Advisor — Proxy

A minimal Vercel serverless function that proxies requests from [Card Advisor](https://github.com/prashantapurkayastha/card-advisor) to the Gemini API.

One reason this exists as a separate service: the frontend is a static HTML file on GitHub Pages. Calling Gemini directly from the browser would expose the API key in client-side code. This proxy holds the key in an environment variable and forwards requests server-side.

**Live at:** `https://which-card-nine.vercel.app`

---

## Endpoints

### `POST /ask`

Forwards a request body to Gemini 2.5 Flash and returns the response.

**Request**
```json
{
  "contents": [
    {
      "parts": [{ "text": "your prompt here" }]
    }
  ]
}
```

**Response** — raw Gemini API response:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "..." }],
        "role": "model"
      }
    }
  ]
}
```

### `GET /health`

Returns `{ "status": "ok" }`. Used to verify the service is running.

---

## Structure

```
which-card/
├── api/
│   ├── ask.js        ← POST /ask handler
│   └── health.js     ← GET /health handler
├── vercel.json       ← route rewrites
└── package.json
```

Vercel automatically treats any file inside `/api` as a serverless function. No Express, no server process, no port management.

---

## Deploy your own

1. Fork this repo
2. Import it at [vercel.com](https://vercel.com) — zero config needed
3. Add your API key under **Settings → Environment Variables**:
   ```
   GEMINI_API_KEY = your_key_here
   ```
4. Redeploy to pick up the env var

Get a Gemini API key at [aistudio.google.com](https://aistudio.google.com).

---

## Running locally

```bash
npm install -g vercel
vercel dev
```

Or without the Vercel CLI:

```bash
# api/ask.js and api/health.js are plain Node.js modules
# you can test them directly with a minimal wrapper
GEMINI_API_KEY=your_key node -e "
  const handler = require('./api/ask');
  // handler expects (req, res) — use with any http server
"
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google AI Studio API key |

---

## CORS

The proxy allows requests from any origin (`*`). If you want to lock it down to your specific GitHub Pages domain, update the `Access-Control-Allow-Origin` header in `api/ask.js`:

```js
res.setHeader('Access-Control-Allow-Origin', 'https://yourusername.github.io');
```

---

## Tech stack

- Node.js serverless functions (Vercel)
- Node's built-in `https` module — no dependencies
- Free tier, no cold start issues for this workload
