import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  GraduationCap,
  MapPin,
  UserPlus,
  MessageCircle,
  Loader2,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  country: string;
  university: string;
  createdAt: string;
}

interface ApiResponse {
  success: boolean;
  total: number;
  limit: number;
  offset: number;
  users: User[];
}

const MeetPeople: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 12;

  // Fetch users from API
  const fetchUsers = async (
    page = 1,
    search = "",
    university = "",
    country = ""
  ) => {
    setLoading(true);
    setError(null);

    try {
      const offset = (page - 1) * usersPerPage;
      const params = new URLSearchParams({
        limit: usersPerPage.toString(),
        offset: offset.toString(),
      });

      if (search.trim()) params.append("q", search.trim());
      if (university) params.append("university", university);
      if (country) params.append("country", country);

      const response = await fetch(
        `http://localhost:8000/api/auth/users?${params}`,
        {
          method: "GET",
          credentials: "include", // Include cookies for authentication
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please log in to view users");
        }
        throw new Error(`Error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setUsers(data.users);
        setTotalUsers(data.total);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchUsers(1, searchTerm, universityFilter, countryFilter);
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, universityFilter, countryFilter]);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchUsers(page, searchTerm, universityFilter, countryFilter);
  };

  // Get unique universities and countries for filters
  const universities = [...new Set(users.map((u) => u.university))].sort();
  const countries = [...new Set(users.map((u) => u.country))].sort();

  // Helper function to get user initials
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => fetchUsers()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meet People</h1>
          <p className="text-gray-600">
            Connect with fellow international students from around the world
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Showing {users.length} of {totalUsers} students
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or university..."
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
                  <option value="">All Universities</option>
                  {universities.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
                >
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading students...</span>
          </div>
        )}

        {/* User Cards Grid */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {getUserInitials(user.firstName, user.lastName)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        @{user.username}
                      </p>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <GraduationCap className="w-4 h-4 mr-1" />
                        <span className="truncate">{user.university}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>From {user.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </p>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;

                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}

            {/* No Results */}
            {users.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No students found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setUniversityFilter("");
                    setCountryFilter("");
                  }}
                  className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MeetPeople;
