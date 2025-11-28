/**
 * LLM Classification Service
 * Classifies discrepancies using OpenAI, Gemini, and Grok
 */

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GROK_API_KEY = import.meta.env.VITE_GROK_API_KEY;

export async function classifyWithOpenAI(grokSentence, wikiContext) {
  const prompt = `You are a fact-checker. Classify this discrepancy:

Grokipedia claim: "${grokSentence}"
Wikipedia context: "${wikiContext}"

Classify as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Respond ONLY with JSON: {"label": "...", "explanation": "..."}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

export async function classifyWithGemini(grokSentence, wikiContext) {
  const prompt = `Classify this discrepancy as ONE of: factual_inconsistency, missing_context, hallucination, bias, aligned

Grokipedia: "${grokSentence}"
Wikipedia: "${wikiContext}"

Respond with JSON: {"label": "...", "explanation": "..."}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text.trim();
  return JSON.parse(content);
}

export async function classifyDiscrepancies(discrepancies, wikiText) {
  const classified = [];
  const wikiContext = wikiText.substring(0, 500);
  
  for (const sentence of discrepancies.slice(0, 5)) {
    try {
      const openaiResult = await classifyWithOpenAI(sentence, wikiContext);
      const geminiResult = await classifyWithGemini(sentence, wikiContext);
      
      // Use majority vote
      const label = openaiResult.label;
      
      classified.push({
        type: label,
        grokipedia_claim: sentence,
        wikipedia_claim: null,
        explanation: openaiResult.explanation,
        model_votes: [
          { model: 'openai', label: openaiResult.label, explanation: openaiResult.explanation },
          { model: 'gemini', label: geminiResult.label, explanation: geminiResult.explanation },
        ],
      });
    } catch (error) {
      console.error('Classification error:', error);
    }
  }
  
  return classified;
}
