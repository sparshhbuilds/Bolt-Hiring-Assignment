import { useState, useRef, useEffect } from 'react';
import { X, Lock, AlertCircle } from 'lucide-react';

interface RecognitionModalProps {
  isOpen: boolean;
  userFirstName: string;
  userEmail: string;
  onVerify: (code: string) => Promise<{ success: boolean; message?: string; user?: any }>;
  onSkip: () => void;
  onSuccess: (user: any) => void;
}

export function RecognitionModal({ isOpen, userFirstName, userEmail, onVerify, onSkip, onSuccess }: RecognitionModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small timeout to allow CSS animation to start
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setCode('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Please enter a 6-digit code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await onVerify(code);
      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setError(result.message || 'Invalid code.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onSkip}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onSkip}
          style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <div style={{ display: 'inline-flex', background: 'var(--bg-color)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Lock size={32} color="var(--accent)" />
          </div>
          <h2>Welcome back, {userFirstName}!</h2>
          <p>We found your account for <strong>{userEmail}</strong>. Enter your 6-digit login code to checkout faster.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setCode(val);
                if (error) setError('');
              }}
              className={`input-field text-center code-display ${error ? 'error' : ''}`}
              style={{ fontSize: '2rem', letterSpacing: '0.5rem', padding: '1rem' }}
              placeholder="------"
              disabled={isLoading}
            />
            {error && (
              <div className="flex items-center gap-2 mt-4 text-center" style={{ color: 'var(--error)', justifyContent: 'center' }}>
                <AlertCircle size={16} />
                <span className="error-text" style={{ marginTop: 0 }}>{error}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4" style={{ flexDirection: 'column', marginTop: '2rem' }}>
            <button 
              type="submit" 
              className="btn btn-accent w-full"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? <div className="spinner"></div> : 'Verify & Sign In'}
            </button>
            <button 
              type="button" 
              className="btn btn-ghost w-full"
              onClick={onSkip}
              disabled={isLoading}
            >
              Skip & Continue as Guest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
