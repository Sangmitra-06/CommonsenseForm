import React from 'react';
import { useForm } from '../context/FormContext.tsx';

// In ProgressBar.tsx, update the progress display
export default function ProgressBar() {
  const { 
    state, 
    calculateProgress
  } = useForm();

  if (!state.questionsData || state.questionsData.length === 0) {
    return (
      <div 
        className="backdrop-blur-sm border-b px-6 py-3 sticky top-0 z-10 shadow-sm"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-light)'
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div 
              className="h-3 rounded mb-2"
              style={{ backgroundColor: 'var(--color-cream)' }}
            ></div>
            <div 
              className="h-2 rounded"
              style={{ backgroundColor: 'var(--color-blue-gray)' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const overallProgress = calculateProgress();
  
  // Filter out attention check responses for display
  const actualResponses = Array.from(state.responses.keys())
    .filter(questionId => !questionId.startsWith('ATTENTION_CHECK_'))
    .length;

  return (
    <div 
      className="backdrop-blur-sm border-b px-6 py-3 sticky top-0 z-10 shadow-sm"
      style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-light)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span 
              className="font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Survey Progress
            </span>
            <span 
              className="flex items-center text-xs"
              style={{ color: 'var(--text-primary)' }}
            >
              <span 
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {actualResponses}
              </span>
              <span className="mx-1">/</span>
              <span>{state.progress.totalQuestions}</span>
              <span className="ml-1">questions</span>
            </span>
          </div>
          <div 
            className="w-full rounded-full h-3 overflow-hidden"
            style={{ backgroundColor: 'var(--bg-progress)' }}
          >
            <div 
              className="h-3 rounded-full transition-all duration-700 ease-out"
              style={{ 
                background: 'var(--bg-progress-fill)',
                width: `${Math.min(overallProgress, 100)}%` 
              }}
            ></div>
          </div>
          <div 
            className="flex justify-between items-center text-xs mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>{overallProgress.toFixed(1)}% complete</span>
            <span>
              {state.progress.totalQuestions - actualResponses} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}