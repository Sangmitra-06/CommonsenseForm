import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef, useState } from 'react';
import { FormState, UserInfo, QuestionResponse, Category, Progress, SurveyTiming } from '../types/index.ts';
import { loadQuestionsData } from '../utils/helpers.ts';
import * as api from '../services/api.ts';

// Timer constants - simplified
const TIMER_UPDATE_INTERVAL = 1000; // Update every second

type FormAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'SET_USER_INFO'; payload: UserInfo }
  | { type: 'SET_QUESTIONS_DATA'; payload: Category[] }
  | { type: 'SET_CURRENT_POSITION'; payload: { categoryIndex: number; subcategoryIndex: number; topicIndex: number; questionIndex: number } }
  | { type: 'ADD_RESPONSE'; payload: QuestionResponse }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<Progress> }
  | { type: 'SET_RESPONSES'; payload: QuestionResponse[] }
  | { type: 'SET_START_TIME'; payload: number }
  | { type: 'SET_LAST_SAVE_TIME'; payload: number }
  | { type: 'SET_COMPLETED'; payload: boolean }
  | { type: 'RESET_FORM' }
  // Simplified timer actions
  | { type: 'START_SURVEY_TIMER' }
  | { type: 'UPDATE_TIMER'; payload: { timeElapsed: number } }
  // Attention check failure
  | { type: 'SET_ATTENTION_CHECK_FAILED'; payload: boolean }
  // NEW: Timing action
  | { type: 'SET_TIMING'; payload: SurveyTiming | null };

const initialState: FormState = {
  sessionId: null,
  userInfo: null,
  currentPosition: {
    categoryIndex: 0,
    subcategoryIndex: 0,
    topicIndex: 0,
    questionIndex: 0
  },
  responses: new Map(),
  progress: {
    currentCategory: 0,
    currentSubcategory: 0,
    currentTopic: 0,
    currentQuestion: 0,
    completedQuestions: 0,
    totalQuestions: 0,
    completedTopics: [],
    attentionChecksPassed: 0,
    attentionChecksFailed: 0
  },
  isLoading: false,
  error: null,
  questionsData: [],
  startTime: 0,
  lastSaveTime: 0,
  isCompleted: false,
  // Simplified timer state
  surveyStartTime: 0,
  surveyTimeElapsed: 0, // Count up from 0
  surveyExpired: false, // Keep this false always now
  showTimeWarning: false, // Always false now
  showTimeCritical: false, // Always false now
  // Attention check failure state
  attentionCheckFailed: false,
  // NEW: Timing state
  timing: null,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };
    case 'SET_USER_INFO':
      return { ...state, userInfo: action.payload };
    case 'SET_QUESTIONS_DATA':
      return { ...state, questionsData: action.payload };
    case 'SET_CURRENT_POSITION':
      return { ...state, currentPosition: action.payload };
    case 'ADD_RESPONSE':
      const newResponses = new Map(state.responses);
      newResponses.set(action.payload.questionId, action.payload);
      return { ...state, responses: newResponses };
    case 'UPDATE_PROGRESS':
      return { 
        ...state, 
        progress: { ...state.progress, ...action.payload }
      };
    case 'SET_RESPONSES':
      const responseMap = new Map();
      action.payload.forEach(response => {
        responseMap.set(response.questionId, response);
      });
      return { ...state, responses: responseMap };
    case 'SET_START_TIME':
      return { ...state, startTime: action.payload };
    case 'SET_LAST_SAVE_TIME':
      return { ...state, lastSaveTime: action.payload };
    case 'SET_COMPLETED':
      return { ...state, isCompleted: action.payload };
    case 'RESET_FORM':
      return { ...initialState, questionsData: state.questionsData };
    // Simplified timer cases
    case 'START_SURVEY_TIMER':
      return {
        ...state,
        surveyStartTime: Date.now(),
        surveyTimeElapsed: 0,
        showTimeWarning: false,
        showTimeCritical: false,
        surveyExpired: false
      };
    case 'UPDATE_TIMER':
      return {
        ...state,
        surveyTimeElapsed: action.payload.timeElapsed
      };
    // Attention check failure case
    case 'SET_ATTENTION_CHECK_FAILED':
      return {
        ...state,
        attentionCheckFailed: action.payload
      };
    // NEW: Timing case
    case 'SET_TIMING':
      return { ...state, timing: action.payload };
    
    default:
      return state;
  }
}

