// --- Configuration ---

var CONFIG = {
  // Override via Script Properties > API_BASE for production deployment.
  // Default: http://localhost:8000/api (local development)
  API_BASE: PropertiesService.getScriptProperties().getProperty('API_BASE') || 'http://localhost:8000/api',
};
