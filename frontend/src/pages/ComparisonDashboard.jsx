import React, { useState, useEffect, useRef } from 'react';
import { getTopics, searchNotes } from '../api';
import { fetchWikipediaArticle } from '../services/wikipedia';
import { fetchGrokipediaArticle } from '../services/grokipedia';
import { compareArticles } from '../services/comparison';
import { publishToDKG, saveCommunityNoteToHistory } from '../services/dkg';
import CustomTopicSelector from '../components/CustomTopicSelector';
import AlignmentScoreBadge from '../components/AlignmentScoreBadge';
import DiscrepancyList from '../components/DiscrepancyList';

function ComparisonDashboard() {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customTopics, setCustomTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [existingNotes, setExistingNotes] = useState([]);
  const [progressSteps, setProgressSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [partialData, setPartialData] = useState({});
  
  useEffect(() => {
    loadTopics();
  }, []);
  
  useEffect(() => {
    if (selectedTopic) {
      loadExistingNotes(selectedTopic.name);
    }
  }, [selectedTopic]);
  
  const loadTopics = async () => {
    try {
      const data = await getTopics();
      setTopics(data.topics);
    } catch (err) {
      console.error('Error loading topics:', err);
      setError('Failed to load topics');
    }
  };
  
  const handleCustomTopic = (customTopic) => {
    // Add custom topic to the list
    setCustomTopics([...customTopics, customTopic]);
    // Select the custom topic
    setSelectedTopic(customTopic);
  };
  
  const getAllTopics = () => {
    return [...topics, ...customTopics];
  };
  
  const loadExistingNotes = async (topicName) => {
    try {
      const data = await searchNotes(topicName);
      setExistingNotes(data.notes || []);
    } catch (err) {
      console.error('Error loading existing notes:', err);
    }
  };
  
  const handleRunComparison = async () => {
    if (!selectedTopic) {
      setError('Please select a topic first');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResult(null);
    setProgressSteps([]);
    setCurrentStep(0);
    setPartialData({});
    
    try {
      // Step 1: Fetch Wikipedia article
      setProgressSteps([{ step: 1, status: 'progress', message: 'Fetching Wikipedia article...' }]);
      const wikiArticle = await fetchWikipediaArticle(selectedTopic.wikiTitle);
      
      // Step 2: Fetch Grokipedia article
      setProgressSteps(prev => [...prev, { step: 2, status: 'progress', message: 'Fetching Grokipedia article...' }]);
      const grokArticle = await fetchGrokipediaArticle(selectedTopic.grokSlug);
      
      // Step 3: Compare articles
      setProgressSteps(prev => [...prev, { step: 3, status: 'progress', message: 'Comparing articles with embeddings...' }]);
      const comparison = await compareArticles(wikiArticle, grokArticle, (progress) => {
        setProgressSteps(prev => [...prev, { 
          step: 3, 
          status: 'progress', 
          message: `Comparing sentence ${progress.current}/${progress.total}...`,
          data: progress 
        }]);
      });
      
      // Step 4: Classify discrepancies
      if (comparison.addedInGrok.length > 0) {
        setProgressSteps(prev => [...prev, { step: 4, status: 'progress', message: 'Classifying discrepancies with LLMs (3-model consensus)...' }]);
        
        // Call backend classification endpoint for 3-model consensus
        const response = await fetch('http://localhost:3001/api/classify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            discrepancies: comparison.addedInGrok,
            context: wikiArticle.text
          })
        });
        
        if (!response.ok) {
          throw new Error(`Classification failed: ${response.statusText}`);
        }
        
        const classificationResult = await response.json();
        const classified = classificationResult.classified || [];
        
        // Prepare analysis data
        const analysisData = {
          topic: selectedTopic.name,
          wikiArticle: {
            title: wikiArticle.title,
            extract: wikiArticle.text.substring(0, 500),
            fullLength: wikiArticle.text.length,
            sentenceCount: wikiArticle.sentenceCount,
            url: wikiArticle.url,
          },
          grokArticle: {
            title: grokArticle.title,
            extract: grokArticle.text.substring(0, 500),
            fullLength: grokArticle.text.length,
            sentenceCount: grokArticle.sentenceCount,
            url: grokArticle.url,
          },
          analysis: {
            alignmentScore: comparison.globalSimilarity,
            discrepancyCount: classified.length,
            stats: {
              ...comparison.stats,
              discrepanciesAnalyzed: classified.length,
            },
            comparisonMetadata: {
              method: 'semantic-embedding',
              provider: 'openai',
              embeddingDimension: 1536,
            },
          },
          discrepancies: classified,
        };
        
        // Step 5: Publish to DKG
        setProgressSteps(prev => [...prev, { step: 5, status: 'progress', message: 'Publishing Community Note to DKG...' }]);
        const dkgResult = await publishToDKG(analysisData);
        
        // Step 6: Complete
        setProgressSteps(prev => [...prev, { step: 6, status: 'complete', message: dkgResult.success ? 'Published to DKG!' : 'Analysis complete (DKG unavailable)' }]);
        
        const finalResult = {
          ...analysisData,
          success: true,
          ual: dkgResult.ual,
          transactionHash: dkgResult.transactionHash,
          explorerUrl: dkgResult.explorerUrl,
          dkgPublished: dkgResult.success,
          communityNote: dkgResult.communityNote,
        };
        
        // Save to history
        saveCommunityNoteToHistory(dkgResult, selectedTopic.name);
        
        setResult(finalResult);
        setLoading(false);
      } else {
        // No discrepancies found - still publish to DKG
        setProgressSteps(prev => [...prev, { step: 4, status: 'progress', message: 'No discrepancies found - preparing Community Note...' }]);
        
        const analysisData = {
          topic: selectedTopic.name,
          wikiArticle: {
            title: wikiArticle.title,
            extract: wikiArticle.text.substring(0, 500),
            fullLength: wikiArticle.text.length,
            sentenceCount: wikiArticle.sentenceCount,
            url: wikiArticle.url,
          },
          grokArticle: {
            title: grokArticle.title,
            extract: grokArticle.text.substring(0, 500),
            fullLength: grokArticle.text.length,
            sentenceCount: grokArticle.sentenceCount,
            url: grokArticle.url,
          },
          analysis: {
            alignmentScore: comparison.globalSimilarity,
            discrepancyCount: 0,
            stats: comparison.stats,
            comparisonMetadata: {
              method: 'semantic-embedding',
              provider: 'openai',
              embeddingDimension: 1536,
            },
          },
          discrepancies: [],
        };
        
        // Publish to DKG
        setProgressSteps(prev => [...prev, { step: 5, status: 'progress', message: 'Publishing Community Note to DKG...' }]);
        const dkgResult = await publishToDKG(analysisData);
        
        // Complete
        setProgressSteps(prev => [...prev, { step: 6, status: 'complete', message: dkgResult.success ? 'Published to DKG!' : 'Analysis complete (DKG unavailable)' }]);
        
        const finalResult = {
          ...analysisData,
          success: true,
          ual: dkgResult.ual,
          transactionHash: dkgResult.transactionHash,
          explorerUrl: dkgResult.explorerUrl,
          dkgPublished: dkgResult.success,
          communityNote: dkgResult.communityNote,
        };
        
        // Save to history
        saveCommunityNoteToHistory(dkgResult, selectedTopic.name);
        
        setResult(finalResult);
        setLoading(false);
      }
      
    } catch (err) {
      console.error('Error running comparison:', err);
      setError(err.message || 'Failed to run comparison');
      setLoading(false);
      setProgressSteps(prev => [...prev, { step: 0, status: 'error', message: `Error: ${err.message}` }]);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Comparison Dashboard</h1>
          <p className="text-gray-600">
            Select a topic, run analysis, and publish Community Notes to the DKG.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar: Topic Selection */}
          <div className="lg:col-span-1">
            <div className="card sticky top-8">
              <CustomTopicSelector
                topics={getAllTopics()}
                onSelectTopic={setSelectedTopic}
                selectedTopicId={selectedTopic?.id}
                onCustomTopic={handleCustomTopic}
              />
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedTopic ? (
              <div className="space-y-6">
                {/* Selected Topic Card */}
                <div className="card">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {selectedTopic.name}
                  </h2>
                  
                  <div className="mb-4 space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-semibold">Wikipedia:</span> {selectedTopic.wikiTitle}
                    </div>
                    <div>
                      <span className="font-semibold">Grokipedia:</span> {selectedTopic.grokSlug}
                    </div>
                  </div>
                  
                  <button
                    onClick={handleRunComparison}
                    disabled={loading}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <span className="animate-spin mr-2">⟳</span>
                        Analyzing... (This may take 30-60 seconds)
                      </span>
                    ) : (
                      'Run Comparison & Publish Note'
                    )}
                  </button>
                </div>
                
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
                    <div className="flex">
                      <span className="text-red-800 font-semibold mr-2">✗</span>
                      <div>
                        <div className="font-semibold text-red-900">Error</div>
                        <div className="text-red-700">{error}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading Indicator with Real-Time Progress */}
                {loading && (
                  <div className="card bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border-2 border-blue-200 shadow-lg">
                    <div className="py-8">
                      <div className="text-center mb-8">
                        <div className="inline-block">
                          <div className="text-6xl mb-4 animate-bounce">🔍</div>
                        </div>
                        <h3 className="text-2xl font-bold text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 mb-2">
                          Processing Analysis
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">
                          Real-time updates • <span className="text-blue-600 font-semibold">{progressSteps.length} steps</span> completed
                        </p>
                      </div>
                      
                      {/* Progress Timeline */}
                      <div className="space-y-2 max-w-3xl mx-auto px-4">
                        {/* Timeline connector */}
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-blue-300 via-cyan-300 to-transparent opacity-30"></div>
                        
                        {progressSteps.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="inline-block">
                              <div className="animate-spin text-4xl mb-3">⟳</div>
                            </div>
                            <div className="text-gray-600 font-medium">Initializing analysis...</div>
                          </div>
                        ) : (
                          progressSteps.slice(-6).map((progress, idx) => {
                            const isComplete = progress.status?.includes('complete');
                            const isError = progress.status?.includes('error');
                            const isProgress = progress.status?.includes('progress');
                            
                            return (
                              <div 
                                key={idx}
                                className={`flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 hover:shadow-md ${
                                  isComplete ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-sm' :
                                  isError ? 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 shadow-sm' :
                                  isProgress ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 shadow-md' :
                                  'bg-gray-50 border border-gray-200'
                                }`}
                              >
                                {/* Step Indicator Circle */}
                                <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-md ${
                                  isComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white scale-100' :
                                  isError ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white scale-100' :
                                  isProgress ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white animate-pulse' :
                                  'bg-gray-400 text-white'
                                }`}>
                                  {isComplete ? (
                                    <span className="text-lg">✓</span>
                                  ) : isError ? (
                                    <span className="text-lg">✕</span>
                                  ) : isProgress ? (
                                    <span className="text-sm animate-spin">◐</span>
                                  ) : (
                                    <span className="text-sm">{progress.step || idx + 1}</span>
                                  )}
                                </div>
                                
                                {/* Step Content */}
                                <div className="flex-1 min-w-0 pt-1">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <div className={`font-bold text-sm ${
                                      isComplete ? 'text-green-700' :
                                      isError ? 'text-red-700' :
                                      isProgress ? 'text-blue-700' :
                                      'text-gray-700'
                                    }`}>
                                      {progress.message || progress.status}
                                    </div>
                                    {isProgress && progress.percent && (
                                      <span className="text-xs font-semibold bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2.5 py-0.5 rounded-full whitespace-nowrap">
                                        {progress.percent}%
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Progress Bar */}
                                  {isProgress && progress.percent && (
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2 overflow-hidden">
                                      <div 
                                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300 rounded-full"
                                        style={{ width: `${progress.percent}%` }}
                                      ></div>
                                    </div>
                                  )}
                                  
                                  {/* Data Preview */}
                                  {progress.data && (
                                    <div className="text-xs text-gray-700 mt-2 space-y-1 bg-white/50 rounded-lg p-2.5 border border-gray-200/50">
                                      {progress.data.title && (
                                        <div className="flex items-center gap-2"><span>📄</span> <span className="font-medium truncate">{progress.data.title}</span></div>
                                      )}
                                      {progress.data.charCount && (
                                        <div className="flex items-center gap-2"><span>📊</span> <span>{progress.data.charCount.toLocaleString()} chars, {progress.data.wordCount?.toLocaleString()} words</span></div>
                                      )}
                                      {progress.data.globalSimilarity && (
                                        <div className="flex items-center gap-2"><span>🎯</span> <span className="font-medium text-green-600">{(progress.data.globalSimilarity * 100).toFixed(1)}% similarity</span></div>
                                      )}
                                      {progress.data.provider && (
                                        <div className="flex items-center gap-2"><span>🧠</span> <span>Using <span className="font-medium">{progress.data.provider}</span> embeddings</span></div>
                                      )}
                                      {progress.label && progress.current && (
                                        <div className="flex items-center gap-2"><span>⚙️</span> <span>Sentence {progress.current}/{progress.total}{progress.similarity && ` • ${(progress.similarity * 100).toFixed(1)}% match`}</span></div>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Status Icon */}
                                {!isComplete && !isError && isProgress && (
                                  <div className="flex-shrink-0 animate-bounce text-cyan-500">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      {/* Partial Data Preview */}
                      {Object.keys(partialData).length > 0 && (
                        <div className="mt-6 max-w-3xl mx-auto">
                          <div className="bg-white rounded-lg p-4 border border-blue-200">
                            <div className="text-sm font-semibold text-gray-700 mb-2">📊 Live Data Preview</div>
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              {partialData.title && (
                                <div>
                                  <span className="text-gray-600">Last Article:</span>
                                  <div className="font-semibold">{partialData.title}</div>
                                </div>
                              )}
                              {partialData.globalSimilarity && (
                                <div>
                                  <span className="text-gray-600">Similarity:</span>
                                  <div className="font-semibold">{(partialData.globalSimilarity * 100).toFixed(1)}%</div>
                                </div>
                              )}
                              {partialData.alignmentScore && (
                                <div>
                                  <span className="text-gray-600">Alignment:</span>
                                  <div className="font-semibold">{(partialData.alignmentScore * 100).toFixed(1)}%</div>
                                </div>
                              )}
                              {partialData.discrepancyCount !== undefined && (
                                <div>
                                  <span className="text-gray-600">Discrepancies:</span>
                                  <div className="font-semibold">{partialData.discrepancyCount}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Results Display */}
                {result && (
                  <div className="space-y-6">
                    {/* Success Banner */}
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6">
                      <div className="flex items-start">
                        <span className="text-4xl mr-4">✓</span>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-green-900 mb-3">
                            Analysis Complete {result.dkgPublished ? '& Published to DKG' : '(Demo Mode)'}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="bg-white p-3 rounded-lg border border-green-200">
                              <div className="text-xs font-semibold text-green-700 mb-1">TOPIC</div>
                              <div className="text-lg font-bold text-gray-900">{result.topic}</div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-green-200">
                              <div className="text-xs font-semibold text-green-700 mb-1">ALIGNMENT</div>
                              <div className="text-lg font-bold text-gray-900">
                                {Math.round(result.analysis.alignmentScore * 100)}%
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-green-200">
                              <div className="text-xs font-semibold text-green-700 mb-1">DISCREPANCIES</div>
                              <div className="text-lg font-bold text-gray-900">
                                {result.analysis.discrepancyCount} analyzed
                              </div>
                            </div>
                            
                            <div className="bg-white p-3 rounded-lg border border-green-200">
                              <div className="text-xs font-semibold text-green-700 mb-1">LLM MODELS</div>
                              <div className="text-sm font-semibold text-gray-900">
                                OpenAI + Gemini + Groq
                              </div>
                            </div>
                            
                            {result.analysis.comparisonMetadata && (
                              <div className="bg-white p-3 rounded-lg border border-green-200 md:col-span-2">
                                <div className="text-xs font-semibold text-green-700 mb-1">COMPARISON METHOD</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {result.analysis.comparisonMetadata.method === 'semantic-embedding' ? (
                                    <>
                                      🧠 Semantic Embeddings via {result.analysis.comparisonMetadata.provider}
                                      {result.analysis.comparisonMetadata.embeddingDimension && (
                                        <span className="text-xs text-gray-600 ml-2">
                                          ({result.analysis.comparisonMetadata.embeddingDimension}D vectors)
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    '📝 String Similarity (Fallback)'
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border border-green-200">
                            <div className="text-xs font-semibold text-green-700 mb-2">
                              {result.dkgPublished ? 'KNOWLEDGE ASSET UAL' : 'DEMO UAL (DKG Not Connected)'}
                            </div>
                            <code className="text-xs bg-green-50 px-2 py-1 rounded block overflow-x-auto">
                              {result.ual}
                            </code>
                            {!result.dkgPublished && (
                              <div className="text-xs text-orange-600 mt-2">
                                ⚠ Note: DKG node not available. Using demo UAL. Data is still analyzed correctly.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Fetched Articles Preview */}
                    {(result.wikiArticle || result.grokArticle) && (
                      <div className="card">
                        <h3 className="text-lg font-semibold mb-4">📚 Fetched Articles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Wikipedia Article */}
                          {result.wikiArticle && (
                            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-blue-900">Wikipedia</h4>
                                <span className="text-xs px-2 py-1 bg-blue-200 text-blue-800 rounded">
                                  {result.wikiArticle.sentenceCount} sentences
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 mb-2 font-semibold">
                                {result.wikiArticle.title}
                              </div>
                              <div className="text-xs text-gray-600 bg-white p-3 rounded border border-blue-100 
                                            max-h-32 overflow-y-auto leading-relaxed">
                                {result.wikiArticle.extract}
                              </div>
                              <div className="text-xs text-blue-600 mt-2">
                                Total: {result.wikiArticle.fullLength} characters
                              </div>
                            </div>
                          )}
                          
                          {/* Grokipedia Article */}
                          {result.grokArticle && (
                            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-purple-900">Grokipedia</h4>
                                <span className="text-xs px-2 py-1 bg-purple-200 text-purple-800 rounded">
                                  {result.grokArticle.sentenceCount} sentences
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 mb-2 font-semibold">
                                {result.grokArticle.title}
                              </div>
                              <div className="text-xs text-gray-600 bg-white p-3 rounded border border-purple-100 
                                            max-h-32 overflow-y-auto leading-relaxed">
                                {result.grokArticle.extract}
                              </div>
                              <div className="text-xs text-purple-600 mt-2">
                                Total: {result.grokArticle.fullLength} characters
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Alignment Score & Statistics */}
                    <div className="card">
                      <h3 className="text-lg font-semibold mb-4">Alignment Score & Statistics</h3>
                      <div className="mb-6">
                        <AlignmentScoreBadge score={result.analysis.alignmentScore} />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                          <div className="text-xs font-semibold text-blue-700 mb-1">WIKIPEDIA</div>
                          <div className="text-3xl font-bold text-blue-900">
                            {result.analysis.stats.wikiSentenceCount}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">sentences</div>
                        </div>
                        
                        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                          <div className="text-xs font-semibold text-purple-700 mb-1">GROKIPEDIA</div>
                          <div className="text-3xl font-bold text-purple-900">
                            {result.analysis.stats.grokSentenceCount}
                          </div>
                          <div className="text-xs text-purple-600 mt-1">sentences</div>
                        </div>
                        
                        <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                          <div className="text-xs font-semibold text-orange-700 mb-1">ADDED IN GROK</div>
                          <div className="text-3xl font-bold text-orange-900">
                            {result.analysis.stats.addedCount}
                          </div>
                          <div className="text-xs text-orange-600 mt-1">unique claims</div>
                        </div>
                        
                        <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
                          <div className="text-xs font-semibold text-red-700 mb-1">ANALYZED</div>
                          <div className="text-3xl font-bold text-red-900">
                            {result.analysis.stats.discrepanciesAnalyzed || result.analysis.discrepancyCount}
                          </div>
                          <div className="text-xs text-red-600 mt-1">discrepancies</div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">Similarity Score:</span> {Math.round(result.analysis.alignmentScore * 100)}% 
                          <span className="ml-4 text-gray-600">
                            ({result.analysis.alignmentScore >= 0.8 ? '✓ High alignment' : 
                              result.analysis.alignmentScore >= 0.6 ? '⚠ Moderate alignment' : 
                              '⚠ Low alignment - significant differences detected'})
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Discrepancies */}
                    <div className="card">
                      <h3 className="text-lg font-semibold mb-4">
                        Discrepancies ({result.discrepancies.length})
                      </h3>
                      <DiscrepancyList discrepancies={result.discrepancies} />
                    </div>
                  </div>
                )}
                
                {/* Existing Notes */}
                {existingNotes.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">
                      Previous Notes for this Topic ({existingNotes.length})
                    </h3>
                    <div className="space-y-3">
                      {existingNotes.map((note, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <AlignmentScoreBadge score={note.alignmentScore} />
                            <span className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-2">
                            <span className="font-semibold">UAL:</span>
                            <code className="ml-2 bg-gray-100 px-2 py-1 rounded text-xs">
                              {note.ual}
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Topic to Begin
                </h3>
                <p className="text-gray-600">
                  Choose a topic from the list on the left to start comparing articles.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonDashboard;
