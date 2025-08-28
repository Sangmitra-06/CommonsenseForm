import React, { useState, useEffect } from 'react';
import { FormProvider, useForm } from './context/FormContext.tsx';
import IntroductionWelcome from './components/IntroductionWelcome.tsx';
import IntroductionStructure from './components/IntroductionStructure.tsx';
import UserInfo from './components/UserInfo.tsx';
import QuestionForm from './components/QuestionForm.tsx';
import CompletionPage from './components/CompletionPage.tsx';
import SurveyExpired from './components/SurveyExpired.tsx';
import './App.css';

type AppStage = 'welcome' | 'structure' | 'userInfo' | 'questions' | 'completed' | 'expired';

function AppContent() {
  const { state, createUserSession, loadUserSession } = useForm();
  const [currentStage, setCurrentStage] = useState<AppStage>('welcome');
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null);

  // Wait for questions data to load
  useEffect(() => {
    if (state.questionsData.length > 0 && !hasCheckedSession && !state.isLoading) {
      const checkExistingSession = async () => {
        console.log('App: Checking for existing session...');
        const savedSessionId = localStorage.getItem('culturalSurveySessionId');
        
        if (savedSessionId) {
          try {
            const response = await fetch(`http://localhost:5000/api/users/${savedSessionId}`);
            if (response.ok) {
              const userData = await response.json();
              console.log('App: Found existing session');
              
              if (userData.isCompleted) {
                localStorage.removeItem('culturalSurveySessionId');
                localStorage.removeItem('culturalSurveyStartTime');
                setHasExistingSession(false);
              } else {
                // Check if session has expired
                const savedStartTime = localStorage.getItem('culturalSurveyStartTime');
                if (savedStartTime) {
                  const elapsed = Date.now() - parseInt(savedStartTime);
                  const timeLimit = 15 * 60 * 1000; // 15 minutes
                  
                  if (elapsed >= timeLimit) {
                    console.log('Existing session has expired');
                    localStorage.removeItem('culturalSurveySessionId');
                    localStorage.removeItem('culturalSurveyStartTime');
                    setHasExistingSession(false);
                  } else {
                    setHasExistingSession(true);
                    setExistingSessionId(savedSessionId);
                  }
                } else {
                  // No start time found, treat as expired
                  localStorage.removeItem('culturalSurveySessionId');
                  setHasExistingSession(false);
                }
              }
            } else {
              localStorage.removeItem('culturalSurveySessionId');
              localStorage.removeItem('culturalSurveyStartTime');
              setHasExistingSession(false);
            }
          } catch (error) {
            console.error('Error checking existing session:', error);
            localStorage.removeItem('culturalSurveySessionId');
            localStorage.removeItem('culturalSurveyStartTime');
            setHasExistingSession(false);
          }
        }
        
        setHasCheckedSession(true);
        setIsInitializing(false);
      };

      checkExistingSession();
    }
  }, [state.questionsData.length, state.isLoading, hasCheckedSession]);

  // Add this useEffect to handle page reloads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show warning if survey is in progress
      if (state.sessionId && !state.isCompleted && !state.surveyExpired) {
        e.preventDefault();
        e.returnValue = 'Your survey progress will be lost. Are you sure you want to leave?';
        return 'Your survey progress will be lost. Are you sure you want to leave?';
      }
    };

    const handleUnload = () => {
      // Clear session data on page unload
      if (state.sessionId && !state.isCompleted) {
        localStorage.removeItem('culturalSurveySessionId');
        localStorage.removeItem('culturalSurveyStartTime');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [state.sessionId, state.isCompleted, state.surveyExpired]);

  // Modified session checking logic
  useEffect(() => {
    if (state.questionsData.length > 0 && !hasCheckedSession && !state.isLoading) {
      const checkExistingSession = async () => {
        console.log('App: Checking for existing session...');
        const savedSessionId = localStorage.getItem('culturalSurveySessionId');
        const savedStartTime = localStorage.getItem('culturalSurveyStartTime');
        
        // For one-sitting surveys, always clear old sessions
        if (savedSessionId || savedStartTime) {
          console.log('App: Clearing previous session (one-sitting requirement)');
          localStorage.removeItem('culturalSurveySessionId');
          localStorage.removeItem('culturalSurveyStartTime');
          setHasExistingSession(false);
        }
        
        setHasCheckedSession(true);
        setIsInitializing(false);
      };

      checkExistingSession();
    }
  }, [state.questionsData.length, state.isLoading, hasCheckedSession]);

  // Update stage based on form state
  useEffect(() => {
    if (!hasCheckedSession) return;
    
    if (state.surveyExpired) {
      setCurrentStage('expired');
    } else if (state.isCompleted) {
      setCurrentStage('completed');
    } else if (state.sessionId && state.userInfo) {
      setCurrentStage('questions');
    }
  }, [state.surveyExpired, state.isCompleted, state.sessionId, state.userInfo, hasCheckedSession]);

  const handleWelcomeContinue = () => {
    setCurrentStage('structure');
  };

  const handleStartNewSurvey = () => {
    if (hasExistingSession) {
      localStorage.removeItem('culturalSurveySessionId');
      localStorage.removeItem('culturalSurveyStartTime');
      setHasExistingSession(false);
      setExistingSessionId(null);
    }
    setCurrentStage('userInfo');
  };

  const handleResumeSurvey = async () => {
    if (existingSessionId) {
      try {
        console.log('Resuming survey with session:', existingSessionId);
        await loadUserSession(existingSessionId);
        setCurrentStage('questions');
      } catch (error) {
        console.error('Failed to resume session:', error);
        localStorage.removeItem('culturalSurveySessionId');
        localStorage.removeItem('culturalSurveyStartTime');
        setHasExistingSession(false);
        setExistingSessionId(null);
        alert('Unable to resume previous session. Starting fresh.');
        setCurrentStage('userInfo');
      }
    }
  };

  const handleUserInfoSubmit = async (userInfo: any) => {
    try {
      await createUserSession(userInfo);
      setCurrentStage('questions');
    } catch (error) {
      console.error('Failed to create user session:', error);
    }
  };

  if (isInitializing || state.questionsData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {state.questionsData.length === 0 ? 'Loading survey questions...' : 'Checking for existing survey...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Questions loaded: {state.questionsData.length} categories
          </p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Error</h2>
          <p className="text-red-600 mb-4">{state.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  switch (currentStage) {
    case 'welcome':
      return <IntroductionWelcome onContinue={handleWelcomeContinue} />;
    case 'structure':
      return (
        <IntroductionStructure 
          onStartNew={handleStartNewSurvey}
          onResume={handleResumeSurvey}
          hasExistingSession={hasExistingSession}
        />
      );
    case 'userInfo':
      return <UserInfo onSubmit={handleUserInfoSubmit} isLoading={state.isLoading} />;
    case 'questions':
      return <QuestionForm />;
    case 'completed':
      return <CompletionPage />;
    case 'expired':
      return <SurveyExpired />;
    default:
      return <IntroductionWelcome onContinue={handleWelcomeContinue} />;
  }
}

function App() {
  return (
    <FormProvider>
      <div className="App">
        <AppContent />
      </div>
    </FormProvider>
  );
}

export default App;