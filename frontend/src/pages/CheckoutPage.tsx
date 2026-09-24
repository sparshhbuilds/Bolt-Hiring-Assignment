import { useState } from 'react';
import { useEmailRecognition } from '../hooks/useEmailRecognition';
import { RecognitionModal } from '../components/RecognitionModal';
import { ShoppingBag, CheckCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export function CheckoutPage() {
  const { email, setEmail, isRecognized, isChecking, recognizedUser, setIsRecognized } = useEmailRecognition();

  const [formData, setFormData] = useState({
    phone: '',
    shippingName: '',
    addressLine1: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const [loggedInUser, setLoggedInUser] = useState<any>(null);
  const [guestDismissed, setGuestDismissed] = useState(false);
  const [orderComplete, setOrderComplete] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Should we show the modal?
  // Yes, if recognized AND not logged in AND hasn't dismissed it.
  const showModal = isRecognized && !loggedInUser && !guestDismissed;

  const handleVerify = async (code: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    return res.json();
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: loggedInUser?.id || null,
          email,
          phone: formData.phone,
          shippingName: formData.shippingName,
          addressLine1: formData.addressLine1,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          isGuest: !loggedInUser
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrderComplete(data.order);
      } else {
        setSubmitError(data.message || 'Failed to place order.');
      }
    } catch (err) {
      setSubmitError('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="container" style={{ marginTop: '4rem', maxWidth: '600px' }}>
        <div className="card text-center" style={{ padding: '4rem 2rem' }}>
          <div style={{ display: 'inline-flex', background: 'var(--success)', padding: '1rem', borderRadius: '50%', marginBottom: '1.5rem', color: 'white' }}>
            <CheckCircle size={48} />
          </div>
          <h1>Order Confirmed!</h1>
          <p className="mb-6">Thank you for your purchase.</p>

          <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
            <p className="mb-2"><strong>Order ID:</strong> {orderComplete.id}</p>
            <p className="mb-2"><strong>Email:</strong> {orderComplete.email}</p>
            <p className="mb-2"><strong>Total:</strong> ${orderComplete.orderTotal}</p>
            <p><strong>Status:</strong> {orderComplete.isGuest ? 'Guest Checkout' : 'Authenticated Purchase'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '2rem' }}>

      {/* Logged in Badge */}
      {loggedInUser && (
        <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
          <CheckCircle size={20} />
          <span><strong>Securely signed in as {loggedInUser.firstName} {loggedInUser.lastName}</strong> ({loggedInUser.email})</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        {/* Checkout Form */}
        <div className="card">
          <h2 className="mb-6">Checkout</h2>

          <form onSubmit={handleCheckoutSubmit}>
            <div className="mb-6">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Contact Information</h3>

              <div className="input-group" style={{ position: 'relative' }}>
                <label className="input-label">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="you@example.com"
                  value={loggedInUser ? loggedInUser.email : email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setGuestDismissed(false);
                  }}
                  disabled={!!loggedInUser}
                  required
                />
                {isChecking && (
                  <div style={{ position: 'absolute', right: '1rem', top: '2.2rem' }}>
                    <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--accent)' }}></div>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="mb-8">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Shipping Address</h3>

              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.shippingName}
                  onChange={(e) => setFormData({ ...formData, shippingName: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Address Line 1</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">City</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">State</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="input-group" style={{ width: '50%' }}>
                <label className="input-label">Postal Code</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  required
                />
              </div>
            </div>

            {submitError && (
              <div className="mb-4 text-center error-text">{submitError}</div>
            )}

            <button type="submit" className="btn btn-primary w-full" style={{ padding: '1rem', fontSize: '1.1rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Complete Purchase'}
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '2rem' }}>
            <div className="flex items-center gap-2 mb-4" style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
              <ShoppingBag size={20} />
              <h3 style={{ margin: 0 }}>Order Summary</h3>
            </div>

            <div className="flex justify-between mb-4">
              <div className="flex gap-4">
                <div style={{ width: '60px', height: '60px', background: '#f3f4f6', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  📦
                </div>
                <div>
                  <p style={{ fontWeight: 500, color: 'var(--text-main)' }}>Home Theatre</p>
                  <p style={{ fontSize: '0.875rem' }}>Qty: 1</p>
                </div>
              </div>
              <div style={{ fontWeight: 500 }}>INR 9500</div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border)', margin: '1rem 0' }}></div>

            <div className="flex justify-between mb-2" style={{ fontSize: '0.875rem' }}>
              <p>Subtotal</p>
              <p>INR 9500</p>
            </div>
            <div className="flex justify-between mb-4" style={{ fontSize: '0.875rem' }}>
              <p>Shipping</p>
              <p style={{ color: 'var(--success)' }}>Free</p>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', margin: '1rem 0' }}></div>

            <div className="flex justify-between items-center">
              <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Total</p>
              <p style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--text-main)' }}>INR 9500</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recognition Modal */}
      <RecognitionModal
        isOpen={showModal}
        userEmail={email}
        userFirstName={recognizedUser?.firstName || ''}
        onVerify={handleVerify}
        onSkip={() => {
          setGuestDismissed(true);
          setIsRecognized(false);
        }}
        onSuccess={(user) => {
          setLoggedInUser(user);
          setFormData(prev => ({
            ...prev,
            shippingName: `${user.firstName} ${user.lastName}`
          }));
        }}
      />
    </div>
  );
}
