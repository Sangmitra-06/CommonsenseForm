import React, { useState, useEffect } from 'react';
import { FormProvider, useForm } from './context/FormContext.tsx';
import Introduction from './components/Introduction.tsx';
import UserInfo from './components/UserInfo.tsx';
import QuestionForm from './components/QuestionForm.tsx';
import CompletionPage from './components/CompletionPage.tsx';
import './App.css';

type AppStage = 'introduction' | 'userInfo' | 'questions' | 'completed';

function AppContent() {
  const { state, createUserSession, loadUserSession } = useForm();
  const [currentStage, setCurrentStage] = useState<AppStage>('introduction');
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null);

  // Wait for questions data to load before checking sessions
  useEffect(() => {
    if (state.questionsData.length > 0 && !hasCheckedSession) {
      const checkExistingSession = async () => {
        const savedSessionId = localStorage.getItem('culturalSurveySessionId');
        console.log('Checking for existing session:', savedSessionId);
        
        if (savedSessionId) {
          try {
            // Just check if the session exists, don't load it yet
            const response = await fetch(`http://localhost:5000/api/users/${savedSessionId}`);
            if (response.ok) {
              const userData = await response.json();
              console.log('Found existing session:', userData);
              
              if (userData.isCompleted) {
                // If survey is completed, start fresh
                localStorage.removeItem('culturalSurveySessionId');
                setHasExistingSession(false);
              } else {
                // Valid incomplete session found
                setHasExistingSession(true);
                setExistingSessionId(savedSessionId);
              }
            } else {
              // Session doesn't exist on server, remove from localStorage
              localStorage.removeItem('culturalSurveySessionId');
              setHasExistingSession(false);
            }
          } catch (error) {
            console.error('Error checking existing session:', error);
            localStorage.removeItem('culturalSurveySessionId');
            setHasExistingSession(false);
          }
        }
        
        setHasCheckedSession(true);
        setIsInitializing(false);
      };

      checkExistingSession();
    }
  }, [state.questionsData.length, hasCheckedSession]);

  // Update stage based on form state
  useEffect(() => {
    if (!hasCheckedSession) return;
    
    if (state.isCompleted) {
      setCurrentStage('completed');
    } else if (state.sessionId && state.userInfo) {
      setCurrentStage('questions');
    }
  }, [state.isCompleted, state.sessionId, state.userInfo, hasCheckedSession]);

  const handleStartNewSurvey = () => {
    // Clear any existing session
    if (hasExistingSession) {
      localStorage.removeItem('culturalSurveySessionId');
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
        // If resume fails, start fresh
        localStorage.removeItem('culturalSurveySessionId');
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
    case 'introduction':
      return (
        <Introduction 
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
    default:
      return (
        <Introduction 
          onStartNew={handleStartNewSurvey}
          onResume={handleResumeSurvey}
          hasExistingSession={hasExistingSession}
        />
      );
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