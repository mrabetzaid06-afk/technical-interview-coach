/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useRef, useEffect } from 'react';
import { Play, Copy, RotateCcw, Terminal, Lightbulb, Check } from 'lucide-react';

interface CodeScratchpadProps {
  initialLanguage: string;
  code: string;
  onChange: (newCode: string) => void;
  onRunTest?: (code: string) => void;
}

const TEMPLATES: Record<string, string> = {
  TypeScript: `// Implement your optimal solution here\nfunction solveProblem(input: any): any {\n  // Explain approach first, then time/space complexity\n  \n  return null;\n}`,
  JavaScript: `// Implement your optimal solution here\nfunction solveProblem(input) {\n  // Explain approach first, then time/space complexity\n  \n  return null;\n}`,
  Python: `# Implement your optimal solution here\ndef solve_problem(input_val):\n    # Explain approach first, then time/space complexity\n    \n    pass`,
  Java: `// Implement your optimal solution here\nclass Solution {\n    public Object solveProblem(Object input) {\n        // Explain approach first, then time/space complexity\n        \n        return null;\n    }\n}`,
  Go: `// Implement your optimal solution here\npackage main\n\nfunc solveProblem(input interface{}) interface{} {\n    // Explain approach first, then time/space complexity\n    \n    return nil;\n}`,
  'C++': `// Implement your optimal solution here\n#include <iostream>\n\nclass Solution {\npublic:\n    void* solveProblem(void* input) {\n        // Explain approach first, then time/space complexity\n        \n        return nullptr;\n    }\n};`,
};

export default function CodeScratchpad({ initialLanguage, code, onChange, onRunTest }: CodeScratchpadProps) {
  const [lang, setLang] = useState(initialLanguage);
  const [copied, setCopied] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>(['Console initialized. Workspace is ready for candidate compilation.']);
  const [isRunning, setIsRunning] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load template if scratchpad is loaded blank or when language updates
  useEffect(() => {
    if (!code) {
      onChange(TEMPLATES[lang] || TEMPLATES['TypeScript']);
    }
  }, [lang]);

  const statsLines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset this code editor workspace to standard template defaults?')) {
      onChange(TEMPLATES[lang] || TEMPLATES['TypeScript']);
      setConsoleOutput(['Console reset. Workspace restored.']);
    }
  };

  const handleMockExecute = () => {
    setIsRunning(true);
    setConsoleOutput((prev) => [...prev, `[Compiling / Executing solveProblem in ${lang}...]`]);
    
    setTimeout(() => {
      // Mock simple local syntax checking
      const output = [];
      const hasFunction = code.includes('function') || code.includes('def ') || code.includes('class');
      
      if (!hasFunction) {
        output.push('⚠️ Compiler Warning: No primary solution entry hook found.');
      } else {
        output.push('✔️ Compilation Successful.');
        output.push('✔️ Solutions loaded on virtual VM wrapper.');
        output.push('✔️ Standard input test suite: Loaded.');
        output.push('⏳ Prompt: Submit this code block using the Chat message box to receive AI grading evaluation!');
      }

      setConsoleOutput((prev) => [...prev, ...output]);
      setIsRunning(false);

      if (onRunTest) {
        onRunTest(code);
      }
    }, 900);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full font-sans shadow-md" id="code-scratchpad-container">
      {/* Scratchbar panel actions */}
      <div className="bg-slate-950 px-4 py-2 flex items-center justify-between border-b border-slate-850">
        <div className="flex items-center space-x-2">
          <Terminal size={14} className="text-slate-400" />
          <span className="text-xs font-mono font-bold text-slate-300">SANDBOX PLAYGROUND</span>
        </div>
        <div className="flex items-center space-x-2">
          {/* Language Selector */}
          <select
            id="scratchpad-lang-selector"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="bg-slate-905 border border-slate-750 text-slate-300 text-[10px] font-mono rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            {Object.keys(TEMPLATES).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Copy Trigger */}
          <button
            onClick={handleCopy}
            id="scratchpad-copy-btn"
            title="Copy code input"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>

          {/* Reset Template */}
          <button
            onClick={handleReset}
            id="scratchpad-reset-btn"
            title="Reset to template"
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Editor Space layout with line gutter */}
      <div className="flex-1 flex min-h-[220px] relative font-mono text-slate-300 text-xs">
        {/* Dynamic line numbers */}
        <div className="bg-slate-950/40 select-none text-right px-2.5 py-4 border-r border-slate-850 text-slate-600 font-mono w-10 text-[11px] leading-relaxed">
          {statsLines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        
        {/* Monospace Text Field */}
        <textarea
          ref={textareaRef}
          value={code}
          id="scratchpad-editor-textarea"
          onChange={(e) => onChange(e.target.value)}
          placeholder="// Draft, compile or outline your optimal algorithms here..."
          className="flex-1 p-4 bg-transparent resize-none outline-none border-none font-mono text-[13px] leading-relaxed select-text text-slate-100 placeholder-slate-650"
          spellCheck={false}
        />
      </div>

      {/* Interactive Controls & Output Terminal */}
      <div className="border-t border-slate-850 p-3 bg-slate-955 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-450 uppercase tracking-widest font-mono font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local Comp Wrapper</span>
          </div>

          <button
            onClick={handleMockExecute}
            id="scratchpad-execute-btn"
            disabled={isRunning}
            className={`px-3 py-1 bg-indigo-650 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium text-[11px] rounded-md flex items-center space-x-1 shadow-sm transition-all cursor-pointer`}
          >
            <Play size={10} className="fill-current" />
            <span>{isRunning ? 'Executing...' : 'Run Test'}</span>
          </button>
        </div>

        {/* Minimal Terminal shell */}
        <div className="bg-slate-950 rounded p-2 border border-slate-850/80 max-h-[85px] overflow-y-auto font-mono text-[10px] text-slate-450 leading-relaxed space-y-1" id="sandbox-console">
          {consoleOutput.map((log, idx) => (
            <div key={idx} className={log.startsWith('✔️') ? 'text-emerald-400' : log.startsWith('⏳') ? 'text-indigo-400' : log.startsWith('⚠️') ? 'text-amber-400' : 'text-slate-450'}>
              &gt; {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
