/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { Briefcase, Code, GraduationCap, ChevronRight, Sparkles } from 'lucide-react';

interface ProfileBuilderProps {
  onProfileComplete: (profile: UserProfile) => void;
}

const COMMON_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'SQL', 'Ruby'];
const COMMON_ROLES = ['Software Engineer', 'Backend Developer', 'Frontend Developer', 'Full Stack Developer', 'Data Engineer', 'Data Scientist', 'DevOps Engineer', 'System Architect'];

export default function ProfileBuilder({ onProfileComplete }: ProfileBuilderProps) {
  const [educationLevel, setEducationLevel] = useState("Bachelor's Degree in Computer Science");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['TypeScript', 'JavaScript']);
  const [customLanguage, setCustomLanguage] = useState('');
  const [targetRole, setTargetRole] = useState('Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState<'Beginner' | 'Junior' | 'Intermediate' | 'Advanced'>('Junior');

  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleAddCustomLanguage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customLanguage.trim();
    if (clean && !selectedLanguages.includes(clean)) {
      setSelectedLanguages([...selectedLanguages, clean]);
      setCustomLanguage('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalRole = isCustomRole ? (customRoleInput.trim() || 'Software Engineer') : targetRole;
    onProfileComplete({
      educationLevel,
      programmingLanguages: selectedLanguages,
      targetRole: finalRole,
      experienceLevel,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden"
        id="profile-builder-container"
      >
        {/* Header section with brand accent */}
        <div className="bg-slate-900 px-6 py-8 md:px-8 md:py-10 text-white relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-1/4 translate-x-1/4">
            <Sparkles size={240} className="text-white" />
          </div>
          <div className="flex items-center space-x-2 text-indigo-400 font-mono text-sm uppercase tracking-widest mb-1">
            <Sparkles size={16} />
            <span>Interactive Simulator</span>
          </div>
          <h1 className="text-3xl font-display font-medium tracking-tight text-white">
            Technical Interview Arena
          </h1>
          <p className="mt-2 text-slate-350 text-sm max-w-md leading-relaxed">
            Configure your technical persona. Our expert AI interviewer will conduct a 10-turn tailored session assessing code optimization, problem-solving speed, computer science fundamentals, and developer communication.
          </p>
        </div>

        {/* Configuration interactive form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8" id="profile-builder-form">
          {/* Target Role Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 font-medium text-slate-800">
              <Briefcase size={18} className="text-slate-550" />
              <label className="text-base font-display">Target Engineering Role</label>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_ROLES.map((role) => (
                <button
                  type="button"
                  key={role}
                  id={`role-chip-${role.replace(/\s+/g, '-').toLowerCase()}`}
                  onClick={() => {
                    setTargetRole(role);
                    setIsCustomRole(false);
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-lg text-left border transition-all ${
                    !isCustomRole && targetRole === role
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {role}
                </button>
              ))}
              <button
                type="button"
                id="role-chip-custom"
                onClick={() => setIsCustomRole(true)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg text-left border transition-all ${
                  isCustomRole
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Custom Role...
              </button>
            </div>

            {isCustomRole && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2"
              >
                <input
                  type="text"
                  placeholder="e.g. Senior Embedded Systems Engineer"
                  id="custom-role-input"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-950 focus:border-slate-950 bg-slate-50/50"
                  required={isCustomRole}
                />
              </motion.div>
            )}
          </div>

          {/* Programming Languages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-medium text-slate-800">
                <Code size={18} className="text-slate-550" />
                <label className="text-base font-display">Primary Programming Languages</label>
              </div>
              <span className="text-xs text-slate-500 font-mono">Select 1 or more</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 leading-relaxed">
              {COMMON_LANGUAGES.map((lang) => {
                const selected = selectedLanguages.includes(lang);
                return (
                  <button
                    type="button"
                    key={lang}
                    id={`lang-chip-${lang.toLowerCase()}`}
                    onClick={() => toggleLanguage(lang)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer font-mono ${
                      selected
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>

            {/* Custom Language field */}
            <div className="flex items-center gap-2 max-w-sm pt-1">
              <input
                type="text"
                placeholder="Add other language (e.g. Swift)"
                id="custom-lang-input"
                value={customLanguage}
                onChange={(e) => setCustomLanguage(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-950 transition-colors"
              />
              <button
                type="button"
                id="custom-lang-add-btn"
                onClick={handleAddCustomLanguage}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Education & Experience Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education Level */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 font-medium text-slate-800">
                <GraduationCap size={18} className="text-slate-550" />
                <label className="text-base font-display">Education Level</label>
              </div>
              <select
                id="select-education"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-950 transition-colors cursor-pointer"
              >
                <option value="Self-Taught Engineering Path">Self-Taught / Independent Study</option>
                <option value="Coding Bootcamp Graduate">Coding Education Bootcamp</option>
                <option value="Bachelor's Degree in Computer Science">Computer Science - Bachelor's Degree</option>
                <option value="Master's Degree in Computer Science">Computer Science - Master's Degree</option>
                <option value="PhD Candidate in Computer Science or related">PhD or Academic Research Track</option>
                <option value="Non-Traditional Engineering Background">Non-Traditional / Other Field Degree</option>
              </select>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2 font-medium text-slate-800">
                <Sparkles size={17} className="text-slate-550" />
                <label className="text-base font-display">Target Seniority Experience</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['Beginner', 'Junior', 'Intermediate', 'Advanced'] as const).map((level) => {
                  const labelLabels: Record<string, string> = {
                    Beginner: 'Entry / Apprentice',
                    Junior: 'Junior Indep (1-2 yrs)',
                    Intermediate: 'Mid-Level (3-5 yrs)',
                    Advanced: 'Senior / Staff (5+ yrs)'
                  };
                  return (
                    <button
                      type="button"
                      key={level}
                      id={`exp-chip-${level.toLowerCase()}`}
                      onClick={() => setExperienceLevel(level)}
                      className={`px-3 py-2 text-xs rounded-lg border transition-all text-left font-medium ${
                        experienceLevel === level
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {labelLabels[level]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Enter Arena Submission */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              id="start-interview-submit-btn"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 group cursor-pointer"
            >
              <span>Begin Technical Assessment</span>
              <ChevronRight size={18} className="transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
