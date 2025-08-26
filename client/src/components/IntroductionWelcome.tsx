import React from 'react';

interface IntroductionWelcomeProps {
  onContinue: () => void;
}

export default function IntroductionWelcome({ onContinue }: IntroductionWelcomeProps) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
      <div 
        className="max-w-4xl mx-auto rounded-2xl shadow-xl p-8 md:p-12 animate-fade-in"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div className="text-center mb-8">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Cultural Practices Survey
          </h1>
          <div 
            className="w-24 h-1 mx-auto rounded-full"
            style={{ background: 'var(--bg-progress-fill)' }}
          ></div>
        </div>

        <div className="prose prose-lg max-w-none text-custom-dark-brown space-y-6">
          <p className="text-xl text-center text-custom-olive mb-8">
            Help us understand the rich cultural diversity of India by sharing your knowledge about regional practices and traditions.
          </p>

          <div className="bg-custom-blue-gray border-l-4 border-custom-olive p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">About This Survey</h2>
            <p className="text-custom-dark-brown">
              This survey explores cultural commonsense - the everyday beliefs, behaviors, values, and practices 
              that are perceived as natural and widely shared within your cultural region. Your responses will 
              contribute to a comprehensive understanding of India's diverse cultural landscape.
            </p>
          </div>

          <div className="bg-custom-blue-gray-changed border-l-4 border-custom-brown p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">What to Expect</h2>
            <ul className="list-disc list-inside space-y-2 text-custom-dark-brown">
              <li>Questions about various aspects of cultural life in your region</li>
              <li>Estimated completion time: 2-3 hours (you can save and continue later)</li>
              <li>Your progress will be automatically saved as you go</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">Important Notes</h2>
            <ul className="list-disc list-inside space-y-2 text-custom-dark-brown">
              <li>All responses are anonymous and confidential</li>
              <li>Answer based on your personal knowledge and experience</li>
              <li>There are no right or wrong answers - we value your authentic perspective</li>
              <li>You can pause and resume the survey at any time</li>
              <li>If you're unfamiliar with a practice, you can specify "none" or explain what you do know</li>
              <li>Please provide thoughtful, detailed responses when possible</li>
            </ul>
          </div>

          
        </div>

        <div className="text-center mt-10">
          <button
            onClick={onContinue}
            className="font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            style={{ 
              background: 'var(--btn-primary-bg)',
              color: 'var(--text-on-dark)'
            }}
          >
            Continue to Survey Structure
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-custom-olive mt-4">
            By continuing, you agree to participate in this research study.
          </p>
        </div>
      </div>
    </div>
  );
}