import React from 'react';
import { Brain, BookOpen, Globe, Users } from 'lucide-react';

const Quizzes: React.FC = () => {
  const quizCategories = [
    {
      id: 1,
      title: 'Academic Subjects',
      description: 'Test your knowledge in various academic fields',
      icon: BookOpen,
      color: 'blue',
      quizCount: 15
    },
    {
      id: 2,
      title: 'Cultural Knowledge',
      description: 'Learn about different cultures and traditions',
      icon: Globe,
      color: 'green',
      quizCount: 12
    },
    {
      id: 3,
      title: 'Student Life Skills',
      description: 'Essential skills for international students',
      icon: Users,
      color: 'purple',
      quizCount: 8
    },
    {
      id: 4,
      title: 'Language Learning',
      description: 'Improve your language skills with interactive quizzes',
      icon: Brain,
      color: 'orange',
      quizCount: 20
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quizzes</h1>
          <p className="text-gray-600">Test your knowledge and enhance your learning experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quizCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div
                key={category.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className={`w-12 h-12 bg-${category.color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <IconComponent className={`w-6 h-6 text-${category.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{category.quizCount} quizzes</span>
                  <button className={`px-4 py-2 bg-${category.color}-600 text-white text-sm font-medium rounded-lg hover:bg-${category.color}-700 transition-colors`}>
                    Start
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Brain className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed: Cultural Knowledge Quiz</p>
                    <p className="text-xs text-gray-500">Score: 85% • 2 hours ago</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">85%</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed: Computer Science Basics</p>
                    <p className="text-xs text-gray-500">Score: 92% • 1 day ago</p>
                  </div>
                </div>
                <span className="text-sm text-blue-600 font-medium">92%</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Completed: Student Life Skills</p>
                    <p className="text-xs text-gray-500">Score: 78% • 3 days ago</p>
                  </div>
                </div>
                <span className="text-sm text-purple-600 font-medium">78%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;
