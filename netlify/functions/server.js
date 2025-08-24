exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': '*',
    'Access-Control-Allow-Headers': '*'
  };

  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Remove Netlify function prefix from path
  const path = event.path.replace('/.netlify/functions/server', '');

  // CRITICAL: Handle /authorize endpoint - THIS IS WHAT FIXED IT BEFORE
  if (path === '/authorize' || event.path.includes('/authorize')) {
    const params = event.queryStringParameters || {};
    if (params.redirect_uri) {
      // This is the exact pattern that worked on Vercel
      const redirectUrl = `${params.redirect_uri}?code=authorized&state=${params.state || ''}`;
      return {
        statusCode: 302,
        headers: { Location: redirectUrl },
        body: ''
      };
    }
  }

  // Handle /token endpoint - ALSO NEEDED
  if (path === '/token' || event.path.includes('/token')) {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: 'connected',
        token_type: 'Bearer',
        expires_in: 3600
      })
    };
  }

  // SSE endpoint - Keep it simple like before
  if (path === '/sse' || event.path.includes('/sse')) {
    return {
      statusCode: 200,
      headers: { 
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      },
      body: 'data: {"type":"connection","status":"connected"}\n\n'
    };
  }

  // Default response showing all endpoints
  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      status: 'running',
      endpoints: ['/authorize', '/token', '/sse']
    })
  };
};
