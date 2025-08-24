const axios = require('axios');

module.exports = async (req, res) => {
  const N8N_API_KEY = process.env.N8N_API_KEY;
  const N8N_HOST = process.env.N8N_HOST;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle SSE connection - NO AUTH CHECK FOR NOW
  if (req.url === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send connection established
    res.write('data: {"type":"connection","status":"connected"}\n\n');
    
    // Keep alive
    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });
    return;
  }

  // Handle n8n API requests
  if (req.url.startsWith('/api/')) {
    try {
      const n8nPath = req.url.replace('/api', '');
      const response = await axios({
        method: req.method || 'GET',
        url: `${N8N_HOST}/api/v1${n8nPath}`,
        headers: {
          'X-N8N-API-KEY': N8N_API_KEY,
          'Content-Type': 'application/json'
        },
        data: req.body
      });
      
      return res.status(200).json(response.data);
    } catch (error) {
      return res.status(error.response?.status || 500).json({
        error: error.message
      });
    }
  }

  // Default response
  res.status(200).json({ 
    status: 'MCP Server Running',
    endpoints: ['/sse', '/api/*'],
    timestamp: new Date().toISOString()
  });
};
