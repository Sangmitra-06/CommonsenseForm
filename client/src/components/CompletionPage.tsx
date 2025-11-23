import React, { useEffect, useState, useRef } from 'react';
import { useForm } from '../context/FormContext.tsx';
import * as api from '../services/api.ts';

interface CompletionPageProps {
  isAttentionCheckFailure?: boolean;
}

export default function CompletionPage({ isAttentionCheckFailure = false }: CompletionPageProps) {
  const { state, calculateProgress } = useForm();
  const [actualTimeSpent, setActualTimeSpent] = useState<number>(0);
  const [prolificCode, setProlificCode] = useState<string>('');
  const hasMarkedCompleted = useRef(false); // NEW: Prevent multiple API calls
  const progress = calculateProgress();

  // NEW: Prevent refresh/back button for attention check failures
  useEffect(() => {
    if (isAttentionCheckFailure) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Please do not refresh this page. Use the Prolific code to return the survey.';
        return 'Please do not refresh this page. Use the Prolific code to return the survey.';
      };

      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
      };

      // Prevent back button
      window.history.pushState(null, '', window.location.href);
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isAttentionCheckFailure]);

  useEffect(() => {
    // Generate Prolific completion code
    const generateProlificCode = () => {
      if (isAttentionCheckFailure) {
        // Specific code for attention check failures
        setProlificCode('C1J91I4U');
      } else {
        // Success completion code
        setProlificCode('C13F6JQB');
      }
    };

    // Mark survey as completed in the database - ONLY ONCE
    const markCompleted = async () => {
      if (state.sessionId && !hasMarkedCompleted.current) { // Check the ref
        try {
          hasMarkedCompleted.current = true; // Set immediately to prevent duplicates
          console.log('Marking survey as completed (once)');
          // Send completion reason
          const reason = isAttentionCheckFailure ? 'attention_check_failed' : 'completed';
          await api.completeUser(state.sessionId, reason);
        } catch (error) {
          console.error('Error marking survey as completed:', error);
          hasMarkedCompleted.current = false; // Reset on error
        }
      }
    };

    // Calculate actual time spent from timer
    const calculateActualTime = () => {
      if (state.surveyTimeElapsed > 0) {
        setActualTimeSpent(Math.floor(state.surveyTimeElapsed / 1000));
      } else if (state.responses.size > 0) {
        // Fallback to response-based calculation
        const responses = Array.from(state.responses.values());
        const totalTimeFromResponses = responses.reduce((total, response) => {
          return total + (response.timeSpent || 0);
        }, 0);
        setActualTimeSpent(totalTimeFromResponses);
      }
    };

    generateProlificCode();
    markCompleted();
    calculateActualTime();
  }, [state.sessionId, isAttentionCheckFailure]); // Removed dependencies that cause re-runs

  const formatTime = (seconds: number): string => {
    if (seconds === 0) return 'Less than a minute';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
    if (remainingSeconds > 0 && hours === 0) parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(prolificCode);
    alert('Prolific code copied to clipboard!');
  };

  // Fix the stats calculation in CompletionPage.tsx
