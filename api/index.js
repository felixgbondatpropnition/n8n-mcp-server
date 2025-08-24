const axios = require('axios');

module.exports = async (req, res) => {
  const N8N_API_KEY = process.env.N8N_API_KEY;
  const N8N_HOST = process.env.N8N_HOST;
  const AUTH_TOKEN = process.env.AUTH_TOKEN;

  // Enable CORS for Claude
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle SSE connection for MCP
  if (req.url === '/sse') {
    // For Claude MCP, we'll be more lenient with auth
    const authHeader = req.headers.authorization || 
                      req.headers.Authorization || 
                      req.headers['x-api-key'] ||
                      req.headers['oauth-client-secret'];
    
    // Check if auth token is present anywhere in the header
    const isAuthorized = authHeader && 
                         (authHeader.includes(AUTH_TOKEN) || 
                          authHeader === AUTH_TOKEN ||
                          authHeader === `Bearer ${AUTH_TOKEN}`);
    
    if (!isAuthorized) {
      console.log('Auth attempted with:', authHeader);
      // For now, let's allow the connection to help debug
      // Remove this in production
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    // Send MCP handshake
    res.write('data: {"type":"handshake","version":"1.0"}\n\n');
    res.write('data: {"type":"ready"}\n\n');
    
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

  // Health check endpoint
  res.status(200).json({ 
    status: 'MCP Server Running',
    endpoints: ['/sse', '/api/*'],
    timestamp: new Date().toISOString()
  });
};
