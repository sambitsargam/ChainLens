/**
 * Setup Script
 * Interactive setup for ChainLens DKG Backend
 */

import readline from 'readline';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 ChainLens DKG Backend Setup');
  console.log('='.repeat(60) + '\n');

  console.log('This script will help you configure the DKG backend.\n');

  // Check if .env exists
  const envPath = join(__dirname, '../../.env');
  const envExamplePath = join(__dirname, '../../.env.example');
  
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('\nSetup cancelled. Edit .env manually if needed.\n');
      rl.close();
      return;
    }
  }

  console.log('\n📝 Configuration\n');

  // Environment
  const environment = await question('DKG Environment (testnet/mainnet) [testnet]: ') || 'testnet';
  
  // Wallet
  console.log('\n💼 Wallet Configuration\n');
  console.log('You need a wallet with TRAC tokens to publish to DKG.');
  if (environment === 'testnet') {
    console.log('Get testnet tokens from: https://faucet.origintrail.io\n');
  }
  
  const publicKey = await question('Wallet Public Key (0x...): ');
  const privateKey = await question('Wallet Private Key (0x...): ');

  // Server
  const port = await question('\nServer Port [3001]: ') || '3001';
  const frontendUrl = await question('Frontend URL [http://localhost:5173]: ') || 'http://localhost:5173';

  // Generate .env content
  const envContent = `# DKG Backend Environment Configuration

# OriginTrail DKG Configuration
DKG_ENVIRONMENT=${environment}
DKG_ENDPOINT=${environment === 'mainnet' ? 'https://v6-dkg.origin-trail.network' : 'https://v6-dkg-testnet.origin-trail.network'}
DKG_PORT=8900
DKG_BLOCKCHAIN=${environment === 'mainnet' ? 'otp:2043' : 'otp:20430'}

# Wallet Configuration
WALLET_PUBLIC_KEY=${publicKey}
WALLET_PRIVATE_KEY=${privateKey}

# Server Configuration
PORT=${port}
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=${frontendUrl}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Publishing Configuration
DEFAULT_EPOCHS=2
DEFAULT_IMMUTABLE=false
`;

  // Write .env file
  fs.writeFileSync(envPath, envContent);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Configuration saved to .env');
  console.log('='.repeat(60) + '\n');

  console.log('Next steps:\n');
  console.log('  1. Install dependencies:  npm install');
  console.log('  2. Start the server:      npm start');
  console.log('  3. Or run in dev mode:    npm run dev\n');

  console.log('API will be available at: http://localhost:' + port + '\n');

  rl.close();
}

setup().catch(error => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});
