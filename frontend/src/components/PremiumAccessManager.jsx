/**
 * Premium Access Manager Component
 * Displays premium features and payment status
 */

import React, { useState, useEffect } from "react";
import { useX402Payment } from "../services/x402-client";

const PremiumAccessManager = () => {
  const { isInitialized, wallet, paymentHistory, error, initializePayment, totalSpent } =
    useX402Payment();

  const [privateKey, setPrivateKey] = useState("");
  const [showPrivateKeyForm, setShowPrivateKeyForm] = useState(false);
  const [subscription, setSubscription] = useState("free");

  useEffect(() => {
    // Check localStorage for saved subscription
    const savedSub = localStorage.getItem("x402_subscription");
    if (savedSub) {
      setSubscription(savedSub);
    }
  }, []);

  const handleInitializeWallet = async (e) => {
    e.preventDefault();
    try {
      await initializePayment(privateKey);
      setShowPrivateKeyForm(false);
      localStorage.setItem("x402_private_key", privateKey);
    } catch (err) {
      console.error("Failed to initialize:", err);
    }
  };

  const handleSubscriptionUpgrade = async (tier) => {
    // In a real implementation, this would trigger a payment flow
    const prices = {
      free: 0,
      premium: 19.99,
      pro: 49.99,
    };

    if (prices[tier] > 0) {
      console.log(`Upgrade to ${tier}: $${prices[tier]}`);
      setSubscription(tier);
      localStorage.setItem("x402_subscription", tier);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="premium-access-container" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🔐 Premium Access</h2>
        <p style={styles.subtitle}>Unlock advanced features with X402 payments</p>
      </div>

      {/* Wallet Status */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>💳 Wallet Status</h3>
        {isInitialized ? (
          <div style={styles.statusCard}>
            <p style={styles.statusItem}>
              <span style={styles.label}>Wallet:</span>
              <code style={styles.code}>{wallet?.substring(0, 10)}...{wallet?.substring(-8)}</code>
            </p>
            <p style={styles.statusItem}>
              <span style={styles.label}>Total Spent:</span>
              <span style={styles.amount}>{formatCurrency(totalSpent)}</span>
            </p>
            <p style={styles.statusItem}>
              <span style={styles.label}>Payments:</span>
              <span style={styles.badge}>{paymentHistory.length}</span>
            </p>
          </div>
        ) : (
          <div style={styles.statusCard}>
            {!showPrivateKeyForm ? (
              <button
                onClick={() => setShowPrivateKeyForm(true)}
                style={styles.button}
              >
                Connect Wallet
              </button>
            ) : (
              <form onSubmit={handleInitializeWallet} style={styles.form}>
                <input
                  type="password"
                  placeholder="Enter private key (0x...)"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  style={styles.input}
                />
                <button type="submit" style={styles.buttonPrimary}>
                  Initialize
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrivateKeyForm(false)}
                  style={styles.buttonSecondary}
                >
                  Cancel
                </button>
              </form>
            )}
            {error && <p style={styles.error}>{error}</p>}
          </div>
        )}
      </div>

      {/* Subscription Plans */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📊 Subscription Plans</h3>
        <div style={styles.plansGrid}>
          {/* Free Plan */}
          <div style={{ ...styles.planCard, borderColor: "#e0e0e0" }}>
            <h4 style={styles.planName}>Free</h4>
            <p style={styles.planPrice}>$0/mo</p>
            <ul style={styles.featureList}>
              <li style={styles.feature}>5 DKG publishes/month</li>
              <li style={styles.feature}>3 advanced analyses/month</li>
              <li style={styles.feature}>10 Grokipedia searches/month</li>
              <li style={styles.feature}>1 batch verification/month</li>
            </ul>
            <button
              style={{
                ...styles.planButton,
                opacity: subscription === "free" ? 0.5 : 1,
                cursor: subscription === "free" ? "default" : "pointer",
              }}
              disabled={subscription === "free"}
            >
              {subscription === "free" ? "Current Plan" : "Select"}
            </button>
          </div>

          {/* Premium Plan */}
          <div style={{ ...styles.planCard, borderColor: "#4CAF50", borderWidth: 2 }}>
            <span style={styles.badgeBest}>Popular</span>
            <h4 style={styles.planName}>Premium</h4>
            <p style={styles.planPrice}>$19.99/mo</p>
            <ul style={styles.featureList}>
              <li style={styles.feature}>✅ Unlimited publishing</li>
              <li style={styles.feature}>✅ Unlimited analyses</li>
              <li style={styles.feature}>✅ Premium Grokipedia</li>
              <li style={styles.feature}>✅ Batch verification</li>
            </ul>
            <button
              style={styles.planButtonPrimary}
              onClick={() => handleSubscriptionUpgrade("premium")}
            >
              {subscription === "premium" ? "Current Plan" : "Upgrade"}
            </button>
          </div>

          {/* Pro Plan */}
          <div style={{ ...styles.planCard, borderColor: "#2196F3" }}>
            <h4 style={styles.planName}>Pro</h4>
            <p style={styles.planPrice}>$49.99/mo</p>
            <ul style={styles.featureList}>
              <li style={styles.feature}>✅ Everything in Premium</li>
              <li style={styles.feature}>✅ Priority support</li>
              <li style={styles.feature}>✅ API priority access</li>
              <li style={styles.feature}>✅ Custom batch size</li>
            </ul>
            <button
              style={styles.planButtonSecondary}
              onClick={() => handleSubscriptionUpgrade("pro")}
            >
              {subscription === "pro" ? "Current Plan" : "Upgrade"}
            </button>
          </div>
        </div>
      </div>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>💰 Recent Payments</h3>
          <div style={styles.historyList}>
            {paymentHistory.slice(-5).reverse().map((payment, idx) => (
              <div key={idx} style={styles.historyItem}>
                <span style={styles.historyTime}>
                  {new Date(payment.timestamp).toLocaleString()}
                </span>
                <span style={styles.historyUrl}>{payment.url}</span>
                <span style={styles.historyAmount}>
                  {formatCurrency(parseFloat(payment.payment?.amount || 0))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Matrix */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>📋 Feature Comparison</h3>
        <table style={styles.featureTable}>
          <thead>
            <tr style={styles.tableHeaderRow}>
              <th style={styles.tableHeader}>Feature</th>
              <th style={styles.tableHeader}>Free</th>
              <th style={styles.tableHeader}>Premium</th>
              <th style={styles.tableHeader}>Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.tableCell}>DKG Publishing</td>
              <td style={styles.tableCell}>5/mo</td>
              <td style={styles.tableCell}>Unlimited</td>
              <td style={styles.tableCell}>Unlimited</td>
            </tr>
            <tr style={styles.tableRowAlt}>
              <td style={styles.tableCell}>Advanced Analysis</td>
              <td style={styles.tableCell}>3/mo</td>
              <td style={styles.tableCell}>Unlimited</td>
              <td style={styles.tableCell}>Unlimited</td>
            </tr>
            <tr>
              <td style={styles.tableCell}>Grokipedia Access</td>
              <td style={styles.tableCell}>10/mo</td>
              <td style={styles.tableCell}>Unlimited</td>
              <td style={styles.tableCell}>Unlimited</td>
            </tr>
            <tr style={styles.tableRowAlt}>
              <td style={styles.tableCell}>Batch Verification</td>
              <td style={styles.tableCell}>1/mo</td>
              <td style={styles.tableCell}>Unlimited</td>
              <td style={styles.tableCell}>Unlimited</td>
            </tr>
            <tr>
              <td style={styles.tableCell}>Priority Support</td>
              <td style={styles.tableCell}>✗</td>
              <td style={styles.tableCell}>✗</td>
              <td style={styles.tableCell}>✅</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Inline styles
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "2rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: "#f5f5f5",
    borderRadius: "12px",
  },
  header: {
    textAlign: "center",
    marginBottom: "3rem",
  },
  title: {
    fontSize: "2rem",
    fontWeight: "bold",
    margin: "0 0 0.5rem 0",
    color: "#333",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#666",
    margin: 0,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: "1.25rem",
    fontWeight: "600",
    margin: "0 0 1rem 0",
    color: "#333",
  },
  statusCard: {
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
  },
  statusItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    margin: "0.5rem 0",
    fontSize: "0.95rem",
  },
  label: {
    fontWeight: "600",
    color: "#666",
  },
  code: {
    fontFamily: "monospace",
    backgroundColor: "#f0f0f0",
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
  amount: {
    fontWeight: "bold",
    color: "#4CAF50",
    fontSize: "1.05rem",
  },
  badge: {
    display: "inline-block",
    backgroundColor: "#2196F3",
    color: "white",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
  form: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "1rem",
  },
  input: {
    flex: 1,
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "0.9rem",
  },
  button: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.95rem",
  },
  buttonPrimary: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
  },
  buttonSecondary: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#f0f0f0",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
  },
  error: {
    color: "#d32f2f",
    marginTop: "1rem",
    padding: "0.75rem",
    backgroundColor: "#ffebee",
    borderRadius: "4px",
  },
  plansGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "1.5rem",
    marginTop: "1rem",
  },
  planCard: {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    padding: "1.5rem",
    textAlign: "center",
    position: "relative",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  badgeBest: {
    position: "absolute",
    top: "0",
    left: "50%",
    transform: "translateX(-50%) translateY(-50%)",
    backgroundColor: "#4CAF50",
    color: "white",
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  planName: {
    fontSize: "1.25rem",
    fontWeight: "bold",
    margin: "0.5rem 0",
    color: "#333",
  },
  planPrice: {
    fontSize: "1.75rem",
    fontWeight: "bold",
    color: "#2196F3",
    margin: "0.5rem 0 1rem 0",
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: "1rem 0",
    textAlign: "left",
  },
  feature: {
    padding: "0.5rem 0",
    fontSize: "0.9rem",
    color: "#666",
  },
  planButton: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#f0f0f0",
    color: "#333",
    border: "1px solid #ddd",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "1rem",
  },
  planButtonPrimary: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "1rem",
  },
  planButtonSecondary: {
    width: "100%",
    padding: "0.75rem",
    backgroundColor: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "1rem",
  },
  historyList: {
    marginTop: "1rem",
  },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.75rem",
    borderBottom: "1px solid #eee",
    fontSize: "0.9rem",
  },
  historyTime: {
    color: "#999",
    flex: "0 0 180px",
  },
  historyUrl: {
    flex: 1,
    color: "#666",
    fontFamily: "monospace",
  },
  historyAmount: {
    fontWeight: "bold",
    color: "#d32f2f",
  },
  featureTable: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
  tableHeaderRow: {
    backgroundColor: "#f5f5f5",
  },
  tableHeader: {
    padding: "1rem",
    textAlign: "left",
    fontWeight: "bold",
    borderBottom: "2px solid #ddd",
  },
  tableCell: {
    padding: "1rem",
    borderBottom: "1px solid #eee",
  },
  tableRowAlt: {
    backgroundColor: "#f9f9f9",
  },
};

export default PremiumAccessManager;
