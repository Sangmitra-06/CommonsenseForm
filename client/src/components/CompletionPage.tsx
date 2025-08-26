import React, { useEffect, useState } from 'react';
import { useForm } from '../context/FormContext.tsx';
import * as api from '../services/api.ts';

export default function CompletionPage() {
  const { state, calculateProgress } = useForm();
  const [actualTimeSpent, setActualTimeSpent] = useState<number>(0);
  const progress = calculateProgress();

  useEffect(() => {
    // Mark survey as completed in the database
    const markCompleted = async () => {
      if (state.sessionId) {
        try {
          await api.completeUser(state.sessionId);
        } catch (error) {
          console.error('Error marking survey as completed:', error);
        }
      }
    };

    // Calculate actual time spent from responses
    const calculateActualTime = () => {
      if (state.responses.size > 0) {
        const responses = Array.from(state.responses.values());
        
        // Method 1: Sum of individual question times
        const totalTimeFromResponses = responses.reduce((total, response) => {
          return total + (response.timeSpent || 0);
        }, 0);

        // Method 2: Calculate from start time to now (if available)
        const sessionDuration = state.startTime > 0 
          ? Math.floor((Date.now() - state.startTime) / 1000)
          : 0;

        // Method 3: Calculate from first response to last response
        const timestamps = responses
          .map(r => new Date(r.timestamp).getTime())
          .sort((a, b) => a - b);
        
        const firstResponseTime = timestamps[0];
        const lastResponseTime = timestamps[timestamps.length - 1];
        const responseSpanTime = firstResponseTime && lastResponseTime 
          ? Math.floor((lastResponseTime - firstResponseTime) / 1000)
          : 0;

        console.log('Time calculations:', {
          totalTimeFromResponses,
          sessionDuration,
          responseSpanTime,
          responseCount: responses.length
        });

        // Use the most reasonable time calculation
        // Usually responseSpanTime + some buffer is most accurate
        const estimatedTime = Math.max(
          totalTimeFromResponses,
          responseSpanTime,
          sessionDuration * 0.8 // Assume 80% of session time was active
        );

        setActualTimeSpent(estimatedTime);
      }
    };

    markCompleted();
    calculateActualTime();
  }, [state.sessionId, state.responses, state.startTime]);

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

  const stats = {
    totalQuestions: state.progress.totalQuestions,
    answeredQuestions: state.responses.size,
    completionRate: progress,
    timeSpent: actualTimeSpent,
    categoriesCompleted: state.questionsData.length,
    topicsCompleted: state.questionsData.reduce((total, category) => {
      return total + category.subcategories.reduce((subTotal, subcategory) => {
        return subTotal + subcategory.topics.length;
      }, 0);
    }, 0),
    averageTimePerQuestion: actualTimeSpent > 0 && state.responses.size > 0 
      ? Math.round(actualTimeSpent / state.responses.size) 
      : 0
  };

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
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 animate-bounce-in"
               style={{ backgroundColor: 'var(--accent-success)' }}>
            <span className="text-4xl">🎉</span>
          </div>
          
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
            You have successfully completed the Survey
          </p>
          
          <div 
            className="w-32 h-1 mx-auto rounded-full"
            style={{ background: 'var(--bg-progress-fill)' }}
          ></div>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
              background: 'var(--tag-subcategory-bg)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--tag-subcategory-text)' }}
            >
              {stats.completionRate.toFixed(1)}%
            </div>
            <div 
              className="font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Completion Rate
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
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--tag-category-text)' }}
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
              background: 'var(--tag-subcategory-bg)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div 
              className="text-3xl font-bold mb-2"
              style={{ color: 'var(--tag-subcategory-text)' }}
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

        {/* Session Information */}
        <div 
          className="border rounded-2xl p-6 mb-8"
          style={{ 
            backgroundColor: 'rgba(135, 144, 143, 0.1)',
            borderColor: 'var(--border-light)'
          }}
        >
          <h3 
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Survey Summary
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <div>
              <strong>Session ID:</strong> {state.sessionId}
            </div>
            <div>
              <strong>Region:</strong> {state.userInfo?.region} India
            </div>
            <div>
              <strong>Completion Date:</strong> {new Date().toLocaleDateString()}
            </div>
            <div>
              <strong>Total Categories:</strong> {stats.categoriesCompleted}
            </div>
            <div>
              <strong>Topics Covered:</strong> {stats.topicsCompleted}
            </div>
          </div>
        </div>

  

        


        {/* Final Thank You */}
        <div className="text-center mt-8">
          <p 
            className="text-lg font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Thank you once again for your time and valuable insights!
          </p>
        </div>
      </div>
    </div>
  );
}