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
            Understanding the Survey Structure
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
                  We found your previous survey session. You can continue from where you left off 
                  or start a completely new survey.
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
            This survey is organized into a hierarchical structure to comprehensively cover different aspects of cultural life.
          </p>

          <div 
            className="border-l-4 p-6 rounded-r-lg"
            style={{ 
              backgroundColor: 'var(--color-blue-gray-changed)',
              borderColor: 'var(--border-dark)'
            }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Categories
            </h2>
            <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
              <strong>Categories</strong> represent major areas of cultural life. Think of them as the main themes 
              that organize different aspects of culture.
            </p>
            <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
              Examples: "Interpersonal Relations," "Religious Practices," "Food and Cuisine," "Festivals and Celebrations"
            </p>
          </div>

          <div 
            className="border-l-4 p-6 rounded-r-lg"
            style={{ 
              backgroundColor: 'var(--tag-category-bg)',
              borderColor: 'var(--accent-success)'
            }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Subcategories
            </h2>
            <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
              Within each category, <strong>subcategories</strong> break down the main theme into more specific areas. 
              These help organize related cultural practices together.
            </p>
            <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
              Example: Within "Interpersonal Relations," you might find subcategories like "Visiting and Hospitality," 
              "Gift Giving," and "Social Etiquette"
            </p>
          </div>

          <div 
            className="border-l-4 p-6 rounded-r-lg"
            style={{ 
              backgroundColor: 'var(--color-cream)',
              borderColor: 'var(--border-dark)'
            }}
          >
            <h2 
              className="text-2xl font-semibold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              Topics
            </h2>
            <p className="mb-3" style={{ color: 'var(--text-secondary)' }}>
              <strong>Topics</strong> are the most specific level, focusing on particular aspects within each subcategory. 
              Each topic contains a set of related questions about that specific cultural practice.
            </p>
            <p className="text-sm italic" style={{ color: 'var(--text-secondary)' }}>
              Example: Within "Visiting and Hospitality," you might have topics like "Etiquette in Reception of Visitors" 
              and "Occasions for Visiting"
            </p>
          </div>

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
              How This Helps You
            </h2>
            <ul className="list-disc list-inside space-y-2" style={{ color: '#92400e' }}>
              <li><strong>Context:</strong> You'll always know what cultural area you're discussing</li>
              <li><strong>Navigation:</strong> You can jump between sections or return to previous topics</li>
              <li><strong>Completion:</strong> Celebrate your progress as you complete topics, subcategories, and categories</li>
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