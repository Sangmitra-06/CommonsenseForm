import React from 'react';

interface IntroductionStructureProps {
  onStartNew: () => void;
  onResume: () => void;
  hasExistingSession: boolean;
}

export default function IntroductionStructure({ onStartNew, onResume, hasExistingSession }: IntroductionStructureProps) {
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
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            How to Give Quality Responses
          </h1>
          <div 
            className="w-24 h-1 mx-auto rounded-full"
            style={{ background: 'var(--bg-progress-fill)' }}
          ></div>
        </div>

        {/* Resume Survey Alert */}
        {hasExistingSession && (
          <div className="bg-green-50 border-l-4 border-custom-olive p-6 rounded-r-lg mb-8 animate-bounce-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-custom-dark-brown mb-2">
                  Welcome Back!
                </h3>
                <p className="text-custom-olive">
                  We found your previous session. You can continue from where you left off 
                  or start fresh.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="prose prose-lg max-w-none space-y-6">
          <p 
            className="text-lg text-center mb-8"
            style={{ color: 'var(--text-secondary)' }}
          >
            Please note, quality responses are required for successful participation and full compensation. Here's what makes a quality response, using this sample question:
          </p>

          {/* Sample Question */}
<div 
  className="border-2 border-dashed p-6 rounded-lg text-center"
  style={{ 
    backgroundColor: 'var(--color-cream)',
    borderColor: 'var(--border-dark)'
  }}
>
  <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
    Sample Question:
  </h3>
  <p className="text-lg italic" style={{ color: 'var(--text-secondary)' }}>
    "In your region, what are two most common spices typically added to everyday staple dishes?"
  </p>
</div>

{/* Good Response */}
<div 
  className="border-l-4 p-6 rounded-r-lg"
  style={{ 
    backgroundColor: '#f0f9ff',
    borderColor: '#10b981'
  }}
>
  <h2 className="text-2xl font-semibold mb-4 flex items-center">
    <span className="text-2xl mr-2">✅</span>
    <span style={{ color: 'var(--text-primary)' }}>Quality Response Example</span>
  </h2>
  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
    <p className="text-custom-dark-brown italic mb-3">
      "In South India, we add turmeric and mustard seeds to almost all our daily dishes like sambar, rasam, and vegetable curries. These are the base spices you'll find in every household kitchen."
    </p>
  </div>
  <div className="mt-4">
    <h4 className="font-semibold text-green-700 mb-2">Why this works:</h4>
    <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
      <li>Specific regional information (South India)</li>
      <li>Provides exactly two spices as requested</li>
      <li>Shows personal knowledge of local cooking</li>
    </ul>
  </div>
</div>

{/* Bad Response */}
<div 
  className="border-l-4 p-6 rounded-r-lg"
  style={{ 
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444'
  }}
>
  <h2 className="text-2xl font-semibold mb-4 flex items-center">
    <span className="text-2xl mr-2">❌</span>
    <span style={{ color: 'var(--text-primary)' }}>Poor Response Examples</span>
  </h2>
  
  <div className="space-y-4">
    <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
      <p className="text-custom-dark-brown italic mb-2">
        "Turmeric is very common here"
      </p>
      <p className="text-sm text-red-600">Only mentions one spice when two were specifically requested</p>
    </div>

    <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
      <p className="text-custom-dark-brown italic mb-2">
        "I don't know what spices we use"
      </p>
      <p className="text-sm text-red-600">No attempt to share any knowledge or think about daily cooking</p>
    </div>

    <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
      <p className="text-custom-dark-brown italic mb-2">
        "I've seen that Indian food typically uses garam masala and curry powder from cooking shows and restaurants"
      </p>
      <p className="text-sm text-red-600">Drawing from external sources rather than personal regional experience</p>
    </div>

    <div className="bg-white p-4 rounded-lg border-l-4 border-red-500">
      <p className="text-custom-dark-brown italic mb-2">
        "Various spices are used in cooking throughout the region for flavoring purposes"
      </p>
      <p className="text-sm text-red-600">Too vague, no specific spices mentioned, no regional detail</p>
    </div>
  </div>
</div>

          {/* Tips */}
          <div 
            className="border-l-4 p-6 rounded-r-lg"
            style={{ 
              backgroundColor: 'var(--color-cream-changed)',
              borderColor: 'var(--accent-warning)'
            }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              💡 Quick Tips for Quality Responses
            </h2>
            <ul className="list-disc list-inside space-y-2" style={{ color: '#92400e' }}>
              <li><strong>Be specific about your region:</strong> North/South/East/West/Central India</li>
              <li><strong>Describe what you've seen:</strong> What actually happens in your community?</li>
              <li><strong>Include details:</strong> When, where, who, how it's done</li>
              <li><strong>Use local terms:</strong> Include words in your language with explanations</li>
              <li><strong>If unsure:</strong> Share what you do know rather than just saying "I don't know"</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center mt-10">
          {hasExistingSession ? (
            <div className="space-y-4">
              {/* Resume Button - Primary */}
              <div>
                <button
                  onClick={onResume}
                  className="bg-custom-olive hover:bg-custom-dark-olive text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  style={{ 
                    background: 'linear-gradient(to right, var(--color-olive), var(--color-dark-olive))',
                    backgroundImage: 'var(--btn-primary-bg)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundImage = 'var(--btn-primary-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundImage = 'var(--btn-primary-bg)';
                  }}
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🔄</span>
                    Resume Previous Survey
                  </span>
                </button>
                <p className="text-sm text-custom-olive mt-2">
                  Continue from where you left off
                </p>
              </div>
              
              {/* Start New Button - Secondary */}
              <div>
                <button
                  onClick={onStartNew}
                  className="bg-custom-blue-gray hover:bg-custom-brown text-custom-dark-brown font-medium py-3 px-6 rounded-lg text-base transition-all duration-200"
                  style={{ 
                    background: 'linear-gradient(to right, var(--color-blue-gray), var(--color-olive))',
                    backgroundImage: 'var(--btn-secondary-bg)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundImage = 'var(--btn-secondary-hover)';
                    e.currentTarget.style.color = 'var(--color-cream)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundImage = 'var(--btn-secondary-bg)';
                    e.currentTarget.style.color = 'var(--color-dark-brown)';
                  }}
                >
                  Start New Survey
                </button>
                <p className="text-sm text-custom-olive mt-2">
                  This will clear your previous progress
                </p>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={onStartNew}
                className="bg-custom-olive hover:bg-custom-dark-olive text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                style={{ 
                  background: 'linear-gradient(to right, var(--color-olive), var(--color-dark-olive))',
                  backgroundImage: 'var(--btn-primary-bg)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundImage = 'var(--btn-primary-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundImage = 'var(--btn-primary-bg)';
                }}
              >
                Start Survey
              </button>
              <p className="text-sm text-custom-olive mt-4">
                Ready to share your cultural knowledge!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}