import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';

// regex to make sure email looks legit before we bother calling backend
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
  
  // keeping track of pending network requests so we can cancel old ones if user keeps typing
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // wiping old state and cancelling any active fetch so stale user data doesn't pop up
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRecognized(false);
    setRecognizedUser(null);

    // skip api call if the user hasn't finished typing a valid email format
    if (!EMAIL_REGEX.test(email)) {
      return;
    }

    // setting up a fresh cancellation handle for this brand new request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // waiting 350ms after typing stops so we don't spam the server on every single letter
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
    }, 350); // 350ms delay buffer

    // clearing timer if the user types another letter before the 350ms finishes
    return () => {
      clearTimeout(timer);
    };
  }, [email]);

  // aborting any active fetch if the component gets unmounted
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
    setIsRecognized // letting parent components override recognition state like when clicking skip
  };
}
