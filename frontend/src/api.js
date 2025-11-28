/**
 * Topics Configuration
 * Now defined locally in frontend (no backend needed)
 */

const TOPICS = [
  {
    id: 1,
    name: 'Blockchain',
    wikiTitle: 'Blockchain',
    grokSlug: 'Blockchain',
  },
  {
    id: 2,
    name: 'Cryptocurrency',
    wikiTitle: 'Cryptocurrency',
    grokSlug: 'Cryptocurrency',
  },
  {
    id: 3,
    name: 'Artificial Intelligence',
    wikiTitle: 'Artificial_intelligence',
    grokSlug: 'Artificial_intelligence',
  },
  {
    id: 4,
    name: 'Climate Change',
    wikiTitle: 'Climate_change',
    grokSlug: 'Climate_change',
  },
  {
    id: 5,
    name: 'Quantum Computing',
    wikiTitle: 'Quantum_computing',
    grokSlug: 'Quantum_computing',
  },
  {
    id: 6,
    name: 'Machine Learning',
    wikiTitle: 'Machine_learning',
    grokSlug: 'Machine_learning',
  },
  {
    id: 7,
    name: 'Renewable Energy',
    wikiTitle: 'Renewable_energy',
    grokSlug: 'Renewable_energy',
  },
  {
    id: 8,
    name: 'Deep Learning',
    wikiTitle: 'Deep_learning',
    grokSlug: 'Deep_learning',
  },
  {
    id: 9,
    name: 'Space Exploration',
    wikiTitle: 'Space_exploration',
    grokSlug: 'Space_exploration',
  },
  {
    id: 10,
    name: 'Biotechnology',
    wikiTitle: 'Biotechnology',
    grokSlug: 'Biotechnology',
  },
];

export const getTopics = async () => {
  return { topics: TOPICS };
};

// Note search functionality - will be stored locally or in DKG later
export const searchNotes = async (topic) => {
  // TODO: Implement local storage or DKG query
  return { notes: [] };
};

export const getNoteByUAL = async (ual) => {
  // TODO: Query DKG for note by UAL
  return { note: null };
};

export const getNotesTopics = async () => {
  // Return topics from local list
  return { topics: TOPICS.map(t => t.name) };
};

export default {
  getTopics,
  searchNotes,
  getNoteByUAL,
  getNotesTopics,
};
