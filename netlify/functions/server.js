exports.handler = async (event, context) => {
  const { httpMethod, path, body, headers } = event;
  
  // Parse the request
  const request = body ? JSON.parse(body) : {};
  
  // Handle different commands from Claude
  if (request.action === 'create_workflow') {
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Workflow creation endpoint ready',
        workflow: request.workflow
      })
    };
  }
  
  if (request.action === 'list_workflows') {
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        workflows: ['Email Automation', 'Data Sync', 'Report Generator']
      })
    };
  }
  
  // Default response
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Netlify Function Connected',
      available_actions: ['create_workflow', 'list_workflows'],
      timestamp: new Date().toISOString()
    })
  };
};
