/**
 * Usage Tracking Service
 * Tracks free tier usage for rate limiting
 */

const fs = require("fs");
const path = require("path");

class UsageTracker {
  constructor() {
    this.storage = new Map(); // In-memory storage (use Redis in production)
    this.dbPath = path.join(__dirname, "../../data/usage.json");
    this.loadUsage();
  }

  /**
   * Load usage from disk
   */
  loadUsage() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = JSON.parse(fs.readFileSync(this.dbPath, "utf-8"));
        this.storage = new Map(Object.entries(data));
        console.log("✅ Usage data loaded from disk");
      }
    } catch (error) {
      console.warn("⚠️ Failed to load usage data:", error.message);
    }
  }

  /**
   * Save usage to disk
   */
  saveUsage() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(Object.fromEntries(this.storage)), "utf-8");
    } catch (error) {
      console.error("❌ Failed to save usage data:", error.message);
    }
  }

  /**
   * Get user key
   */
  getUserKey(walletAddress) {
    return `user:${walletAddress}`;
  }

  /**
   * Get month key
   */
  getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  /**
   * Track usage
   */
  trackUsage(walletAddress, feature, amount = 1) {
    const userKey = this.getUserKey(walletAddress);
    const monthKey = this.getMonthKey();
    const usageKey = `${userKey}:${monthKey}`;

    if (!this.storage.has(usageKey)) {
      this.storage.set(usageKey, {});
    }

    const usage = this.storage.get(usageKey);
    usage[feature] = (usage[feature] || 0) + amount;
    this.storage.set(usageKey, usage);
    this.saveUsage();

    return usage;
  }

  /**
   * Get current usage
   */
  getUsage(walletAddress) {
    const userKey = this.getUserKey(walletAddress);
    const monthKey = this.getMonthKey();
    const usageKey = `${userKey}:${monthKey}`;

    return this.storage.get(usageKey) || {};
  }

  /**
   * Check if user has reached limit
   */
  hasReachedLimit(walletAddress, feature, limit) {
    const usage = this.getUsage(walletAddress);
    const currentUsage = usage[feature] || 0;
    return currentUsage >= limit;
  }

  /**
   * Get remaining quota
   */
  getRemainingQuota(walletAddress, feature, limit) {
    const usage = this.getUsage(walletAddress);
    const currentUsage = usage[feature] || 0;
    return Math.max(0, limit - currentUsage);
  }

  /**
   * Reset usage for user (for testing)
   */
  resetUsage(walletAddress) {
    const userKey = this.getUserKey(walletAddress);
    const monthKey = this.getMonthKey();
    const usageKey = `${userKey}:${monthKey}`;

    this.storage.delete(usageKey);
    this.saveUsage();
  }

  /**
   * Get all usage stats
   */
  getAllUsage() {
    return Object.fromEntries(this.storage);
  }
}

module.exports = new UsageTracker();