// Updated interface
interface FormContextType {
  state: FormState;
  dispatch: React.Dispatch<FormAction>;
  createUserSession: (userInfo: UserInfo) => Promise<void>;
  saveResponse: (response: QuestionResponse) => Promise<void>;
  navigateToNext: () => void;
  navigateToPrevious: () => void;
  calculateProgress: () => number;
  getCurrentQuestion: () => string | null;
  getCurrentQuestionData: () => {
    category: string;
    subcategory: string;
    topic: string;
    question: string;
    questionId: string;
  } | null;
  getTotalQuestionsInCurrentTopic: () => number;
  getCompletedQuestionsInCurrentTopic: () => number;
  loadUserSession: (sessionId: string) => Promise<void>;
  navigateToPosition: (categoryIndex: number, subcategoryIndex: number, topicIndex: number, questionIndex: number) => Promise<void>;
  resetSession: () => void;
  // Simplified timer functions
  startSurveyTimer: () => void;
  resumeSurveyTimer: (startTime: number) => void;
  formatTimeElapsed: (milliseconds: number) => string;
  // Attention check failure function
  setAttentionCheckFailed: (failed: boolean) => void;
  // NEW: Timing function
  setTiming: (timing: SurveyTiming | null) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const hasLoadedQuestions = useRef(false);
  const isLoadingSession = useRef(false);
  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const surveyStartTimeRef = useRef<number>(0);

  // Load questions data only once
  useEffect(() => {
    if (hasLoadedQuestions.current) return;
    
    const loadData = async () => {
      try {
        hasLoadedQuestions.current = true;
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        console.log('FormContext: Loading questions data...');
        const data = await loadQuestionsData();
        console.log('FormContext: Questions loaded:', data.length, 'categories');
        
        dispatch({ type: 'SET_QUESTIONS_DATA', payload: data });
        
        const totalQuestions = getTotalQuestions(data);
        console.log('FormContext: Total questions calculated:', totalQuestions);
        
        dispatch({ type: 'UPDATE_PROGRESS', payload: { totalQuestions } });
        
      } catch (error) {
        console.error('FormContext: Error loading questions:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load questions data. Please refresh the page.' });
        hasLoadedQuestions.current = false;
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Calculate total questions
  const getTotalQuestions = (questionsData: Category[]): number => {
    return questionsData.reduce((total, category) => {
      return total + category.subcategories.reduce((subTotal, subcategory) => {
        return subTotal + subcategory.topics.reduce((topicTotal, topic) => {
          return topicTotal + topic.questions.length;
        }, 0);
      }, 0);
    }, 0);
  };

  // Simplified start timer function - counts UP
  const startSurveyTimer = useCallback(() => {
    const startTime = Date.now();
    console.log('Starting survey timer at:', new Date(startTime).toISOString());
    
    dispatch({ type: 'START_SURVEY_TIMER' });
    surveyStartTimeRef.current = startTime;
    
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Start new timer that counts UP
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - surveyStartTimeRef.current;
      
      dispatch({ 
        type: 'UPDATE_TIMER', 
        payload: { 
          timeElapsed: elapsed
        } 
      });
    }, TIMER_UPDATE_INTERVAL);

    setTimerInterval(interval);
  }, [timerInterval]);

  // Simplified resume timer function
  const resumeSurveyTimer = useCallback((startTime: number) => {
    console.log('Resuming survey timer from:', new Date(startTime).toISOString());
    
    surveyStartTimeRef.current = startTime;
    const now = Date.now();
    const elapsed = now - startTime;

    dispatch({
      type: 'UPDATE_TIMER',
      payload: {
        timeElapsed: elapsed
      }
    });

    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Start timer continuing from where it left off
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - surveyStartTimeRef.current;
      
      dispatch({ 
        type: 'UPDATE_TIMER', 
        payload: { 
          timeElapsed: elapsed
        } 
      });
    }, TIMER_UPDATE_INTERVAL);

    setTimerInterval(interval);
  }, [timerInterval]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // Simple format time function (shows elapsed time)
  const formatTimeElapsed = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Attention check failure function
  const setAttentionCheckFailed = useCallback((failed: boolean) => {
    dispatch({ type: 'SET_ATTENTION_CHECK_FAILED', payload: failed });
  }, []);

  // NEW: Timing function
  const setTiming = useCallback((timing: SurveyTiming | null) => {
    dispatch({ type: 'SET_TIMING', payload: timing });
  }, []);

