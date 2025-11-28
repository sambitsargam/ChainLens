import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for LLM processing
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API Client for backend communication
 */

export const getTopics = async () => {
  const response = await api.get('/api/topics');
  return response.data;
};

export const compareAndPublish = async (payload) => {
  const response = await api.post('/api/compare-and-publish', payload);
  return response.data;
};

/**
 * Stream comparison results with real-time progress updates via Server-Sent Events
 * 
 * @param {Object} payload - Comparison payload
 * @param {Object} callbacks - Event handlers
 * @param {Function} callbacks.onStart - Called when streaming starts
 * @param {Function} callbacks.onProgress - Called for progress updates
 * @param {Function} callbacks.onComplete - Called with final results
 * @param {Function} callbacks.onError - Called on error
 * @returns {EventSource} EventSource instance (can be closed to cancel)
 */
export const compareAndPublishStream = (payload, callbacks) => {
  const { onStart, onProgress, onComplete, onError } = callbacks;
  
  // Create EventSource endpoint URL with payload as query params
  const url = new URL(`${API_BASE_URL}/api/compare-and-publish/stream`);
  
  // For POST with EventSource, we need to use fetch with ReadableStream
  // or send payload as query params (not ideal for large data)
  // Alternative: use fetch API with streaming response
  
  const controller = new AbortController();
  
  fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.substring(7).trim();
            continue; // Store event type for next data line
          }
          
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              // Determine event type from data or previous line
              if (data.timestamp && !data.step) {
                onStart && onStart(data);
              } else if (data.success !== undefined) {
                onComplete && onComplete(data);
              } else if (data.error) {
                onError && onError(data);
              } else if (data.step || data.status) {
                onProgress && onProgress(data);
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError && onError({ error: error.message });
      }
    });
  
  // Return an object with abort method
  return {
    close: () => controller.abort(),
  };
};

export const searchNotes = async (topic) => {
  const response = await api.get('/api/notes/search', {
    params: { topic },
  });
  return response.data;
};

export const getNoteByUAL = async (ual) => {
  const encodedUAL = encodeURIComponent(ual);
  const response = await api.get(`/api/notes/${encodedUAL}`);
  return response.data;
};

export const getNotesTopics = async () => {
  const response = await api.get('/api/notes/topics');
  return response.data;
};

export default {
  getTopics,
  compareAndPublish,
  compareAndPublishStream,
  searchNotes,
  getNoteByUAL,
  getNotesTopics,
};
