import React, { useState } from 'react';
import X402_CONFIG from '../config/x402-config';

function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async (planType) => {
    console.log(`Initiating X402 payment for ${planType} plan...`);
    setSelectedPlan(planType);
    setShowPaymentModal(true);
    setIsProcessing(true);

    // Simulate X402 payment request
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Premium Plans</h1>
          <p className="text-xl text-gray-300">Unlock advanced features with X402 payments</p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Free Plan */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-2xl p-8 hover:shadow-lg transition-all">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {X402_CONFIG.subscriptions.free.name}
              </h2>
              <div className="text-4xl font-bold text-emerald-400">
                ${X402_CONFIG.subscriptions.free.monthly_cost}
                <span className="text-lg text-gray-300">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-emerald-400">✓</span>
                <span>{X402_CONFIG.subscriptions.free.limits.publishing_per_month} DKG publishes/month</span>
              </li>
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-emerald-400">✓</span>
                <span>{X402_CONFIG.subscriptions.free.limits.advanced_analyses_per_month} advanced analyses/month</span>
              </li>
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-emerald-400">✓</span>
                <span>{X402_CONFIG.subscriptions.free.limits.grokipedia_searches_per_month} Grokipedia searches/month</span>
              </li>
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-emerald-400">✓</span>
                <span>{X402_CONFIG.subscriptions.free.limits.batch_verifications_per_month} batch verification/month</span>
              </li>
            </ul>

            <button
              disabled
              className="w-full bg-slate-600 text-slate-300 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-2 border-amber-400 rounded-2xl p-8 hover:shadow-2xl transition-all transform hover:scale-105 relative">
            <div className="absolute -top-4 right-6 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold">
              Most Popular
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {X402_CONFIG.subscriptions.premium.name}
              </h2>
              <div className="text-4xl font-bold text-amber-400">
                ${X402_CONFIG.subscriptions.premium.monthly_cost}
                <span className="text-lg text-gray-300">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-100">
                <span className="text-amber-400 text-lg">★</span>
                <span>Unlimited DKG publishing</span>
              </li>
              <li className="flex items-center gap-3 text-gray-100">
                <span className="text-amber-400 text-lg">★</span>
                <span>Unlimited advanced analysis</span>
              </li>
              <li className="flex items-center gap-3 text-gray-100">
                <span className="text-amber-400 text-lg">★</span>
                <span>Unlimited Grokipedia access</span>
              </li>
              <li className="flex items-center gap-3 text-gray-100">
                <span className="text-amber-400 text-lg">★</span>
                <span>Unlimited batch verification</span>
              </li>
              <li className="flex items-center gap-3 text-gray-100">
                <span className="text-amber-400 text-lg">★</span>
                <span>Priority API support</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('premium')}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all hover:from-amber-600 hover:to-orange-600"
            >
              💳 Upgrade to Premium
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-2xl p-8 hover:shadow-lg transition-all">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {X402_CONFIG.subscriptions.pro.name}
              </h2>
              <div className="text-4xl font-bold text-blue-400">
                ${X402_CONFIG.subscriptions.pro.monthly_cost}
                <span className="text-lg text-gray-300">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-blue-400">✦</span>
                <span>All Premium features</span>
              </li>
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-blue-400">✦</span>
                <span>Priority support 24/7</span>
              </li>
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-blue-400">✦</span>
                <span>High API priority</span>
              </li>
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-blue-400">✦</span>
                <span>Dedicated account manager</span>
              </li>
              <li className="flex items-center gap-3 text-gray-200">
                <span className="text-blue-400">✦</span>
                <span>Custom integrations</span>
              </li>
            </ul>

            <button
              onClick={() => handleCheckout('pro')}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-lg hover:shadow-lg transition-all hover:from-blue-600 hover:to-cyan-600"
            >
              💳 Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-2xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-white mb-6">Feature Comparison</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="px-4 py-3 text-gray-300 font-semibold">Feature</th>
                  <th className="px-4 py-3 text-center text-gray-300 font-semibold">Free</th>
                  <th className="px-4 py-3 text-center text-amber-400 font-semibold">Premium</th>
                  <th className="px-4 py-3 text-center text-blue-400 font-semibold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(X402_CONFIG.features).map(([key, feature]) => (
                  <tr key={key} className="border-b border-slate-700">
                    <td className="px-4 py-3 text-gray-200">{feature.name}</td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {X402_CONFIG.subscriptions.free.features[key] ? '✓' : '✗'}
                    </td>
                    <td className="px-4 py-3 text-center text-amber-400">
                      {X402_CONFIG.subscriptions.premium.features[key] ? '✓' : '✗'}
                    </td>
                    <td className="px-4 py-3 text-center text-blue-400">
                      {X402_CONFIG.subscriptions.pro.features[key] ? '✓' : '✗'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* X402 Info */}
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border border-purple-600 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Powered by X402</h3>
          <p className="text-gray-300 mb-4">
            ChainLens uses the X402 HTTP Payment Protocol for secure, blockchain-based transactions
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <span className="inline-block bg-purple-700/50 text-purple-200 px-4 py-2 rounded-lg text-sm">
              🔐 Secure Payments
            </span>
            <span className="inline-block bg-purple-700/50 text-purple-200 px-4 py-2 rounded-lg text-sm">
              ⚡ Base Sepolia Network
            </span>
            <span className="inline-block bg-purple-700/50 text-purple-200 px-4 py-2 rounded-lg text-sm">
              💎 USDC Payments
            </span>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <a
            href="/comparison"
            className="inline-block bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg transition-all"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>

      {/* X402 Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-in fade-in duration-300">
            <div className="text-center mb-6">
              <div className="inline-block bg-gradient-to-br from-amber-100 to-orange-100 p-4 rounded-full mb-4">
                <span className="text-4xl">💳</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">X402 Payment</h2>
            </div>

            {isProcessing ? (
              <div className="text-center py-8">
                <div className="inline-block">
                  <div className="animate-spin text-4xl mb-4">⟳</div>
                </div>
                <p className="text-gray-600 font-medium">Processing payment...</p>
                <p className="text-sm text-gray-500 mt-2">Connecting to X402 facilitator</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-6 mb-6 border border-slate-200">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Plan</span>
                      <span className="text-gray-900 font-bold">{selectedPlan?.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Amount</span>
                      <span className="text-2xl font-bold text-amber-600">
                        ${X402_CONFIG.subscriptions[selectedPlan]?.monthly_cost}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-300">
                      <span className="text-gray-700 font-medium">Billing</span>
                      <span className="text-gray-600">Monthly</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Network</span>
                      <span className="text-gray-600 text-sm">Base Sepolia</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Token</span>
                      <span className="text-gray-600 text-sm">USDC</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsProcessing(true);
                      // Redirect to X402 facilitator
                      setTimeout(() => {
                        window.open(
                          `${X402_CONFIG.x402.facilitatorUrl}?amount=${X402_CONFIG.subscriptions[selectedPlan]?.monthly_cost}&plan=${selectedPlan}&receiver=${X402_CONFIG.x402.receivingAddress}`,
                          '_blank'
                        );
                        setShowPaymentModal(false);
                        setIsProcessing(false);
                      }, 800);
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all hover:from-amber-600 hover:to-orange-600"
                  >
                    💳 Pay with X402
                  </button>
                  
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full bg-slate-200 text-slate-800 font-semibold py-3 px-6 rounded-lg hover:bg-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  By proceeding, you agree to our Terms of Service and are authorizing the X402 payment protocol
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PremiumPage;
