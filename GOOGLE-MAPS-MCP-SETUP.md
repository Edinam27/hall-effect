# Google Maps MCP Server Setup Guide

This guide will help you fix the deprecated Google Maps MCP server issue and set up the new, actively maintained server.

## Issue Summary

The original `@modelcontextprotocol/server-google-maps` package has been deprecated <mcreference link="https://www.npmjs.com/support" index="0">0</mcreference> and is no longer supported. The errors you encountered were due to:

1. **Deprecated Package**: The old Google Maps MCP server is no longer maintained
2. **Permission Issues**: npm cache conflicts on Windows
3. **Missing API Key**: The `GOOGLE_MAPS_API_KEY` environment variable was not set

## Solution: New Google Maps MCP Server

We've installed the new, actively maintained Google Maps MCP server: `@cablate/mcp-google-map` <mcreference link="https://github.com/cablate/mcp-google-map" index="1">1</mcreference>

### ✅ What's Already Done

1. **Cleared npm cache**: Resolved permission issues
2. **Installed new server**: `@cablate/mcp-google-map` is now installed globally
3. **Updated .env file**: Added Google Maps API key configuration
4. **Created test script**: `test-google-maps-mcp.js` for verification

### 🔧 Next Steps: Get Your Google Maps API Key

#### Step 1: Create/Access Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **Important**: Enable billing for your project (required for Maps APIs)

#### Step 2: Enable Required APIs

1. Go to [APIs & Services > Library](https://console.cloud.google.com/apis/library)
2. Enable these APIs:
   - **Maps JavaScript API**
   - **Places API** 
   - **Geocoding API**
   - **Directions API**
   - **Distance Matrix API**
   - **Elevation API**

#### Step 3: Create API Key

1. Go to [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "+ CREATE CREDENTIALS" > "API key"
3. Copy the generated API key
4. **Optional but Recommended**: Restrict the API key:
   - Click on the key to edit
   - Under "API restrictions", select "Restrict key"
   - Choose the APIs you enabled above

#### Step 4: Update Your Configuration

1. Open your `.env` file
2. Replace `your_google_maps_api_key_here` with your actual API key:
   ```
   GOOGLE_MAPS_API_KEY=AIzaSyC4YourActualAPIKeyHere
   ```

### 🧪 Testing the Setup

Run the test script to verify everything is working:

```bash
node test-google-maps-mcp.js
```

### 🚀 Running the MCP Server

Once you have your API key configured, you can start the server:

```bash
mcp-google-map --port 3000 --apikey "YOUR_API_KEY"
```

Or using environment variables:

```bash
mcp-google-map --port 3000
```

### 🔗 Integration with Claude Desktop

Add this configuration to your Claude Desktop MCP settings:

```json
{
  "mcpServers": {
    "google-maps": {
      "command": "mcp-google-map",
      "args": ["--port", "3000"],
      "env": {
        "GOOGLE_MAPS_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

### 🛠️ Available Tools

The new server provides these tools <mcreference link="https://github.com/cablate/mcp-google-map" index="1">1</mcreference>:

- **search_nearby**: Search for nearby places based on location
- **get_place_details**: Get detailed information about a specific place
- **maps_geocode**: Convert addresses to geographic coordinates
- **maps_reverse_geocode**: Convert coordinates to addresses
- **maps_distance_matrix**: Calculate travel distances and durations
- **maps_directions**: Get turn-by-turn navigation directions
- **maps_elevation**: Get elevation data for specific locations
- **echo**: Test tool for server functionality

### 💰 Billing Information

**Important**: Google Maps APIs require billing to be enabled on your Google Cloud project. However:

- Google provides $200 in free credits monthly for Maps Platform
- Most development and testing usage falls within the free tier
- You can set up billing alerts to monitor usage

### 🔍 Troubleshooting

#### Server Won't Start
- Verify your API key is correct
- Check that billing is enabled on your Google Cloud project
- Ensure all required APIs are enabled

#### "Invalid API Key" Errors
- Double-check the API key in your `.env` file
- Verify the key has access to the required APIs
- Check if the key has any IP or referrer restrictions

#### Permission Errors
- Run `npm cache clean --force` if you encounter cache issues
- Try running the command as administrator if needed

### 📚 Additional Resources

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [MCP Google Maps Server GitHub](https://github.com/cablate/mcp-google-map)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)

---

**Status**: ✅ New server installed, waiting for API key configuration
**Next Action**: Get your Google Maps API key and update the `.env` file