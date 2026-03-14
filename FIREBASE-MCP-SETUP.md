# Firebase MCP Server Setup Guide 🔥

## Overview
This guide helps you set up and configure the Firebase MCP (Model Context Protocol) server for integration with Claude Desktop and other MCP clients.

## ✅ Issues Resolved

### 1. PowerShell Execution Policy
- **Problem**: `UnauthorizedAccess` error when running `firebase-mcp`
- **Solution**: Changed execution policy to `RemoteSigned` for current user
- **Status**: ✅ Fixed

### 2. NPM Cache Issues
- **Problem**: Module resolution errors with dotenv package
- **Solution**: Cleared npm cache and reinstalled Firebase MCP server
- **Status**: ✅ Fixed

### 3. Missing Dependencies
- **Problem**: `Cannot find package 'dotenv'` error
- **Solution**: Global reinstallation resolved dependency issues
- **Status**: ✅ Fixed

## 🔧 Current Status

✅ Firebase MCP Server installed globally  
✅ PowerShell execution policy configured  
✅ Server can start (waiting for configuration)  
⚠️ Requires Firebase service account configuration  

## 📋 Required Configuration

### 1. Firebase Service Account Setup

1. **Go to Firebase Console**:
   - Visit [Firebase Console](https://console.firebase.google.com/)
   - Select your project or create a new one

2. **Generate Service Account Key**:
   ```
   Project Settings → Service Accounts → Generate New Private Key
   ```

3. **Download the JSON file** and save it securely (e.g., `firebase-service-account.json`)

4. **Set Environment Variable**:
   ```bash
   # Option 1: Add to your .env file
   SERVICE_ACCOUNT_KEY_PATH=C:\\path\\to\\firebase-service-account.json
   
   # Option 2: Set system environment variable
   $env:SERVICE_ACCOUNT_KEY_PATH="C:\\path\\to\\firebase-service-account.json"
   ```

### 2. Firebase Project Configuration

1. **Initialize Firebase** (if not already done):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

2. **Select Firebase services** you want to use:
   - Firestore Database
   - Firebase Functions
   - Firebase Hosting
   - Firebase Storage

## 🚀 Starting the Server

### Method 1: Direct Command
```bash
firebase-mcp --port 3001
```

### Method 2: With Custom Transport
```bash
firebase-mcp --transport stdio
```

### Method 3: With Debug Logging
```bash
$env:DEBUG_LOG_FILE="firebase-mcp.log"
firebase-mcp --port 3001
```

## 🔌 Claude Desktop Integration

Add this configuration to your Claude Desktop config file:

### Windows: `%APPDATA%\Claude\claude_desktop_config.json`
```json
{
  "mcpServers": {
    "firebase": {
      "command": "firebase-mcp",
      "args": ["--port", "3001"],
      "env": {
        "SERVICE_ACCOUNT_KEY_PATH": "C:\\path\\to\\firebase-service-account.json"
      }
    }
  }
}
```

### macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
```json
{
  "mcpServers": {
    "firebase": {
      "command": "firebase-mcp",
      "args": ["--port", "3001"],
      "env": {
        "SERVICE_ACCOUNT_KEY_PATH": "/path/to/firebase-service-account.json"
      }
    }
  }
}
```

## 🛠️ Available Tools

Once configured, the Firebase MCP server provides these tools:

- **Firestore Operations**:
  - Create, read, update, delete documents
  - Query collections with filters
  - Batch operations

- **Firebase Auth**:
  - User management
  - Custom token generation
  - Authentication state management

- **Firebase Storage**:
  - File upload/download
  - Metadata management
  - Access control

- **Firebase Functions**:
  - Deploy and manage functions
  - Trigger function execution
  - Monitor function logs

## 🧪 Testing Your Setup

Run the test script to verify everything is working:

```bash
node test-firebase-mcp.js
```

## 🔍 Troubleshooting

### Common Issues:

1. **"SERVICE_ACCOUNT_KEY_PATH not set"**
   - Ensure the environment variable is set correctly
   - Check the file path exists and is accessible
   - Use absolute paths, not relative paths

2. **"Permission denied" errors**
   - Verify the service account has proper Firebase permissions
   - Check IAM roles in Google Cloud Console

3. **"Module not found" errors**
   - Clear npm cache: `npm cache clean --force`
   - Reinstall: `npm install -g @gannonh/firebase-mcp`

4. **PowerShell execution policy errors**
   - Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### Debug Mode:
```bash
$env:DEBUG_LOG_FILE="firebase-debug.log"
firebase-mcp --port 3001
```

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)

## 🎯 Next Steps

1. ✅ Configure Firebase service account
2. ✅ Set SERVICE_ACCOUNT_KEY_PATH environment variable
3. ✅ Test the server startup
4. ✅ Integrate with Claude Desktop
5. ✅ Start building with Firebase tools!

---

**Note**: Keep your service account key file secure and never commit it to version control. Consider using environment variables or secure key management systems in production.
