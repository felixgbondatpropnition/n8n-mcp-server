const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Your n8n credentials - hardcoded for simplicity
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2ZmY2JlYS03NzJhLTRkMDktOWRjNS0wYzMxNWE3MTc0ZTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2MDM3NDcyfQ.RqYzXr-Ac5sHuieMfUGd9AYkGT4M63aWxGleKLIFxVY';
const N8N_HOST = 'https://leadgeneration.app.n8n.cloud';

// SSE endpoint for Claude
app.get('/sse', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  res.write('data: ready\n\n');
  
  // Keep connection alive
  const interval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

// Proxy to n8n API
app.all('/api/*', async (req, res) => {
  try {
    const path = req.path.replace('/api', '');
    const response = await axios({
      method: req.method,
      url: `${N8N_HOST}/api/v1${path}`,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      },
      data: req.body
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'running', endpoints: ['/sse', '/api/*'] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
