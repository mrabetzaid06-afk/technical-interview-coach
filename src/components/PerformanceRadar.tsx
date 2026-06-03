/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PerformanceStats } from '../types';
import { Award, Brain, Code2, MessageSquare, Terminal } from 'lucide-react';

interface PerformanceRadarProps {
  stats: PerformanceStats;
}

export default function PerformanceRadar({ stats }: PerformanceRadarProps) {
  const items = [
    {
      key: 'problemSolving',
      label: 'Problem Solving',
      value: stats.problemSolving,
      color: 'stroke-indigo-600 text-indigo-600 bg-indigo-50 border-indigo-100',
      fill: 'text-indigo-600',
      icon: Brain,
      desc: 'Analytical thinking, boundary handling, logic correctness',
    },
    {
      key: 'coding',
      label: 'Coding Ability',
      value: stats.coding,
      color: 'stroke-emerald-600 text-emerald-600 bg-emerald-50 border-emerald-100',
      fill: 'text-emerald-600',
      icon: Code2,
      desc: 'Language fluency, syntactical accuracy, neatness',
    },
    {
      key: 'communication',
      label: 'Developer Communication',
      value: stats.communication,
      color: 'stroke-amber-600 text-amber-600 bg-amber-50 border-amber-100',
      fill: 'text-amber-600',
      icon: MessageSquare,
      desc: 'Explaining trade-offs, conceptualizing approach, layout clarity',
    },
    {
      key: 'computerScience',
      label: 'CS Fundamentals',
      value: stats.computerScience,
      color: 'stroke-sky-600 text-sky-600 bg-sky-50 border-sky-100',
      fill: 'text-sky-600',
      icon: Terminal,
      desc: 'Big O analysis, system design depth, networking & databases',
    },
  ];

  // Calculate circular SVG parameters
  const size = 68;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-4 md:p-5 space-y-4 shadow-2xs font-sans" id="performance-tracker-container">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <Award size={18} className="text-slate-650" />
          <h3 className="text-sm font-semibold text-slate-800 font-display">Intelligence Metrix</h3>
        </div>
        <span className="text-[10px] bg-indigo-50 border border-indigo-100/50 text-indigo-700 font-mono px-2 py-0.5 rounded-full font-medium">
          Dyanmic Tracking
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const strokeDashoffset = circumference - (item.value / 100) * circumference;

          return (
            <div
              key={item.key}
              id={`metric-card-${item.key}`}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100/60 hover:border-slate-200 hover:bg-slate-50/50 transition-all group"
            >
              {/* Stat metadata */}
              <div className="space-y-1 pr-3 max-w-[70%]">
                <div className="flex items-center space-x-2">
                  <div className={`p-1.5 rounded-md border ${item.color.split(' ')[2]} ${item.color.split(' ')[3]}`}>
                    <Icon size={14} className={item.color.split(' ')[1]} />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 font-display group-hover:text-slate-900 transition-colors">
                    {item.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">
                  {item.desc}
                </p>
              </div>

              {/* Progress Ring */}
              <div className="relative flex items-center justify-center flex-shrink-0">
                <svg className="transform -rotate-90" width={size} height={size}>
                  {/* Track ring */}
                  <circle
                    className="stroke-slate-100 fill-transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                  />
                  {/* Dynamic value ring */}
                  <circle
                    className={`fill-transparent transition-all duration-700 ease-out ${item.color.split(' ')[0]}`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                  />
                </svg>
                {/* Score percentage counter */}
                <div className="absolute text-[11px] font-bold font-mono text-slate-800">
                  {item.value}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
