const axios = require('axios');

module.exports = async (req, res) => {
  const N8N_API_KEY = process.env.N8N_API_KEY;
  const N8N_HOST = process.env.N8N_HOST;
  const AUTH_TOKEN = process.env.AUTH_TOKEN;

  // Handle SSE connection
  if (req.url === '/sse' && req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(401).send('Unauthorized');
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial connection message
    res.write('data: {"type":"connection","status":"connected"}\n\n');
    
    // Keep connection alive
    const interval = setInterval(() => {
      res.write('data: {"type":"ping"}\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(interval);
    });
    return;
  }

  // Handle API proxy requests
  if (req.url.startsWith('/api/') && req.method === 'POST') {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${AUTH_TOKEN}`) {
      return res.status(401).send('Unauthorized');
    }

    try {
      const n8nPath = req.url.replace('/api', '');
      const response = await axios({
        method: 'POST',
        url: `${N8N_HOST}/api/v1${n8nPath}`,
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        data: req.body
      });
      
      res.status(200).json(response.data);
    } catch (error) {
      res.status(error.response?.status || 500).json({
        error: error.message,
        details: error.response?.data
      });
    }
    return;
  }

  // Default response
  res.status(200).json({ 
    status: 'MCP Server Running',
    endpoints: ['/sse', '/api/*']
  });
};
