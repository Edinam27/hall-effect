/**
 * Comprehensive Test Runner
 * 
 * This script runs all the test scripts in sequence and provides a summary of results.
 */

const { spawn } = require('child_process');
const path = require('path');

// Test scripts to run
const testScripts = [
  { name: 'API Tests', file: 'test-api.js' },
  { name: 'Email Service Tests', file: 'test-email.js' },
  { name: 'Order Service Tests', file: 'test-order.js' }
];

// Results tracking
const results = {
  passed: 0,
  partial: 0,
  failed: 0,
  details: []
};

/**
 * Run a test script as a child process
 */
async function runTest(testScript) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`Running ${testScript.name} (${testScript.file})...`);
    console.log(`${'='.repeat(80)}\n`);
    
    const testProcess = spawn('node', [testScript.file], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    testProcess.on('close', (code) => {
      const result = {
        name: testScript.name,
        file: testScript.file,
        exitCode: code,
        status: code === 0 ? 'passed' : 'failed'
      };
      
      results.details.push(result);
      
      if (code === 0) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      resolve(result);
    });
    
    testProcess.on('error', (error) => {
      const result = {
        name: testScript.name,
        file: testScript.file,
        error: error.message,
        status: 'failed'
      };
      
      results.details.push(result);
      results.failed++;
      
      resolve(result); // Still resolve to continue with other tests
    });
  });
}

/**
 * Print test summary
 */
function printSummary() {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log('TEST SUMMARY');
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`Total Tests: ${results.details.length}`);
  console.log(`Passed: ${results.passed}`);
  console.log(`Failed: ${results.failed}\n`);
  
  console.log('Details:');
  results.details.forEach((result, index) => {
    const statusSymbol = result.status === 'passed' ? '✅' : '❌';
    console.log(`${statusSymbol} ${result.name} (${result.file}): ${result.status.toUpperCase()}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test run completed at ${new Date().toLocaleString()}`);
  console.log(`${'='.repeat(80)}`);
}

/**
 * Run all tests in sequence
 */
async function runAllTests() {
  console.log('🧪 Starting comprehensive test run...');
  console.log(`Time: ${new Date().toLocaleString()}\n`);
  
  try {
    for (const testScript of testScripts) {
      await runTest(testScript);
    }
    
    printSummary();
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
runAllTests();