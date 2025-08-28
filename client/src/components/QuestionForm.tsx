import React, { useState, useEffect, useRef } from 'react';
import { useForm } from '../context/FormContext.tsx';
import { validateAnswer, shouldShowAttentionCheck, generateAttentionCheck, analyzeResponseQuality, analyzeUserPattern } from '../utils/helpers.ts';
import ProgressBar from './ProgressBar.tsx';
import NavigationMenu from './NavigationMenu.tsx';
import QualityWarningModal from './QualityWarningModel.tsx';
import SurveyTimer from './SurveyTimer.tsx';
import TimeWarningModal from './TimeWarningModal.tsx';
import * as api from '../services/api.ts';

export default function QuestionForm() {
  const {
    state,
    saveResponse,
    navigateToNext,
    navigateToPrevious,
    getCurrentQuestionData,
    getTotalQuestionsInCurrentTopic,
    getCompletedQuestionsInCurrentTopic,
    resetSession,
    navigateToPosition
  } = useForm();

  // Basic form state
  const [answer, setAnswer] = useState('');
  const [errors, setErrors] = useState<{ answer?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastQuestionId, setLastQuestionId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'previous' | null>(null);
  const [showNavigationMenu, setShowNavigationMenu] = useState(false);

  // Time warning modal state
  const [showTimeWarningModal, setShowTimeWarningModal] = useState(false);
  const [hasShownTimeWarning, setHasShownTimeWarning] = useState(false);
  const [hasShownTimeCritical, setHasShownTimeCritical] = useState(false);

  // Attention check state
  const [isAttentionCheck, setIsAttentionCheck] = useState(false);
  const [attentionCheck, setAttentionCheck] = useState<any>(null);
  const [lastAttentionCheckAt, setLastAttentionCheckAt] = useState<number>(-1);
  const [attentionChecksPassed, setAttentionChecksPassed] = useState(0);
  const [attentionChecksFailed, setAttentionChecksFailed] = useState(0);

  // Quality tracking state
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [lastQualityAlertAt, setLastQualityAlertAt] = useState<number>(-1);
  const [hasShownQualityAlert, setHasShownQualityAlert] = useState(false);
  const [currentQualityIssue, setCurrentQualityIssue] = useState<{
    type: string | null;
    noneRate: number;
    gibberishRate: number;
    speedRate: number;
  }>({ type: null, noneRate: 0, gibberishRate: 0, speedRate: 0 });

  // Celebration state
  const [showCelebration, setShowCelebration] = useState<{type: string, data: any} | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentQuestionData = getCurrentQuestionData();

  // Handle time warning modals
  useEffect(() => {
    if (state.showTimeWarning && !hasShownTimeWarning) {
      setShowTimeWarningModal(true);
      setHasShownTimeWarning(true);
    } else if (state.showTimeCritical && !hasShownTimeCritical) {
      setShowTimeWarningModal(true);
      setHasShownTimeCritical(true);
    }
    
    // Reset warning flags when time status changes
    if (!state.showTimeWarning && !state.showTimeCritical) {
      setHasShownTimeWarning(false);
      setHasShownTimeCritical(false);
    }
  }, [state.showTimeWarning, state.showTimeCritical, hasShownTimeWarning, hasShownTimeCritical]);

  // Check if this should be an attention check (every 7 questions)
useEffect(() => {
  const totalResponses = state.responses.size;
  
  console.log('Attention check logic:', {
    totalResponses,
    lastAttentionCheckAt,
    shouldShow: shouldShowAttentionCheck(totalResponses),
    currentQuestionId: currentQuestionData?.questionId
  });
  
  // Don't show if we haven't moved to a new response count
  if (lastAttentionCheckAt === totalResponses) {
    console.log('Already shown attention check for this response count');
    return;
  }
  
  if (shouldShowAttentionCheck(totalResponses) && currentQuestionData) {
    console.log('SHOWING ATTENTION CHECK at response count:', totalResponses);
    
    const check = generateAttentionCheck(
      currentQuestionData.category,
      currentQuestionData.topic,
      state.userInfo || undefined
    );
    
    setAttentionCheck(check);
    setIsAttentionCheck(true);
    setLastAttentionCheckAt(totalResponses);
    setAnswer(''); // Clear any existing answer
  } else {
    // IMPORTANT: Reset attention check state when we shouldn't show one
    console.log('NOT showing attention check, resetting state');
    setIsAttentionCheck(false);
    setAttentionCheck(null);
  }
}, [state.responses.size, lastAttentionCheckAt, currentQuestionData?.questionId]);


// Add a separate effect to handle attention check completion
useEffect(() => {
  // Reset attention check state when moving to a new question that shouldn't be an attention check
  if (currentQuestionData && !shouldShowAttentionCheck(state.responses.size)) {
    if (isAttentionCheck) {
      console.log('Resetting attention check state for new question');
      setIsAttentionCheck(false);
      setAttentionCheck(null);
    }
  }
}, [currentQuestionData?.questionId, state.responses.size, isAttentionCheck]);

  // Reset form when question changes
  useEffect(() => {
    if (currentQuestionData && currentQuestionData.questionId !== lastQuestionId) {
      console.log('Question changed, loading data for:', currentQuestionData.questionId);
      
      setErrors({});
      setShowSuccess(false);
      setStartTime(Date.now());
      setLastQuestionId(currentQuestionData.questionId);
      setIsNavigating(false);
      setNavigationDirection(null);
      setQualityWarnings([]);
      
      if (!isAttentionCheck) {
        const existingResponse = state.responses.get(currentQuestionData.questionId);
        if (existingResponse) {
          console.log('Found existing response:', existingResponse);
          setAnswer(existingResponse.answer);
        } else {
          console.log('No existing response, clearing form');
          setAnswer('');
        }
      } else {
        setAnswer('');
      }
    }
  }, [currentQuestionData?.questionId, lastQuestionId, state.responses, isAttentionCheck]);

  // Quality check logic (skip for attention checks)
  useEffect(() => {
    const totalResponses = state.responses.size;
    
    if (totalResponses < 5 || showQualityModal || isAttentionCheck) return;

    const allResponses = Array.from(state.responses.values());
    const analysisData = allResponses.map(r => ({ answer: r.answer, timeSpent: r.timeSpent }));
    const patternAnalysis = analyzeUserPattern(analysisData);
    
    if (patternAnalysis.suspiciousPattern && !hasShownQualityAlert) {
      console.log('SHOWING QUALITY ALERT: First detection at', totalResponses);
      setShowQualityModal(true);
      setLastQualityAlertAt(totalResponses);
      setHasShownQualityAlert(true);
      setQualityWarnings(patternAnalysis.warnings);
      setCurrentQualityIssue({
        type: patternAnalysis.issueType,
        noneRate: patternAnalysis.noneResponseRate,
        gibberishRate: patternAnalysis.gibberishResponseRate,
        speedRate: patternAnalysis.fastResponseRate
      });
    }
    else if (patternAnalysis.suspiciousPattern && 
             hasShownQualityAlert && 
             lastQualityAlertAt > 0 && 
             (totalResponses - lastQualityAlertAt) >= 5) {
      console.log('SHOWING QUALITY ALERT: Persistent issue after 5 responses');
      setShowQualityModal(true);
      setLastQualityAlertAt(totalResponses);
      setQualityWarnings(patternAnalysis.warnings);
      setCurrentQualityIssue({
        type: patternAnalysis.issueType,
        noneRate: patternAnalysis.noneResponseRate,
        gibberishRate: patternAnalysis.gibberishResponseRate,
        speedRate: patternAnalysis.fastResponseRate
      });
    }
  }, [state.responses.size, showQualityModal, hasShownQualityAlert, lastQualityAlertAt, isAttentionCheck]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [answer]);

  const validateForm = () => {
    const newErrors: { answer?: string } = {};
    
    const answerValidation = validateAnswer(answer);
    if (!answerValidation.isValid) {
      newErrors.answer = answerValidation.message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setAnswer(newValue);
    
    if (errors.answer) {
      setErrors(prev => ({ ...prev, answer: undefined }));
    }

    // Real-time quality feedback for current response only (skip for attention checks)
    if (newValue.length > 5 && !isAttentionCheck) {
      const qualityAnalysis = analyzeResponseQuality(newValue);
      if (qualityAnalysis.isLowQuality) {
        setQualityWarnings(qualityAnalysis.issues);
      } else {
        setQualityWarnings([]);
      }
    } else {
      setQualityWarnings([]);
    }
  };

  const handleClear = () => {
    setAnswer('');
    setErrors({});
    setShowSuccess(false);
    setQualityWarnings([]);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const checkForMilestones = () => {
    const { categoryIndex, subcategoryIndex, topicIndex, questionIndex } = state.currentPosition;
    const currentCategory = state.questionsData[categoryIndex];
    const currentSubcategory = currentCategory?.subcategories[subcategoryIndex];
    const currentTopic = currentSubcategory?.topics[topicIndex];
    
    if (!currentTopic) return null;

    if (questionIndex === currentTopic.questions.length - 1) {
      if (topicIndex === currentSubcategory.topics.length - 1) {
        if (subcategoryIndex === currentCategory.subcategories.length - 1) {
          return {
            type: 'category',
            name: currentCategory.category,
            subcategoryName: currentSubcategory.subcategory,
            topicName: currentTopic.topic
          };
        }
        return {
          type: 'subcategory',
          name: currentSubcategory.subcategory,
          topicName: currentTopic.topic,
          categoryName: currentCategory.category
        };
      }
      return {
        type: 'topic',
        name: currentTopic.topic,
        subcategoryName: currentSubcategory.subcategory,
        categoryName: currentCategory.category
      };
    }
    return null;
  };

  const updateAttentionCheckStats = async () => {
    if (state.sessionId) {
      try {
        await api.updateUserProgress(state.sessionId, {
          attentionChecksPassed,
          attentionChecksFailed,
          completedQuestions: state.responses.size
        });
        console.log('Updated attention check stats:', { attentionChecksPassed, attentionChecksFailed });
      } catch (error) {
        console.error('Failed to update attention check stats:', error);
      }
    }
  };

  // Just save the response, no automatic validation for attention checks
  const performSave = async (qualityAnalysis?: any) => {
  if (!currentQuestionData || !state.sessionId) {
    console.error('Missing required data for save');
    return false;
  }

  // For attention checks, we'll create a special question ID to identify them
  const questionId = isAttentionCheck 
    ? `ATTENTION_CHECK_${state.responses.size}_${currentQuestionData.questionId}`
    : currentQuestionData.questionId;

  const questionText = isAttentionCheck 
    ? attentionCheck.question 
    : currentQuestionData.question;

  if (!qualityAnalysis) {
    qualityAnalysis = analyzeResponseQuality(answer);
  }

  setIsSaving(true);
  
  try {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    
    const response = {
      sessionId: state.sessionId,
      questionId: questionId,
      categoryIndex: state.currentPosition.categoryIndex,
      subcategoryIndex: state.currentPosition.subcategoryIndex,
      topicIndex: state.currentPosition.topicIndex,
      questionIndex: state.currentPosition.questionIndex,
      category: currentQuestionData.category,
      subcategory: currentQuestionData.subcategory,
      topic: currentQuestionData.topic,
      question: questionText,
      answer: answer.trim(),
      timeSpent,
      timestamp: new Date().toISOString(),
      qualityScore: qualityAnalysis.score,
      // Add metadata for attention checks
      isAttentionCheck: isAttentionCheck,
      attentionCheckType: isAttentionCheck ? attentionCheck.type : undefined,
      expectedAnswer: isAttentionCheck ? attentionCheck.expectedAnswer : undefined
    };

    console.log('Saving response:', {
      questionId,
      isAttentionCheck,
      answer: answer.substring(0, 50) + '...',
      totalResponses: state.responses.size
    });

    await saveResponse(response);
    await updateAttentionCheckStats();
    
    // IMPORTANT: Reset attention check state after saving
    if (isAttentionCheck) {
      console.log('Attention check response saved, resetting state');
      setIsAttentionCheck(false);
      setAttentionCheck(null);
    }
    
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
    return true;
    
  } catch (error) {
    console.error('SAVE ERROR:', error);
    throw error;
  } finally {
    setIsSaving(false);
  }
};



  const handleSave = async () => {
    if (!validateForm() || !currentQuestionData || !state.sessionId) {
      console.log('Validation failed:', errors);
      return false;
    }

    try {
      const qualityAnalysis = analyzeResponseQuality(answer);
      return await performSave(qualityAnalysis);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save response. Please try again.');
      return false;
    }
  };

  const handleNext = async () => {
    const isValid = validateForm();
    if (!isValid) {
      console.log('Form validation failed, cannot proceed');
      return;
    }

    try {
      const saveSuccessful = await handleSave();
      
      if (saveSuccessful && isValid) {
        const milestone = checkForMilestones();
        
        setNavigationDirection('next');
        setIsNavigating(true);
        
        setTimeout(() => {
          navigateToNext();
          
          if (milestone && !isAttentionCheck) {
            setShowCelebration({type: milestone.type, data: milestone});
          }
        }, 300);
      }
    } catch (error) {
      console.error('Next navigation failed:', error);
    }
  };

  const handlePrevious = () => {
    setNavigationDirection('previous');
    setIsNavigating(true);
    
    setTimeout(() => {
      navigateToPrevious();
    }, 300);
  };

  const handleSkip = () => {
    if (isAttentionCheck) return; // Don't allow skipping attention checks
    
    setAnswer('');
    setErrors({});
    
    setNavigationDirection('next');
    setIsNavigating(true);
    
    setTimeout(() => {
      navigateToNext();
    }, 300);
  };

  const handleNavigateToQuestion = async (categoryIndex: number, subcategoryIndex: number, topicIndex: number, questionIndex: number) => {
    const isValid = validateForm();
    if (isValid && answer.trim()) {
      console.log('QuestionForm: Saving current response before navigation');
      try {
        await handleSave();
      } catch (error) {
        console.error('Failed to save before navigation:', error);
      }
    }
    
    console.log('QuestionForm: Navigating to:', categoryIndex, subcategoryIndex, topicIndex, questionIndex);
    await navigateToPosition(categoryIndex, subcategoryIndex, topicIndex, questionIndex);
  };

  const handleQualityModalClose = () => {
    console.log('Quality modal closed - user will improve response');
    setShowQualityModal(false);
    
    setAnswer('');
    setErrors({});
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const closeCelebration = () => {
    setShowCelebration(null);
  };

  if (!currentQuestionData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  // If survey has expired, don't render the question form
  if (state.surveyExpired) {
    return null; // App.tsx will handle showing SurveyExpired component
  }

  const topicProgress = getTotalQuestionsInCurrentTopic();
  const completedInTopic = getCompletedQuestionsInCurrentTopic();
  const currentQuestionInTopic = state.currentPosition.questionIndex + 1;
  const isFirstQuestion = state.currentPosition.categoryIndex === 0 && 
                         state.currentPosition.subcategoryIndex === 0 && 
                         state.currentPosition.topicIndex === 0 && 
                         state.currentPosition.questionIndex === 0;

  const isFormValid = answer.trim().length >= 4;

  // For attention checks, use the attention check question, but make it look like a regular question
  const displayQuestionData = isAttentionCheck 
    ? {
        topic: currentQuestionData.topic,
        category: currentQuestionData.category,
        subcategory: currentQuestionData.subcategory,
        question: attentionCheck.question
      }
    : currentQuestionData;

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
      {/* Timer Components */}
      <SurveyTimer />
      <TimeWarningModal 
        isOpen={showTimeWarningModal}
        onClose={() => setShowTimeWarningModal(false)}
      />
      
      <ProgressBar />
      
      {/* Menu Button */}
      <div className="fixed top-20 right-6 z-40">
        <button
          onClick={() => setShowNavigationMenu(true)}
          className="p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          style={{ 
            background: 'var(--btn-primary-bg)',
            color: 'var(--text-on-dark)'
          }}
          title="Navigation Menu"
        >
          <span className="text-xl">📋</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <NavigationMenu 
        isOpen={showNavigationMenu}
        onClose={() => setShowNavigationMenu(false)}
        onNavigateTo={handleNavigateToQuestion}
      />

      {/* Quality Warning Modal (not shown for attention checks) */}
      {!isAttentionCheck && (
        <QualityWarningModal
          isOpen={showQualityModal}
          onClose={handleQualityModalClose}
          qualityIssues={qualityWarnings}
          issueType={currentQualityIssue.type}
          noneResponseRate={currentQualityIssue.noneRate}
          gibberishResponseRate={currentQualityIssue.gibberishRate}
          fastResponseRate={currentQualityIssue.speedRate}
        />
      )}
      
      {/* Celebration Modal */}
      {showCelebration && (
        <CelebrationModal 
          celebration={showCelebration} 
          onClose={closeCelebration}
        />
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Question Card Container */}
        <div className="relative overflow-hidden">
          <div className={`transform transition-all duration-500 ease-in-out ${
            isNavigating 
              ? navigationDirection === 'next' 
                ? '-translate-x-full opacity-0'
                : 'translate-x-full opacity-0'
              : 'translate-x-0 opacity-100'
          }`}>
            
            {/* Topic Header Card */}
            <div 
              className="backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div className="text-center mb-4">
                <div 
                  className="inline-flex items-center px-4 py-2 text-white rounded-full text-sm font-medium mb-4 shadow-sm"
                  style={{ 
                    background: 'var(--btn-primary-bg)' 
                  }}
                >
                  Question {currentQuestionInTopic} of {topicProgress}
                </div>
                
                <h1 
                  className="text-2xl md:text-3xl font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayQuestionData.topic}
                </h1>
                
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <span 
                    className="px-3 py-1 rounded-full font-medium"
                    style={{ 
                      backgroundColor: 'var(--tag-category-bg)',
                      color: 'var(--tag-category-text)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    {displayQuestionData.category}
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span 
                    className="px-3 py-1 rounded-full font-medium"
                    style={{ 
                      backgroundColor: 'var(--tag-subcategory-bg)',
                      color: 'var(--tag-subcategory-text)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    {displayQuestionData.subcategory}
                  </span>
                </div>
              </div>

              {/* Topic Progress Bar */}
              <div className="relative">
                <div 
                  className="w-full rounded-full h-2 overflow-hidden"
                  style={{ backgroundColor: 'var(--bg-progress)' }}
                >
                  <div 
                    className="h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      background: 'var(--bg-progress-fill)',
                      width: `${(completedInTopic / topicProgress) * 100}%` 
                    }}
                  ></div>
                </div>
                
                <div 
                  className="text-center text-sm mt-2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {completedInTopic} of {topicProgress} questions completed
                </div>
              </div>
            </div>

            {/* Main Question Card */}
            <div 
              className="backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)'
              }}
            >
              
              {/* Question Header - looks identical for both regular and attention check questions */}
              <div 
                className="p-6"
                style={{ 
                  background: 'var(--bg-card-header)',
                  color: 'var(--text-on-dark)'
                }}
              >
                <h2 className="text-lg md:text-xl font-medium leading-relaxed">
                  {displayQuestionData.question}
                </h2>
              </div>

              {/* Answer Section */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label 
                      className="block text-base font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <span>Your Answer *</span>
                      <span 
                        className="block text-xs font-normal mt-1"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        You can specify "none" if no answer exists
                      </span>
                    </label>
                    <button
                      onClick={handleClear}
                      className="text-sm font-medium hover:underline transition-colors"
                      style={{ color: 'var(--accent-warning)' }}
                    >
                      Clear Form
                    </button>
                  </div>
                  
                  {/* Regular Question Textarea - same for both regular and attention checks */}
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={answer}
                      onChange={handleAnswerChange}
                      placeholder="Share your knowledge about cultural practices in your region, or specify 'none' if no answer exists..."
                      className={`w-full px-4 py-3 border-2 rounded-xl resize-none min-h-[120px] transition-all duration-200 ${
                        errors.answer ? 'focus:border-red-400' : ''
                      }`}
                      style={{
                        color: 'var(--text-primary)',
                        borderColor: errors.answer ? 'var(--accent-error)' : 'var(--border-medium)',
                        backgroundColor: 'rgba(244, 228, 202, 0.3)'
                      }}
                      maxLength={5000}
                      disabled={isSaving}
                    />
                    
                    <div 
                      className={`absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs border`}
                      style={{
                        backgroundColor: answer.length >= 4 ? 'var(--color-cream)' : '#fef3c7',
                        color: answer.length >= 4 ? 'var(--text-secondary)' : 'var(--accent-warning)',
                        borderColor: answer.length >= 4 ? 'var(--border-light)' : '#fbbf24'
                      }}
                    >
                      {answer.length}/5000 {answer.length < 4 && `(${4 - answer.length} more needed)`}
                    </div>
                  </div>
                  
                  {errors.answer && (
                    <p className="text-sm mt-2 font-medium" style={{ color: 'var(--accent-error)' }}>
                      {errors.answer}
                    </p>
                  )}
                </div>

                {/* Real-time Quality Warnings (for regular questions only) */}
                {!isAttentionCheck && qualityWarnings.length > 0 && (
                  <div 
                    className="mb-4 p-3 border rounded-xl"
                    style={{ 
                      background: 'var(--btn-warning-bg)',
                      borderColor: '#fbbf24'
                    }}
                  >
                    <div className="flex items-start">
                      <span style={{ color: 'var(--accent-warning)' }} className="mr-2">⚠️</span>
                      <div className="text-sm" style={{ color: '#92400e' }}>
                        <p className="font-medium mb-1">Response Quality Notice:</p>
                        <ul className="text-xs space-y-1">
                          {qualityWarnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                        <p className="mt-2 font-medium">
                          Please provide detailed responses or specify "none" if not applicable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {showSuccess && (
                  <div 
                    className="mb-4 p-3 border rounded-xl animate-bounce-in"
                    style={{ 
                      background: 'var(--accent-success)',
                      borderColor: 'var(--border-dark)',
                      color: 'var(--text-on-dark)'
                    }}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">✨</span>
                      <span className="font-medium text-sm">Response saved successfully!</span>
                    </div>
                  </div>
                )}

                {/* Validation Warning */}
                {!isFormValid && (
                  <div 
                    className="mb-4 p-3 border rounded-xl"
                    style={{ 
                      background: 'var(--btn-warning-bg)',
                      borderColor: '#fbbf24'
                    }}
                  >
                    <div className="flex items-start">
                      <span style={{ color: 'var(--accent-warning)' }} className="mr-2">⚠️</span>
                      <div className="text-sm" style={{ color: '#92400e' }}>
                        <p className="font-medium mb-1">Please complete the following:</p>
                        <ul className="text-xs space-y-1">
                          <li>• Add at least 4 characters to your answer or specify "none"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div 
                  className="flex justify-between items-center pt-4 border-t"
                  style={{ borderColor: 'var(--border-light)' }}
                >
                  <button
                    onClick={handlePrevious}
                    disabled={isFirstQuestion || isNavigating}
                    className="flex items-center px-4 py-2 font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed text-sm disabled:opacity-50"
                    style={{ 
                      background: 'var(--btn-warning-bg)',
                      color: '#92400e'
                    }}
                  >
                    <span className="mr-2">←</span>
                    Previous
                  </button>

                  <div className="flex space-x-3">
                    {/* Hide skip for attention checks */}
                    {!isAttentionCheck && (
                      <button
                        onClick={handleSkip}
                        disabled={isNavigating}
                        className="px-4 py-2 font-medium rounded-xl transition-all duration-200 text-sm"
                        style={{ 
                          background: 'var(--btn-warning-bg)',
                          color: '#92400e'
                        }}
                      >
                        Skip
                      </button>
                    )}

                    <button
                      onClick={handleSave}
                      disabled={isSaving || !isFormValid || isNavigating}
                      className="px-4 py-2 font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed text-sm disabled:opacity-50"
                      style={{ 
                        background: 'var(--btn-secondary-bg)',
                        color: 'var(--text-on-dark)'
                      }}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>

                    <button
                      onClick={handleNext}
                      disabled={isSaving || !isFormValid || isNavigating}
                      className="flex items-center px-5 py-2 font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed text-sm disabled:opacity-50"
                      style={{ 
                        background: 'var(--btn-primary-bg)',
                        color: 'var(--text-on-dark)'
                      }}
                    >
                      {isNavigating ? 'Moving...' : (
                        <>
                          Save & Continue
                          <span className="ml-2">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Celebration Modal Component (keep icons only, no emojis)
function CelebrationModal({ celebration, onClose }: { 
  celebration: {type: string, data: any}, 
  onClose: () => void 
}) {
  const celebrations = {
    topic: {
      icon: '🎯',
      title: 'Topic Completed!',
    },
    subcategory: {
      icon: '🏆',
      title: 'Subcategory Mastered!',
    },
    category: {
      icon: '👑',
      title: 'Category Champion!',
    }
  };

  const config = celebrations[celebration.type as keyof typeof celebrations];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div 
        className="rounded-2xl p-6 max-w-lg mx-auto text-center shadow-2xl animate-bounce-in"
        style={{ 
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div className="text-5xl mb-3">{config.icon}</div>
        <h2 
          className="text-2xl font-bold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          {config.title}
        </h2>
        <div 
          className="p-4 rounded-xl mb-4"
          style={{ 
            background: 'linear-gradient(to right, var(--tag-category-bg), var(--tag-subcategory-bg))',
            border: '1px solid var(--border-light)'
          }}
        >
          <p 
            className="font-medium text-lg mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            "{celebration.data.name}"
          </p>
          <p 
            className="text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            {celebration.type === 'topic' && `in ${celebration.data.subcategoryName}`}
            {celebration.type === 'subcategory' && `from ${celebration.data.categoryName}`}
            {celebration.type === 'category' && 'Entire category completed!'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-6 py-2 font-medium rounded-xl transition-all duration-200"
          style={{ 
            background: 'var(--btn-primary-bg)',
            color: 'var(--text-on-dark)'
          }}
        >
          Continue Survey
        </button>
      </div>
    </div>
  );
}