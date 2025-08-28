import React from 'react';
import { useForm } from '../context/FormContext.tsx';

export default function SurveyTimer() {
  const { state, formatTimeRemaining } = useForm();

  if (state.surveyExpired) {
    return (
      <div className="fixed top-4 left-4 z-50">
        <div 
          className="px-4 py-2 rounded-lg shadow-lg animate-pulse"
          style={{ 
            background: 'var(--accent-error)',
            color: 'var(--text-on-dark)'
          }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-lg">⏰</span>
            <span className="font-bold text-sm">TIME EXPIRED</span>
          </div>
        </div>
      </div>
    );
  }

  if (!state.surveyStartTime || state.isCompleted) {
    return null;
  }

  const getTimerStyle = () => {
    if (state.showTimeCritical) {
      return {
        background: 'var(--accent-error)',
        color: 'var(--text-on-dark)',
        animation: 'pulse 1s infinite'
      };
    } else if (state.showTimeWarning) {
      return {
        background: 'var(--accent-warning)',
        color: '#92400e'
      };
    } else {
      return {
        background: 'var(--btn-secondary-bg)',
        color: 'var(--text-on-dark)'
      };
    }
  };

  const getTimerIcon = () => {
    if (state.showTimeCritical) return '🚨';
    if (state.showTimeWarning) return '⚠️';
    return '⏱️';
  };

  return (
    <div className="fixed top-4 left-4 z-40">
      <div 
        className="px-4 py-2 rounded-lg shadow-lg transition-all duration-200"
        style={getTimerStyle()}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getTimerIcon()}</span>
          <div>
            <div className="font-bold text-sm">
              {formatTimeRemaining(state.surveyTimeRemaining)}
            </div>
            <div className="text-xs opacity-90">
              {state.showTimeCritical ? 'HURRY!' : state.showTimeWarning ? 'Time running out' : 'Time remaining'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}