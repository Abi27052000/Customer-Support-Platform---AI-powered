import { GoogleGenAI } from '@google/genai';

// Initialize lazily to avoid ES Module dotenv import hoisting issues
let ai = null;

const getGenAI = () => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("WARNING: GEMINI_API_KEY is missing from .env file!");
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
};

/**
 * Analyzes policy text for ambiguities using Gemini.
 * @param {string} text - The extracted PDF text.
 * @returns {Promise<Array>} - Array of suggestion objects.
 */
export const analyzePolicyText = async (text) => {
  try {
    const prompt = `
You are an expert legal and policy document analyst. Your job is to review the following policy text and identify any ambiguous statements, vague rules, or unclear conditions. AI systems reading this policy need absolute clarity.

List all ambiguous phrases. For each, explain why it is ambiguous, and provide a clear, unambiguous suggested correction.
Return ONLY a valid JSON array of objects. Do not include markdown code blocks around the JSON.
Format:
[
  {
    "original_phrase": "exact phrase from text",
    "reason_for_ambiguity": "why it's unclear",
    "suggested_correction": "clear, improved phrase"
  }
]

Text to analyze:
"""
${text}
"""
`;

    const aiClient = getGenAI();
    
    // Using gemini-2.5-flash as it is fast and excellent for this
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonString = response.text;
    
    // Clean up potential markdown formatting (sometimes Gemini adds ```json )
    const cleanedString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const suggestions = JSON.parse(cleanedString);
    return suggestions;
  } catch (err) {
    console.error("Error analyzing text with Gemini:", err);
    throw err;
  }
};

/**
 * Verifies if the uploaded document text is relevant to customer support policies.
 * @param {string} text - The extracted PDF text.
 * @returns {Promise<Object>} - Object containing { isRelevant: boolean, reason: string }.
 */
export const verifyDocumentRelevance = async (text) => {
  try {
    const prompt = `
You are an expert AI classifying documents for a customer support platform. Your task is to determine if the following document text is a valid customer support policy, company handbook, service level agreement, or related documentation that an organization admin would upload. If it is a completely unrelated document (e.g., a cooking recipe, a fictional novel excerpt, personal photos/letters, unrelated technical manual), it should be classified as not relevant.

If it is relevant, set "isRelevant" to true and provide a brief reason.
If it is NOT relevant, set "isRelevant" to false and provide a reason explaining why it was rejected.

Return ONLY a valid JSON object. Do not include markdown code blocks around the JSON.
Format:
{
  "isRelevant": true/false,
  "reason": "explanation here"
}

Text to analyze:
"""
${text.substring(0, 5000)}
"""
`;

    const aiClient = getGenAI();
    
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const jsonString = response.text;
    const cleanedString = jsonString.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    return JSON.parse(cleanedString);
  } catch (err) {
    console.error("Error verifying document relevance with Gemini:", err);
    // On fallback error, we might bubble it up so the upload can be safely aborted
    throw err;
  }
};
