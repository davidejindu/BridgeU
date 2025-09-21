import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronDown,
  GraduationCap,
  MapPin,
  UserPlus,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { sendConnectionRequest } from "../services/connectionService";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [universityFilter, setUniversityFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [messagingUserId, setMessagingUserId] = useState<string | null>(null);
  const [connectingUserId, setConnectingUserId] = useState<string | null>(null);
  const [connectionStatuses, setConnectionStatuses] = useState<{[key: string]: {connected: boolean, pending: boolean}}>({});

  // Store all available options
  const [allCountries, setAllCountries] = useState<string[]>([]);
  const [allUniversities, setAllUniversities] = useState<string[]>([]);

  const usersPerPage = 12;

  // Fetch all countries and universities for filter options
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(
        `http://localhost:54112/api/auth/users?limit=1000`, // Get a large number to capture all options
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data: ApiResponse = await response.json();
        if (data.success) {
          const countries = [
            ...new Set(data.users.map((u) => u.country)),
          ].sort();
          const universities = [
            ...new Set(data.users.map((u) => u.university)),
          ].sort();

          setAllCountries(countries);
          setAllUniversities(universities);
        }
      }
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  // Check connection status for a user
  const checkUserConnectionStatus = async (userId: string) => {
    try {
      const response = await fetch(
        `http://localhost:54112/api/connections/status/${userId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConnectionStatuses(prev => ({
            ...prev,
            [userId]: { connected: data.connected, pending: data.pending }
          }));
          return data;
        }
      }
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
    return { connected: false, pending: false };
  };

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
        `http://localhost:54112/api/auth/users?${params}`,
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
        // Filter out connected users
        const filteredUsers = data.users.filter(userItem => {
          const status = connectionStatuses[userItem.id];
          return !status?.connected;
        });
        
        setUsers(filteredUsers);
        setTotalUsers(filteredUsers.length);
        
        // Check connection status for all users
        data.users.forEach(userItem => {
          checkUserConnectionStatus(userItem.id);
        });
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

  // Handle messaging a user - Navigate to existing or create new conversation
  const handleMessage = async (selectedUser: User) => {
    if (!user) {
      alert("Please log in to send messages");
      return;
    }

    setMessagingUserId(selectedUser.id);

    try {
      // Check if a conversation already exists with this user
      const existingConversationsResponse = await fetch("/api/messages", {
        credentials: "include",
      });

      if (existingConversationsResponse.ok) {
        const conversations = await existingConversationsResponse.json();

        console.log("All conversations:", conversations);
        console.log("Looking for user with username:", selectedUser.username);
        console.log("Selected user details:", selectedUser);

        // Look for an existing 1-on-1 conversation with this user
        const existingConversation = conversations.find((conv: any) => {
          // Only check 1-on-1 conversations
          if (!conv.members || conv.members.length !== 1) {
            return false;
          }

          const member = conv.members[0];

          // Match by username since the backend doesn't return user IDs in members
          const isMatch = member.username === selectedUser.username;

          if (isMatch) {
            console.log(
              "MATCH FOUND! Conversation ID:",
              conv.id,
              "with:",
              member.firstName,
              member.lastName
            );
          }

          return isMatch;
        });

        console.log("Found existing conversation:", existingConversation);

        if (existingConversation) {
          console.log(
            "Navigating to existing conversation:",
            existingConversation.id
          );
          // Navigate directly to the existing conversation
          navigate("/messages", {
            state: {
              selectedConversationId: existingConversation.id,
            },
          });
        } else {
          console.log(
            "No existing conversation found, opening create modal with user:",
            selectedUser
          );
          // If no existing conversation, navigate with user info to create new one
          navigate("/messages", {
            state: {
              createConversationWith: selectedUser,
            },
          });
        }
      } else {
        console.error("Failed to fetch conversations");
        navigate("/messages");
      }
    } catch (error) {
      console.error("Error handling message:", error);
      navigate("/messages");
    } finally {
      setMessagingUserId(null);
    }
  };

  // Initial load
  useEffect(() => {
    fetchFilterOptions(); // Fetch filter options first
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
                  {allUniversities.map((uni) => (
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
                  {allCountries.map((country) => (
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
              {users.map((userItem) => (
                <div
                  key={userItem.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/profile/${userItem.id}`)}
                >
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {getUserInitials(userItem.firstName, userItem.lastName)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {userItem.firstName} {userItem.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        @{userItem.username}
                      </p>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <GraduationCap className="w-4 h-4 mr-1" />
                        <span className="truncate">{userItem.university}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>From {userItem.country}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500">
                      Joined {new Date(userItem.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {(() => {
                      const status = connectionStatuses[userItem.id];
                      if (status?.connected) {
                        return (
                          <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                            <UserPlus className="w-4 h-4" />
                            <span className="text-sm font-medium">Connected</span>
                          </div>
                        );
                      } else if (status?.pending) {
                        return (
                          <div className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                            <Loader2 className="w-4 h-4" />
                            <span className="text-sm font-medium">Pending</span>
                          </div>
                        );
                      } else {
                        return (
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              setConnectingUserId(userItem.id);
                              try {
                                const response = await sendConnectionRequest(userItem.id);
                                if (response.success) {
                                  alert(`Connection request sent to ${userItem.firstName} ${userItem.lastName}!`);
                                  // Update connection status
                                  setConnectionStatuses(prev => ({
                                    ...prev,
                                    [userItem.id]: { connected: false, pending: true }
                                  }));
                                } else {
                                  alert(response.message || "Failed to send connection request");
                                }
                              } catch (error) {
                                console.error("Error connecting:", error);
                                alert("Failed to send connection request");
                              } finally {
                                setConnectingUserId(null);
                              }
                            }}
                            disabled={connectingUserId === userItem.id}
                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {connectingUserId === userItem.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                            <span className="text-sm font-medium">
                              {connectingUserId === userItem.id ? "Sending..." : "Connect"}
                            </span>
                          </button>
                        );
                      }
                    })()}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMessage(userItem);
                      }}
                      disabled={messagingUserId === userItem.id}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {messagingUserId === userItem.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {messagingUserId === userItem.id
                          ? "Starting..."
                          : "Message"}
                      </span>
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
