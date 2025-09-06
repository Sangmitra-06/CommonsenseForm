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
            Indian Cultural Practices Survey
          </h1>
          <div 
            className="w-24 h-1 mx-auto rounded-full"
            style={{ background: 'var(--bg-progress-fill)' }}
          ></div>
        </div>

        <div className="prose prose-lg max-w-none text-custom-dark-brown space-y-6">
          <p className="text-xl text-center text-custom-olive mb-8">
            Share your knowledge about the cultural practices and traditions from your region of India.
          </p>

          <div className="bg-custom-blue-gray border-l-4 border-custom-olive p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">What You'll Be Doing</h2>
            <p className="text-custom-dark-brown">
              You'll answer questions about everyday cultural practices in your region - things like greetings, 
              food customs, festivals, family traditions, and social behaviors that are common where you're from.
            </p>
          </div>

          <div className="bg-custom-blue-gray-changed border-l-4 border-custom-brown p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">Important Details</h2>
            <ul className="list-disc list-inside space-y-2 text-custom-dark-brown">
              <li><strong>This survey must be completed in one sitting</strong></li>
              <li>Focus on practices from your specific region (North, South, East, West, or Central India)</li>
              <li>Answer based on what you've personally observed or experienced</li>
              <li>Your progress is saved automatically as you go</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">Keep in Mind</h2>
            <ul className="list-disc list-inside space-y-2 text-custom-dark-brown">
              <li>All responses are anonymous and confidential</li>
              <li>There are no right or wrong answers - we want your authentic experience</li>
              <li>If you're unfamiliar with something, you can say so or explain what you do know</li>
              <li><strong>Quality matters</strong> - thoughtful, detailed responses are required for successful participation and full compensation</li>
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
            Continue to Response Guidelines
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