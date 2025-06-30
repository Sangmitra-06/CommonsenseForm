import React, { useState } from 'react';
import { AttentionCheck } from '../types';

interface AttentionCheckProps {
  attentionCheck: AttentionCheck;
  onComplete: (correct: boolean) => void;
}

export default function AttentionCheckComponent({ attentionCheck, onComplete }: AttentionCheckProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === attentionCheck.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
    
    setTimeout(() => {
      onComplete(correct);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
            <span className="text-2xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Attention Check
          </h2>
          <p className="text-gray-600">
            Please answer this quick question to help us ensure data quality
          </p>
        </div>

        {!showResult ? (
          <div>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
              <h3 className="text-lg font-semibold text-amber-800 mb-4">
                {attentionCheck.question}
              </h3>
            </div>

            <div className="space-y-3 mb-8">
              {attentionCheck.options.map((option, index) => (
                <label
                  key={index}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="attention-check"
                    value={index}
                    checked={selectedAnswer === index}
                    onChange={() => setSelectedAnswer(index)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-200 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center animate-slide-in">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
              isCorrect ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className="text-3xl">
                {isCorrect ? '✅' : '❌'}
              </span>
            </div>
            
            <h3 className={`text-2xl font-bold mb-4 ${
              isCorrect ? 'text-green-800' : 'text-red-800'
            }`}>
              {isCorrect ? 'Correct!' : 'Not quite right'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {isCorrect 
                ? 'Great job staying focused! Continuing with the survey...'
                : 'No worries - this helps us improve our research. Continuing with the survey...'
              }
            </p>

            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-blue-600">Continuing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}