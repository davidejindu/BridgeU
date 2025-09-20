import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, LoginData } from '../services/authService';

const LoginPageSimple: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const loginData: LoginData = { username, password };
      const response = await loginUser(loginData);
      
      if (response.success) {
        console.log('Login successful:', response.user);
        navigate('/');
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f9ff', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <Link 
          to="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            color: '#6b7280', 
            textDecoration: 'none',
            marginBottom: '2rem'
          }}
        >
          ← Back to Home
        </Link>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              Welcome Back
            </h1>
            <p style={{ color: '#6b7280' }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
                required
                disabled={isLoading}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  style={{ marginRight: '0.5rem' }}
                />
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Remember me</span>
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: '#2563eb', textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.5 : 1
              }}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{ color: '#2563eb', fontWeight: '600', textDecoration: 'none' }}>
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPageSimple;
