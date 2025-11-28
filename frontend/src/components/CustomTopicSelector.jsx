/**
 * Custom Topic Selector Component
 * Allows users to check new topics or select from predefined ones
 */

import React, { useState } from 'react';

function CustomTopicSelector({ topics, onSelectTopic, selectedTopicId, onCustomTopic }) {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWikiTitle, setCustomWikiTitle] = useState('');
  const [customGrokSlug, setCustomGrokSlug] = useState('');
  const [error, setError] = useState('');

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!customName.trim()) {
      setError('Topic name is required');
      return;
    }

    if (!customWikiTitle.trim()) {
      setError('Wikipedia article title is required');
      return;
    }

    if (!customGrokSlug.trim()) {
      setError('Grokipedia slug is required');
      return;
    }

    // Create custom topic
    const customTopic = {
      id: Date.now(), // Unique ID based on timestamp
      name: customName.trim(),
      wikiTitle: customWikiTitle.trim().replace(/ /g, '_'),
      grokSlug: customGrokSlug.trim().replace(/ /g, '_'),
      isCustom: true,
    };

    // Call parent callback
    onCustomTopic(customTopic);

    // Reset form
    setCustomName('');
    setCustomWikiTitle('');
    setCustomGrokSlug('');
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Predefined Topics List */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 px-2">📌 Featured Topics</h3>
        <div className="space-y-2">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => onSelectTopic(topic)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                selectedTopicId === topic.id
                  ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{topic.name}</span>
                {selectedTopicId === topic.id && (
                  <span className="text-blue-600 font-bold text-lg">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Topic Section */}
      <div className="border-t-2 border-gray-200 pt-4">
        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="w-full px-4 py-3 rounded-lg border-2 border-green-300 bg-green-50 text-green-900 font-semibold hover:bg-green-100 transition-all flex items-center justify-center gap-2"
        >
          {showCustomForm ? '✕' : '+'} Check New Topic
        </button>

        {/* Custom Topic Form */}
        {showCustomForm && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200 space-y-3">
            <h4 className="font-semibold text-green-900 mb-3">🔍 Custom Topic</h4>

            <form onSubmit={handleCustomSubmit} className="space-y-3">
              {/* Topic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Neural Networks"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  What topic do you want to analyze?
                </p>
              </div>

              {/* Wikipedia Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wikipedia Article Title
                </label>
                <input
                  type="text"
                  value={customWikiTitle}
                  onChange={(e) => setCustomWikiTitle(e.target.value)}
                  placeholder="e.g., Artificial_intelligence"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use underscores instead of spaces (e.g., Climate_change)
                </p>
              </div>

              {/* Grokipedia Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Grokipedia Slug
                </label>
                <input
                  type="text"
                  value={customGrokSlug}
                  onChange={(e) => setCustomGrokSlug(e.target.value)}
                  placeholder="e.g., artificial-intelligence"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use hyphens instead of spaces (e.g., artificial-intelligence)
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Check Topic
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomForm(false);
                    setError('');
                    setCustomName('');
                    setCustomWikiTitle('');
                    setCustomGrokSlug('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Quick Tips */}
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs font-semibold text-green-800 mb-1">💡 Quick Tips:</p>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Search for Wikipedia article titles on wikipedia.org</li>
                <li>• Check Grokipedia for equivalent slugs</li>
                <li>• Use URL format: wikipedia.org/wiki/YOUR_TITLE</li>
                <li>• Replace spaces with underscores for Wikipedia</li>
                <li>• Replace spaces with hyphens for Grokipedia</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Topics Count */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-700">
        <span className="font-semibold">{topics.length}</span> topics available
      </div>
    </div>
  );
}

export default CustomTopicSelector;