  // Create user session - UPDATED to handle timing
  const createUserSession = useCallback(async (userInfo: UserInfo) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('FormContext: Creating user session with:', userInfo);
      
      const response = await api.createUser(userInfo);
      
      dispatch({ type: 'SET_SESSION_ID', payload: response.sessionId });
      dispatch({ type: 'SET_USER_INFO', payload: userInfo });
      
      // NEW: Set timing if provided from server
      if (response.startTime) {
        const serverStartTime = new Date(response.startTime);
        dispatch({ type: 'SET_TIMING', payload: {
          startedAt: serverStartTime,
          completedAt: null,
          totalTimeSeconds: null,
          totalTimeFormatted: null
        }});
        console.log('FormContext: Server timing initialized:', serverStartTime.toISOString());
      }
      
      const startTime = Date.now();
      dispatch({ type: 'SET_START_TIME', payload: startTime });
      
      // Store session ID and start time in localStorage
      localStorage.setItem('culturalSurveySessionId', response.sessionId);
      localStorage.setItem('culturalSurveyStartTime', startTime.toString());
      
      // Start the survey timer
      console.log('FormContext: Creating user session and starting timer');
      startSurveyTimer();
      
      console.log('FormContext: User session created successfully');
      
    } catch (error: any) {
      console.error('FormContext: Error creating user session:', error);
      
      const errorMessage = error.response?.data?.error || 'Failed to create session';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [startSurveyTimer]);

  // Rest of your existing functions remain the same...
  const loadUserSession = useCallback(async (sessionId: string) => {
    if (isLoadingSession.current) return;
    
    try {
      isLoadingSession.current = true;
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('FormContext: Loading user session...');
      const user = await api.getUser(sessionId);
      
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
      dispatch({ type: 'SET_USER_INFO', payload: user.userInfo });
      dispatch({ type: 'SET_COMPLETED', payload: user.isCompleted });
      
      // NEW: Load timing data if available
      if (user.timing) {
        dispatch({ type: 'SET_TIMING', payload: {
          startedAt: new Date(user.timing.startedAt),
          completedAt: user.timing.completedAt ? new Date(user.timing.completedAt) : null,
          totalTimeSeconds: user.timing.totalTimeSeconds,
          totalTimeFormatted: user.timing.totalTimeFormatted
        }});
        console.log('FormContext: Timing data loaded from user session');
      }
      
      // Load responses
      console.log('FormContext: Loading user responses...');
      const responses = await api.getUserResponses(sessionId);
      console.log('FormContext: Responses loaded:', responses.length);
      
      dispatch({ type: 'SET_RESPONSES', payload: responses });
      
      // Recalculate total questions from current data
      const totalQuestions = getTotalQuestions(state.questionsData);
      
      const updatedProgress = {
        ...user.progress,
        totalQuestions,
        completedQuestions: responses.length
      };
      
      dispatch({ type: 'UPDATE_PROGRESS', payload: updatedProgress });
      
      // Find the correct starting position
      const nextPosition = findNextUnansweredQuestion(responses, state.questionsData);
      console.log('FormContext: Setting position to:', nextPosition);
      
      dispatch({ type: 'SET_CURRENT_POSITION', payload: nextPosition });
      
      // Resume timer if not completed
      if (!user.isCompleted) {
        const savedStartTime = localStorage.getItem('culturalSurveyStartTime');
        if (savedStartTime) {
          resumeSurveyTimer(parseInt(savedStartTime));
        } else {
          // If no start time found, start fresh timer
          localStorage.setItem('culturalSurveyStartTime', Date.now().toString());
          startSurveyTimer();
        }
      }
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      isLoadingSession.current = false;
    }
  }, [state.questionsData, resumeSurveyTimer, startSurveyTimer]);

  const findNextUnansweredQuestion = useCallback((responses: QuestionResponse[], questionsData: Category[]) => {
    const answeredQuestions = new Set(responses.map(r => r.questionId));
    
    for (let categoryIndex = 0; categoryIndex < questionsData.length; categoryIndex++) {
      const category = questionsData[categoryIndex];
      
      for (let subcategoryIndex = 0; subcategoryIndex < category.subcategories.length; subcategoryIndex++) {
        const subcategory = category.subcategories[subcategoryIndex];
        
        for (let topicIndex = 0; topicIndex < subcategory.topics.length; topicIndex++) {
          const topic = subcategory.topics[topicIndex];
          
          for (let questionIndex = 0; questionIndex < topic.questions.length; questionIndex++) {
            const questionId = `${categoryIndex}-${subcategoryIndex}-${topicIndex}-${questionIndex}`;
            
            if (!answeredQuestions.has(questionId)) {
              return {
                categoryIndex,
                subcategoryIndex,
                topicIndex,
                questionIndex
              };
            }
          }
        }
      }
    }
    
    if (questionsData.length > 0) {
      const lastCategory = questionsData[questionsData.length - 1];
      const lastSubcategory = lastCategory.subcategories[lastCategory.subcategories.length - 1];
      const lastTopic = lastSubcategory.topics[lastSubcategory.topics.length - 1];
      
      return {
        categoryIndex: questionsData.length - 1,
        subcategoryIndex: lastCategory.subcategories.length - 1,
        topicIndex: lastSubcategory.topics.length - 1,
        questionIndex: lastTopic.questions.length - 1
      };
    }
    
    return { categoryIndex: 0, subcategoryIndex: 0, topicIndex: 0, questionIndex: 0 };
  }, []);

