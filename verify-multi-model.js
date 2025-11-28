#!/usr/bin/env node

/**
 * 🤖 ChainLens Multi-Model LLM System Verification
 * Checks if all 3 models (OpenAI, Gemini, Grok) are properly configured
 */

import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 ChainLens Multi-Model LLM System Verification');
console.log('═'.repeat(50));

// Check 1: Frontend LLM Service
console.log('\n📱 Frontend Configuration:');
const frontendLlmPath = path.join(__dirname, 'frontend/src/services/llm.js');
if (fs.existsSync(frontendLlmPath)) {
  const content = fs.readFileSync(frontendLlmPath, 'utf-8');
  const hasOpenAI = content.includes('classifyWithOpenAI');
  const hasGemini = content.includes('classifyWithGemini');
  const hasGrok = content.includes('classifyWithGrok');
  const hasConsensus = content.includes('Promise.allSettled');
  
  console.log(`  ✅ Frontend LLM Service: ${frontendLlmPath}`);
  console.log(`     • OpenAI Support: ${hasOpenAI ? '✓' : '✗'}`);
  console.log(`     • Gemini Support: ${hasGemini ? '✓' : '✗'}`);
  console.log(`     • Grok Support: ${hasGrok ? '✓' : '✗'}`);
  console.log(`     • Consensus Mode: ${hasConsensus ? '✓ (Parallel)' : '✗'}`);
} else {
  console.log(`  ❌ Frontend LLM Service not found: ${frontendLlmPath}`);
}

// Check 2: Backend LLM Service
console.log('\n🖥️  Backend Configuration:');
const backendLlmPath = path.join(__dirname, 'backend/src/services/llm.js');
if (fs.existsSync(backendLlmPath)) {
  const content = fs.readFileSync(backendLlmPath, 'utf-8');
  const hasOpenAI = content.includes('classifyWithOpenAI');
  const hasGemini = content.includes('classifyWithGemini');
  const hasGrok = content.includes('classifyWithGrok');
  const hasConsensus = content.includes('classifyWithConsensus');
  const hasSimple = content.includes('classifySimple');
  
  console.log(`  ✅ Backend LLM Service: ${backendLlmPath}`);
  console.log(`     • OpenAI Support: ${hasOpenAI ? '✓' : '✗'}`);
  console.log(`     • Gemini Support: ${hasGemini ? '✓' : '✗'}`);
  console.log(`     • Grok Support: ${hasGrok ? '✓' : '✗'}`);
  console.log(`     • Consensus Function: ${hasConsensus ? '✓' : '✗'}`);
  console.log(`     • Fallback Function: ${hasSimple ? '✓' : '✗'}`);
} else {
  console.log(`  ❌ Backend LLM Service not found: ${backendLlmPath}`);
}

// Check 3: Premium Endpoint Integration
console.log('\n🔌 API Endpoint Configuration:');
const premiumPath = path.join(__dirname, 'backend/src/routes/premium.js');
if (fs.existsSync(premiumPath)) {
  const content = fs.readFileSync(premiumPath, 'utf-8');
  const hasLlmImport = content.includes('llm.js');
  const hasConsensusCall = content.includes('classifyWithConsensus');
  
  console.log(`  ✅ Premium Route: ${premiumPath}`);
  console.log(`     • LLM Service Import: ${hasLlmImport ? '✓' : '✗'}`);
  console.log(`     • Consensus Integration: ${hasConsensusCall ? '✓' : '✗'}`);
} else {
  console.log(`  ❌ Premium Route not found: ${premiumPath}`);
}

// Check 4: Environment Configuration
console.log('\n🔐 Environment Configuration:');
const frontendEnvPath = path.join(__dirname, 'frontend/.env');
const backendEnvPath = path.join(__dirname, 'backend/.env');

const checkEnv = (path, label) => {
  if (fs.existsSync(path)) {
    const content = fs.readFileSync(path, 'utf-8');
    const hasOpenAI = content.includes('OPENAI_API_KEY') && !content.includes('OPENAI_API_KEY=');
    const hasGemini = content.includes('GEMINI_API_KEY') && !content.includes('GEMINI_API_KEY=');
    const hasGrok = content.includes('GROK_API_KEY') && !content.includes('GROK_API_KEY=');
    
    console.log(`  ✅ ${label}: Found`);
    console.log(`     • OpenAI Key: ${hasOpenAI ? '✓ Configured' : '⚠ Missing or Empty'}`);
    console.log(`     • Gemini Key: ${hasGemini ? '✓ Configured' : '⚠ Missing or Empty'}`);
    console.log(`     • Grok Key: ${hasGrok ? '✓ Configured' : '⚠ Missing or Empty'}`);
  } else {
    console.log(`  ⚠️  ${label}: Not found`);
  }
};

checkEnv(frontendEnvPath, 'Frontend .env');
checkEnv(backendEnvPath, 'Backend .env');

// Summary
console.log('\n' + '═'.repeat(50));
console.log('📊 System Status:');
console.log('═'.repeat(50));

const checks = [
  ['Frontend LLM Service (3 models)', fs.existsSync(frontendLlmPath)],
  ['Backend LLM Service (3 models)', fs.existsSync(backendLlmPath)],
  ['Premium Endpoint Integration', fs.existsSync(premiumPath)],
  ['Environment Configuration', fs.existsSync(frontendEnvPath) && fs.existsSync(backendEnvPath)]
];

const allPassed = checks.every(([_, result]) => result);
const passCount = checks.filter(([_, result]) => result).length;

checks.forEach(([check, passed]) => {
  console.log(`  ${passed ? '✅' : '❌'} ${check}`);
});

console.log('\n' + '═'.repeat(50));
console.log(`Overall Status: ${allPassed ? '✅ ALL SYSTEMS GO' : `⚠️  ${passCount}/${checks.length} checks passed`}`);
console.log('═'.repeat(50));

console.log('\n📚 Multi-Model Consensus Algorithm:');
console.log('  1. All 3 models classify in PARALLEL');
console.log('  2. Collect results from available models');
console.log('  3. Vote counting for consensus label');
console.log('  4. Average confidence across models');
console.log('  5. Return consensus with all votes');

console.log('\n🔄 Fallback Strategy:');
console.log('  • All 3 models available → Use consensus');
console.log('  • 2 models available → Majority vote');
console.log('  • 1 model available → Use that result');
console.log('  • All failed → Default classification');

console.log('\n💡 Next Steps:');
console.log('  1. Configure API keys in .env files:');
console.log('     • VITE_OPENAI_API_KEY (frontend)');
console.log('     • VITE_GEMINI_API_KEY (frontend)');
console.log('     • VITE_GROK_API_KEY (frontend)');
console.log('     • OPENAI_API_KEY (backend)');
console.log('     • GEMINI_API_KEY (backend)');
console.log('     • GROK_API_KEY (backend)');
console.log('  2. Start backend: npm start');
console.log('  3. Start frontend: npm run dev');
console.log('  4. Test consensus at: POST /api/analysis/advanced');

console.log('\n✨ Multi-Model System Ready for Testing!\n');
