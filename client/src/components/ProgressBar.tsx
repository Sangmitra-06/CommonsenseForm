import React from 'react';
import { useForm } from '../context/FormContext.tsx';

export default function ProgressBar() {
  const { 
    state, 
    calculateProgress, 
    getTotalQuestionsInCurrentTopic, 
    getCompletedQuestionsInCurrentTopic 
  } = useForm();

  if (!state.questionsData || state.questionsData.length === 0) {
    return (
      <div 
        className="backdrop-blur-sm border-b px-6 py-3 sticky top-0 z-10 shadow-sm"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-light)'
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div 
              className="h-3 rounded mb-2"
              style={{ backgroundColor: 'var(--color-cream)' }}
            ></div>
            <div 
              className="h-2 rounded"
              style={{ backgroundColor: 'var(--color-blue-gray)' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const overallProgress = calculateProgress();
  const totalInTopic = getTotalQuestionsInCurrentTopic();
  const completedInTopic = getCompletedQuestionsInCurrentTopic();
  const topicProgress = totalInTopic > 0 ? (completedInTopic / totalInTopic) * 100 : 0;

  const { categoryIndex, subcategoryIndex, topicIndex, questionIndex } = state.currentPosition;
  
  const currentCategory = state.questionsData[categoryIndex] || null;
  const currentSubcategory = currentCategory?.subcategories[subcategoryIndex] || null;
  const currentTopic = currentSubcategory?.topics[topicIndex] || null;

  if (!currentCategory || !currentSubcategory || !currentTopic) {
    return (
      <div 
        className="backdrop-blur-sm border-b px-6 py-3 sticky top-0 z-10 shadow-sm"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-light)'
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div 
              className="h-3 rounded mb-2"
              style={{ backgroundColor: 'var(--color-cream)' }}
            ></div>
            <div 
              className="h-2 rounded"
              style={{ backgroundColor: 'var(--color-blue-gray)' }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestionNumber = questionIndex + 1;
  const totalQuestionsInTopic = currentTopic.questions.length;

  return (
    <div 
      className="backdrop-blur-sm border-b px-6 py-3 sticky top-0 z-10 shadow-sm"
      style={{ 
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border-light)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div 
          className="text-sm mb-2 flex flex-wrap items-center"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span 
            className="font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            {currentCategory.category}
          </span>
          <span 
            className="mx-2"
            style={{ color: 'var(--text-muted)' }}
          >
            →
          </span>
          <span 
            className="font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {currentSubcategory.subcategory}
          </span>
          <span 
            className="mx-2"
            style={{ color: 'var(--text-muted)' }}
          >
            →
          </span>
          <span 
            className="font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            {currentTopic.topic}
          </span>
          <span 
            className="ml-auto text-xs px-2 py-1 rounded-full border"
            style={{ 
              backgroundColor: 'var(--bg-progress)',
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-light)'
            }}
          >
            Question {currentQuestionNumber} of {totalQuestionsInTopic}
          </span>
        </div>

        {/* Overall Survey Progress */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span 
              className="font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              Overall Progress
            </span>
            <span 
              className="flex items-center text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span 
                className="font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {state.responses.size}
              </span>
              <span className="mx-1">/</span>
              <span>{state.progress.totalQuestions}</span>
              <span className="ml-1">questions</span>
            </span>
          </div>
          <div 
            className="w-full rounded-full h-2 overflow-hidden"
            style={{ backgroundColor: 'var(--bg-progress)' }}
          >
            <div 
              className="h-2 rounded-full transition-all duration-700 ease-out"
              style={{ 
                background: 'var(--bg-progress-fill)',
                width: `${Math.min(overallProgress, 100)}%` 
              }}
            ></div>
          </div>
          <div 
            className="flex justify-between items-center text-xs mt-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>{overallProgress.toFixed(1)}% complete</span>
            <span>
              {state.progress.totalQuestions - state.responses.size} remaining
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}