const axios = require('axios');

exports.handler = async (event, context) => {
  // Your n8n credentials
  const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwM2ZmY2JlYS03NzJhLTRkMDktOWRjNS0wYzMxNWE3MTc0ZTIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU2MDM3NDcyfQ.RqYzXr-Ac5sHuieMfUGd9AYkGT4M63aWxGleKLIFxVY';
  const N8N_HOST = 'https://leadgeneration.app.n8n.cloud';
  
  const { action, data } = JSON.parse(event.body || '{}');
  
  try {
    // List all workflows
    if (action === 'list_workflows') {
      const response = await axios.get(`${N8N_HOST}/api/v1/workflows`, {
        headers: { 'X-N8N-API-KEY': N8N_API_KEY }
      });
      return {
        statusCode: 200,
        body: JSON.stringify(response.data)
      };
    }
    
    // Get specific workflow
    if (action === 'get_workflow' && data.id) {
      const response = await axios.get(`${N8N_HOST}/api/v1/workflows/${data.id}`, {
        headers: { 'X-N8N-API-KEY': N8N_API_KEY }
      });
      return {
        statusCode: 200,
        body: JSON.stringify(response.data)
      };
    }
    
    // Execute workflow
    if (action === 'execute_workflow' && data.id) {
      const response = await axios.post(
        `${N8N_HOST}/api/v1/workflows/${data.id}/execute`,
        data.body || {},
        { headers: { 'X-N8N-API-KEY': N8N_API_KEY } }
      );
      return {
        statusCode: 200,
        body: JSON.stringify(response.data)
      };
    }
    
    // Default response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'n8n bridge ready',
        available_actions: ['list_workflows', 'get_workflow', 'execute_workflow']
      })
    };
    
  } catch (error) {
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
