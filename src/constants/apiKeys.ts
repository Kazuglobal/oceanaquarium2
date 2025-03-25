/**
 * API Keys and tokens centralized in one file
 * 
 * IMPORTANT: Never hardcode actual API keys here.
 * All keys should be loaded from environment variables.
 * This file only provides the structure and fallbacks for development.
 */

// NASA API Key
export const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY || '';

// Mapbox Access Token
export const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

// Firecrawl MCP Server API Key
export const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY || '';

/**
 * Validates if required API keys are present
 * @returns Object with validation results for each API key
 */
export const validateApiKeys = () => {
  return {
    nasa: !!NASA_API_KEY,
    mapbox: !!MAPBOX_ACCESS_TOKEN,
    firecrawl: !!FIRECRAWL_API_KEY
  };
};
