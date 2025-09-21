import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Globe, GraduationCap, MessageSquare, Scale, Wrench, Languages, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getRecentActivity, RecentActivity } from '../services/learningService';

const Quizzes: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const mainCategories = [
    {
      id: 'culture',
      title: 'Culture',
      description: 'Learn about different cultures, traditions, and social norms',
      icon: Globe,
      color: 'bg-green-500',
      topics: [
        { name: 'Campus Life', difficulty: 'Beginner' },
        { name: 'General (Mannerisms)', difficulty: 'Intermediate' }
      ]
    },
    {
      id: 'practical-skills',
      title: 'Practical Skills',
      description: 'Essential skills for daily life as an international student',
      icon: Wrench,
      color: 'bg-blue-500',
      topics: [
        { name: 'Banking', difficulty: 'Beginner' },
        { name: 'Transportation', difficulty: 'Beginner' },
        { name: 'Housing', difficulty: 'Intermediate' },
        { name: 'Healthcare', difficulty: 'Intermediate' }
      ]
    },
    {
      id: 'language',
      title: 'Language',
      description: 'Improve your language skills and learn terminology',
      icon: Languages,
      color: 'bg-orange-500',
      topics: [
        { name: 'Terminology (Gen Z Slang)', difficulty: 'Advanced' }
      ]
    },
    {
      id: 'legal-immigration',
      title: 'Legal & Immigration',
      description: 'Understand your legal responsibilities and visa requirements',
      icon: Scale,
      color: 'bg-purple-500',
      topics: [
        { name: 'Maintaining Visa Status', difficulty: 'Advanced' },
        { name: 'Campus Jobs', difficulty: 'Intermediate' },
        { name: 'Laws', difficulty: 'Advanced' },
        { name: 'International Student Office', difficulty: 'Intermediate' }
      ]
    }
  ];

  useEffect(() => {
    const fetchRecentActivity = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const activity = await getRecentActivity(user.id);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentActivity();
  }, [user?.id]);

  const getCategoryIcon = (categoryType: string) => {
    switch (categoryType) {
      case 'culture': return Globe;
      case 'practical-skills': return Wrench;
      case 'language': return Languages;
      case 'legal-immigration': return Scale;
      default: return BookOpen;
    }
  };

  const getCategoryColor = (categoryType: string) => {
    switch (categoryType) {
      case 'culture': return 'text-green-600';
      case 'practical-skills': return 'text-blue-600';
      case 'language': return 'text-orange-600';
      case 'legal-immigration': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/quizzes/${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Quizzes</h1>
          <p className="text-lg text-gray-600">
            Test your knowledge and enhance your learning experience
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {mainCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleCategoryClick(category.id)}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mr-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{category.title}</h3>
                    <p className="text-sm text-gray-500">
                      {category.topics.length} topic{category.topics.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{category.description}</p>
                <button className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors">
                  Start
                </button>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          {isLoading ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-12 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-12 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const IconComponent = getCategoryIcon(activity.category_type);
                const percentage = Math.round((activity.score / activity.total_questions) * 100);
                const colorClass = getCategoryColor(activity.category_type);
                
                return (
                  <div key={index} className="bg-white rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${colorClass.replace('text-', 'bg-').replace('-600', '-100')} rounded-lg flex items-center justify-center mr-4`}>
                        <IconComponent className={`w-5 h-5 ${colorClass}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Completed: {activity.subcategory_name}</p>
                        <p className="text-sm text-gray-500">
                          Score: {percentage}% • {formatTimeAgo(activity.completed_at)}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-semibold ${
                      percentage >= 80 ? 'text-green-600' : 
                      percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Activity</h3>
              <p className="text-gray-500 mb-4">Start learning and taking quizzes to see your progress here!</p>
              <button
                onClick={() => navigate('/quizzes/culture')}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quizzes;