  const saveResponse = useCallback(async (response: QuestionResponse) => {
  try {
    console.log('FormContext: Saving response:', response);
    await api.saveResponse(response);
    dispatch({ type: 'ADD_RESPONSE', payload: response });
    dispatch({ type: 'SET_LAST_SAVE_TIME', payload: Date.now() });
    
    // Only count non-attention check responses for progress
    const wasNewResponse = !state.responses.has(response.questionId);
    const isActualQuestion = !response.questionId.startsWith('ATTENTION_CHECK_');
    
    if (wasNewResponse && isActualQuestion) {
      const completedQuestions = Array.from(state.responses.keys())
        .filter(questionId => !questionId.startsWith('ATTENTION_CHECK_'))
        .length + 1; // +1 for the response we just added
      
      dispatch({ type: 'UPDATE_PROGRESS', payload: { completedQuestions } });
    }
    
  } catch (error) {
    console.error('FormContext: Error saving response:', error);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to save response' });
    throw error;
  }
}, [state.responses]);

  const navigateToPosition = useCallback(async (categoryIndex: number, subcategoryIndex: number, topicIndex: number, questionIndex: number) => {
    const newPosition = { categoryIndex, subcategoryIndex, topicIndex, questionIndex };
    dispatch({ type: 'SET_CURRENT_POSITION', payload: newPosition });

    if (state.sessionId) {
      try {
        await api.updateUserProgress(state.sessionId, {
          currentCategory: categoryIndex,
          currentSubcategory: subcategoryIndex,
          currentTopic: topicIndex,
          currentQuestion: questionIndex
        });
      } catch (error) {
        console.error('Failed to save navigation progress:', error);
      }
    }
  }, [state.sessionId]);

  const getCurrentQuestionData = useCallback(() => {
    const { categoryIndex, subcategoryIndex, topicIndex, questionIndex } = state.currentPosition;
    
    if (!state.questionsData[categoryIndex]) return null;
    
    const category = state.questionsData[categoryIndex];
    const subcategory = category.subcategories[subcategoryIndex];
    const topic = subcategory?.topics[topicIndex];
    const question = topic?.questions[questionIndex];
    
    if (!question) return null;
    
    return {
      category: category.category,
      subcategory: subcategory.subcategory,
      topic: topic.topic,
      question,
      questionId: `${categoryIndex}-${subcategoryIndex}-${topicIndex}-${questionIndex}`
    };
  }, [state.currentPosition, state.questionsData]);

  const getCurrentQuestion = useCallback(() => {
    const data = getCurrentQuestionData();
    return data?.question || null;
  }, [getCurrentQuestionData]);

