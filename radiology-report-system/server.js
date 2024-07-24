const express = require('express');
const next = require('next');
const fetch = require('node-fetch');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '';

app.prepare().then(() => {
  const server = express();

  server.use(express.json());

  server.post('/api/analyzeReport', async (req, res) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to analyze report' });
    }
  });

  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});
