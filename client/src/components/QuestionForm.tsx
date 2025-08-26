import React, { useState, useEffect, useRef } from 'react';
import { useForm } from '../context/FormContext.tsx';
import { validateAnswer, shouldShowAttentionCheck, generateAttentionCheck, analyzeResponseQuality, analyzeUserPattern } from '../utils/helpers.ts';
import AttentionCheck from './AttentionCheck.tsx';
import ProgressBar from './ProgressBar.tsx';
import NavigationMenu from './NavigationMenu.tsx';
import QualityWarningModal from './QualityWarningModel.tsx';
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
  const [culturalCommonsense, setCulturalCommonsense] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<{ answer?: string; cultural?: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastQuestionId, setLastQuestionId] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState<'next' | 'previous' | null>(null);
  const [showNavigationMenu, setShowNavigationMenu] = useState(false);

  // Attention check state
  const [showAttentionCheck, setShowAttentionCheck] = useState(false);
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
      
      const existingResponse = state.responses.get(currentQuestionData.questionId);
      if (existingResponse) {
        console.log('Found existing response:', existingResponse);
        setAnswer(existingResponse.answer);
        setCulturalCommonsense(existingResponse.culturalCommonsense);
      } else {
        console.log('No existing response, clearing form');
        setAnswer('');
        setCulturalCommonsense(null);
      }
    }
  }, [currentQuestionData?.questionId, lastQuestionId, state.responses]);

  // Attention check logic
  useEffect(() => {
    const totalResponses = state.responses.size;
    
    if (showAttentionCheck || lastAttentionCheckAt === totalResponses) return;
    
    if (shouldShowAttentionCheck(totalResponses) && currentQuestionData) {
      console.log('SHOWING ATTENTION CHECK at response count:', totalResponses);
      
      const check = generateAttentionCheck(
        currentQuestionData.category,
        currentQuestionData.topic,
        state.userInfo || undefined
      );
      
      setAttentionCheck(check);
      setShowAttentionCheck(true);
      setLastAttentionCheckAt(totalResponses);
    }
  }, [state.responses.size, showAttentionCheck, lastAttentionCheckAt, currentQuestionData]);

  // FIXED: Comprehensive quality check logic
  useEffect(() => {
    const totalResponses = state.responses.size;
    
    // Need at least 5 responses to analyze
    if (totalResponses < 5) return;
    
    // Don't check if modal is already open
    if (showQualityModal) return;

    const allResponses = Array.from(state.responses.values());
    const analysisData = allResponses.map(r => ({ answer: r.answer, timeSpent: r.timeSpent }));
    const patternAnalysis = analyzeUserPattern(analysisData);
    
    console.log('Quality pattern analysis:', patternAnalysis);

    // Show alert immediately when ANY pattern becomes problematic
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
    // Show again after 5 responses if still problematic
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
  }, [state.responses.size, showQualityModal, hasShownQualityAlert, lastQualityAlertAt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [answer]);

  const validateForm = () => {
    const newErrors: { answer?: string; cultural?: string } = {};
    
    const answerValidation = validateAnswer(answer);
    if (!answerValidation.isValid) {
      newErrors.answer = answerValidation.message;
    }

    if (culturalCommonsense === null) {
      newErrors.cultural = 'Please select whether this pertains to cultural commonsense';
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

    // Real-time quality feedback for current response only
    if (newValue.length > 5) {
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

  const handleCulturalChange = (value: boolean) => {
    setCulturalCommonsense(value);
    if (errors.cultural) {
      setErrors(prev => ({ ...prev, cultural: undefined }));
    }
  };

  const handleClear = () => {
    setAnswer('');
    setCulturalCommonsense(null);
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

  const performSave = async (qualityAnalysis?: any) => {
    if (!qualityAnalysis) {
      qualityAnalysis = analyzeResponseQuality(answer);
    }

    if (!currentQuestionData || !state.sessionId) {
      console.error('Missing required data for save');
      return false;
    }

    setIsSaving(true);
    
    try {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      const response = {
        sessionId: state.sessionId,
        questionId: currentQuestionData.questionId,
        categoryIndex: state.currentPosition.categoryIndex,
        subcategoryIndex: state.currentPosition.subcategoryIndex,
        topicIndex: state.currentPosition.topicIndex,
        questionIndex: state.currentPosition.questionIndex,
        category: currentQuestionData.category,
        subcategory: currentQuestionData.subcategory,
        topic: currentQuestionData.topic,
        question: currentQuestionData.question,
        answer: answer.trim(),
        culturalCommonsense: culturalCommonsense!,
        timeSpent,
        timestamp: new Date().toISOString(),
        qualityScore: qualityAnalysis.score
      };

      await saveResponse(response);
      await updateAttentionCheckStats();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      return true;
      
    } catch (error) {
      console.error('SAVE ERROR:', error);
      throw error; // Re-throw to handle in calling function
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
          
          if (milestone) {
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
    setAnswer('');
    setCulturalCommonsense(null);
    setErrors({});
    
    setNavigationDirection('next');
    setIsNavigating(true);
    
    setTimeout(() => {
      navigateToNext();
    }, 300);
  };

  const handleAttentionCheckComplete = (correct: boolean) => {
    console.log('=== ATTENTION CHECK COMPLETED ===');
    console.log('Result:', correct ? 'CORRECT' : 'INCORRECT');
    
    if (correct) {
      setAttentionChecksPassed(prev => {
        console.log('Attention checks passed:', prev + 1);
        return prev + 1;
      });
    } else {
      setAttentionChecksFailed(prev => {
        console.log('Attention checks failed:', prev + 1);
        return prev + 1;
      });
    }
    
    setShowAttentionCheck(false);
    setAttentionCheck(null);
    
    console.log('Attention check state cleared');
  };

  const handleNavigateToQuestion = async (categoryIndex: number, subcategoryIndex: number, topicIndex: number, questionIndex: number) => {
    const isValid = validateForm();
    if (isValid && answer.trim() && culturalCommonsense !== null) {
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

  // FIXED: Quality modal close handler
  const handleQualityModalClose = () => {
    console.log('Quality modal closed - user will improve response');
    setShowQualityModal(false);
    
    // Clear current response to force user to re-enter
    setAnswer('');
    setCulturalCommonsense(null);
    setErrors({});
    
    // Focus on textarea for improvement
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const closeCelebration = () => {
    setShowCelebration(null);
  };

  // Show attention check if needed
  if (showAttentionCheck && attentionCheck) {
    console.log('Rendering attention check component');
    return <AttentionCheck attentionCheck={attentionCheck} onComplete={handleAttentionCheckComplete} />;
  }

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

  const topicProgress = getTotalQuestionsInCurrentTopic();
  const completedInTopic = getCompletedQuestionsInCurrentTopic();
  const currentQuestionInTopic = state.currentPosition.questionIndex + 1;
  const isFirstQuestion = state.currentPosition.categoryIndex === 0 && 
                         state.currentPosition.subcategoryIndex === 0 && 
                         state.currentPosition.topicIndex === 0 && 
                         state.currentPosition.questionIndex === 0;

  const isFormValid = answer.trim().length >= 4 && culturalCommonsense !== null;

  return (
    <div 
      className="min-h-screen"
      style={{ 
        background: `linear-gradient(135deg, var(--bg-primary) 0%, var(--color-cream) 50%, var(--bg-secondary) 100%)` 
      }}
    >
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
          <span className="text-xl">🗂️</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <NavigationMenu 
        isOpen={showNavigationMenu}
        onClose={() => setShowNavigationMenu(false)}
        onNavigateTo={handleNavigateToQuestion}
      />

      {/* FIXED: Quality Warning Modal */}
      <QualityWarningModal
        isOpen={showQualityModal}
        onClose={handleQualityModalClose}
        qualityIssues={qualityWarnings}
        issueType={currentQualityIssue.type}
        noneResponseRate={currentQualityIssue.noneRate}
        gibberishResponseRate={currentQualityIssue.gibberishRate}
        fastResponseRate={currentQualityIssue.speedRate}
      />
      
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
                  <span className="mr-2">🍃</span>
                  Question {currentQuestionInTopic} of {topicProgress}
                </div>
                
                <h1 
                  className="text-2xl md:text-3xl font-semibold mb-3"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentQuestionData.topic}
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
                    {currentQuestionData.category}
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
                    {currentQuestionData.subcategory}
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
              
              {/* Question Header */}
              <div 
                className="p-6"
                style={{ 
                  background: 'var(--bg-card-header)',
                  color: 'var(--text-on-dark)'
                }}
              >
                <h2 className="text-lg md:text-xl font-medium leading-relaxed">
                  {currentQuestionData.question}
                </h2>
              </div>

              {/* Answer Section */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label 
                      htmlFor="main-answer" 
                      className="block text-base font-medium"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Your Answer *
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
                      id="main-answer"
                      value={answer}
                      onChange={handleAnswerChange}
                      placeholder="Share your knowledge about cultural practices in your region..."
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
                    
                    {/* Character count badge */}
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

                {/* Cultural Commonsense Section */}
                <div 
                  className="mb-6 p-4 rounded-xl"
                  style={{ 
                    background: 'linear-gradient(to right, var(--tag-subcategory-bg), var(--tag-category-bg))',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  <h3 
                    className="font-medium mb-3 text-base"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    🧠 Cultural Commonsense Assessment
                  </h3>
                  <p 
                    className="text-sm mb-3 leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Cultural commonsense refers to everyday beliefs, behaviors, values, and practices 
                    that are perceived as "natural" and widely shared within a cultural group.
                  </p>
                  <p 
                    className="font-medium mb-3 text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Does this question pertain to cultural commonsense in your region? *
                  </p>
                  
                  <div className="space-y-2">
                    <div 
                      className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-white/60 transition-colors"
                      onClick={() => handleCulturalChange(true)}
                    >
                      <input
                        type="radio"
                        id="cultural-yes"
                        checked={culturalCommonsense === true}
                        onChange={() => handleCulturalChange(true)}
                        disabled={isSaving}
                        className="h-4 w-4"
                        style={{ accentColor: 'var(--accent-secondary)' }}
                      />
                      <label 
                        htmlFor="cultural-yes" 
                        className="ml-3 cursor-pointer text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        ✅ Yes, this relates to cultural commonsense
                      </label>
                    </div>
                    
                    <div 
                      className="flex items-center cursor-pointer p-3 rounded-lg hover:bg-white/60 transition-colors"
                      onClick={() => handleCulturalChange(false)}
                    >
                      <input
                        type="radio"
                        id="cultural-no"
                        checked={culturalCommonsense === false}
                        onChange={() => handleCulturalChange(false)}
                        disabled={isSaving}
                        className="h-4 w-4"
                        style={{ accentColor: 'var(--accent-secondary)' }}
                      />
                      <label 
                        htmlFor="cultural-no" 
                        className="ml-3 cursor-pointer text-sm"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        ❌ No, this does not relate to cultural commonsense
                      </label>
                    </div>
                  </div>
                  
                  {errors.cultural && (
                    <p className="text-sm mt-2 font-medium" style={{ color: 'var(--accent-error)' }}>
                      {errors.cultural}
                    </p>
                  )}
                </div>

                {/* Real-time Quality Warnings (for current answer only) */}
                {qualityWarnings.length > 0 && (
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
                          Please provide detailed, thoughtful responses about cultural practices in your region.
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
                          {answer.trim().length < 4 && <li>• Add at least 4 characters to your answer</li>}
                          {culturalCommonsense === null && <li>• Select whether this relates to cultural commonsense</li>}
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
      title: 'Topic Completed!',
      emoji: '🌱🌿✨',
    },
    subcategory: {
      icon: '🏆',
      title: 'Subcategory Mastered!',
      emoji: '🌿🎋🌟💫',
    },
    category: {
      icon: '👑',
      title: 'Category Champion!',
      emoji: '🌿🎋🌟💫✨🎯',
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
        <div className="text-3xl mb-4 animate-pulse">
          {config.emoji}
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