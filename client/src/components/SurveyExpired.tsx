import React, { useEffect, useState } from 'react';
import { useForm } from '../context/FormContext.tsx';

export default function SurveyExpired() {
  const { state } = useForm();
  const [responseCount, setResponseCount] = useState(0);

  useEffect(() => {
    setResponseCount(state.responses.size);
  }, [state.responses.size]);

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
      <div 
        className="max-w-2xl mx-auto rounded-2xl shadow-xl p-8 md:p-12 text-center animate-fade-in"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)'
        }}
      >
        {/* Icon */}
        <div className="text-8xl mb-6">⏰</div>
        
        {/* Title */}
        <h1 
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: 'var(--accent-error)' }}
        >
          Survey Time Expired
        </h1>
        
        {/* Subtitle */}
        <p 
          className="text-xl mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          Your 15-minute survey session has ended
        </p>

        {/* Progress Summary */}
        <div 
          className="p-6 rounded-xl mb-8"
          style={{ 
            background: 'linear-gradient(to right, var(--tag-category-bg), var(--tag-subcategory-bg))',
            border: '1px solid var(--border-light)'
          }}
        >
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Your Contribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div 
                className="text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {responseCount}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Questions Answered
              </div>
            </div>
            <div>
              <div 
                className="text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                15:00
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Time Spent
              </div>
            </div>
            <div>
              <div 
                className="text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                100%
              </div>
              <div 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Data Preserved
              </div>
            </div>
          </div>
        </div>

        {/* Thank you message */}
        <div 
          className="p-6 rounded-xl mb-8"
          style={{ 
            backgroundColor: 'var(--accent-success)',
            color: 'var(--text-on-dark)'
          }}
        >
          <h3 className="text-xl font-semibold mb-3">
            Thank You for Your Participation!
          </h3>
          <p className="leading-relaxed">
            Even though time ran out, your {responseCount} responses provide valuable insights 
            into India's cultural diversity. Every contribution helps preserve cultural knowledge 
            for future generations.
          </p>
        </div>

        {/* What happens next */}
        <div 
          className="text-left p-6 rounded-xl"
          style={{ 
            backgroundColor: 'rgba(110, 112, 73, 0.1)',
            border: '1px solid var(--border-light)'
          }}
        >
          <h3 
            className="text-lg font-semibold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            What Happens Next:
          </h3>
          <ul 
            className="space-y-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <li>Your responses have been automatically submitted</li>
            <li>All data has been securely saved</li>
            <li>Your contribution will be included in the research</li>
            <li>Your anonymity is fully protected</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            You may now close this window. Thank you for contributing to cultural research!
          </p>
        </div>
      </div>
    </div>
  );
}