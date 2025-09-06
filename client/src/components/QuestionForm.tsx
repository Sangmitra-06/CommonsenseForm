import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from '../context/FormContext.tsx';
import { validateAnswer, shouldShowAttentionCheck, generateAttentionCheck, analyzeResponseQuality, analyzeUserPattern, validateAttentionCheck } from '../utils/helpers.ts';
import ProgressBar from './ProgressBar.tsx';
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
    dispatch,
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

  // Attention check state
  const [isAttentionCheck, setIsAttentionCheck] = useState(false);
  const [attentionCheck, setAttentionCheck] = useState<any>(null);
  const [lastAttentionCheckAt, setLastAttentionCheckAt] = useState<number>(-1);
  const [attentionChecksPassed, setAttentionChecksPassed] = useState(0);
  const [attentionChecksFailed, setAttentionChecksFailed] = useState(0);
  const [attentionCheckFailed, setAttentionCheckFailed] = useState(false);

  // Store the question data and answer before attention check (without saving to responses)
  const [preAttentionData, setPreAttentionData] = useState<{
    questionData: any;
    answer: string;
    startTime: number;
  } | null>(null);

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

  // Helper to get actual question response count
  const getActualQuestionResponseCount = useCallback(() => {
    return Array.from(state.responses.keys())
      .filter(questionId => !questionId.startsWith('ATTENTION_CHECK_'))
      .length;
  }, [state.responses]);

  // Quality check monitoring - runs after each response is saved
  useEffect(() => {
    // Only check quality for actual question responses, not attention checks
    const actualResponses = Array.from(state.responses.values())
      .filter(response => !response.questionId.startsWith('ATTENTION_CHECK_'));
      
    if (actualResponses.length < 5 || isAttentionCheck) {
      return; // Need at least 5 responses to analyze patterns
    }

    // Avoid showing multiple alerts in quick succession
    if (hasShownQualityAlert && Date.now() - lastQualityAlertAt < 10000) {
      return; // Wait at least 10 seconds between alerts
    }

    console.log('Running quality analysis on', actualResponses.length, 'actual responses');
    
    // Analyze the user's response pattern
    const patternAnalysis = analyzeUserPattern(actualResponses);
    
    console.log('Pattern analysis results:', patternAnalysis);
    
    if (patternAnalysis.suspiciousPattern) {
      console.log('🚨 SUSPICIOUS PATTERN DETECTED - showing quality modal');
      
      setCurrentQualityIssue({
        type: patternAnalysis.issueType,
        noneRate: patternAnalysis.noneResponseRate,
        gibberishRate: patternAnalysis.gibberishResponseRate,
        speedRate: patternAnalysis.fastResponseRate
      });
      
      setQualityWarnings(patternAnalysis.warnings);
      setShowQualityModal(true);
      setLastQualityAlertAt(Date.now());
      setHasShownQualityAlert(true);
    }
  }, [
    // Trigger when actual responses change
    getActualQuestionResponseCount(),
    isAttentionCheck,
    hasShownQualityAlert,
    lastQualityAlertAt
  ]);

  // Separate effect to trigger attention check when navigating to a new question
  useEffect(() => {
    // Only run this when we have a valid question and we're not already in an attention check
    if (!currentQuestionData || isAttentionCheck || preAttentionData) {
      return;
    }

    const actualQuestionResponses = getActualQuestionResponseCount();
    
    console.log('🔍 Checking for attention check trigger:', {
      actualQuestionResponses,
      shouldShow: shouldShowAttentionCheck(actualQuestionResponses),
      lastAttentionCheckAt,
      currentQuestionId: currentQuestionData.questionId
    });

    // Check if we should show attention check
    if (shouldShowAttentionCheck(actualQuestionResponses) && actualQuestionResponses !== lastAttentionCheckAt) {
      console.log('🚨 TRIGGERING ATTENTION CHECK at count:', actualQuestionResponses);
      
      // Store current state before showing attention check
      if (answer.trim().length >= 4) {
        setPreAttentionData({
          questionData: currentQuestionData,
          answer: answer.trim(),
          startTime: startTime
        });
      }
      
      const check = generateAttentionCheck(
        currentQuestionData.category,
        currentQuestionData.topic,
        state.userInfo || undefined
      );
      
      setAttentionCheck(check);
      setIsAttentionCheck(true);
      setLastAttentionCheckAt(actualQuestionResponses);
      setAnswer(''); // Clear answer for attention check
      setStartTime(Date.now());
    }
  }, [
    currentQuestionData?.questionId, // Trigger when question changes
    getActualQuestionResponseCount(), // Trigger when response count changes
    isAttentionCheck,
    preAttentionData,
    lastAttentionCheckAt
  ]);

  // Reset form when question changes - handles both regular navigation and post-attention-check
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
      
      if (isAttentionCheck) {
        // We're showing an attention check, keep answer cleared
        setAnswer('');
      } else {
        // Check if this matches our pre-attention data
        if (preAttentionData && preAttentionData.questionData.questionId === currentQuestionData.questionId) {
          console.log('🔄 Restoring pre-attention data for:', currentQuestionData.questionId);
          setAnswer(preAttentionData.answer);
          setStartTime(preAttentionData.startTime);
          // Clear preAttentionData since we're now back to the original question
          setPreAttentionData(null);
        } else {
          // Normal question loading - check for existing response
          const existingResponse = state.responses.get(currentQuestionData.questionId);
          if (existingResponse) {
            console.log('Found existing response:', existingResponse.answer.substring(0, 50) + '...');
            setAnswer(existingResponse.answer);
          } else {
            console.log('No existing response, clearing form');
            setAnswer('');
          }
        }
      }
    }
  }, [currentQuestionData?.questionId, lastQuestionId, state.responses, isAttentionCheck, preAttentionData]);

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

  // UPDATED performSave to handle both regular and pre-attention data
  const performSave = async (questionDataToUse?: any, answerToUse?: string, startTimeToUse?: number, qualityAnalysis?: any, skipSuccessMessage?: boolean) => {
    const questionData = questionDataToUse || currentQuestionData;
    const answerText = answerToUse || answer;
    const timeStart = startTimeToUse || startTime;
    
    if (!questionData || !state.sessionId) {
      console.error('Missing required data for save');
      return false;
    }

    // For attention checks, create a special question ID using actual response count
    const questionId = isAttentionCheck 
      ? `ATTENTION_CHECK_${getActualQuestionResponseCount()}_${questionData.questionId}`
      : questionData.questionId;

    const questionText = isAttentionCheck 
      ? attentionCheck.question 
      : questionData.question;

    if (!qualityAnalysis) {
      qualityAnalysis = analyzeResponseQuality(answerText);
    }

    setIsSaving(true);
    
    try {
      const timeSpent = Math.floor((Date.now() - timeStart) / 1000);
      
      const response = {
        sessionId: state.sessionId,
        questionId: questionId,
        categoryIndex: state.currentPosition.categoryIndex,
        subcategoryIndex: state.currentPosition.subcategoryIndex,
        topicIndex: state.currentPosition.topicIndex,
        questionIndex: state.currentPosition.questionIndex,
        category: questionData.category,
        subcategory: questionData.subcategory,
        topic: questionData.topic,
        question: questionText,
        answer: answerText.trim(),
        timeSpent,
        timestamp: new Date().toISOString(),
        qualityScore: qualityAnalysis.score,
        isAttentionCheck: isAttentionCheck,
        attentionCheckType: isAttentionCheck ? attentionCheck.type : undefined,
        expectedAnswer: isAttentionCheck ? attentionCheck.expectedAnswer : undefined
      };

      console.log('Saving response:', {
        questionId,
        isAttentionCheck,
        answer: answerText.substring(0, 50) + '...',
        totalResponses: state.responses.size,
        qualityScore: qualityAnalysis.score
      });

      await saveResponse(response);
      
      // Only show success message if not skipped and not an attention check
      if (!skipSuccessMessage && !isAttentionCheck) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
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
      return await performSave(undefined, undefined, undefined, qualityAnalysis);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save response. Please try again.');
      return false;
    }
  };

  // FIXED handleNext function
  const handleNext = async () => {
    const isValid = validateForm();
    if (!isValid) {
      console.log('Form validation failed, cannot proceed');
      return;
    }

    // Handle attention check validation
    if (isAttentionCheck && attentionCheck) {
      const expectedAnswers = attentionCheck.expectedAnswers || [attentionCheck.expectedAnswer];
      const isAttentionCheckValid = validateAttentionCheck(answer, expectedAnswers);
      
      console.log('ATTENTION CHECK VALIDATION:', {
        userAnswer: answer,
        expectedAnswers: expectedAnswers,
        isValid: isAttentionCheckValid,
        attentionCheckType: attentionCheck.type
      });
      
      if (!isAttentionCheckValid) {
        console.log('❌ ATTENTION CHECK FAILED - Redirecting to completion');
        
        try {
          await performSave();
          console.log('Failed attention check response saved');
        } catch (error) {
          console.error('Error saving failed attention check:', error);
        }
        
        if (state.sessionId) {
          try {
            await api.completeUser(state.sessionId, 'attention_check_failed');
            console.log('Survey marked as completed due to attention check failure');
          } catch (error) {
            console.error('Error marking survey completed:', error);
          }
        }
        
        dispatch({ type: 'SET_ATTENTION_CHECK_FAILED', payload: true });
        return;
      } else {
        console.log('✅ ATTENTION CHECK PASSED');
        
        // Save the attention check response
        try {
          await performSave();
          console.log('Attention check response saved');
        } catch (error) {
          console.error('Error saving attention check:', error);
        }
        
        // Save the pre-attention data if it exists
        if (preAttentionData) {
          console.log('💾 Saving pre-attention data:', preAttentionData.questionData.questionId);
          try {
            await performSave(
              preAttentionData.questionData,
              preAttentionData.answer,
              preAttentionData.startTime,
              undefined,
              true // Skip success message
            );
            console.log('Pre-attention data saved successfully');
          } catch (error) {
            console.error('Error saving pre-attention data:', error);
          }
        }
        
        // Reset attention check state and clear pre-attention data
        setIsAttentionCheck(false);
        setAttentionCheck(null);
        
        // TRIGGER NAVIGATION with animation
        setNavigationDirection('next');
        setIsNavigating(true);
        
        setTimeout(() => {
          // Clear the answer field to prevent wrong answer from showing
          setAnswer('');
          setPreAttentionData(null);
          
          // Force re-render by updating the question ID tracker
          setLastQuestionId(null);
        }, 300);
        
        return;
      }
    }

    // Regular question flow - check for quality issues before saving
    try {
      if (!isAttentionCheck) {
        const qualityAnalysis = analyzeResponseQuality(answer);
        
        // If this individual response is very low quality, show warning
        if (qualityAnalysis.isLowQuality && qualityAnalysis.score < 15) {
          console.log('Individual response quality too low:', qualityAnalysis.score);
          setCurrentQualityIssue({
            type: 'individual',
            noneRate: qualityAnalysis.isNoneResponse ? 100 : 0,
            gibberishRate: qualityAnalysis.isGibberish ? 100 : 0,
            speedRate: 0
          });
          setQualityWarnings([
            'This response appears to be very low quality',
            ...qualityAnalysis.issues
          ]);
          setShowQualityModal(true);
          return; // Don't proceed with save
        }
      }
      
      const saveSuccessful = await handleSave();
      
      if (saveSuccessful && isValid) {
        // If we have pre-attention data and we're saving the same question, clear it
        if (
          preAttentionData &&
          currentQuestionData &&
          preAttentionData.questionData.questionId === currentQuestionData.questionId
        ) {
          console.log('Clearing pre-attention data after saving the same question');
          setPreAttentionData(null);
        }
        
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

  const handleQualityModalClose = () => {
    console.log('Quality modal closed - user will improve response');
    setShowQualityModal(false);
    
    // Clear the current answer to force them to rewrite
    setAnswer('');
    setErrors({});
    setQualityWarnings([]);
    
    // Reset the quality issue state
    setCurrentQualityIssue({
      type: null,
      noneRate: 0,
      gibberishRate: 0,
      speedRate: 0
    });
    
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

  if (state.surveyExpired) {
    return null;
  }

  const isFirstQuestion = state.currentPosition.categoryIndex === 0 && 
                         state.currentPosition.subcategoryIndex === 0 && 
                         state.currentPosition.topicIndex === 0 && 
                         state.currentPosition.questionIndex === 0;

  const isFormValid = answer.trim().length >= 4;
  const displayQuestion = isAttentionCheck ? attentionCheck.question : currentQuestionData.question;

  if (attentionCheckFailed) {
    return null;
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
      <SurveyTimer />
      <ProgressBar />

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
      
      {showCelebration && (
        <CelebrationModal 
          celebration={showCelebration} 
          onClose={closeCelebration}
        />
      )}
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="relative overflow-hidden">
          <div className={`transform transition-all duration-500 ease-in-out ${
            isNavigating 
              ? navigationDirection === 'next' 
                ? '-translate-x-full opacity-0'
                : 'translate-x-full opacity-0'
              : 'translate-x-0 opacity-100'
          }`}>

            <div 
              className="backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden"
              style={{ 
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-light)'
              }}
            >
              
              <div 
                className="p-6"
                style={{ 
                  background: 'var(--bg-card-header)',
                  color: 'var(--text-on-dark)'
                }}
              >
                {isAttentionCheck}
                <h2 className="text-lg md:text-xl font-medium leading-relaxed">
                  {displayQuestion}
                </h2>
              </div>

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

                <div 
                  className="flex justify-between items-center pt-4 border-t"
                  style={{ borderColor: 'var(--border-light)' }}
                >
                  <button
                    onClick={handlePrevious}
                    disabled={isFirstQuestion || isNavigating || isAttentionCheck}
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

// Celebration Modal Component
function CelebrationModal({ celebration, onClose }: { 
  celebration: {type: string, data: any}, 
  onClose: () => void 
}) {
  const celebrations = {
    topic: {
      icon: '🎯',
      title: 'Section Completed!',
      message: 'Great progress! Keep going!'
    },
    subcategory: {
      icon: '🏆',
      title: 'Section Mastered!',
      message: 'Excellent work! Moving to next section!'
    },
    category: {
      icon: '👑',
      title: 'Major Section Complete!',
      message: 'Outstanding! You\'re making great progress!'
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
        <p 
          className="text-lg mb-4"
          style={{ color: 'var(--text-secondary)' }}
        >
          {config.message}
        </p>
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