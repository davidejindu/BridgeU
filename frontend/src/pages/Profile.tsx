import React, { useState, useEffect } from 'react';
import { Camera, Plus, X, ChevronDown, Save, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile, UpdateProfileData } from '../services/authService';
import CountrySelector from '../components/CountrySelector';
import UniversitySelector from '../components/UniversitySelector';

const Profile: React.FC = () => {
  const { user, login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [academicYear, setAcademicYear] = useState(user?.academicYear || 'Sophomore');
  const [homeCountry, setHomeCountry] = useState(user?.country || '');
  const [university, setUniversity] = useState(user?.university || '');
  const [biography, setBiography] = useState(user?.biography || '');
  const [showProfile, setShowProfile] = useState(true);
  const [showUniversity, setShowUniversity] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      console.log('User data loaded:', user);
      setHomeCountry(user.country || '');
      setUniversity(user.university || '');
      setBiography(user.biography || '');
      setInterests(user.interests || []);
      setAcademicYear(user.academicYear || 'Sophomore');
    }
  }, [user]);

  const handleSave = async () => {
    console.log('Profile save attempt - Auth status:', {
      isAuthenticated,
      user: user,
      userId: user?.id,
      sessionId: document.cookie
    });
    
    if (!user) {
      console.error('No user found - not authenticated');
      setError('You must be logged in to update your profile');
      return;
    }
    
    console.log('Saving profile with data:', {
      biography,
      country: homeCountry,
      university
    });
    
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const profileData: UpdateProfileData = {
        biography: biography,
        country: homeCountry,
        university: university,
        interests: interests,
        academicYear: academicYear
      };

      console.log('Calling updateProfile with:', profileData);
      const response = await updateProfile(profileData);
      console.log('Update profile response:', response);
      
      if (response.success && response.user) {
        console.log('Profile updated successfully, updating auth context');
        await login(response.user); // Update auth context with new user data
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('Profile update failed:', response.message);
        setError(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (user) {
      setHomeCountry(user.country || '');
      setUniversity(user.university || '');
      setBiography(user.biography || '');
    }
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
            <p className="text-gray-600">Share your story and connect with fellow international students</p>
          </div>
          <button
            onClick={() => {
              console.log('Edit button clicked, current isEditing:', isEditing);
              setIsEditing(!isEditing);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Academic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Academic Year
                </label>
                {isEditing ? (
                  <div className="relative">
                    <select
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate Student">Graduate Student</option>
                      <option value="PhD Student">PhD Student</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <p className="text-gray-700 px-4 py-3 bg-gray-50 rounded-lg">
                    {academicYear}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Country
                </label>
                {isEditing ? (
                  <CountrySelector
                    value={homeCountry}
                    onChange={setHomeCountry}
                    placeholder="Search for your country..."
                  />
                ) : (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {homeCountry || 'Not specified'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* University Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">University Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                University
              </label>
              {isEditing ? (
                <UniversitySelector
                  value={university}
                  onChange={setUniversity}
                  placeholder="Search for your university..."
                />
              ) : (
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                  {university || 'Not specified'}
                </div>
              )}
            </div>
          </div>

          {/* About You */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">About You</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Biography</h3>
              {isEditing ? (
                <textarea
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Tell us about yourself, your interests, goals, and what makes you unique..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={4}
                  maxLength={500}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed min-h-[100px] p-4 bg-gray-50 rounded-lg">
                  {biography || 'No biography added yet. Click "Edit Profile" to add one!'}
                </p>
              )}
              {isEditing && (
                <p className="text-sm text-gray-500 mt-2">
                  {biography.length}/500 characters
                </p>
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Interests & Hobbies</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                  >
                    {interest}
                    {isEditing && (
                      <button
                        onClick={() => removeInterest(interest)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {isEditing && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add an interest"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  />
                  <button
                    onClick={addInterest}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Show my profile to other students</h3>
                  <p className="text-sm text-gray-500">Allow other students to find and connect with you</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showProfile}
                    onChange={(e) => setShowProfile(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Show my university</h3>
                  <p className="text-sm text-gray-500">Display your university in your profile</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showUniversity}
                    onChange={(e) => setShowUniversity(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Allow messages from new connections</h3>
                  <p className="text-sm text-gray-500">Let students message you directly</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowMessages}
                    onChange={(e) => setAllowMessages(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
