const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Your n8n credentials
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2ZmY2JlYS03NzJhLTRkMDktOWRjNS0wYzMxNWE3MTc0ZTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2MDM3NDcyfQ.RqYzXr-Ac5sHuieMfUGd9AYkGT4M63aWxGleKLIFxVY';
const N8N_HOST = 'https://leadgeneration.app.n8n.cloud';

// Store active connections
const connections = new Set();

// OAuth endpoints
app.get('/authorize', (req, res) => {
  const redirectUri = req.query.redirect_uri || 'https://claude.ai';
  res.redirect(`${redirectUri}?code=authorized&state=${req.query.state || ''}`);
});

app.post('/token', (req, res) => {
  res.json({
    access_token: 'connected',
    token_type: 'Bearer',
    expires_in: 3600
  });
});

// SSE endpoint with proper MCP protocol
app.get('/sse', (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  
  // Add to connections
  connections.add(res);
  
  // Send initial connection message
  res.write('event: open\n');
  res.write('data: {"type":"connection","status":"connected"}\n\n');
  
  // Send capabilities
  res.write('event: capability\n');
  res.write(`data: {"api_endpoint":"${N8N_HOST}"}\n\n`);
  
  // Keep alive with ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write('event: ping\n');
    res.write('data: {"type":"ping"}\n\n');
  }, 30000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    connections.delete(res);
  });
});

// n8n API proxy
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

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    status: 'connected',
    active_connections: connections.size
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'running', 
    endpoints: ['/sse', '/api/*', '/authorize', '/token', '/status'],
    connections: connections.size
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
