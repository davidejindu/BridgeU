import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Globe, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationBell from './NotificationBell';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                International Student Hub
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <Link
              to="/"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isActive('/') 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Home
            </Link>
            <Link
              to="/profile"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isActive('/profile') 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Profile
            </Link>
            <Link
              to="/meet-people"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isActive('/meet-people') 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Meet People
            </Link>
            <Link
              to="/messages"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isActive('/messages') 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Messages
            </Link>
            <Link
              to="/quizzes"
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 ${
                isActive('/quizzes') 
                  ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Quizzes
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {user?.firstName || user?.username}!
                </span>
                
                {/* Notification Bell */}
                <NotificationBell />
                
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
