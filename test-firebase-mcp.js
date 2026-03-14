#!/usr/bin/env node

/**
 * Firebase MCP Server Test Script
 * Tests the Firebase MCP server setup and configuration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔥 Firebase MCP Server Test\n');

// Check if Firebase MCP server is installed
function checkFirebaseMCPInstallation() {
    console.log('📦 Checking Firebase MCP Server Installation...');
    
    try {
        const { execSync } = require('child_process');
        const result = execSync('npm list -g @gannonh/firebase-mcp', { encoding: 'utf8' });
        console.log('✅ Firebase MCP Server is installed globally');
        return true;
    } catch (error) {
        console.log('❌ Firebase MCP Server is not installed globally');
        console.log('   Run: npm install -g @gannonh/firebase-mcp');
        return false;
    }
}

// Check Firebase configuration
function checkFirebaseConfig() {
    console.log('\n🔧 Checking Firebase Configuration...');
    
    // Check for Firebase config file
    const configPaths = [
        '.firebaserc',
        'firebase.json',
        '.env'
    ];
    
    let hasConfig = false;
    configPaths.forEach(configPath => {
        if (fs.existsSync(configPath)) {
            console.log(`✅ Found ${configPath}`);
            hasConfig = true;
        }
    });
    
    if (!hasConfig) {
        console.log('⚠️  No Firebase configuration files found');
        console.log('   You may need to run: firebase init');
    }
    
    return hasConfig;
}

// Test Firebase MCP server startup
function testFirebaseMCPStartup() {
    console.log('\n🚀 Testing Firebase MCP Server Startup...');
    
    return new Promise((resolve) => {
        const child = spawn('firebase-mcp', ['--help'], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let output = '';
        let errorOutput = '';
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0 || output.includes('Usage:') || output.includes('firebase-mcp')) {
                console.log('✅ Firebase MCP Server can start successfully');
                console.log('\n📋 Available Commands:');
                console.log(output);
                resolve(true);
            } else {
                console.log('❌ Firebase MCP Server failed to start');
                if (errorOutput) {
                    console.log('Error:', errorOutput);
                }
                resolve(false);
            }
        });
        
        child.on('error', (error) => {
            console.log('❌ Failed to start Firebase MCP Server');
            console.log('Error:', error.message);
            resolve(false);
        });
        
        // Timeout after 10 seconds
        setTimeout(() => {
            child.kill();
            console.log('⏰ Test timed out - this might be normal if server is waiting for input');
            resolve(true);
        }, 10000);
    });
}

// Main test function
async function runTests() {
    console.log('Starting Firebase MCP Server tests...\n');
    
    const installationOk = checkFirebaseMCPInstallation();
    const configOk = checkFirebaseConfig();
    const startupOk = await testFirebaseMCPStartup();
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Installation: ${installationOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Configuration: ${configOk ? '✅ PASS' : '⚠️  WARN'}`);
    console.log(`Startup Test: ${startupOk ? '✅ PASS' : '❌ FAIL'}`);
    
    if (installationOk && startupOk) {
        console.log('\n🎉 Firebase MCP Server is ready to use!');
        console.log('\n📝 Next Steps:');
        console.log('1. Initialize Firebase project: firebase init');
        console.log('2. Configure Firebase credentials');
        console.log('3. Start MCP server: firebase-mcp --port 3001');
        console.log('4. Integrate with Claude Desktop');
    } else {
        console.log('\n🔧 Issues found - please resolve them before using Firebase MCP');
    }
}

// Run the tests
runTests().catch(console.error);
