import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { FormState, UserInfo, QuestionResponse, Category, Progress } from '../types/index.ts';
import { loadQuestionsData } from '../utils/helpers.ts';
import * as api from '../services/api.ts';

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
  | { type: 'RESET_FORM' };

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
    totalQuestions: 585, // Updated to match your data
    completedTopics: [],
    attentionChecksPassed: 0,
    attentionChecksFailed: 0
  },
  isLoading: false,
  error: null,
  questionsData: [],
  startTime: 0,
  lastSaveTime: 0,
  isCompleted: false
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
      return initialState;
    default:
      return state;
  }
}

// Add this to the FormContextType interface (around line 80)
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
  resetSession: () => void; // Add this line
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, initialState);

  // Load questions data only once on mount
  // In the FormProvider component, update the useEffect that loads questions:

  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        console.log('FormContext: Loading questions data...');
        const data = await loadQuestionsData();
        console.log('FormContext: Questions loaded:', data.length, 'categories');
        
        dispatch({ type: 'SET_QUESTIONS_DATA', payload: data });
        
        // Calculate total questions
        const totalQuestions = data.reduce((total, category) => {
          return total + category.subcategories.reduce((subTotal, subcategory) => {
            return subTotal + subcategory.topics.reduce((topicTotal, topic) => {
              return topicTotal + topic.questions.length;
            }, 0);
          }, 0);
        }, 0);
        
        console.log('FormContext: Total questions calculated:', totalQuestions);
        dispatch({ type: 'UPDATE_PROGRESS', payload: { totalQuestions } });
        
      } catch (error) {
        console.error('FormContext: Error loading questions:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load questions data. Please refresh the page.' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []); // Empty dependency array - only run once

  const createUserSession = useCallback(async (userInfo: UserInfo) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await api.createUser(userInfo);
      dispatch({ type: 'SET_SESSION_ID', payload: response.sessionId });
      dispatch({ type: 'SET_USER_INFO', payload: userInfo });
      dispatch({ type: 'SET_START_TIME', payload: Date.now() });
      
      // Store session ID in localStorage for recovery
      localStorage.setItem('culturalSurveySessionId', response.sessionId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create user session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const loadUserSession = useCallback(async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const user = await api.getUser(sessionId);
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
      dispatch({ type: 'SET_USER_INFO', payload: user.userInfo });
      dispatch({ type: 'UPDATE_PROGRESS', payload: user.progress });
      dispatch({ type: 'SET_COMPLETED', payload: user.isCompleted });
      
      // Load responses
      const responses = await api.getUserResponses(sessionId);
      dispatch({ type: 'SET_RESPONSES', payload: responses });
      
      // Set current position
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex: user.progress.currentCategory,
        subcategoryIndex: user.progress.currentSubcategory,
        topicIndex: user.progress.currentTopic,
        questionIndex: user.progress.currentQuestion
      }});
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const resetSession = useCallback(() => {
    localStorage.removeItem('culturalSurveySessionId');
    dispatch({ type: 'RESET_FORM' });
  }, []);


  const saveResponse = useCallback(async (response: QuestionResponse) => {
  try {
    console.log('FormContext: Saving response:', response);
    await api.saveResponse(response);
    dispatch({ type: 'ADD_RESPONSE', payload: response });
    dispatch({ type: 'SET_LAST_SAVE_TIME', payload: Date.now() });
    
    // Update progress - but don't increment if we're updating an existing response
    const isNewResponse = !state.responses.has(response.questionId);
    if (isNewResponse) {
      const completedQuestions = state.progress.completedQuestions + 1;
      dispatch({ type: 'UPDATE_PROGRESS', payload: { completedQuestions } });
    }
    
  } catch (error) {
    console.error('FormContext: Error saving response:', error);
    dispatch({ type: 'SET_ERROR', payload: 'Failed to save response' });
    throw error;
  }
}, [state.responses, state.progress.completedQuestions]);

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

  const navigateToNext = useCallback(() => {
    const { categoryIndex, subcategoryIndex, topicIndex, questionIndex } = state.currentPosition;
    const category = state.questionsData[categoryIndex];
    
    if (!category) return;
    
    const subcategory = category.subcategories[subcategoryIndex];
    const topic = subcategory?.topics[topicIndex];
    
    if (!topic) return;
    
    // Move to next question
    if (questionIndex < topic.questions.length - 1) {
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex,
        subcategoryIndex,
        topicIndex,
        questionIndex: questionIndex + 1
      }});
    }
    // Move to next topic
    else if (topicIndex < subcategory.topics.length - 1) {
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex,
        subcategoryIndex,
        topicIndex: topicIndex + 1,
        questionIndex: 0
      }});
    
    
    }
    // Move to next subcategory
    else if (subcategoryIndex < category.subcategories.length - 1) {
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex,
        subcategoryIndex: subcategoryIndex + 1,
        topicIndex: 0,
        questionIndex: 0
      }});
    }
    // Move to next category
    else if (categoryIndex < state.questionsData.length - 1) {
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex: categoryIndex + 1,
        subcategoryIndex: 0,
        topicIndex: 0,
        questionIndex: 0
      }});
    }
    // Survey completed
    else {
      dispatch({ type: 'SET_COMPLETED', payload: true });
    }
  }, [state.currentPosition, state.questionsData]);

  const navigateToPrevious = useCallback(() => {
    const { categoryIndex, subcategoryIndex, topicIndex, questionIndex } = state.currentPosition;
    
    // Move to previous question
    if (questionIndex > 0) {
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex,
        subcategoryIndex,
        topicIndex,
        questionIndex: questionIndex - 1
      }});
    }
    // Move to previous topic
    else if (topicIndex > 0) {
      const prevTopic = state.questionsData[categoryIndex].subcategories[subcategoryIndex].topics[topicIndex - 1];
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex,
        subcategoryIndex,
        topicIndex: topicIndex - 1,
        questionIndex: prevTopic.questions.length - 1
      }});
    }
    // Move to previous subcategory
    else if (subcategoryIndex > 0) {
      const prevSubcategory = state.questionsData[categoryIndex].subcategories[subcategoryIndex - 1];
      const lastTopic = prevSubcategory.topics[prevSubcategory.topics.length - 1];
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex,
        subcategoryIndex: subcategoryIndex - 1,
        topicIndex: prevSubcategory.topics.length - 1,
        questionIndex: lastTopic.questions.length - 1
      }});
    }
    // Move to previous category
    else if (categoryIndex > 0) {
      const prevCategory = state.questionsData[categoryIndex - 1];
      const lastSubcategory = prevCategory.subcategories[prevCategory.subcategories.length - 1];
      const lastTopic = lastSubcategory.topics[lastSubcategory.topics.length - 1];
      dispatch({ type: 'SET_CURRENT_POSITION', payload: {
        categoryIndex: categoryIndex - 1,
        subcategoryIndex: prevCategory.subcategories.length - 1,
        topicIndex: lastSubcategory.topics.length - 1,
        questionIndex: lastTopic.questions.length - 1
      }});
    }
  }, [state.currentPosition, state.questionsData]);

  const calculateProgress = useCallback(() => {
    const totalQuestions = state.progress.totalQuestions;
    const completedQuestions = state.responses.size;
    return totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;
  }, [state.progress.totalQuestions, state.responses.size]);

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
    resetSession // Add this line
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