import React, { useState } from 'react';
import { useForm } from '../context/FormContext.tsx';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTo: (categoryIndex: number, subcategoryIndex: number, topicIndex: number, questionIndex: number) => void;
}

export default function NavigationMenu({ isOpen, onClose, onNavigateTo }: NavigationMenuProps) {
  const { state } = useForm();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);
  const [expandedSubcategory, setExpandedSubcategory] = useState<string | null>(null);

  if (!isOpen) return null;

  const getTopicProgress = (categoryIndex: number, subcategoryIndex: number, topicIndex: number) => {
    const topic = state.questionsData[categoryIndex]?.subcategories[subcategoryIndex]?.topics[topicIndex];
    if (!topic) return { completed: 0, total: 0 };

    let completed = 0;
    topic.questions.forEach((_, questionIndex) => {
      const questionId = `${categoryIndex}-${subcategoryIndex}-${topicIndex}-${questionIndex}`;
      if (state.responses.has(questionId)) {
        completed++;
      }
    });

    return { completed, total: topic.questions.length };
  };

  const isCurrentLocation = (catIdx: number, subIdx: number, topIdx: number, qIdx: number) => {
    const pos = state.currentPosition;
    return pos.categoryIndex === catIdx && 
           pos.subcategoryIndex === subIdx && 
           pos.topicIndex === topIdx && 
           pos.questionIndex === qIdx;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        {/* Header */}
        <div 
          className="p-6 border-b"
          style={{ 
            backgroundColor: 'var(--bg-card-header)',
            borderColor: 'var(--border-light)'
          }}
        >
          <div className="flex justify-between items-center">
            <h2 
              className="text-2xl font-bold"
              style={{ color: 'var(--text-on-dark)' }}
            >
              📚 Survey Navigation
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
              style={{ color: 'var(--text-on-dark)' }}
            >
              ✕
            </button>
          </div>
          <p 
            className="text-sm mt-2"
            style={{ color: 'var(--text-on-dark)' }}
          >
            Navigate to any section. Your current position is highlighted.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {state.questionsData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-6">
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === categoryIndex ? null : categoryIndex)}
                className="w-full text-left p-4 rounded-lg border hover:shadow-md transition-all duration-200"
                style={{ 
                  backgroundColor: expandedCategory === categoryIndex ? 'var(--tag-category-bg)' : 'transparent',
                  borderColor: 'var(--border-light)'
                }}
              >
                <div className="flex justify-between items-center">
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {categoryIndex + 1}. {category.category}
                  </h3>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {expandedCategory === categoryIndex ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {/* Subcategories */}
              {expandedCategory === categoryIndex && (
                <div className="ml-4 mt-2 space-y-2">
                  {category.subcategories.map((subcategory, subcategoryIndex) => (
                    <div key={subcategoryIndex}>
                      {/* Subcategory Header */}
                      <button
                        onClick={() => {
                          const key = `${categoryIndex}-${subcategoryIndex}`;
                          setExpandedSubcategory(expandedSubcategory === key ? null : key);
                        }}
                        className="w-full text-left p-3 rounded-lg border hover:shadow-sm transition-all duration-200"
                        style={{ 
                          backgroundColor: expandedSubcategory === `${categoryIndex}-${subcategoryIndex}` ? 'var(--tag-subcategory-bg)' : 'transparent',
                          borderColor: 'var(--border-light)'
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <h4 
                            className="font-medium"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {subcategory.subcategory}
                          </h4>
                          <span 
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {expandedSubcategory === `${categoryIndex}-${subcategoryIndex}` ? '▼' : '▶'}
                          </span>
                        </div>
                      </button>

                      {/* Topics */}
                      {expandedSubcategory === `${categoryIndex}-${subcategoryIndex}` && (
                        <div className="ml-4 mt-2 space-y-1">
                          {subcategory.topics.map((topic, topicIndex) => {
                            const progress = getTopicProgress(categoryIndex, subcategoryIndex, topicIndex);
                            const isComplete = progress.completed === progress.total;
                            const hasStarted = progress.completed > 0;

                            return (
                              <button
                                key={topicIndex}
                                onClick={() => {
                                  onNavigateTo(categoryIndex, subcategoryIndex, topicIndex, 0);
                                  onClose();
                                }}
                                className="w-full text-left p-3 rounded-lg border hover:shadow-sm transition-all duration-200 group"
                                style={{ 
                                  backgroundColor: isCurrentLocation(categoryIndex, subcategoryIndex, topicIndex, state.currentPosition.questionIndex) 
                                    ? 'var(--accent-secondary)' 
                                    : 'transparent',
                                  borderColor: 'var(--border-light)'
                                }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <h5 
                                      className="font-medium text-sm"
                                      style={{ 
                                        color: isCurrentLocation(categoryIndex, subcategoryIndex, topicIndex, state.currentPosition.questionIndex) 
                                          ? 'var(--text-on-dark)' 
                                          : 'var(--text-primary)' 
                                      }}
                                    >
                                      {topic.topic}
                                    </h5>
                                    <div className="flex items-center mt-1">
                                      <div 
                                        className="h-1 bg-gray-200 rounded-full flex-1 mr-2"
                                        style={{ backgroundColor: 'var(--bg-progress)' }}
                                      >
                                        <div 
                                          className="h-1 rounded-full transition-all duration-300"
                                          style={{ 
                                            background: 'var(--bg-progress-fill)',
                                            width: `${(progress.completed / progress.total) * 100}%` 
                                          }}
                                        ></div>
                                      </div>
                                      <span 
                                        className="text-xs"
                                        style={{ 
                                          color: isCurrentLocation(categoryIndex, subcategoryIndex, topicIndex, state.currentPosition.questionIndex) 
                                            ? 'var(--text-on-dark)' 
                                            : 'var(--text-secondary)' 
                                        }}
                                      >
                                        {progress.completed}/{progress.total}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-3 flex items-center">
                                    {isComplete && <span className="text-green-500">✓</span>}
                                    {hasStarted && !isComplete && <span className="text-yellow-500">⋯</span>}
                                    {!hasStarted && <span className="text-gray-400">○</span>}
                                    {isCurrentLocation(categoryIndex, subcategoryIndex, topicIndex, state.currentPosition.questionIndex) && (
                                      <span 
                                        className="ml-2 text-xs font-bold"
                                        style={{ color: 'var(--text-on-dark)' }}
                                      >
                                        CURRENT
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div 
          className="p-4 border-t"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <div className="flex justify-between items-center text-sm">
            <span style={{ color: 'var(--text-secondary)' }}>
              Progress: {state.responses.size} / {state.progress.totalQuestions} questions completed
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
              style={{ 
                background: 'var(--btn-primary-bg)',
                color: 'var(--text-on-dark)'
              }}
            >
              Close Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}