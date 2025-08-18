import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef } from 'react';
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
    totalQuestions: 0, // Updated to match your data
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
  navigateToPosition: (categoryIndex: number, subcategoryIndex: number, topicIndex: number, questionIndex: number) => Promise<void>;
  resetSession: () => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const hasLoadedQuestions = useRef(false); // Prevent double loading
  const isLoadingSession = useRef(false); // Prevent double session loading

  // Load questions data only once
  useEffect(() => {
    if (hasLoadedQuestions.current) return; // Prevent double loading
    
    const loadData = async () => {
      try {
        hasLoadedQuestions.current = true;
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });
        
        console.log('FormContext: Loading questions data...');
        const data = await loadQuestionsData();
        console.log('FormContext: Questions loaded:', data.length, 'categories');
        
        dispatch({ type: 'SET_QUESTIONS_DATA', payload: data });
        
        // Calculate total questions from the actual loaded data
        const totalQuestions = getTotalQuestions(data);
        console.log('FormContext: Total questions calculated:', totalQuestions);
        
        dispatch({ type: 'UPDATE_PROGRESS', payload: { totalQuestions } });
        
      } catch (error) {
        console.error('FormContext: Error loading questions:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load questions data. Please refresh the page.' });
        hasLoadedQuestions.current = false; // Allow retry
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []); // Keep empty dependency array

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

  // Update the loadUserSession function to recalculate total questions
const loadUserSession = useCallback(async (sessionId: string) => {
    if (isLoadingSession.current) return; // Prevent double loading
    
    try {
      isLoadingSession.current = true;
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('FormContext: Loading user session...');
      const user = await api.getUser(sessionId);
      
      dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
      dispatch({ type: 'SET_USER_INFO', payload: user.userInfo });
      dispatch({ type: 'SET_COMPLETED', payload: user.isCompleted });
      
      // Load responses
      console.log('FormContext: Loading user responses...');
      const responses = await api.getUserResponses(sessionId);
      console.log('FormContext: Responses loaded:', responses.length);
      
      dispatch({ type: 'SET_RESPONSES', payload: responses });
      
      // IMPORTANT: Recalculate total questions from current data
      const totalQuestions = getTotalQuestions(state.questionsData);
      
      // Update progress with recalculated total
      const updatedProgress = {
        ...user.progress,
        totalQuestions, // Use the recalculated total
        completedQuestions: responses.length // Update with actual response count
      };
      
      dispatch({ type: 'UPDATE_PROGRESS', payload: updatedProgress });
      
      // Find the correct starting position
      const nextPosition = findNextUnansweredQuestion(responses, state.questionsData);
      console.log('FormContext: Setting position to:', nextPosition);
      
      dispatch({ type: 'SET_CURRENT_POSITION', payload: nextPosition });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load user session' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      isLoadingSession.current = false;
    }
  }, [state.questionsData]);

  const findNextUnansweredQuestion = useCallback((responses: QuestionResponse[], questionsData: Category[]) => {
    const answeredQuestions = new Set(responses.map(r => r.questionId));
    
    // Iterate through all questions to find the first unanswered one
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
    
    // If all questions are answered, return the last position
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

// Add navigation function
  const navigateToPosition = useCallback(async (categoryIndex: number, subcategoryIndex: number, topicIndex: number, questionIndex: number) => {
    const newPosition = { categoryIndex, subcategoryIndex, topicIndex, questionIndex };
    dispatch({ type: 'SET_CURRENT_POSITION', payload: newPosition });

    // Save position to database
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

  // Move to next question
  if (questionIndex < topic.questions.length - 1) {
    newPosition.questionIndex = questionIndex + 1;
  }
  // Move to next topic
  else if (topicIndex < subcategory.topics.length - 1) {
    newPosition.topicIndex = topicIndex + 1;
    newPosition.questionIndex = 0;
  }
  // Move to next subcategory
  else if (subcategoryIndex < category.subcategories.length - 1) {
    newPosition.subcategoryIndex = subcategoryIndex + 1;
    newPosition.topicIndex = 0;
    newPosition.questionIndex = 0;
  }
  // Move to next category
  else if (categoryIndex < state.questionsData.length - 1) {
    newPosition.categoryIndex = categoryIndex + 1;
    newPosition.subcategoryIndex = 0;
    newPosition.topicIndex = 0;
    newPosition.questionIndex = 0;
  }
  // Survey completed
  else {
    dispatch({ type: 'SET_COMPLETED', payload: true });
    return;
  }

  dispatch({ type: 'SET_CURRENT_POSITION', payload: newPosition });

  // Save position to database
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

  // Move to previous question
  if (questionIndex > 0) {
    newPosition.questionIndex = questionIndex - 1;
  }
  // Move to previous topic
  else if (topicIndex > 0) {
    const prevTopic = state.questionsData[categoryIndex].subcategories[subcategoryIndex].topics[topicIndex - 1];
    newPosition.topicIndex = topicIndex - 1;
    newPosition.questionIndex = prevTopic.questions.length - 1;
  }
  // Move to previous subcategory
  else if (subcategoryIndex > 0) {
    const prevSubcategory = state.questionsData[categoryIndex].subcategories[subcategoryIndex - 1];
    const lastTopic = prevSubcategory.topics[prevSubcategory.topics.length - 1];
    newPosition.subcategoryIndex = subcategoryIndex - 1;
    newPosition.topicIndex = prevSubcategory.topics.length - 1;
    newPosition.questionIndex = lastTopic.questions.length - 1;
  }
  // Move to previous category
  else if (categoryIndex > 0) {
    const prevCategory = state.questionsData[categoryIndex - 1];
    const lastSubcategory = prevCategory.subcategories[prevCategory.subcategories.length - 1];
    const lastTopic = lastSubcategory.topics[lastSubcategory.topics.length - 1];
    newPosition.categoryIndex = categoryIndex - 1;
    newPosition.subcategoryIndex = prevCategory.subcategories.length - 1;
    newPosition.topicIndex = lastSubcategory.topics.length - 1;
    newPosition.questionIndex = lastTopic.questions.length - 1;
  }

  dispatch({ type: 'SET_CURRENT_POSITION', payload: newPosition });

  // Save position to database
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

 const resetSession = useCallback(() => {
    localStorage.removeItem('culturalSurveySessionId');
    dispatch({ type: 'RESET_FORM' });
  }, []);

  
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
      resetSession
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