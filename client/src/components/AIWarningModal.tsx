// components/AIWarningModal.tsx
import React from 'react';

interface AIWarningModalProps {
  onAccept: () => void;
}

export default function AIWarningModal({ onAccept }: AIWarningModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="max-w-md mx-auto rounded-xl shadow-2xl p-6 animate-scale-in"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: '2px solid #dc2626'
        }}
      >
        <div className="flex items-start mb-4">
          <div className="text-3xl mr-3">⚠️</div>
          <div>
            <h3 className="text-xl font-bold text-red-600 mb-2">
              AI Usage Prohibited
            </h3>
            <p className="text-custom-dark-brown text-sm leading-relaxed">
              The use of AI for this study in <strong>any form</strong> is strictly prohibited. 
              If traces of AI usage are detected, you will be reported to Prolific and your 
              compensation will be withheld.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded-r mb-4">
          <p className="text-sm text-custom-dark-brown">
            We need your authentic responses based on your personal knowledge and experiences.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onAccept}
            className="font-semibold py-2 px-6 rounded-lg text-base transition-all duration-200 hover:opacity-90"
            style={{ 
              background: 'var(--btn-primary-bg)',
              color: 'var(--text-on-dark)'
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}