const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Your n8n credentials
const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2ZmY2JlYS03NzJhLTRkMDktOWRjNS0wYzMxNWE3MTc0ZTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2MDM3NDcyfQ.RqYzXr-Ac5sHuieMfUGd9AYkGT4M63aWxGleKLIFxVY';
const N8N_HOST = 'https://leadgeneration.app.n8n.cloud';

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

// MCP Protocol Implementation
app.post('/mcp', async (req, res) => {
  console.log('MCP request received:', req.body);
  
  const { method, params } = req.body;
  
  try {
    if (method === 'initialize') {
      res.json({
        protocolVersion: '1.0',
        serverInfo: {
          name: 'n8n-mcp-server',
          version: '1.0.0'
        },
        capabilities: {
          tools: true,
          prompts: false
        }
      });
    } else if (method === 'tools/list') {
      res.json({
        tools: [
          {
            name: 'list_workflows',
            description: 'List all n8n workflows',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'create_workflow',
            description: 'Create a new n8n workflow',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                nodes: { type: 'array' },
                connections: { type: 'object' }
              }
            }
          }
        ]
      });
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params;
      
      if (name === 'list_workflows') {
        const response = await axios.get(`${N8N_HOST}/api/v1/workflows`, {
          headers: { 'X-N8N-API-KEY': N8N_API_KEY }
        });
        res.json({ result: response.data });
      } else if (name === 'create_workflow') {
        const response = await axios.post(
          `${N8N_HOST}/api/v1/workflows`,
          args,
          { headers: { 'X-N8N-API-KEY': N8N_API_KEY } }
        );
        res.json({ result: response.data });
      } else {
        res.json({ error: 'Unknown tool' });
      }
    } else {
      res.json({ error: 'Unknown method' });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

// SSE endpoint for MCP
app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send MCP initialization
  res.write('data: {"jsonrpc":"2.0","method":"initialized","params":{}}\n\n');
  
  // Keep alive
  const interval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});

// API Proxy (fallback)
app.all('/api/*', async (req, res) => {
  try {
    const path = req.path.replace('/api', '');
    const response = await axios({
      method: req.method,
      url: `${N8N_HOST}/api/v1${path}`,
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      data: req.body
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    endpoints: ['/sse', '/mcp', '/api/*', '/authorize', '/token'],
    mcp: 'ready'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);
});
