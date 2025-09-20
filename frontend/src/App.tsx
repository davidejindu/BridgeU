import { useState } from 'react';
import Login from './components/Login';
import Signup from './components/Signup';
import "./components/Auth.css";


function App() {
  const [currentView, setCurrentView] = useState<'login' | 'signup'>('login');

  return (
    <div className="auth-container">
      <header className="auth-header">
        <h1>Welcome Back</h1>
        <p className="auth-subtitle">
          {currentView === 'login'
            ? 'Sign in to your account to continue your journey'
            : 'Join thousands of international students worldwide'}
        </p>
      </header>

      {currentView === 'login' ? (
        <Login onSwitchToSignup={() => setCurrentView('signup')} />
      ) : (
        <Signup onSwitchToLogin={() => setCurrentView('login')} />
      )}
    </div>
  );
}

export default App;
