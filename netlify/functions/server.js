exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Handle SSE endpoint
  if (event.path.includes('/sse')) {
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: `data: ${JSON.stringify({
        type: 'connection',
        status: 'connected',
        capabilities: ['workflow.create', 'workflow.list']
      })}\n\n`
    };
  }

  // Handle OAuth (minimal implementation)
  if (event.path.includes('/authorize')) {
    const { queryStringParameters } = event;
    const redirectUri = queryStringParameters?.redirect_uri;
    if (redirectUri) {
      const authCode = 'auth_' + Date.now();
      return {
        statusCode: 302,
        headers: {
          Location: `${redirectUri}?code=${authCode}`
        }
      };
    }
  }

  if (event.path.includes('/token')) {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: 'token_' + Date.now(),
        token_type: 'Bearer'
      })
    };
  }

  // Default response
  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'MCP Server Running on Netlify',
      endpoints: ['/sse', '/authorize', '/token'],
      timestamp: new Date().toISOString()
    })
  };
};
