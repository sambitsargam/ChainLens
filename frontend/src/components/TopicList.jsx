import React from 'react';

function TopicList({ topics, onSelectTopic, selectedTopicId }) {
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Topics</h3>
      
      {topics.map((topic) => (
        <button
          key={topic.id}
          onClick={() => onSelectTopic(topic)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            selectedTopicId === topic.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
          }`}
        >
          <div className="font-semibold text-gray-900">{topic.name}</div>
          <div className="text-xs text-gray-500 mt-1">
            Wikipedia: {topic.wikiTitle} • Grokipedia: {topic.grokSlug}
          </div>
        </button>
      ))}
    </div>
  );
}

export default TopicList;
