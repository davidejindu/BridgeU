import { useState, ChangeEvent, FormEvent } from 'react';
import './Auth.css';
import UniversitySelector from './UniversitySelector';
import CountrySelector from './CountrySelector';

interface SignupProps {
  onSwitchToLogin: () => void;
}

const Signup = ({ onSwitchToLogin }: SignupProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: '',
    university: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Signup:', formData);
  };

  return (
    <>
      <div className="auth-tabs signup-tabs">
        <button className="tab-button" onClick={onSwitchToLogin}>
          Sign In
        </button>
        <button className="tab-button active">Create Account</button>
      </div>

      <div className="auth-form-container">
        <h2>Create your account</h2>
        <p className="form-subtitle">Join thousands of international students worldwide</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>


          <div className="form-group">
            <label htmlFor="country">Country</label>
            <CountrySelector
              value={formData.country}
              onChange={(value) => setFormData(prev => ({ ...prev, country: value }))}
              placeholder="Search for your country..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="university">University</label>
            <UniversitySelector
              value={formData.university}
              onChange={(value) => setFormData(prev => ({ ...prev, university: value }))}
              placeholder="Search for your university..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrapper">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>


          <button type="submit" className="submit-button">Create Account</button>
        </form>
      </div>
    </>
  );
};

export default Signup;
