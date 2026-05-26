# Card Advisor — Proxy

A minimal Node.js API that proxies requests from [Card Advisor](https://github.com/prashantapurkayastha/card-advisor) to the Gemini API.

One reason this exists as a separate service: the frontend is a static HTML file on GitHub Pages. Calling Gemini directly from the browser would expose the API key in client-side code. This proxy holds the key in an environment variable and forwards requests server-side.

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

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add the environment variable in the Vercel dashboard:

```
GEMINI_API_KEY = your_key_here
```

Or via CLI:
```bash
vercel env add GEMINI_API_KEY
```

---

## Running locally

```bash
npm install
GEMINI_API_KEY=your_key_here node index.js
```

The server starts on port 3000 by default. Test it:

```bash
curl http://localhost:3000/health
```

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Your Google AI Studio API key |
| `PORT` | No | Port to listen on (default: 3000) |

Get a Gemini API key at [aistudio.google.com](https://aistudio.google.com).

---

## CORS

The proxy allows requests from any `*.github.io` domain and localhost. If you fork the frontend and host it elsewhere, add your domain to the `allowedOrigins` array in `index.js`.

---

## Tech stack

- Node.js
- Express
- Node's built-in `https` module (no external fetch dependency)
- Deployed on Vercel free tier
