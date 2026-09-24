import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, Copy, Check } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export function RegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successCode, setSuccessCode] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessCode(data.code);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('A network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(successCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (successCode) {
    return (
      <div className="container" style={{ maxWidth: '600px', marginTop: '4rem' }}>
        <div className="card text-center" style={{ padding: '3rem' }}>
          <div style={{ display: 'inline-flex', background: '#e0e7ff', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', color: 'var(--accent)' }}>
            <UserPlus size={40} />
          </div>
          <h1>Account Created Successfully!</h1>
          <p className="mb-6">Your account is ready. Save this 6-digit code—you'll need it to log in seamlessly during checkout.</p>

          <div className="code-display flex items-center justify-center gap-4" style={{ margin: '2rem 0' }}>
            <span>{successCode}</span>
          </div>

          <div className="flex gap-4" style={{ justifyContent: 'center' }}>
            <button onClick={handleCopy} className="btn btn-ghost flex items-center gap-2">
              {copied ? <Check size={18} color="var(--success)" /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            <button onClick={() => navigate('/checkout')} className="btn btn-primary flex items-center gap-2">
              Try Checkout Flow <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '500px', marginTop: '2rem' }}>
      <div className="card">
        <div className="text-center mb-6">
          <h1 style={{ fontSize: '1.75rem' }}>Create your Account</h1>
          <p>Get a seamless one-click checkout experience.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <div className="input-group w-full">
              <label className="input-label">First Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="input-group w-full">
              <label className="input-label">Last Name</label>
              <input
                type="text"
                className="input-field"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="input-group mb-6">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          {error && <div className="mb-4 text-center error-text">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}