  const navigateToNext = useCallback(async () => {
    const { categoryIndex, subcategoryIndex, topicIndex, questionIndex } = state.currentPosition;
    const category = state.questionsData[categoryIndex];
    
    if (!category) return;
    
    const subcategory = category.subcategories[subcategoryIndex];
    const topic = subcategory?.topics[topicIndex];
    
    if (!topic) return;

    let newPosition = { ...state.currentPosition };

    if (questionIndex < topic.questions.length - 1) {
      newPosition.questionIndex = questionIndex + 1;
    } else if (topicIndex < subcategory.topics.length - 1) {
      newPosition.topicIndex = topicIndex + 1;
      newPosition.questionIndex = 0;
    } else if (subcategoryIndex < category.subcategories.length - 1) {
      newPosition.subcategoryIndex = subcategoryIndex + 1;
      newPosition.topicIndex = 0;
      newPosition.questionIndex = 0;
    } else if (categoryIndex < state.questionsData.length - 1) {
      newPosition.categoryIndex = categoryIndex + 1;
      newPosition.subcategoryIndex = 0;
      newPosition.topicIndex = 0;
      newPosition.questionIndex = 0;
    } else {
      dispatch({ type: 'SET_COMPLETED', payload: true });
      return;
    }

    dispatch({ type: 'SET_CURRENT_POSITION', payload: newPosition });

    if (state.sessionId) {
      try {
        await api.updateUserProgress(state.sessionId, {
          currentCategory: newPosition.categoryIndex,
          currentSubcategory: newPosition.subcategoryIndex,
          currentTopic: newPosition.topicIndex,
          currentQuestion: newPosition.questionIndex
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  }, [state.currentPosition, state.questionsData, state.sessionId]);

  const navigateToPrevious = useCallback(async () => {
    const { categoryIndex, subcategoryIndex, topicIndex, questionIndex } = state.currentPosition;
    
    let newPosition = { ...state.currentPosition };

    if (questionIndex > 0) {
      newPosition.questionIndex = questionIndex - 1;
    } else if (topicIndex > 0) {
      const prevTopic = state.questionsData[categoryIndex].subcategories[subcategoryIndex].topics[topicIndex - 1];
      newPosition.topicIndex = topicIndex - 1;
      newPosition.questionIndex = prevTopic.questions.length - 1;
    } else if (subcategoryIndex > 0) {
      const prevSubcategory = state.questionsData[categoryIndex].subcategories[subcategoryIndex - 1];
      const lastTopic = prevSubcategory.topics[prevSubcategory.topics.length - 1];
      newPosition.subcategoryIndex = subcategoryIndex - 1;
      newPosition.topicIndex = prevSubcategory.topics.length - 1;
      newPosition.questionIndex = lastTopic.questions.length - 1;
    } else if (categoryIndex > 0) {
      const prevCategory = state.questionsData[categoryIndex - 1];
      const lastSubcategory = prevCategory.subcategories[prevCategory.subcategories.length - 1];
      const lastTopic = lastSubcategory.topics[lastSubcategory.topics.length - 1];
      newPosition.categoryIndex = categoryIndex - 1;
      newPosition.subcategoryIndex = prevCategory.subcategories.length - 1;
      newPosition.topicIndex = lastSubcategory.topics.length - 1;
      newPosition.questionIndex = lastTopic.questions.length - 1;
    }

    dispatch({ type: 'SET_CURRENT_POSITION', payload: newPosition });

    if (state.sessionId) {
      try {
        await api.updateUserProgress(state.sessionId, {
          currentCategory: newPosition.categoryIndex,
          currentSubcategory: newPosition.subcategoryIndex,
          currentTopic: newPosition.topicIndex,
          currentQuestion: newPosition.questionIndex
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }
  }, [state.currentPosition, state.questionsData, state.sessionId]);

  const calculateProgress = useCallback(() => {
  const totalQuestions = state.progress.totalQuestions;
  // Filter out attention check responses from the count
  const completedQuestions = Array.from(state.responses.keys())
    .filter(questionId => !questionId.startsWith('ATTENTION_CHECK_'))
    .length;
  return totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
}, [state.progress.totalQuestions, state.responses]);

  const getTotalQuestionsInCurrentTopic = useCallback(() => {
    const { categoryIndex, subcategoryIndex, topicIndex } = state.currentPosition;
    const topic = state.questionsData[categoryIndex]?.subcategories[subcategoryIndex]?.topics[topicIndex];
    return topic?.questions.length || 0;
  }, [state.currentPosition, state.questionsData]);

  const getCompletedQuestionsInCurrentTopic = useCallback(() => {
    const { categoryIndex, subcategoryIndex, topicIndex } = state.currentPosition;
    let completed = 0;
    
    const topic = state.questionsData[categoryIndex]?.subcategories[subcategoryIndex]?.topics[topicIndex];
    if (!topic) return 0;
    
    topic.questions.forEach((_, questionIndex) => {
      const questionId = `${categoryIndex}-${subcategoryIndex}-${topicIndex}-${questionIndex}`;
      if (state.responses.has(questionId)) {
        completed++;
      }
    });
    
    return completed;
  }, [state.currentPosition, state.questionsData, state.responses]);

  // Reset session function
  const resetSession = useCallback(() => {
    localStorage.removeItem('culturalSurveySessionId');
    localStorage.removeItem('culturalSurveyStartTime');
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    surveyStartTimeRef.current = 0;
    dispatch({ type: 'RESET_FORM' });
  }, [timerInterval]);
  
  const value: FormContextType = {
    state,
    dispatch,
    createUserSession,
    saveResponse,
    navigateToNext,
    navigateToPrevious,
    calculateProgress,
    getCurrentQuestion,
    getCurrentQuestionData,
    getTotalQuestionsInCurrentTopic,
    getCompletedQuestionsInCurrentTopic,
    loadUserSession,
    navigateToPosition,
    resetSession,
    startSurveyTimer,
    resumeSurveyTimer,
    formatTimeElapsed,
    setAttentionCheckFailed,
    setTiming,
  };

  return (
    <FormContext.Provider value={value}>
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
}