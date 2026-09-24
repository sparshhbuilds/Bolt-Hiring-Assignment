import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

// Email validation regex (standard RFC 5322 approximation)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RecognitionResult {
  recognized: boolean;
  user?: { email: string; firstName: string };
}

export function useEmailRecognition() {
  const [email, setEmail] = useState('');
  const [isRecognized, setIsRecognized] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [recognizedUser, setRecognizedUser] = useState<{ email: string; firstName: string } | null>(null);
  
  // Ref to hold the current AbortController so we can cancel pending requests
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Immediately cancel any in-flight requests and wipe previous recognition state
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRecognized(false);
    setRecognizedUser(null);

    // 1. Check valid syntax
    if (!EMAIL_REGEX.test(email)) {
      return;
    }

    // Create a new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // 2. Debounce the API call
    const timer = setTimeout(async () => {
      setIsChecking(true);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/recognize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data: RecognitionResult = await response.json();
        
        setIsRecognized(data.recognized);
        if (data.recognized && data.user) {
          setRecognizedUser(data.user);
        } else {
          setRecognizedUser(null);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Request aborted for:', email);
        } else {
          console.error('Recognition error:', err);
        }
      } finally {
        setIsChecking(false);
      }
    }, 350); // 350ms debounce time

    // Cleanup function runs if email changes before the timeout fires
    return () => {
      clearTimeout(timer);
    };
  }, [email]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    email,
    setEmail,
    isRecognized,
    isChecking,
    recognizedUser,
    setIsRecognized // Allow manual override (e.g. to close the modal on skip)
  };
}
