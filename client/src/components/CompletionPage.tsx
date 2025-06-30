import React, { useEffect } from 'react';
import { useForm } from '../context/FormContext.tsx';
import * as api from '../services/api.ts';

export default function CompletionPage() {
  const { state, calculateProgress } = useForm();
  const progress = calculateProgress();

  useEffect(() => {
    // Mark survey as completed in the database
    const markCompleted = async () => {
      if (state.sessionId) {
        try {
          await api.completeUser(state.sessionId);
        } catch (error) {
          console.error('Error marking survey as completed:', error);
        }
      }
    };

    markCompleted();
  }, [state.sessionId]);

  const stats = {
    totalQuestions: state.progress.totalQuestions,
    answeredQuestions: state.responses.size,
    completionRate: progress,
    timeSpent: state.lastSaveTime - state.startTime,
    categoriesCompleted: state.questionsData.length,
    topicsCompleted: 39 // This would be calculated based on actual completion
  };

  const formatTime = (milliseconds: number) => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8 md:p-12 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce-in">
            <span className="text-4xl">🎉</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Congratulations!
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            You have successfully completed the Cultural Practices Survey
          </p>
          
          <div className="w-32 h-1 bg-gradient-to-r from-green-500 to-blue-500 mx-auto rounded-full"></div>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.answeredQuestions}
            </div>
            <div className="text-blue-800 font-medium">Questions Answered</div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.completionRate.toFixed(1)}%
            </div>
            <div className="text-green-800 font-medium">Completion Rate</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {formatTime(stats.timeSpent)}
            </div>
            <div className="text-purple-800 font-medium">Time Invested</div>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">
            Thank You for Your Valuable Contribution!
          </h2>
          <div className="text-amber-700 space-y-4">
            <p>
              Your responses will contribute to a comprehensive understanding of India's rich cultural diversity. 
              The insights you've shared about cultural practices in your region are invaluable for research 
              and preservation of cultural knowledge.
            </p>
            <p>
              Your participation helps us document and understand the nuances of cultural commonsense across 
              different regions of India, contributing to anthropological and sociological research.
            </p>
          </div>
        </div>

        {/* Impact Statement */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-6 rounded-2xl border border-indigo-200">
            <h3 className="text-lg font-bold text-indigo-800 mb-3">Your Impact</h3>
            <ul className="text-indigo-700 space-y-2 text-sm">
              <li>• Contributed to cultural documentation efforts</li>
              <li>• Helped preserve regional knowledge</li>
              <li>• Supported academic research initiatives</li>
              <li>• Enhanced cross-cultural understanding</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-6 rounded-2xl border border-teal-200">
            <h3 className="text-lg font-bold text-teal-800 mb-3">What Happens Next</h3>
            <ul className="text-teal-700 space-y-2 text-sm">
              <li>• Your responses are securely stored</li>
              <li>• Data will be analyzed for research purposes</li>
              <li>• Findings may be published in academic journals</li>
              <li>• Results contribute to cultural studies</li>
            </ul>
          </div>
        </div>

        {/* Session Information */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Survey Summary</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Session ID:</strong> {state.sessionId}
            </div>
            <div>
              <strong>Region:</strong> {state.userInfo?.region} India
            </div>
            <div>
              <strong>Completion Date:</strong> {new Date().toLocaleDateString()}
            </div>
            <div>
              <strong>Total Categories:</strong> {stats.categoriesCompleted}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-3">Questions or Feedback?</h3>
          <p className="text-blue-700 mb-4">
            If you have any questions about this research or would like to learn more about the findings, 
            please don't hesitate to contact our research team.
          </p>
          <div className="text-sm text-blue-600">
            <p>Research Team: Cultural Studies Initiative</p>
            <p>Email: research@culturalsurvey.edu</p>
          </div>
        </div>

        {/* Final Thank You */}
        <div className="text-center mt-8">
          <p className="text-lg text-gray-600 font-medium">
            Thank you once again for your time and valuable insights!
          </p>
          <div className="mt-4 text-4xl animate-pulse-slow">
            🙏
          </div>
        </div>
      </div>
    </div>
  );
}