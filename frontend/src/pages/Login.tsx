import { useState, FormEvent } from 'react';
import './Auth.css';
import { loginUser, LoginData } from '../services/authService';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login = ({ onSwitchToSignup }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginData: LoginData = { username, password };
      const response = await loginUser(loginData);
      
      if (response.success) {
        console.log('Login successful:', response.user);
        // Redirect to dashboard or main app
        // You can add navigation logic here
        alert('Login successful! Welcome back!');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
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
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="loginUsername">Username</label>
            <input
              type="text"
              id="loginUsername"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <span>Remember me</span>
            </label>

          </div>

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </>
  );
};

export default Login;
