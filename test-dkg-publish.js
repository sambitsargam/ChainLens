#!/usr/bin/env node

/**
 * DKG Knowledge Publishing Test
 * Publishes a test community note about blockchain to OriginTrail DKG
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';

async function publishToDKG() {
  console.log('🚀 Publishing knowledge to OriginTrail DKG...\n');
  
  // Test data: Blockchain information
  const testNote = {
    topic: 'Blockchain',
    claim: 'Blockchain is a distributed ledger technology that maintains a continuously growing list of records, called blocks, which are linked and secured using cryptography.',
    sources: ['https://en.wikipedia.org/wiki/Blockchain'],
    classification: {
      label: 'aligned',
      confidence: 0.95,
      explanation: 'Information is accurate and well-documented'
    },
    grokipediaClaim: 'Blockchain is a distributed ledger technology that maintains a continuously growing list of records, called blocks, which are linked and secured using cryptography, enabling secure and verifiable transactions without reliance on a trusted third party.',
    wikipediaClaim: 'A blockchain is a distributed ledger with growing list of records, called blocks, which are linked using cryptography. Each block contains a cryptographic hash of the previous block, a timestamp, and transaction data.'
  };

  try {
    console.log('📝 Publishing data:');
    console.log(JSON.stringify(testNote, null, 2));
    console.log('\n⏳ Sending to DKG endpoint...\n');

    const response = await fetch(`${API_BASE}/api/publishnote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testNote)
    });

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Knowledge published to DKG\n');
      console.log('📊 Results:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.ual) {
        console.log('\n🎯 UAL (Universal Asset Locator):');
        console.log(`   ${data.ual}`);
        console.log('\n📍 This asset can be queried using this UAL on the OriginTrail DKG');
      }
      
      if (data.transactionHash) {
        console.log('\n🔗 Transaction Hash:');
        console.log(`   ${data.transactionHash}`);
      }
    } else {
      console.log('\n❌ FAILED to publish\n');
      console.log('Error details:');
      console.log(JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Backend is running: npm start');
    console.error('2. OriginTrail DKG is accessible');
    console.error('3. Wallet has sufficient tokens');
  }
}

// Run the test
publishToDKG();
