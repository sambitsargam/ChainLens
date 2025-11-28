import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { searchNotes, getNoteByUAL } from '../api';
import AlignmentScoreBadge from '../components/AlignmentScoreBadge';
import DiscrepancyList from '../components/DiscrepancyList';

function TopicDetail() {
  const { topicName } = useParams();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadNotes();
  }, [topicName]);
  
  const loadNotes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await searchNotes(topicName);
      setNotes(data.notes || []);
      
      // Auto-select first note if available
      if (data.notes && data.notes.length > 0) {
        await loadNoteDetails(data.notes[0].ual);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };
  
  const loadNoteDetails = async (ual) => {
    try {
      const data = await getNoteByUAL(ual);
      
      // Parse the public graph
      const publicGraph = data.public;
      
      setSelectedNote({
        ual,
        topic: publicGraph.about,
        alignmentScore: publicGraph['gw:alignmentScore'],
        sourceWikipedia: publicGraph['gw:sourceWikipedia'],
        sourceGrokipedia: publicGraph['gw:sourceGrokipedia'],
        discrepancies: publicGraph['gw:discrepancies']?.map(d => ({
          type: d['gw:discrepancyType'],
          grokipedia_claim: d['gw:grokipediaClaim'],
          wikipedia_claim: d['gw:wikipediaClaim'],
          explanation: d['gw:explanation'],
          model_votes: d['gw:modelVotes']?.map(v => ({
            model: v['gw:model'],
            label: v['gw:label'],
            explanation: v['gw:explanation'],
          })) || [],
          model_disagreement: d['gw:modelDisagreement'],
        })) || [],
      });
    } catch (err) {
      console.error('Error loading note details:', err);
      setError('Failed to load note details');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">📖</div>
          <div className="text-xl font-semibold text-gray-700">Loading notes...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {decodeURIComponent(topicName)}
          </h1>
          <p className="text-gray-600">
            Viewing {notes.length} Community Note{notes.length !== 1 ? 's' : ''} for this topic
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}
        
        {notes.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Notes Found
            </h3>
            <p className="text-gray-600 mb-6">
              There are no Community Notes for this topic yet.
            </p>
            <Link to="/dashboard" className="btn-primary">
              Go to Dashboard to Create One
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar: Note List */}
            <div className="lg:col-span-1">
              <div className="card sticky top-8">
                <h3 className="font-semibold text-gray-900 mb-4">Available Notes</h3>
                <div className="space-y-3">
                  {notes.map((note, index) => (
                    <button
                      key={index}
                      onClick={() => loadNoteDetails(note.ual)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedNote?.ual === note.ual
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-sm font-semibold mb-1">
                        Score: {Math.round(note.alignmentScore * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Main Content: Note Details */}
            <div className="lg:col-span-3">
              {selectedNote ? (
                <div className="space-y-6">
                  {/* Note Header */}
                  <div className="card">
                    <div className="mb-6">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        {selectedNote.topic}
                      </h2>
                      <div className="text-sm text-gray-600">
                        Community Note from OriginTrail DKG
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <AlignmentScoreBadge score={selectedNote.alignmentScore} />
                      <div className="mt-2 text-sm text-gray-700">
                        {selectedNote.discrepancies.length} discrepancies analyzed by multi-LLM ensemble
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <div className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wide">
                          📖 Wikipedia Source
                        </div>
                        <a
                          href={selectedNote.sourceWikipedia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline break-all"
                        >
                          {selectedNote.sourceWikipedia} ↗
                        </a>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                        <div className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wide">
                          📘 Grokipedia Source
                        </div>
                        <a
                          href={selectedNote.sourceGrokipedia}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium hover:underline break-all"
                        >
                          {selectedNote.sourceGrokipedia} ↗
                        </a>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                      <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        🔗 Knowledge Asset UAL
                      </div>
                      <code className="text-xs bg-white px-3 py-2 rounded block overflow-x-auto font-mono border border-gray-300">
                        {selectedNote.ual}
                      </code>
                      <div className="text-xs text-gray-600 mt-2">
                        Universal Asset Locator on OriginTrail Decentralized Knowledge Graph
                      </div>
                    </div>
                  </div>
                  
                  {/* Discrepancies */}
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">
                      Discrepancies ({selectedNote.discrepancies.length})
                    </h3>
                    <DiscrepancyList discrepancies={selectedNote.discrepancies} />
                  </div>
                </div>
              ) : (
                <div className="card text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Select a Note
                  </h3>
                  <p className="text-gray-600">
                    Choose a note from the list to view details.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TopicDetail;
