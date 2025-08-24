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

  // Handle OAuth authorize - Claude needs this
  if (event.path.includes('authorize')) {
    const params = event.queryStringParameters || {};
    if (params.redirect_uri) {
      const redirectUrl = params.redirect_uri + 
        (params.redirect_uri.includes('?') ? '&' : '?') + 
        'code=auth_success' +
        (params.state ? '&state=' + params.state : '');
      
      return {
        statusCode: 302,
        headers: { Location: redirectUrl },
        body: ''
      };
    }
  }

  // Handle token exchange - Claude needs this
  if (event.path.includes('token')) {
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: 'token_' + Date.now(),
        token_type: 'Bearer'
      })
    };
  }

  // SSE endpoint
  if (event.path.includes('sse')) {
    return {
      statusCode: 200,
      headers: { 
        ...headers,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache'
      },
      body: 'data: {"connected": true}\n\n'
    };
  }

  // Default
  return {
    statusCode: 200,
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'ready' })
  };
};
