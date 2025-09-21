import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Globe,
  GraduationCap,
  Coffee,
  Gamepad2,
  Music,
  Plane,
  Camera as CameraIcon,
  Heart,
  Languages,
  User,
  UserPlus,
  MessageCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { sendConnectionRequest, checkConnectionStatus } from "../services/connectionService";

interface UserProfileData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  country: string;
  university: string;
  biography?: string;
  interests?: string[];
  academicYear?: string;
  major?: string;
  languages?: Array<{ name: string; level: string }>;
  lookingFor?: string[];
  connections?: string[];
  createdAt: string;
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; pending: boolean }>({ connected: false, pending: false });

  // Helper functions
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const getInterestIcon = (interest: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      Technology: <Gamepad2 className="w-4 h-4" />,
      Travel: <Plane className="w-4 h-4" />,
      Music: <Music className="w-4 h-4" />,
      Coffee: <Coffee className="w-4 h-4" />,
      Photography: <CameraIcon className="w-4 h-4" />,
      Gaming: <Gamepad2 className="w-4 h-4" />,
    };
    return (
      iconMap[interest] || <div className="w-4 h-4 rounded-full bg-gray-300" />
    );
  };

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!userId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `http://localhost:54112/api/auth/users/${userId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("User not found");
        }
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setProfileUser(data.user);
      } else {
        throw new Error(data.message || "Failed to fetch user profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle connecting with user
  const handleConnect = async () => {
    if (!profileUser || !currentUser) return;

    setConnecting(true);

    try {
      const response = await sendConnectionRequest(profileUser.id);
      if (response.success) {
        setConnectionStatus({ connected: false, pending: true });
        alert(`Connection request sent to ${profileUser.firstName} ${profileUser.lastName}!`);
      } else {
        alert(response.message || "Failed to send connection request");
      }
    } catch (error) {
      console.error("Error connecting:", error);
      alert("Failed to send connection request");
    } finally {
      setConnecting(false);
    }
  };

  // Handle messaging user
  const handleMessage = async () => {
    if (!profileUser || !currentUser) return;

    setMessaging(true);

    try {
      // Check if a conversation already exists with this user
      const existingConversationsResponse = await fetch("/api/messages", {
        credentials: "include",
      });

      if (existingConversationsResponse.ok) {
        const conversations = await existingConversationsResponse.json();

        // Look for an existing 1-on-1 conversation with this user
        const existingConversation = conversations.find((conv: any) => {
          // Only check 1-on-1 conversations
          if (!conv.members || conv.members.length !== 1) {
            return false;
          }

          const member = conv.members[0];
          return member.username === profileUser.username;
        });

        if (existingConversation) {
          // Navigate directly to the existing conversation
          navigate("/messages", {
            state: {
              selectedConversationId: existingConversation.id,
            },
          });
        } else {
          // If no existing conversation, navigate with user info to create new one
          navigate("/messages", {
            state: {
              createConversationWith: profileUser,
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
      setMessaging(false);
    }
  };

  // Check connection status
  const checkConnection = async () => {
    if (!profileUser || !currentUser) return;

    try {
      const status = await checkConnectionStatus(profileUser.id);
      setConnectionStatus(status);
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (profileUser) {
      checkConnection();
    }
  }, [profileUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate("/meet-people")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Meet People
          </button>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">User not found</p>
          <button
            onClick={() => navigate("/meet-people")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Meet People
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/meet-people")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Meet People</span>
        </button>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              {/* Profile Picture */}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-semibold text-blue-600 mx-auto">
                  {getInitials(profileUser.firstName, profileUser.lastName)}
                </div>
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* User Info */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {profileUser.firstName} {profileUser.lastName}
              </h1>

              <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
                <Globe className="w-4 h-4" />
                <span>
                  {profileUser.country} • {profileUser.academicYear || "Student"}
                </span>
              </div>

              <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                <GraduationCap className="w-4 h-4" />
                <span>{profileUser.university}</span>
              </div>

              {/* Stats */}
              <div className="flex justify-center text-sm text-gray-600 mb-6">
                <div className="text-center">
                  <div className="font-semibold">
                    {profileUser.connections?.length || 0}
                  </div>
                  <div>Connections</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 mb-6">
                {connectionStatus.connected ? (
                  <div className="flex items-center space-x-2 px-6 py-3 bg-green-100 text-green-800 rounded-lg">
                    <UserPlus className="w-4 h-4" />
                    <span>Connected</span>
                  </div>
                ) : connectionStatus.pending ? (
                  <div className="flex items-center space-x-2 px-6 py-3 bg-yellow-100 text-yellow-800 rounded-lg">
                    <Loader2 className="w-4 h-4" />
                    <span>Pending</span>
                  </div>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    <span>{connecting ? "Connecting..." : "Connect"}</span>
                  </button>
                )}

                <button
                  onClick={handleMessage}
                  disabled={messaging}
                  className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {messaging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  <span>{messaging ? "Starting..." : "Message"}</span>
                </button>
              </div>

              {/* Status Tags */}
              <div className="flex flex-wrap justify-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Available to chat</span>
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full flex items-center space-x-1">
                  <GraduationCap className="w-3 h-3" />
                  <span>International Student</span>
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full flex items-center space-x-1">
                  <Coffee className="w-3 h-3" />
                  <span>Coffee enthusiast</span>
                </span>
              </div>
            </div>
          </div>

          {/* Study Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <GraduationCap className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Study Info</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Major
                </label>
                <p className="text-gray-900">{profileUser.major || "Computer Science"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <p className="text-gray-900">{profileUser.academicYear || "Student"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Joined IS Hub
                </label>
                <p className="text-gray-900">
                  {new Date(profileUser.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* About Me */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About Me</h2>
            <p className="text-gray-700 leading-relaxed">
              {profileUser.biography ||
                "Hey there! I'm an international student studying at university. I'm passionate about connecting with fellow international students and sharing experiences about adapting to university life. I love exploring new places, trying different cuisines, and learning about different cultures. Always down for a coffee chat or study session!"}
            </p>
          </div>

          {/* Looking For */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Looking For</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {profileUser.lookingFor && profileUser.lookingFor.length > 0 ? (
                profileUser.lookingFor.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 border border-blue-200 text-blue-700 text-sm rounded-full"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No preferences specified</p>
              )}
            </div>
          </div>

          {/* Languages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Languages className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Languages</h2>
            </div>

            <div className="space-y-2">
              {profileUser.languages && profileUser.languages.length > 0 ? (
                profileUser.languages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-900 font-medium">
                      {lang.name}
                    </span>
                    <span className="text-gray-600 text-sm">{lang.level}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No languages specified</p>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Interests</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {profileUser.interests && profileUser.interests.length > 0 ? (
                profileUser.interests.map((interest, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                  >
                    {getInterestIcon(interest)}
                    <span className="text-gray-900 text-sm">{interest}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Gamepad2 className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900 text-sm">Technology</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Plane className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900 text-sm">Travel</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Music className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900 text-sm">Music</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Coffee className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900 text-sm">Coffee</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <CameraIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900 text-sm">Photography</span>
                  </div>
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Gamepad2 className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900 text-sm">Gaming</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
