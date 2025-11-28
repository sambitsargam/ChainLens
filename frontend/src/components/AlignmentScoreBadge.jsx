import React from 'react';

function AlignmentScoreBadge({ score }) {
  const getColorClass = () => {
    if (score >= 0.8) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };
  
  const getLabel = () => {
    if (score >= 0.8) return 'High Alignment';
    if (score >= 0.6) return 'Moderate Alignment';
    return 'Low Alignment';
  };
  
  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 ${getColorClass()}`}>
      <span className="font-bold text-2xl mr-2">{Math.round(score * 100)}%</span>
      <span className="text-sm font-semibold">{getLabel()}</span>
    </div>
  );
}

export default AlignmentScoreBadge;
