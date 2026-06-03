/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Sparkles, 
  Play, 
  HelpCircle, 
  Flame, 
  BookOpen, 
  Send, 
  RotateCcw, 
  Maximize2, 
  Code2, 
  ExternalLink, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Lightbulb,
  FileCode,
  Award,
  BookMarked
} from 'lucide-react';
import ProfileBuilder from './components/ProfileBuilder';
import PerformanceRadar from './components/PerformanceRadar';
import CodeScratchpad from './components/CodeScratchpad';
import { UserProfile, ChatMessage, InterviewSession, PerformanceStats } from './types';

// Simple default blank state generators
const DEFAULT_PERFORMANCE: PerformanceStats = {
  problemSolving: 70,
  coding: 70,
  communication: 70,
  computerScience: 70,
};

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('interview_profile_cache');
    return saved ? JSON.parse(saved) : null;
  });

  const [session, setSession] = useState<InterviewSession | null>(() => {
    const saved = localStorage.getItem('interview_session_cache');
    return saved ? JSON.parse(saved) : null;
  });

  // Editor Scratchpad Draft content
  const [scratchpadCode, setScratchpadCode] = useState<string>(() => {
    return localStorage.getItem('interview_scratchpad_cache') || '';
  });

  // Current user's narrative input message
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Layout states: toggle sidebar on small viewports, or toggle live code editor split
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isEditorVisible, setIsEditorVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'editor'>('chat'); // For smaller screens

  // Session timer ticker
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Accordion state to toggle specific evaluations open/closed
  const [expandedEvaluationId, setExpandedEvaluationId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync caches to local storage
  useEffect(() => {
    if (profile) {
      localStorage.setItem('interview_profile_cache', JSON.stringify(profile));
    } else {
      localStorage.removeItem('interview_profile_cache');
    }
  }, [profile]);

  useEffect(() => {
    if (session) {
      localStorage.setItem('interview_session_cache', JSON.stringify(session));
    } else {
      localStorage.removeItem('interview_session_cache');
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem('interview_scratchpad_cache', scratchpadCode);
  }, [scratchpadCode]);

  // Session elapsed second tick-timer hook
  useEffect(() => {
    let interval: any;
    if (session?.isActive && !session.isCompleted) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.isActive, session?.isCompleted]);

  // Auto-scroll logic when a new message pops up
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages, isLoading]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handler: Setup profile and initiate first interviewer query call
  const handleProfileComplete = async (userProfile: UserProfile) => {
    setProfile(userProfile);
    setIsLoading(true);
    setErrorText(null);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: userProfile,
          messages: [],
          action: 'start',
          scratchpadCode: '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed response status code ${response.status}. Make sure GEMINI_API_KEY is configured.`);
      }

      const data = await response.json();
      
      const firstMessage: ChatMessage = {
        id: 'initial_question_1',
        role: 'assistant',
        content: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: data.category || 'Algorithms',
        difficulty: data.difficulty || 'Medium',
        questionNumber: 1,
      };

      setSession({
        profile: userProfile,
        messages: [firstMessage],
        currentIdx: 1,
        performance: data.performanceStats || DEFAULT_PERFORMANCE,
        isActive: true,
        isCompleted: false,
      });
      setElapsedSeconds(0);
    } catch (e: any) {
      console.error(e);
      setErrorText(e.message || 'Error occurred starting interview session. Please verify your internet connection or check API keys.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Post narrative response and evaluate
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() && !scratchpadCode.trim()) return;
    if (!session || isLoading) return;

    // Local user response draft
    const textToSend = userInput.trim() || "See submitted code implementation in sandbox code scratchpad.";
    const userMessage: ChatMessage = {
      id: `user_reply_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...session.messages, userMessage];

    // Optimistically update candidate message log
    setSession({
      ...session,
      messages: updatedMessages,
    });
    setUserInput('');
    setIsLoading(true);
    setErrorText(null);

    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          messages: updatedMessages,
          scratchpadCode,
          message: textToSend,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error API request received (Status ${response.status}). Keep typing or retry.`);
      }

      const data = await response.json();

      // Determine feedback evaluate state
      let evaluationPayload = undefined;
      if (data.hasEvaluation && data.evaluation) {
        evaluationPayload = {
          score: data.evaluation.score,
          strengths: data.evaluation.strengths || [],
          weaknesses: data.evaluation.weaknesses || [],
          betterAnswer: data.evaluation.betterAnswer || '',
          evaluatedAnswer: textToSend,
        };
      }

      const nextQuestionNum = session.currentIdx + 1;
      const responseId = `eval_question_${Date.now()}`;
      
      const assistantMessage: ChatMessage = {
        id: responseId,
        role: 'assistant',
        content: data.replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: data.category || 'Algorithms',
        difficulty: data.difficulty || 'Medium',
        questionNumber: nextQuestionNum,
        evaluation: evaluationPayload,
      };

      // Automatically expand current evaluation to focus user's attention
      if (evaluationPayload) {
        setExpandedEvaluationId(responseId);
      }

      // Check if candidate reached 10 answers completed
      const reachedEnding = nextQuestionNum > 10 || data.replyText.toLowerCase().includes('recommended study plan') || data.replyText.toLowerCase().includes('overall score');

      setSession({
        ...session,
        messages: [...updatedMessages, assistantMessage],
        currentIdx: nextQuestionNum,
        performance: data.performanceStats || session.performance,
        isCompleted: reachedEnding,
      });

    } catch (e: any) {
      console.error(e);
      setErrorText(e.message || 'Our interview node failed to compile feedback. Please retry submitting.');
    } finally {
      setIsLoading(false);
    }
  };

  // Force append code template from scratchpad directly into prompt
  const handleAppendScratchpadToMessage = () => {
    if (!scratchpadCode) return;
    const appendText = `\n\n\`\`\`${session?.profile.programmingLanguages[0] || 'code'}\n${scratchpadCode}\n\`\`\``;
    setUserInput((prev) => prev + appendText);
  };

  // Quick Socratic Hints fetcher
  const handleRequestHint = async () => {
    if (!session || isLoading) return;
    
    setIsLoading(true);
    setErrorText(null);
    try {
      const response = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          messages: session.messages,
          action: 'hint',
          scratchpadCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hint guidance.');
      }

      const data = await response.json();
      
      const hintMessage: ChatMessage = {
        id: `hint_${Date.now()}`,
        role: 'assistant',
        content: `💡 **Socratic Interviewer Hint:** ${data.replyText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hintUsed: true,
      };

      setSession({
        ...session,
        messages: [...session.messages, hintMessage],
      });
    } catch (e: any) {
      console.error(e);
      setErrorText('Hint request timed out. Please review the question terms.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset entire simulation flow
  const handleResetSession = () => {
    if (confirm('Verify: Do you want to wipe current score records and abort this technical interview?')) {
      setSession(null);
      setProfile(null);
      setScratchpadCode('');
      setUserInput('');
      setErrorText(null);
      localStorage.removeItem('interview_session_cache');
      localStorage.removeItem('interview_profile_cache');
      localStorage.removeItem('interview_scratchpad_cache');
    }
  };

  // Return Profile input form if null setup
  if (!profile || !session) {
    return <ProfileBuilder onProfileComplete={handleProfileComplete} />;
  }

  // Find latest active interviewer context to display header metadata
  const lastInterviewerMsg = [...session.messages]
    .reverse()
    .find((m) => m.role === 'assistant' && m.difficulty);

  const currentDifficulty = lastInterviewerMsg?.difficulty || 'Medium';
  const currentCategory = lastInterviewerMsg?.category || 'Algorithms';

  // Construct active physical blocks for difficulty state
  const getDifficultyBlocks = (diff: string) => {
    const mapLevel: Record<string, number> = { Easy: 1, Medium: 2, Hard: 4, Expert: 5 };
    const num = mapLevel[diff] || 3;
    return (
      <div className="flex gap-1.5" id="difficulty-blocks">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className={`h-2.5 w-6 transition-all rounded-[1px] ${
              idx <= num ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-[#1F1F24]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#E0E0E6] flex flex-col font-sans selection:bg-indigo-800 selection:text-white" id="main-interview-arena">
      
      {/* Top Banner Status Bar */}
      <header className="h-14 border-b border-[#1F1F24] px-4 md:px-6 flex items-center justify-between bg-[#0A0A0C] z-10">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
          <span className="text-[11px] font-mono font-medium tracking-widest text-[#88888F] uppercase hidden sm:inline">
            CONNECTED: SENIOR ALGORITHM INTERVIEWER (STAFF COMMITTEE)
          </span>
          <span className="text-[11px] font-mono font-medium tracking-widest text-[#88888F] uppercase sm:hidden">
            LIVE INTERVIEW PANEL
          </span>
        </div>

        {/* Action center header */}
        <div className="flex items-center space-x-4 font-mono text-xs text-[#88888F]">
          <div className="flex items-center space-x-1.5 px-3 py-1 bg-[#111114] border border-[#1F1F24] rounded-md text-[11px]">
            <span className="text-[#55555A]">TIME ELAPSED:</span>
            <span className="text-white font-bold">{formatTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={handleResetSession}
            id="reset-simulation-head-btn"
            title="Reset Arena Session"
            className="p-1.5 hover:bg-[#111114] text-slate-400 hover:text-white transition-all border border-transparent hover:border-[#222226] rounded-md cursor-pointer flex items-center space-x-1"
          >
            <RotateCcw size={13} />
            <span className="text-[10px] uppercase font-mono tracking-wider hidden md:inline">Restart</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Side Navigation & Metrix Panel */}
        <aside 
          id="system-aside-bar"
          className={`${
            isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'
          } bg-[#111114] border-r border-[#222226] flex flex-col transition-all duration-300 overflow-y-auto hidden lg:flex shrink-0`}
        >
          {/* General Metadata Title */}
          <div className="p-6 border-b border-[#222226]">
            <div className="text-[#88888F] text-[10px] uppercase tracking-[0.25em] mb-1 font-mono font-bold flex items-center gap-1.5">
              <Sparkles size={11} className="text-indigo-400" />
              <span>CANDIDATE LOG STATUS</span>
            </div>
            <h2 className="text-lg font-display font-semibold text-white tracking-tight leading-tight">
              {profile.targetRole}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Track: {profile.experienceLevel} Senority level
            </p>
          </div>

          {/* Active Performance metrics */}
          <div className="p-6 space-y-6 flex-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#88888F] tracking-wider uppercase font-semibold">Active Metrics</span>
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">Rapport evaluation</span>
              </div>
              
              {/* Problem Solving indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium font-sans">Problem Solving</span>
                  <span className="text-[11px] font-mono text-emerald-400 font-bold">{(session.performance.problemSolving / 10).toFixed(1)}/10</span>
                </div>
                <div className="h-1 w-full bg-[#1F1F24] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${session.performance.problemSolving}%` }}
                  />
                </div>
              </div>

              {/* Coding Ability */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Coding Proficiency</span>
                  <span className="text-[11px] font-mono text-indigo-400 font-bold">{(session.performance.coding / 10).toFixed(1)}/10</span>
                </div>
                <div className="h-1 w-full bg-[#1F1F24] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${session.performance.coding}%` }}
                  />
                </div>
              </div>

              {/* Communication */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">Developer Communication</span>
                  <span className="text-[11px] font-mono text-amber-400 font-bold">{(session.performance.communication / 10).toFixed(1)}/10</span>
                </div>
                <div className="h-1 w-full bg-[#1F1F24] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${session.performance.communication}%` }}
                  />
                </div>
              </div>

              {/* CS Fundamentals */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 font-medium">CS Fundamentals</span>
                  <span className="text-[11px] font-mono text-[#F43F5E] font-bold">{(session.performance.computerScience / 10).toFixed(1)}/10</span>
                </div>
                <div className="h-1 w-full bg-[#1F1F24] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#F43F5E] transition-all duration-500" 
                    style={{ width: `${session.performance.computerScience}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Profile specifications */}
            <div className="pt-6 border-t border-[#222226] space-y-4">
              <span className="text-[10px] font-mono text-[#88888F] tracking-wider uppercase font-semibold block">Languages configured</span>
              <div className="flex flex-wrap gap-1">
                {profile.programmingLanguages.map((l) => (
                  <span key={l} className="text-[10px] bg-[#1a1a20] border border-[#2d2d35]/60 text-indigo-300 px-2.5 py-1 rounded font-mono">
                    {l}
                  </span>
                ))}
              </div>
              <div className="rounded-lg bg-[#16161A]/80 border border-[#222226] p-3 text-[11px] text-slate-400 leading-relaxed font-sans">
                💡 <span className="text-white font-medium">Hint:</span> Write code on the editor inside the right sandbox, run compiled verification and click <span className="text-indigo-400 font-semibold">'Inject scratchpad code'</span> at bottom bar when answering!
              </div>
            </div>
          </div>

          {/* Difficulty and Progress block */}
          <div className="p-6 bg-[#0D0D10] border-t border-[#222226] space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-[10px] text-[#55555A] uppercase tracking-widest font-mono font-bold">Question Level</div>
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded">{currentDifficulty}</span>
            </div>
            {getDifficultyBlocks(currentDifficulty)}

            <div className="flex justify-between items-center text-[11px] text-[#88888F] font-mono pt-2">
              <span>Overall progress:</span>
              <span className="text-white font-bold">{Math.min(session.currentIdx, 10)} / 10 questions</span>
            </div>
          </div>
        </aside>

        {/* Content Section: Column splits optionally for editor */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Main Conversational Thread Area */}
          <main className="flex-1 flex flex-col bg-[#0A0A0C] min-w-0" id="chat-messages-container">
            {/* Sizable list viewport of messages */}
            <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10 space-y-10 custom-thin-scrollbar scroll-smooth">
              
              <AnimatePresence initial={false}>
                {session.messages.map((msg, index) => {
                  const isAssistant = msg.role === 'assistant';

                  return (
                    <motion.div
                      key={msg.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex flex-col ${isAssistant ? '' : 'items-end'} max-w-4xl ${isAssistant ? '' : 'ml-auto text-right'}`}
                    >
                      {/* Name tags above message bubble */}
                      <div className="flex items-center space-x-2 text-[10px] font-mono tracking-widest text-[#88888F] uppercase mb-2">
                        <span>{isAssistant ? 'INTERVIEWER (VIRTUAL MEMORY)' : 'CANDIDATE REPRESENTATIVE'}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>

                        {isAssistant && msg.category && (
                          <>
                            <span>•</span>
                            <span className="bg-[#1F1F24] px-1.5 py-0.5 text-indigo-400 border border-[#2d2d35]/45 rounded font-bold lowercase tracking-normal text-[9px]">
                              {msg.category}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Bubble Message format */}
                      <div className={`p-5 rounded-lg border leading-relaxed ${
                        isAssistant 
                          ? 'bg-[#111114]/50 border-[#1F1F24] text-[#D1D1D1] shadow-xs' 
                          : 'bg-[#16161A] border-[#222226] text-[#E0E0E6] text-left max-w-xl'
                      }`}>
                        
                        {/* Display Serif styling for specific interviewer guidance, otherwise normal text */}
                        <div className={isAssistant && !msg.hintUsed ? 'font-serif text-[17px] md:text-[18px] text-white/90 leading-relaxed space-y-4' : 'text-sm font-sans space-y-2'}>
                          {msg.content.split('\n').map((paragraph, pIdx) => {
                            if (!paragraph.trim()) return null;
                            return (
                              <p key={pIdx}>
                                {paragraph.startsWith('💡') || paragraph.startsWith('*') ? (
                                  <span className="font-sans text-xs italic tracking-wide text-slate-300 block bg-[#16161A] p-2 rounded border border-[#222226] mt-2 mb-2">
                                    {paragraph}
                                  </span>
                                ) : (
                                  paragraph
                                )}
                              </p>
                            );
                          })}
                        </div>
                      </div>

                      {/* Dynamic evaluation dropdown toggler when message includes an evaluated feedback structure */}
                      {isAssistant && msg.evaluation && (
                        <div className="w-full mt-3 bg-[#111114] border border-[#222226] rounded-md overflow-hidden shadow-md">
                          <button
                            onClick={() => setExpandedEvaluationId(expandedEvaluationId === msg.id ? null : msg.id)}
                            id={`accordion-toggle-${msg.id}`}
                            className="w-full px-4 py-3 bg-[#16161A] flex items-center justify-between text-xs font-mono tracking-wider cursor-pointer text-[#88888F] hover:text-white transition-all uppercase"
                          >
                            <div className="flex items-center space-x-2">
                              <Award size={14} className="text-indigo-400" />
                              <span>Turn Performance Matrix: </span>
                              <span className={`font-bold ml-1 ${msg.evaluation.score >= 7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                {msg.evaluation.score} / 10
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 font-sans text-[10px] text-indigo-400 hover:underline">
                              <span>{expandedEvaluationId === msg.id ? 'Collapse Analysis' : 'Expand Detailed breakdown'}</span>
                              {expandedEvaluationId === msg.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </div>
                          </button>

                          {expandedEvaluationId === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              id={`eval-expanded-block-${msg.id}`}
                              className="p-4 border-t border-[#1F1F24] space-y-4 bg-[#0D0D10]/40 text-xs"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Strengths */}
                                <div className="space-y-1.5">
                                  <div className="font-mono text-[10px] text-[#88888F] uppercase tracking-wider flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span>Identified Strengths</span>
                                  </div>
                                  <ul className="space-y-1 text-slate-300">
                                    {msg.evaluation.strengths.map((str, sIdx) => (
                                      <li key={sIdx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-emerald-400">
                                        {str}
                                      </li>
                                    ))}
                                    {msg.evaluation.strengths.length === 0 && <li className="italic text-slate-500">No specific elements logged.</li>}
                                  </ul>
                                </div>

                                {/* Weaknesses */}
                                <div className="space-y-1.5">
                                  <div className="font-mono text-[10px] text-[#88888F] uppercase tracking-wider flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    <span>Logical Blindspots & Improvements</span>
                                  </div>
                                  <ul className="space-y-1 text-slate-300">
                                    {msg.evaluation.weaknesses.map((weak, wIdx) => (
                                      <li key={wIdx} className="pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-rose-450">
                                        {weak}
                                      </li>
                                    ))}
                                    {msg.evaluation.weaknesses.length === 0 && <li className="italic text-slate-500">Well-rounded; no substantial technical flaws identified.</li>}
                                  </ul>
                                </div>
                              </div>

                              {/* Better answer display with formatted design */}
                              {msg.evaluation.betterAnswer && (
                                <div className="pt-3 border-t border-[#1F1F24] space-y-1.5">
                                  <div className="font-mono text-[10px] text-indigo-400 uppercase tracking-widest flex items-center space-x-1">
                                    <BookMarked size={12} />
                                    <span>Expert Reference Implementation</span>
                                  </div>
                                  <div className="bg-[#0A0A0C] border border-[#1F1F24] p-3 rounded text-[11px] font-mono leading-relaxed text-[#A9A9B3] overflow-x-auto select-text whitespace-pre-wrap">
                                    {msg.evaluation.betterAnswer}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Loader placeholder when Gemini is processing */}
              {isLoading && (
                <div className="flex flex-col space-y-2 max-w-md animate-pulse">
                  <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                    INTERVIEWER IS COMPILING ANSWER DATA...
                  </div>
                  <div className="bg-[#111114] border border-[#1F1F24] rounded-lg p-4 flex items-center space-x-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
                    <span className="text-xs text-slate-400 font-mono">Formulating Socratic response...</span>
                  </div>
                </div>
              )}

              {/* Quick error state warnings banner */}
              {errorText && (
                <div className="bg-rose-950/20 border border-rose-900/40 p-4 rounded-xl flex items-center space-x-3 text-xs text-rose-300">
                  <AlertTriangle className="text-rose-500 shrink-0" size={16} />
                  <div className="flex-1 leading-normal">
                    <span className="font-bold">Interference Node Error:</span> {errorText}
                  </div>
                  <button onClick={() => setErrorText(null)} className="text-rose-400 hover:text-white underline cursor-pointer font-mono text-[10px]">Close</button>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Sticky Prompt Control Footer Dashboard */}
            <footer className="p-4 md:p-6 bg-[#0D0D10] border-t border-[#1F1F24]">
              {session.isCompleted ? (
                <div className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-center space-y-3">
                  <h3 className="text-sm font-bold text-indigo-300 font-display">Technical Assessment Completed Successfully!</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    You have finished the target assessment cycle of 10 questions. Review the study plan guide generated by your technical interviewer above to build your engineering knowledge.
                  </p>
                  <button
                    onClick={handleResetSession}
                    id="reset-completed-interview-btn"
                    className="mt-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Start New Mock Trial
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto space-y-3" id="input-chat-form">
                  {/* Dynamic actions row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleRequestHint}
                        id="hint-trigger-row-btn"
                        disabled={isLoading}
                        className="px-2.5 py-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 disabled:opacity-50 hover:border-amber-400 rounded transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <Lightbulb size={11} className="text-amber-400 fill-current" />
                        <span>Socratic Hint</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAppendScratchpadToMessage}
                        id="scratchpad-inject-btn"
                        className="px-2.5 py-1 text-[11px] font-medium text-[#88888F] bg-[#111114] border border-[#222226] hover:bg-[#1C1C22] hover:text-white rounded transition-all cursor-pointer flex items-center space-x-1"
                        title="Inject current sandbox editor code in response prompt"
                      >
                        <FileCode size={11} className="text-[#88888F]" />
                        <span>Insert Editor Code</span>
                      </button>
                    </div>

                    <div className="font-mono text-[10px] text-[#55555A] hidden sm:block">
                      Question target topics: <span className="text-indigo-400 font-semibold uppercase">{currentCategory}</span>
                    </div>
                  </div>

                  {/* Main text message formulation and send buttons */}
                  <div className="flex items-stretch space-x-3">
                    <div className="flex-1 bg-[#16161A] border border-[#222226] rounded-lg focus-within:border-slate-700 transition-colors flex overflow-hidden">
                      <textarea
                        value={userInput}
                        id="candidate-answer-textarea"
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="State your code constraints, design approach, and complexities..."
                        className="flex-1 bg-transparent py-2.5 px-4 outline-none border-none text-slate-105 placeholder-slate-650 resize-none max-h-24 min-h-[44px] text-sm leading-relaxed scrollbar-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      id="submit-answer-chat-btn"
                      disabled={isLoading || (!userInput.trim() && !scratchpadCode.trim())}
                      className="px-6 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-white font-mono tracking-widest text-[11px] font-bold uppercase rounded-lg shadow-sm hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col justify-center items-center shrink-0 min-w-[120px] pb-1"
                    >
                      <Send size={14} className="mb-0.5" />
                      <span>{isLoading ? 'Wait...' : 'Submit'}</span>
                    </button>
                  </div>
                </form>
              )}
            </footer>
          </main>

          {/* Right Side Sandbox Code Scratchpad Screen Wrapper */}
          {isEditorVisible && (
            <section className="w-full md:w-[45%] lg:w-[48%] border-t md:border-t-0 md:border-l border-[#222226] flex flex-col bg-[#0A0A0C] h-[360px] md:h-auto shrink-0" id="sandbox-editor-panel">
              <CodeScratchpad
                initialLanguage={profile.programmingLanguages[0] || 'TypeScript'}
                code={scratchpadCode}
                onChange={(c) => setScratchpadCode(c)}
              />
            </section>
          )}

        </div>
      </div>

      {/* Floating Interactive Controls (For Mobile & Tab customization) */}
      <div className="bg-[#111114] border-t border-[#1F1F24] py-2 px-4 flex items-center justify-between text-xs font-mono text-[#88888F] md:hidden z-10">
        <div className="flex space-x-2">
          <span className="text-white font-bold">{Math.min(session.currentIdx, 10)}/10 Questions</span>
          <span>•</span>
          <span className="text-indigo-400 capitalize">{currentDifficulty}</span>
        </div>

        <button
          onClick={() => setIsEditorVisible(!isEditorVisible)}
          id="toggle-mobile-scratchpad-btn"
          className="text-xs font-semibold text-indigo-400 cursor-pointer active:text-indigo-300"
        >
          {isEditorVisible ? 'Hide Scratchpad [ ]' : 'Show Scratchpad [x]'}
        </button>
      </div>

    </div>
  );
}
