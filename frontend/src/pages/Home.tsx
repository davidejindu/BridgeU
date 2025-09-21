import React from 'react';
import { Link } from 'react-router-dom';
import { Users, User, Users2, MessageSquare, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Text and Buttons */}
            <div className="space-y-10">
              {isAuthenticated ? (
                <>
                  <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Welcome back,{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      {user?.firstName || user?.username}!
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                    Ready to continue your journey? Explore new connections, take quizzes, and engage with the international student community.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Link
                      to="/meet-people"
                      className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Meet People
                    </Link>
                    <Link
                      to="/profile"
                      className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-xl text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      View Profile
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Connect, Learn & Thrive as an{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                      International Student
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                    Build meaningful connections, take interactive quizzes, and navigate your academic journey with fellow students from around the world.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold rounded-xl text-gray-700 bg-white border-2 border-gray-300 hover:border-gray-400 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      Sign In
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Image */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl transform rotate-3"></div>
                <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
                  <div className="aspect-square bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Users className="w-16 h-16 text-white" />
                      </div>
                      <p className="text-lg font-semibold text-gray-700">Student Community</p>
                      <p className="text-sm text-gray-500 mt-2">Join thousands of students worldwide</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Features Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need as an{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                International Student
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Connect with peers, enhance your learning, and make the most of your international student experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Profile Card */}
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="aspect-[4/3] bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-blue-600/20"></div>
                <User className="w-20 h-20 text-white relative z-10" />
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Profile</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Create and customize your student profile. Share your background, interests, and academic goals with the community.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Explore
                </Link>
              </div>
            </div>

            {/* Meet People Card */}
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="aspect-[4/3] bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-green-600/20"></div>
                <Users2 className="w-20 h-20 text-white relative z-10" />
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Users2 className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Meet People</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Connect with fellow international students, join study groups, and build lasting friendships in your academic community.
                </p>
                <Link
                  to="/meet-people"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Explore
                </Link>
              </div>
            </div>

            {/* Messages Card */}
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="aspect-[4/3] bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-purple-600/20"></div>
                <MessageSquare className="w-20 h-20 text-white relative z-10" />
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Messages</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Stay connected with your network through instant messaging, group chats, and study coordination.
                </p>
                <Link
                  to="/messages"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Explore
                </Link>
              </div>
            </div>

            {/* Quizzes Card */}
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="aspect-[4/3] bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-orange-600/20"></div>
                <Brain className="w-20 h-20 text-white relative z-10" />
                <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Quizzes</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Test your knowledge with interactive quizzes on academic subjects, cultural topics, and student life skills.
                </p>
                <Link
                  to="/quizzes"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Explore
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
