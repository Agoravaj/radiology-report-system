import fetch from 'node-fetch';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_KEY = process.env.NEXT_PUBLIC_CLAUDE_API_KEY || '';

export default async function handler(req, res) {
  if (req.method === 'POST') {
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
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}WWWWWWW
