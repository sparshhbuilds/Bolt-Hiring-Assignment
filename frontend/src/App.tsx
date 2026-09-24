import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { RegistrationPage } from './pages/RegistrationPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { API_BASE_URL } from './config/api';

function App() {
  // silently pre-warming render backend on page load so it wakes up while user fills out form
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/health`).catch(() => {});
  }, []);
  return (
    <BrowserRouter>
      <div className="layout">
        {/* top navbar keeping our brand logo, app title, and nav links aligned */}
        <nav className="navbar" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center' }}>
          <div>
            <Link to="/" className="nav-brand">
              <span style={{ color: 'var(--accent)', marginRight: '0.25rem' }}>⚡</span>
              FlashLogin
            </Link>
          </div>

          <div style={{ textAlign: 'center', fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>
            OTP based User Login Web App
          </div>

          <div className="nav-links" style={{ justifyContent: 'flex-end' }}>
            <Link to="/register" className="nav-link">Register</Link>
            <Link to="/checkout" className="nav-link">Checkout</Link>
          </div>
        </nav>

        {/* main container switching between registration and checkout pages based on url */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/register" replace />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
