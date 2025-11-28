/**
 * Frontend X402 Payment Client
 * Handles wallet creation and automatic payment processing
 */

import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { wrapFetchWithPayment, decodeXPaymentResponse } from "x402-fetch";

// X402 Configuration for frontend
const X402_CLIENT_CONFIG = {
  facilitatorUrl: process.env.VITE_X402_FACILITATOR_URL || "https://x402.org/facilitator",
  network: process.env.VITE_X402_NETWORK || "base-sepolia",
  chain: baseSepolia,
  rpcUrl: process.env.VITE_X402_RPC_URL || "https://sepolia.base.org",
};

class X402PaymentClient {
  constructor() {
    this.walletClient = null;
    this.account = null;
    this.fetchWithPayment = null;
    this.isInitialized = false;
    this.paymentHistory = [];
  }

  /**
   * Initialize wallet from private key
   */
  async initializeWallet(privateKey) {
    try {
      if (!privateKey) {
        throw new Error("Private key required to initialize wallet");
      }

      // Create account from private key
      this.account = privateKeyToAccount(privateKey);

      // Create wallet client
      this.walletClient = createWalletClient({
        account: this.account,
        chain: X402_CLIENT_CONFIG.chain,
        transport: http(X402_CLIENT_CONFIG.rpcUrl),
      });

      // Wrap fetch with payment handling
      this.fetchWithPayment = wrapFetchWithPayment(fetch, this.account);

      this.isInitialized = true;
      console.log("✅ X402 Payment Client initialized");
      console.log(`   Wallet: ${this.account.address}`);
      console.log(`   Network: ${X402_CLIENT_CONFIG.network}`);

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize X402 client:", error.message);
      throw error;
    }
  }

  /**
   * Make a paid request with automatic payment handling
   */
  async makePaidRequest(url, options = {}) {
    if (!this.isInitialized) {
      throw new Error("X402 client not initialized. Call initializeWallet first.");
    }

    try {
      const response = await this.fetchWithPayment(url, {
        method: options.method || "GET",
        headers: options.headers || {},
        body: options.body,
      });

      // Check for payment response
      const paymentResponseHeader = response.headers.get("x-payment-response");
      if (paymentResponseHeader) {
        const paymentData = decodeXPaymentResponse(paymentResponseHeader);
        this.paymentHistory.push({
          timestamp: new Date(),
          url,
          payment: paymentData,
          status: response.status,
        });

        console.log("✅ Payment processed successfully");
        console.log(`   URL: ${url}`);
        console.log(`   Amount: ${paymentData.amount}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
        paid: !!paymentResponseHeader,
        payment: paymentResponseHeader ? decodeXPaymentResponse(paymentResponseHeader) : null,
      };
    } catch (error) {
      console.error(`❌ Failed to make paid request to ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Get wallet address
   */
  getWalletAddress() {
    return this.account?.address || null;
  }

  /**
   * Get payment history
   */
  getPaymentHistory() {
    return this.paymentHistory;
  }

  /**
   * Clear payment history
   */
  clearPaymentHistory() {
    this.paymentHistory = [];
  }

  /**
   * Get total spent from payment history
   */
  getTotalSpent() {
    return this.paymentHistory.reduce((total, entry) => {
      const amount = parseFloat(entry.payment?.amount || 0);
      return total + amount;
    }, 0);
  }

  /**
   * Is wallet initialized
   */
  isReady() {
    return this.isInitialized;
  }
}

// Export singleton instance
export const x402Client = new X402PaymentClient();

/**
 * Hook to use X402 payment client in React components
 */
export const useX402Payment = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [error, setError] = useState(null);

  const initializePayment = async (privateKey) => {
    try {
      await x402Client.initializeWallet(privateKey);
      setIsInitialized(true);
      setWallet(x402Client.getWalletAddress());
      setError(null);
    } catch (err) {
      setError(err.message);
      setIsInitialized(false);
    }
  };

  const makePaidRequest = async (url, options = {}) => {
    try {
      const result = await x402Client.makePaidRequest(url, options);
      setPaymentHistory(x402Client.getPaymentHistory());
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    isInitialized,
    wallet,
    paymentHistory,
    error,
    initializePayment,
    makePaidRequest,
    totalSpent: x402Client.getTotalSpent(),
  };
};

export default x402Client;
