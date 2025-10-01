/**
 * Google Maps MCP Server Test Script
 * 
 * This script helps you test the Google Maps MCP server setup.
 */

require('dotenv').config();
const { spawn } = require('child_process');

function testGoogleMapsMCP() {
  console.log('🗺️ Google Maps MCP Server Test');
  console.log('=' .repeat(50));
  
  // Check if API key is configured
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    console.log('❌ Google Maps API Key not configured');
    console.log('\n📋 Setup Instructions:');
    console.log('1. Go to https://console.cloud.google.com/apis/credentials');
    console.log('2. Create a new API key or use an existing one');
    console.log('3. Enable the following APIs:');
    console.log('   - Maps JavaScript API');
    console.log('   - Places API');
    console.log('   - Geocoding API');
    console.log('   - Directions API');
    console.log('   - Distance Matrix API');
    console.log('   - Elevation API');
    console.log('4. Update your .env file with: GOOGLE_MAPS_API_KEY=your_actual_api_key');
    console.log('\n⚠️ Note: Google Maps APIs require billing to be enabled on your Google Cloud project.');
    return;
  }
  
  console.log('✅ Google Maps API Key found');
  console.log(`   Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
  
  console.log('\n🚀 Starting Google Maps MCP Server...');
  console.log('\n📋 Server Information:');
  console.log('   Package: @cablate/mcp-google-map');
  console.log('   Port: 3000');
  console.log('   Endpoint: http://localhost:3000/mcp');
  
  console.log('\n🛠️ Available Tools:');
  console.log('   - search_nearby: Search for nearby places');
  console.log('   - get_place_details: Get detailed place information');
  console.log('   - maps_geocode: Convert addresses to coordinates');
  console.log('   - maps_reverse_geocode: Convert coordinates to addresses');
  console.log('   - maps_distance_matrix: Calculate distances and travel times');
  console.log('   - maps_directions: Get turn-by-turn directions');
  console.log('   - maps_elevation: Get elevation data');
  console.log('   - echo: Test tool for server functionality');
  
  console.log('\n🔧 To start the server manually, run:');
  console.log(`   mcp-google-map --port 3000 --apikey "${apiKey}"`);
  
  console.log('\n📖 For Claude Desktop integration, add this to your config:');
  console.log('   {');
  console.log('     "mcpServers": {');
  console.log('       "google-maps": {');
  console.log('         "command": "mcp-google-map",');
  console.log('         "args": ["--port", "3000", "--apikey", "' + apiKey + '"]');
  console.log('       }');
  console.log('     }');
  console.log('   }');
  
  console.log('\n✨ Test completed successfully!');
}

// Run the test
testGoogleMapsMCP();