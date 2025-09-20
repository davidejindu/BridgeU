import { useState, FormEvent } from 'react';
import './Auth.css';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login = ({ onSwitchToSignup }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Login:', { username, password, rememberMe });
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
            <label htmlFor="loginUsername">Username</label>
            <input
              type="text"
              id="loginUsername"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

          </div>

          <button type="submit" className="submit-button">Sign In</button>
        </form>
      </div>
    </>
  );
};

export default Login;
