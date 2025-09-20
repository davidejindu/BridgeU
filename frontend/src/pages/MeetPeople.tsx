import React, { useState } from 'react';
import { Search, ChevronDown, GraduationCap, MapPin, UserPlus, MessageCircle } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  initials: string;
  major: string;
  year: string;
  university: string;
  country: string;
  interests: string[];
  mutualConnections: number;
  hasPhoto: boolean;
}

const MeetPeople: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const students: Student[] = [
    {
      id: 1,
      name: 'Maria Rodriguez',
      initials: 'MR',
      major: 'Computer Science',
      year: 'Junior',
      university: 'Stanford University',
      country: 'Mexico',
      interests: ['Machine Learning', 'Soccer', 'Photography'],
      mutualConnections: 3,
      hasPhoto: false
    },
    {
      id: 2,
      name: 'Ahmed Hassan',
      initials: 'AH',
      major: 'Electrical Engineering',
      year: 'Senior',
      university: 'MIT',
      country: 'Egypt',
      interests: ['Robotics', 'Music', 'Chess'],
      mutualConnections: 1,
      hasPhoto: true
    },
    {
      id: 3,
      name: 'Priya Patel',
      initials: 'PP',
      major: 'Medicine',
      year: 'Graduate Student',
      university: 'University of Toronto',
      country: 'India',
      interests: ['Yoga', 'Cooking', 'Volunteering'],
      mutualConnections: 2,
      hasPhoto: true
    },
    {
      id: 4,
      name: 'Chen Wei',
      initials: 'CW',
      major: 'Business Administration',
      year: 'Sophomore',
      university: 'UC Berkeley',
      country: 'China',
      interests: ['Entrepreneurship', 'Basketball', 'Gaming'],
      mutualConnections: 5,
      hasPhoto: true
    },
    {
      id: 5,
      name: 'Sophie Martin',
      initials: 'SM',
      major: 'International Relations',
      year: 'Junior',
      university: 'Harvard University',
      country: 'France',
      interests: ['Languages', 'Travel', 'Art'],
      mutualConnections: 2,
      hasPhoto: true
    },
    {
      id: 6,
      name: 'James Wilson',
      initials: 'JW',
      major: 'Literature',
      year: 'PhD Student',
      university: 'Oxford University',
      country: 'Australia',
      interests: ['Reading', 'Writing', 'Coffee'],
      mutualConnections: 1,
      hasPhoto: true
    }
  ];

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.major.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.university.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = !universityFilter || student.university === universityFilter;
    const matchesMajor = !majorFilter || student.major === majorFilter;
    const matchesYear = !yearFilter || student.year === yearFilter;

    return matchesSearch && matchesUniversity && matchesMajor && matchesYear;
  });

  const universities = [...new Set(students.map(s => s.university))];
  const majors = [...new Set(students.map(s => s.major))];
  const years = [...new Set(students.map(s => s.year))];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meet People</h1>
          <p className="text-gray-600">Connect with fellow international students from around the world</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <select
                  value={universityFilter}
                  onChange={(e) => setUniversityFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
                >
                  <option value="">University</option>
                  {universities.map(uni => (
                    <option key={uni} value={uni}>{uni}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={majorFilter}
                  onChange={(e) => setMajorFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
                >
                  <option value="">Major</option>
                  {majors.map(major => (
                    <option key={major} value={major}>{major}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
                >
                  <option value="">Year Level</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  {student.hasPhoto ? (
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{student.initials}</span>
                    </div>
                  ) : (
                    <span className="text-gray-600 font-semibold text-sm">{student.initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{student.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <GraduationCap className="w-4 h-4 mr-1" />
                    <span>{student.major} • {student.year}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{student.university}</span>
                  </div>
                  <p className="text-sm text-gray-500">From {student.country}</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {student.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{student.mutualConnections} mutual connections</p>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Connect</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Message</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No students found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetPeople;
