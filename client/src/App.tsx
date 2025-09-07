import React, { useState, useEffect } from 'react';
import { FormProvider, useForm } from './context/FormContext.tsx';
import ConsentForm from './components/ConsentForm.tsx';
import ConsentDeclined from './components/ConsentDeclines.tsx';
import IntroductionWelcome from './components/IntroductionWelcome.tsx';
import IntroductionStructure from './components/IntroductionStructure.tsx';
import UserInfo from './components/UserInfo.tsx';
import QuestionForm from './components/QuestionForm.tsx';
import CompletionPage from './components/CompletionPage.tsx';
import SurveyExpired from './components/SurveyExpired.tsx';
import './App.css';

type AppStage = 'consent' | 'declined' | 'welcome' | 'structure' | 'userInfo' | 'questions' | 'completed' | 'expired' | 'attentionFailed';

function AppContent() {
  const { state, createUserSession, loadUserSession } = useForm();
  const [currentStage, setCurrentStage] = useState<AppStage>('consent'); // Start with consent
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null);

  // NEW: Check for attention check failure
  useEffect(() => {
    if (state.attentionCheckFailed) {
      setCurrentStage('attentionFailed');
    }
  }, [state.attentionCheckFailed]);

  // Wait for questions data to load
  useEffect(() => {
    if (state.questionsData.length > 0 && !hasCheckedSession && !state.isLoading) {
      const checkExistingSession = async () => {
        console.log('App: Checking for existing session...');
        
        // For one-sitting surveys, always clear old sessions
        const savedSessionId = localStorage.getItem('culturalSurveySessionId');
        const savedStartTime = localStorage.getItem('culturalSurveyStartTime');
        
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

  // Add this useEffect to handle page reloads
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show warning if survey is in progress
      if (state.sessionId && !state.isCompleted && !state.surveyExpired && !state.attentionCheckFailed) {
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
  }, [state.sessionId, state.isCompleted, state.surveyExpired, state.attentionCheckFailed]);

  // Update stage based on form state
  useEffect(() => {
    if (!hasCheckedSession) return;
    
    if (state.attentionCheckFailed) {
      setCurrentStage('attentionFailed');
    } else if (state.surveyExpired) {
      setCurrentStage('expired');
    } else if (state.isCompleted) {
      setCurrentStage('completed');
    } else if (state.sessionId && state.userInfo) {
      setCurrentStage('questions');
    }
  }, [state.attentionCheckFailed, state.surveyExpired, state.isCompleted, state.sessionId, state.userInfo, hasCheckedSession]);

  // Consent handlers
  const handleConsent = () => {
    setCurrentStage('welcome');
  };

  const handleDeclineConsent = () => {
    setCurrentStage('declined');
  };

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

  // Show consent form immediately, don't wait for initialization if on consent stage
  if (currentStage === 'consent') {
    return (
      <ConsentForm 
        onConsent={handleConsent} 
        onDecline={handleDeclineConsent} 
      />
    );
  }

  // Show declined page immediately
  if (currentStage === 'declined') {
    return <ConsentDeclined />;
  }

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

  if (state.attentionCheckFailed) {
    return <CompletionPage isAttentionCheckFailure={true} />;
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
    case 'attentionFailed':
      return <CompletionPage isAttentionCheckFailure={true} />;
    case 'expired':
      return <SurveyExpired />;
    default:
      return (
        <ConsentForm 
          onConsent={handleConsent} 
          onDecline={handleDeclineConsent} 
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