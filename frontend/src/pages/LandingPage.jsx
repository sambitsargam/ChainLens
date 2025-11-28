import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
            <span className="text-blue-400 text-sm font-semibold">🚀 AI-Powered Truth Verification</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-6xl md:text-7xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ChainLens
            </span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-300 mb-4 font-light">
            Wikipedia vs Grokipedia Truth Alignment
          </p>
          
          <p className="text-lg text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Harness the power of <span className="text-blue-400 font-semibold">semantic embeddings</span> and 
            <span className="text-cyan-400 font-semibold"> multi-LLM ensemble AI</span> to identify 
            discrepancies between knowledge sources. Publish verifiable Community Notes to the 
            <span className="text-blue-400 font-semibold"> OriginTrail DKG</span>.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <Link 
              to="/dashboard" 
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl 
                       hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg shadow-blue-500/50
                       hover:shadow-xl hover:shadow-blue-500/70 transform hover:-translate-y-1 flex items-center space-x-2"
            >
              <span>Launch Dashboard</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <a 
              href="https://github.com/sambitsargam/ChainLens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-4 bg-slate-800 border-2 border-slate-700 text-gray-300 font-semibold rounded-xl 
                       hover:border-blue-500 hover:text-white transition-all duration-300"
            >
              View on GitHub
            </a>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">3</div>
              <div className="text-sm text-gray-400">LLM Providers</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="text-3xl font-bold text-cyan-400 mb-2">1536D</div>
              <div className="text-sm text-gray-400">Vector Embeddings</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
              <div className="text-3xl font-bold text-blue-400 mb-2">∞</div>
              <div className="text-sm text-gray-400">DKG Permanence</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-bold text-center mb-16 text-white">
          How It <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Works</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 
                        hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6 
                            group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl font-bold">🔍</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Semantic Comparison</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Fetch articles from both sources and compare using <span className="text-blue-400">1536D vector embeddings</span> 
                for deep semantic understanding.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                  OpenAI Embeddings
                </span>
                <span className="text-xs px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                  Gemini Embeddings
                </span>
              </div>
            </div>
          </div>
          
          {/* Feature 2 */}
          <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 
                        hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mb-6 
                            group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl font-bold">🧠</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Multi-LLM Ensemble</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Three AI models vote on each discrepancy. <span className="text-cyan-400">Majority consensus</span> 
                determines final classification.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">
                  🟢 OpenAI GPT
                </span>
                <span className="text-xs px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                  🔵 Gemini
                </span>
                <span className="text-xs px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full border border-purple-500/20">
                  🟣 Groq
                </span>
              </div>
            </div>
          </div>
          
          {/* Feature 3 */}
          <div className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 
                        hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center mb-6 
                            group-hover:scale-110 transition-transform">
                <span className="text-white text-2xl font-bold">⛓</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">DKG Publication</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Publish structured <span className="text-blue-400">JSON-LD Community Notes</span> to 
                OriginTrail DKG for permanent, verifiable storage.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                  Blockchain UAL
                </span>
                <span className="text-xs px-3 py-1 bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20">
                  Immutable
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tech Stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Powered by <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Cutting-Edge Technology</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl 
                            flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                <span className="text-3xl">🤖</span>
              </div>
              <div className="text-sm font-semibold text-gray-300 mb-1">OpenAI</div>
              <div className="text-xs text-gray-500">GPT-3.5 + Embeddings</div>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl 
                            flex items-center justify-center group-hover:scale-110 transition-transform border border-cyan-500/30">
                <span className="text-3xl">✨</span>
              </div>
              <div className="text-sm font-semibold text-gray-300 mb-1">Google Gemini</div>
              <div className="text-xs text-gray-500">Gemini 1.5 Flash</div>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl 
                            flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/30">
                <span className="text-3xl">⚡</span>
              </div>
              <div className="text-sm font-semibold text-gray-300 mb-1">Groq</div>
              <div className="text-xs text-gray-500">Mixtral 8x7B</div>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl 
                            flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/30">
                <span className="text-3xl">⛓</span>
              </div>
              <div className="text-sm font-semibold text-gray-300 mb-1">OriginTrail</div>
              <div className="text-xs text-gray-500">Decentralized DKG</div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-700/50">
            <div className="flex flex-wrap justify-center gap-4">
              <span className="px-4 py-2 bg-slate-700/30 text-gray-300 text-sm rounded-lg border border-slate-600/30">
                React 18
              </span>
              <span className="px-4 py-2 bg-slate-700/30 text-gray-300 text-sm rounded-lg border border-slate-600/30">
                Node.js + Express
              </span>
              <span className="px-4 py-2 bg-slate-700/30 text-gray-300 text-sm rounded-lg border border-slate-600/30">
                Vector Embeddings
              </span>
              <span className="px-4 py-2 bg-slate-700/30 text-gray-300 text-sm rounded-lg border border-slate-600/30">
                JSON-LD
              </span>
              <span className="px-4 py-2 bg-slate-700/30 text-gray-300 text-sm rounded-lg border border-slate-600/30">
                MCP Protocol
              </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-3xl p-12 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative text-center">
            <h2 className="text-4xl font-bold mb-4 text-white">
              Ready to Verify Truth?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start analyzing discrepancies with AI-powered semantic embeddings and publish 
              verifiable Community Notes to the blockchain.
            </p>
            <Link 
              to="/dashboard" 
              className="inline-flex items-center space-x-2 px-10 py-5 bg-white text-blue-600 font-bold rounded-xl 
                       hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
            >
              <span>Launch Dashboard</span>
              <span className="text-2xl">→</span>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm">
              © 2025 ChainLens. Built with ❤️ for truth verification.
            </div>
            <div className="flex space-x-6">
              <a href="https://github.com/sambitsargam/ChainLens" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-400 hover:text-blue-400 transition-colors">
                GitHub
              </a>
              <a href="https://docs.origintrail.io/" target="_blank" rel="noopener noreferrer" 
                 className="text-gray-400 hover:text-blue-400 transition-colors">
                OriginTrail Docs
              </a>
              <Link to="/dashboard" className="text-gray-400 hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