const stats = {
  totalQuestions: state.progress.totalQuestions,
  // Filter out attention check responses
  answeredQuestions: Array.from(state.responses.keys())
    .filter(questionId => !questionId.startsWith('ATTENTION_CHECK_'))
    .length,
  completionRate: progress,
  timeSpent: actualTimeSpent,
  // Use actual question responses for average calculation
  averageTimePerQuestion: (() => {
    const actualQuestionResponses = Array.from(state.responses.values())
      .filter(response => !response.questionId.startsWith('ATTENTION_CHECK_'));
    return actualTimeSpent > 0 && actualQuestionResponses.length > 0 
      ? Math.round(actualTimeSpent / actualQuestionResponses.length) 
      : 0;
  })()
};

  if (isAttentionCheckFailure) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ 
          background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
        }}
      >
        <div 
          className="max-w-3xl mx-auto rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
                 style={{ backgroundColor: 'var(--accent-warning)' }}>
              <span className="text-4xl">⚠️</span>
            </div>
            
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: 'var(--accent-error)' }}
            >
              Survey Ended
            </h1>
            
            <p 
              className="text-xl mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              Attention Check Failed
            </p>
          </div>

          {/* Prolific Code - RED */}
          <div 
            className="border-2 rounded-2xl p-8 mb-8 text-center"
            style={{ 
              backgroundColor: '#ef4444', // Red background
              borderColor: '#dc2626'
            }}
          >
            <h2 
              className="text-2xl font-bold mb-4"
              style={{ color: 'white' }}
            >
              Please Return This Survey on Prolific
            </h2>
            <p 
              className="text-lg mb-4"
              style={{ color: 'white' }}
            >
              Use this code to return the survey:
            </p>
            <div 
              className="bg-white border-2 border-dashed rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-50"
              style={{ borderColor: '#ef4444' }} // Red dashed border
              onClick={copyToClipboard}
            >
              <span className="text-2xl font-mono font-bold text-gray-800">
                {prolificCode}
              </span>
            </div>
            <button
              onClick={copyToClipboard}
              className="px-6 py-2 bg-white font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: '#ef4444' }} // Red text on white button
            >
              📋 Copy Code
            </button>
          </div>

          {/* Explanation */}
          <div 
            className="border rounded-2xl p-6 mb-8"
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'var(--accent-error)'
            }}
          >
            <h3 
              className="text-lg font-bold mb-3"
              style={{ color: 'var(--accent-error)' }}
            >
              Why was the survey ended?
            </h3>
            <p 
              className="mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              The survey includes attention checks to ensure data quality. Unfortunately, your response to an attention check question did not meet the required criteria.
            </p>
            <p 
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Please use the code above to return this survey on Prolific. Thank you for your time.
            </p>
          </div>

          {/* Final Message */}
          <div className="text-center">
            <p 
              className="text-lg font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Thank you for your participation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
      <div 
        className="max-w-4xl mx-auto rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >

        {/* Header */}
        <div className="text-center mb-12">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Congratulations!
          </h1>
          
          <p 
            className="text-xl mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            You have successfully completed the Cultural Practices Survey
          </p>
          
          <div 
            className="w-32 h-1 mx-auto rounded-full"
            style={{ background: 'var(--bg-progress-fill)' }}
          ></div>
        </div>

        {/* Prolific Completion Code - GREEN */}
        <div 
          className="border-2 rounded-2xl p-8 mb-8 text-center"
          style={{ 
            backgroundColor: '#dbead7', // Green background
            borderColor: '#bad6b3'
          }}
        >
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: 'black' }}
          >
            🎉 Survey Complete! 🎉
          </h2>
          <p 
            className="text-lg mb-4"
            style={{ color: 'black' }}
          >
            Please copy this code and paste it into Prolific:
          </p>
          <div 
            className="bg-white border-2 border-dashed rounded-lg p-4 mb-4 cursor-pointer hover:bg-gray-50"
            style={{ borderColor: '#10b981' }} // Green dashed border
            onClick={copyToClipboard}
          >
            <span className="text-2xl font-mono font-bold text-gray-800">
              {prolificCode}
            </span>
          </div>
          <button
            onClick={copyToClipboard}
            className="px-6 py-2 bg-white font-semibold rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-#green-300"
            style={{ color: 'black' }} // Green text on white button
          >
            📋 Copy Code
          </button>
        </div>

        
        {/* Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div 
            className="p-6 rounded-2xl"
            style={{ 
              background: 'var(--tag-category-bg)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--tag-category-text)' }}
            >
              {stats.answeredQuestions}
            </div>
            <div 
              className="font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Questions Answered
            </div>
          </div>
          
          
          <div 
            className="p-6 rounded-2xl"
            style={{ 
              background: 'var(--color-blue-gray-changed)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div 
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--tag-subcategory-text)' }}
            >
              {formatTime(stats.timeSpent)}
            </div>
            <div 
              className="font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Time Invested
            </div>
          </div>
          
          <div 
            className="p-6 rounded-2xl"
            style={{ 
              background: 'var(--tag-category-bg)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--tag-category-text)' }}
            >
              {stats.averageTimePerQuestion}s
            </div>
            <div 
              className="font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Avg per Question
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div 
          className="border rounded-2xl p-8 mb-8"
          style={{ 
            background: 'var(--accent-success)',
            borderColor: 'var(--border-dark)'
          }}
        >
          <h2 
            className="text-2xl font-bold mb-4"
            style={{ color: 'var(--text-on-dark)' }}
          >
            Thank You for Your Valuable Contribution!
          </h2>
          <div 
            className="space-y-4"
            style={{ color: 'var(--text-on-dark)' }}
          >
            <p>
              Your responses will contribute to a comprehensive understanding of India's rich cultural diversity. 
              The insights you've shared about cultural practices in your region are invaluable for research 
              and preservation of cultural knowledge.
            </p>
          </div>
        </div>

        {/* Final Thank You */}
        <div className="text-center mt-8">
          <p 
            className="text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Don't forget to submit your Prolific code above! Thank you for your time and valuable insights!
          </p>
        </div>
      </div>
    </div>
  );
}