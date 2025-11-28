import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Layout({ children }) {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-md border-b-2 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">✓</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Truth Alignment Hub
              </span>
            </Link>
            
            {/* Navigation Links */}
            <div className="flex space-x-6">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Home
              </Link>
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 border-t-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-3">About</h3>
              <p className="text-sm leading-relaxed">
                Truth Alignment Hub compares Grokipedia and Wikipedia using multi-LLM ensemble analysis,
                publishing verified Community Notes to the OriginTrail Decentralized Knowledge Graph.
              </p>
            </div>
            
            {/* Technology */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-3">Technology</h3>
              <ul className="text-sm space-y-2">
                <li>→ OriginTrail DKG</li>
                <li>→ OpenAI + Gemini + Grok</li>
                <li>→ MCP Integration</li>
                <li>→ Text-Only UI</li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h3 className="text-white font-semibold text-lg mb-3">Resources</h3>
              <ul className="text-sm space-y-2">
                <li>
                  <a 
                    href="https://docs.origintrail.io/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors"
                  >
                    OriginTrail Docs ↗
                  </a>
                </li>
                <li>
                  <a 
                    href="https://en.wikipedia.org/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Wikipedia ↗
                  </a>
                </li>
                <li>
                  <a 
                    href="https://grok.x.ai/grokipedia" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Grokipedia ↗
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm">
            Powered by OriginTrail DKG & Multi-LLM Ensemble • Text-Only UI • 2025
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
