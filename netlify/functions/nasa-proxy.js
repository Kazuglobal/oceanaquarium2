// This function is kept for backward compatibility but is no longer used
// The app now uses NASA CMR API directly which doesn't require a proxy
exports.handler = async (event, context) => {
  const { queryStringParameters } = event;
  
  if (!queryStringParameters) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing query parameters' })
    };
  }

  const { endpoint, ...params } = queryStringParameters;
  
  try {
    // Support for CMR API if needed in the future
    const baseUrl = endpoint === 'cmr' 
      ? 'https://cmr.earthdata.nasa.gov/search' 
      : 'https://api.nasa.gov/planetary/earth/assets';
    
    const queryString = new URLSearchParams(params).toString();
    const url = `${baseUrl}?${queryString}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `NASA API error: ${response.statusText}` })
      };
    }

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};