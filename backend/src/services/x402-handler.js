/**
 * X402 Payment Middleware
 * Handles HTTP 402 Payment Required responses and payment verification
 */

import { paymentMiddleware } from "x402-express";
import X402_CONFIG from "../config/x402-config.js";

/**
 * Initialize X402 payment middleware
 * Protects premium endpoints and handles payment verification
 */
const initializeX402Middleware = (app) => {
  try {
    // Build route configurations for protected endpoints
    const routeConfigs = {};

    for (const [endpoint, config] of Object.entries(X402_CONFIG.endpoints.paid)) {
      routeConfigs[`POST ${endpoint}`] = {
        price: config.price,
        network: X402_CONFIG.x402.network,
        description: config.description,
        mimeType: config.mimeType,
        resource: endpoint,
        outputSchema: config.outputSchema,
      };
    }

    // Apply payment middleware
    app.use(
      paymentMiddleware(
        X402_CONFIG.x402.receivingAddress, // receiving wallet
        {
          ...routeConfigs,
        },
        {
          url: X402_CONFIG.x402.facilitatorUrl,
          maxTimeoutSeconds: X402_CONFIG.x402.maxTimeoutSeconds,
        }
      )
    );

    console.log("✅ X402 Payment Middleware initialized successfully");
    console.log(`   Receiving address: ${X402_CONFIG.x402.receivingAddress}`);
    console.log(`   Network: ${X402_CONFIG.x402.network}`);
    console.log(`   Facilitator: ${X402_CONFIG.x402.facilitatorUrl}`);

    return middleware;
  } catch (error) {
    console.error("❌ Failed to initialize X402 middleware:", error.message);
    throw error;
  }
};

/**
 * Check if user has valid payment
 * Extracts payment info from X-PAYMENT header
 */
const hasValidPayment = (req) => {
  const paymentHeader = req.headers["x-payment"];
  return paymentHeader && paymentHeader.length > 0;
};

/**
 * Get payment status from response headers
 */
const getPaymentStatus = (response) => {
  const paymentResponse = response.headers.get("x-payment-response");
  return paymentResponse ? JSON.parse(paymentResponse) : null;
};

/**
 * Is endpoint protected by payment
 */
const isProtectedEndpoint = (path) => {
  return Object.keys(X402_CONFIG.endpoints.paid).some((endpoint) =>
    path.startsWith(endpoint)
  );
};

/**
 * Is endpoint free
 */
const isFreeEndpoint = (path) => {
  return X402_CONFIG.endpoints.free.some((endpoint) => path.startsWith(endpoint));
};

/**
 * Get endpoint config
 */
const getEndpointConfig = (path) => {
  return X402_CONFIG.endpoints.paid[path] || null;
};

/**
 * Format 402 Payment Required response
 */
const format402Response = (endpoint, config) => {
  return {
    status: 402,
    message: "Payment Required",
    endpoint,
    feature: config.feature,
    price: config.price,
    description: config.description,
    payment_instruction:
      "Include X-PAYMENT header with signed transaction to access this resource",
    facilitator: X402_CONFIG.x402.facilitatorUrl,
    network: X402_CONFIG.x402.network,
    receiver: X402_CONFIG.x402.receivingAddress,
  };
};

export {
  X402_CONFIG,
  initializeX402Middleware,
  hasValidPayment,
  getPaymentStatus,
  isProtectedEndpoint,
  isFreeEndpoint,
  getEndpointConfig,
  format402Response,
};
