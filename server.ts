/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely, lazy initializing client when required or guarded
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined. Please configure it in your Secrets/Environment variables.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Primary route: Interview Turn Processing
app.post('/api/interview/chat', async (req, res) => {
  try {
    const { profile, messages, action, scratchpadCode } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'User profile is required to conduct the interview.' });
    }

    const ai = getAiClient();

    // Prepare system instructions and constraints for the AI interviewer
    const systemPrompt = `You are an expert technical interviewer with 15+ years of experience hiring software engineers at top tech companies.
Your goal is to conduct a professional, highly personalized mock technical interview based on the user's profile:
- Education level: ${profile.educationLevel}
- Programming languages: ${profile.programmingLanguages.join(', ')}
- Target role: ${profile.targetRole}
- Experience level: ${profile.experienceLevel}

You MUST follow these rules strictly:
1. Conduct the interview as if it's happening live. Speak concisely, clearly, and professionally. Maintain a supportive yet rigorous tone.
2. Ask exactly ONE question at a time.
3. Randomly alternate categories: Programming, Data Structures, Algorithms, Databases, Operating Systems, Networking, Object-Oriented Programming, System Design, Behavioral.
4. When generating coding or algorithm questions:
   - Base your questions directly on LeetCode and Codeforces style problems.
   - Focus specifically on: Arrays, Strings, Linked Lists, Stacks and Queues, Trees and Graphs, Recursion and Backtracking, and Dynamic Programming (introduce Dynamic Programming at higher difficulty levels).
   - Follow a strict difficulty progression list: Easy -> Medium -> Hard. Gradually increase difficulty as the candidate answers well.
   - Format questions clearly and structurally like competitive programming challenges. Always include details on:
     - Clear Problem Description
     - Input/Output formats
     - Example Inputs and Outputs
     - Numerical Constraints
5. Do NOT reveal correct answers immediately if the candidate struggles. Encourage them, ask follow-up questions, or teach the concept before moving on.
6. When the student/candidate answers:
   - Evaluate correctness, logic, edge-cases, and language syntax.
   - Check and analyze candidate's stated Time Complexity and Space Complexity.
   - Suggest optimizations and alternative strategies.
   - Under the "evaluation" object in the JSON response, provide a rigorous score from 0 to 10, a list of strengths, logical weaknesses/blindspots, and a better/optimized alternative.
   - Adjust the candidate's performance stats (Problem Solving, Coding, Communication, CS Fundamentals) proportionally (0 to 100 range).
7. If the candidate requests a hint, provide a helpful, conceptual Socratic hint. Do not reveal the full solution or final code immediately.
8. For coding questions:
   - Encourage them to explain their conceptual approach first.
   - Ask about time/space complexity before writing final code.
   - Mention the current code scratchpad they submitted if relevant: "${scratchpadCode || 'None'}"
9. Every 10 questions/turns (specifically, if this is question index 10, meaning they completed 10 answers):
   - Provide an "Overall score", "Strongest topics", "Weakest topics", and a detailed "Recommended study plan". Tell them the interview is completed and summarize these points beautifully in your final text.
10. Return a valid JSON response adhering strictly to the response schema. Never include conversational prefixes outside of the JSON representation. Make sure 'replyText' contains rich markdown formatting.`;

    // Construct messaging log for Gemini content tracking. 
    // Format previous messages as plain summaries for context, and send the current prompt context
    const chatContext = messages && messages.length > 0 
      ? messages.map((m: any) => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}${m.evaluation ? ` (Evaluation Score: ${m.evaluation.score}/10)` : ''}`).join('\n')
      : 'This is the start of the interview. Complete step 1: introduce yourself professionally, confirm the candidate\'s profile, and present the very first technical question.';

    const userInstructions = action === 'hint' 
      ? `The candidate is asking for a helpful, conceptual hint for the current question. Do not give away the solution. Update the interview state and provide a hint.`
      : action === 'reset'
      ? `The user wants to reset the interview. Restart by introducing yourself and asking the first question.`
      : `The candidate has submitted an answer or updated the discussion. Candidate's message: "${req.body.message || ''}". Current scratchpad code: "${scratchpadCode || ''}". Please evaluate this input and reply with the next steps or the next question.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `${chatContext}\n\nTask: ${userInstructions}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['replyText', 'hasEvaluation', 'category', 'difficulty', 'performanceStats'],
          properties: {
            replyText: {
              type: Type.STRING,
              description: 'The narrative text reply from the interviewer. Contains the greeting, feedback, hint, or the next interview question formatted in clean markdown.',
            },
            hasEvaluation: {
              type: Type.BOOLEAN,
              description: 'Set to true if the candidate\'s latest message is being graded and evaluated, false otherwise.',
            },
            evaluation: {
              type: Type.OBJECT,
              description: 'The grade performance metadata. Must be filled if hasEvaluation is true.',
              properties: {
                score: {
                  type: Type.INTEGER,
                  description: 'An integer code representing correctness from 0 to 10.',
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Bullet points highlighting what the candidate did right.',
                },
                weaknesses: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Constructive items of improvement or errors noticed.',
                },
                betterAnswer: {
                  type: Type.STRING,
                  description: 'A markdown code block or description showing the fully optimized solution.',
                },
              },
            },
            category: {
              type: Type.STRING,
              description: 'The interview topic area currently under question. Must be one of: Programming, Data Structures, Algorithms, Databases, Operating Systems, Networking, Object-Oriented Programming, System Design, Behavioral.',
            },
            difficulty: {
              type: Type.STRING,
              description: 'The current difficulty of the interview questions: Easy, Medium, Hard, Expert.',
            },
            performanceStats: {
              type: Type.OBJECT,
              description: 'The overall current rating estimate of the candidate from 0 to 100 based on all logs.',
              required: ['problemSolving', 'coding', 'communication', 'computerScience'],
              properties: {
                problemSolving: { type: Type.INTEGER },
                coding: { type: Type.INTEGER },
                communication: { type: Type.INTEGER },
                computerScience: { type: Type.INTEGER },
              },
            },
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error('Emply response received from Gemini API.');
    }

    const payload = JSON.parse(resultText);
    res.json(payload);

  } catch (error: any) {
    console.error('Gemini Interview API Error:', error);
    res.status(500).json({
      error: 'Failed to process interview turn.',
      message: error.message || 'An unknown error occurred.',
    });
  }
});

// Configure Vite or production serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Technical Interview Coach] server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
