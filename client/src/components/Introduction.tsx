import React from 'react';

interface IntroductionProps {
  onStartNew: () => void;
  onResume: () => void;
  hasExistingSession: boolean;
}

export default function Introduction({ onStartNew, onResume, hasExistingSession }: IntroductionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Cultural Practices Survey
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 mx-auto rounded-full"></div>
        </div>

        {/* Resume Survey Alert */}
        {hasExistingSession && (
          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg mb-8 animate-bounce-in">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Welcome Back!
                </h3>
                <p className="text-green-700">
                  We found your previous survey session. You can continue from where you left off 
                  or start a completely new survey.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <p className="text-xl text-center text-gray-600 mb-8">
            Help us understand the rich cultural diversity of India by sharing your knowledge about regional practices and traditions.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">About This Survey</h2>
            <p>
              This survey explores cultural commonsense - the everyday beliefs, behaviors, values, and practices 
              that are perceived as natural and widely shared within your cultural region. Your responses will 
              contribute to a comprehensive understanding of India's diverse cultural landscape.
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-green-800 mb-4">What to Expect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Questions about various aspects of cultural life in your region</li>
              <li>Topics covering interpersonal relations, traditions, and social practices</li>
              <li>Estimated completion time: 2-3 hours (you can save and continue later)</li>
              <li>Your progress will be automatically saved as you go</li>
            </ul>
          </div>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-amber-800 mb-4">Important Notes</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>All responses are anonymous and confidential</li>
              <li>Answer based on your personal knowledge and experience</li>
              <li>There are no right or wrong answers - we value your authentic perspective</li>
              <li>You can pause and resume the survey at any time</li>
            </ul>
          </div>

          <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-r-lg">
            <h2 className="text-2xl font-semibold text-purple-800 mb-4">Survey Structure</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">8</div>
                <div>Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">18</div>
                <div>Subcategories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">39</div>
                <div>Topics</div>
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
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🔄</span>
                    Resume Previous Survey
                  </span>
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Continue from where you left off
                </p>
              </div>
              
              {/* Start New Button - Secondary */}
              <div>
                <button
                  onClick={onStartNew}
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-medium py-3 px-6 rounded-lg text-base transition-all duration-200"
                >
                  Start New Survey
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  This will clear your previous progress
                </p>
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={onStartNew}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Begin Survey
              </button>
              <p className="text-sm text-gray-500 mt-4">
                By starting this survey, you agree to participate in this research study.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}