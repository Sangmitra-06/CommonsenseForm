import React, { useState } from 'react';
import { AttentionCheck } from '../types/index.ts';

interface AttentionCheckProps {
  attentionCheck: AttentionCheck;
  onComplete: (correct: boolean) => void;
}

export default function AttentionCheckComponent({ attentionCheck, onComplete }: AttentionCheckProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30 second timer

  React.useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (!showResult) {
      // Time's up, auto-submit with current selection or mark as incorrect
      handleSubmit(false);
    }
  }, [timeLeft, showResult]);

  React.useEffect(() => {
  console.log('AttentionCheck component mounted/updated', {
    selectedAnswer,
    showResult,
    timeLeft
  });
}, [selectedAnswer, showResult, timeLeft]);

  // Update the handleSubmit function with more logging
const handleSubmit = (skipTimeCheck: boolean = true) => {
  if (selectedAnswer === null && skipTimeCheck) {
    console.log('No answer selected, not submitting');
    return;
  }
  
  console.log('Submitting attention check:', { selectedAnswer, correctAnswer: attentionCheck.correctAnswer });
  
  const isCorrect = selectedAnswer === attentionCheck.correctAnswer;
  setShowResult(true);
  
  console.log('Attention check result:', isCorrect ? 'CORRECT' : 'INCORRECT');
  
  setTimeout(() => {
    console.log('Calling onComplete with result:', isCorrect);
    onComplete(isCorrect);
  }, isCorrect ? 1500 : 3000);
};

  const getEmoji = (type: string) => {
    switch (type) {
      case 'context': return '🎯';
      case 'comprehension': return '🧠';
      case 'personal': return '👤';
      case 'logical': return '🤔';
      case 'instruction': return '📋';
      default: return '✅';
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
      <div 
        className="max-w-2xl mx-auto rounded-3xl shadow-2xl p-8 animate-fade-in"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {!showResult ? (
          <>
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{getEmoji(attentionCheck.type || 'default')}</div>
              <h2 
                className="text-2xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                Quick Check
              </h2>
              <p 
                className="text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                Please answer this question to continue with the survey
              </p>
              
              {/* Timer */}
              <div className="mt-4">
                <div 
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    timeLeft > 10 ? 'bg-green-100 text-green-800' : 
                    timeLeft > 5 ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}
                >
                  ⏰ {timeLeft}s remaining
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="mb-8">
              <h3 
                className="text-lg font-semibold mb-6 leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
              >
                {attentionCheck.question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {attentionCheck.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedAnswer(index)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div 
                        className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          selectedAnswer === index
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedAnswer === index && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <span 
                        className="font-medium"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {option}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <button
                onClick={() => handleSubmit()}
                disabled={selectedAnswer === null}
                className="px-8 py-3 font-bold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ 
                  background: selectedAnswer !== null ? 'var(--btn-primary-bg)' : 'var(--btn-warning-bg)',
                  color: selectedAnswer !== null ? 'var(--text-on-dark)' : '#92400e'
                }}
              >
                {selectedAnswer !== null ? 'Submit Answer' : 'Please select an option'}
              </button>
            </div>
          </>
        ) : (
          /* Result Display */
          <div className="text-center animate-bounce-in">
            <div className="text-8xl mb-6">
              {selectedAnswer === attentionCheck.correctAnswer ? '✅' : '❌'}
            </div>
            <h2 
              className={`text-3xl font-bold mb-4 ${
                selectedAnswer === attentionCheck.correctAnswer ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {selectedAnswer === attentionCheck.correctAnswer ? 'Correct!' : 'Incorrect'}
            </h2>
            <p 
              className="text-lg mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              {selectedAnswer === attentionCheck.correctAnswer 
                ? "Great job! You're paying attention. Let's continue with the survey."
                : `The correct answer was: "${attentionCheck.options[attentionCheck.correctAnswer]}". Please stay focused as you continue.`
              }
            </p>
            <div 
              className="w-16 h-1 mx-auto rounded-full"
              style={{ background: 'var(--bg-progress-fill)' }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
}