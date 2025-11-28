import React from 'react';

function DiscrepancyList({ discrepancies }) {
  const getTypeColor = (type) => {
    switch (type) {
      case 'factual_inconsistency':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'missing_context':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'hallucination':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'bias':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'aligned':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const formatType = (type) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  if (!discrepancies || discrepancies.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No discrepancies found. Articles are well aligned.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {discrepancies.map((disc, index) => (
        <div key={index} className="card border-2 border-gray-200">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <span className={`badge border-2 ${getTypeColor(disc.type)}`}>
              {formatType(disc.type)}
            </span>
            {disc.model_disagreement && (
              <span className="badge bg-orange-100 text-orange-800 border-2 border-orange-300">
                ⚠ Model Disagreement
              </span>
            )}
          </div>
          
          {/* Claims */}
          <div className="space-y-4 mb-4">
            {disc.grokipedia_claim && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border-l-4 border-blue-600 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wide">📘 Grokipedia Claim</div>
                  <div className="text-xs text-blue-600">Source Content</div>
                </div>
                <p className="text-gray-900 leading-relaxed font-medium">{disc.grokipedia_claim}</p>
              </div>
            )}
            
            {disc.wikipedia_claim && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border-l-4 border-gray-600 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-gray-800 uppercase tracking-wide">📖 Wikipedia Claim</div>
                  <div className="text-xs text-gray-600">Reference Content</div>
                </div>
                <p className="text-gray-900 leading-relaxed font-medium">{disc.wikipedia_claim}</p>
              </div>
            )}
            
            {!disc.grokipedia_claim && !disc.wikipedia_claim && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
                <div className="text-sm text-yellow-800">
                  ⚠ No specific claims to compare - general content difference detected
                </div>
              </div>
            )}
          </div>
          
          {/* Explanation */}
          <div className="bg-yellow-50 p-4 rounded-lg mb-4">
            <div className="text-xs font-semibold text-yellow-800 mb-2">ANALYSIS</div>
            <p className="text-gray-700 leading-relaxed">{disc.explanation}</p>
          </div>
          
          {/* Model Votes */}
          <div className="border-t-2 border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                🤖 LLM Ensemble Votes
              </div>
              <div className="text-xs text-gray-500">
                {disc.model_votes.length} models analyzed
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {disc.model_votes.map((vote, vIndex) => {
                const modelIcons = {
                  openai: '🟢',
                  gemini: '🔵',
                  grok: '🟣',
                  groq: '🟣'
                };
                const modelColors = {
                  openai: 'from-green-50 to-green-100 border-green-300',
                  gemini: 'from-blue-50 to-blue-100 border-blue-300',
                  grok: 'from-purple-50 to-purple-100 border-purple-300',
                  groq: 'from-purple-50 to-purple-100 border-purple-300'
                };
                
                return (
                  <div 
                    key={vIndex} 
                    className={`bg-gradient-to-br ${modelColors[vote.model.toLowerCase()] || 'from-gray-50 to-gray-100 border-gray-300'} p-4 rounded-lg border-2 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{modelIcons[vote.model.toLowerCase()] || '🤖'}</span>
                        <span className="font-bold text-sm text-gray-900 uppercase">
                          {vote.model}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`badge border-2 mb-3 ${getTypeColor(vote.label)}`}>
                      {formatType(vote.label)}
                    </div>
                    
                    <div className="bg-white bg-opacity-60 p-2 rounded text-xs text-gray-800 leading-relaxed">
                      {vote.explanation || 'Analysis completed'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {disc.model_disagreement && (
              <div className="mt-3 p-3 bg-orange-50 border-2 border-orange-300 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600 font-bold">⚠</span>
                  <span className="text-sm font-semibold text-orange-900">
                    Model Disagreement Detected
                  </span>
                </div>
                <div className="text-xs text-orange-700 mt-1">
                  The AI models had different classifications for this discrepancy. 
                  The final classification is based on majority voting.
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default DiscrepancyList;
