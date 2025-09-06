import React from 'react';
import { useForm } from '../context/FormContext.tsx';

export default function SurveyTimer() {
  const { state, formatTimeElapsed } = useForm();

  // Don't show timer if survey hasn't started or is completed
  if (!state.surveyStartTime || state.isCompleted) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-40">
      <div 
        className="px-4 py-2 rounded-lg shadow-lg transition-all duration-200"
        style={{
          background: 'var(--btn-secondary-bg)',
          color: 'var(--text-on-dark)'
        }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">⏱️</span>
          <div>
            <div className="font-bold text-sm">
              {formatTimeElapsed(state.surveyTimeElapsed)}
            </div>
            <div className="text-xs opacity-90">
              Time elapsed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}