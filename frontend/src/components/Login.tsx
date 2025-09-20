import { useState, FormEvent } from 'react';
import './Auth.css';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login = ({ onSwitchToSignup }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Login:', { email, password, rememberMe });
  };

  return (
    <>
      <div className="auth-tabs">
        <button className="tab-button active">Sign In</button>
        <button className="tab-button" onClick={onSwitchToSignup}>
          Create Account
        </button>
      </div>

      <div className="auth-form-container">
        <h2>Sign in to your account</h2>
        <p className="form-subtitle">Enter your credentials to access your dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="loginEmail">Email</label>
            <input
              type="email"
              id="loginEmail"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>
            <div className="password-input-wrapper">
              <input
                type="password"
                id="loginPassword"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>

            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="submit-button">Sign In</button>
        </form>
      </div>
    </>
  );
};

export default Login;
