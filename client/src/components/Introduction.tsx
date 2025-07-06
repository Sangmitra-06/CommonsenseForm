import React from 'react';

interface IntroductionProps {
  onStartNew: () => void;
  onResume: () => void;
  hasExistingSession: boolean;
}

export default function Introduction({ onStartNew, onResume, hasExistingSession }: IntroductionProps) {
  return (
    <div className="min-h-screen bg-custom-cream flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-custom-dark-brown mb-4">
            Cultural Practices Survey
          </h1>
          <div className="w-24 h-1 bg-custom-olive mx-auto rounded-full"></div>
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
                  We found your previous survey session. You can continue from where you left off 
                  or start a completely new survey.
                </p>
              </div>
            </div>
          </div>
        )}

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

          <div className="bg-custom-blue-gray border-l-4 border-custom-brown p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">What to Expect</h2>
            <ul className="list-disc list-inside space-y-2 text-custom-dark-brown">
              <li>Questions about various aspects of cultural life in your region</li>
              <li>Topics covering interpersonal relations, traditions, and social practices</li>
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
            </ul>
          </div>

          <div className="bg-custom-blue-gray border-l-4 border-custom-dark-olive p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-custom-dark-brown mb-4">Survey Structure</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-custom-brown">8</div>
                <div className="text-custom-dark-brown">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-custom-brown">18</div>
                <div className="text-custom-dark-brown">Subcategories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-custom-brown">39</div>
                <div className="text-custom-dark-brown">Topics</div>
              </div>
            </div>
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
                Begin Survey
              </button>
              <p className="text-sm text-custom-olive mt-4">
                By starting this survey, you agree to participate in this research study.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
