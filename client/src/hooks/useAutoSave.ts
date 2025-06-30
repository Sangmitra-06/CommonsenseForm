import { useEffect, useRef } from 'react';
import { useForm } from '../context/FormContext.tsx';

export function useAutoSave(interval: number = 30000) {
  const { state, saveResponse } = useForm();
  const lastSaveRef = useRef<number>(0);
  const pendingResponses = useRef<Set<string>>(new Set());

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      // Check if there are unsaved responses
      const now = Date.now();
      const timeSinceLastSave = now - state.lastSaveTime;
      
      if (timeSinceLastSave > interval && pendingResponses.current.size > 0) {
        console.log('Auto-saving responses...');
        // Auto-save logic would go here if needed
        // For now, we save individual responses immediately
      }
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }, [state.lastSaveTime, interval]);

  const markForSave = (questionId: string) => {
    pendingResponses.current.add(questionId);
  };

  const markSaved = (questionId: string) => {
    pendingResponses.current.delete(questionId);
  };

  return { markForSave, markSaved };
}