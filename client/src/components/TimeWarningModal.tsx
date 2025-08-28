import React from 'react';
import { useForm } from '../context/FormContext.tsx';

interface TimeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TimeWarningModal({ isOpen, onClose }: TimeWarningModalProps) {
  const { state, formatTimeRemaining } = useForm();

  if (!isOpen) return null;

  const isCritical = state.showTimeCritical;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="max-w-md mx-auto rounded-2xl shadow-2xl p-6 animate-bounce-in"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: `2px solid ${isCritical ? 'var(--accent-error)' : 'var(--accent-warning)'}`
        }}
      >
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{isCritical ? '🚨' : '⚠️'}</div>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ 
              color: isCritical ? 'var(--accent-error)' : 'var(--accent-warning)' 
            }}
          >
            {isCritical ? 'Time Almost Up!' : 'Time Warning'}
          </h2>
          <div 
            className="text-3xl font-bold mb-2"
            style={{ 
              color: isCritical ? 'var(--accent-error)' : 'var(--accent-warning)' 
            }}
          >
            {formatTimeRemaining(state.surveyTimeRemaining)}
          </div>
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            remaining in this survey
          </p>
        </div>

        <div 
          className="p-4 rounded-xl mb-6"
          style={{ 
            background: isCritical ? 'rgba(239, 68, 68, 0.1)' : 'rgba(217, 119, 6, 0.1)',
            border: `1px solid ${isCritical ? '#fca5a5' : '#fcd34d'}`
          }}
        >
          <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
            {isCritical ? (
              <>
                <p className="font-medium mb-2">Your survey will automatically submit in {formatTimeRemaining(state.surveyTimeRemaining)}!</p>
                <ul className="text-xs space-y-1">
                  <li>• Save your current response immediately</li>
                  <li>• The survey will auto-submit when time expires</li>
                  <li>• Your progress will be preserved</li>
                </ul>
              </>
            ) : (
              <>
                <p className="font-medium mb-2">You have {formatTimeRemaining(state.surveyTimeRemaining)} left to complete the survey.</p>
                <ul className="text-xs space-y-1">
                  <li>• Consider providing shorter but complete answers</li>
                  <li>• Focus on the most important cultural practices</li>
                  <li>• Your progress is automatically saved</li>
                </ul>
              </>
            )}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 font-medium rounded-xl transition-all duration-200"
            style={{ 
              background: isCritical ? 'var(--accent-error)' : 'var(--accent-warning)',
              color: 'var(--text-on-dark)'
            }}
          >
            {isCritical ? 'Continue Quickly' : 'Continue Survey'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <p 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isCritical 
              ? 'Every response counts - even incomplete surveys provide valuable data!'
              : 'You\'re doing great! Focus on quality over quantity.'
            }
          </p>
        </div>
      </div>
    </div>
  );
}