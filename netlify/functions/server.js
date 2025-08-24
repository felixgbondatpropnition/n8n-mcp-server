exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*'
  };

  // Log for debugging
  console.log('Path:', event.path);
  console.log('Method:', event.httpMethod);

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Remove the Netlify function path prefix if present
  const path = event.path.replace('/.netlify/functions/server', '');

  // OAuth authorize endpoint
  if (path === '/authorize' || path.includes('/authorize')) {
    const { redirect_uri, state } = event.queryStringParameters || {};
    
    if (redirect_uri) {
      // Immediately redirect back with a code
      const code = 'netlify_' + Date.now();
      const redirectUrl = state 
        ? `${redirect_uri}?code=${code}&state=${state}`
        : `${redirect_uri}?code=${code}`;
      
      return {
        statusCode: 302,
        headers: {
          'Location': redirectUrl
        },
        body: ''
      };
    }
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'text/html' },
      body: '<html><body><h1>Authorized</h1></body></html>'
    };
  }

  // OAuth token endpoint
  if (path === '/token' || path.includes('/token')) {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: 'netlify_token_' + Date.now(),
        token_type: 'Bearer',
        expires_in: 3600
      })
    };
  }

  // SSE endpoint
  if (path === '/sse' || path.includes('/sse')) {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      },
      body: `data: ${JSON.stringify({
        jsonrpc: '2.0',
        method: 'connection.ready',
        params: {
          protocolVersion: '0.1.0',
          capabilities: {
            tools: ['workflow_create', 'workflow_list']
          }
        }
      })}\n\n`
    };
  }

  // Root endpoint
  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'MCP Server Running',
      endpoints: ['/authorize', '/token', '/sse'],
      timestamp: new Date().toISOString()
    })
  };
};
