import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../config/api";
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
  Edit3,
  Save,
  X,
  Plus,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  sendConnectionRequest,
  checkConnectionStatus,
} from "../services/connectionService";
import { updateProfile } from "../services/authService";

interface UserProfileData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  country: string;
  university?: string;
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
  const { user: currentUser, login } = useAuth();

  const [profileUser, setProfileUser] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    pending: boolean;
  }>({ connected: false, pending: false });

  // inline edit (university only)
  const isSelf = !!currentUser && currentUser.id === userId;
  const [editingStudy, setEditingStudy] = useState(false);
  const [tempUniversity, setTempUniversity] = useState("");
  const [savingStudy, setSavingStudy] = useState(false);

  const getInitials = (firstName: string, lastName: string) =>
    `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();

  const getInterestIcon = (interest: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      Technology: <Gamepad2 className="w-4 h-4" />,
      Travel: <Plane className="w-4 h-4" />,
      Music: <Music className="w-4 h-4" />,
      Photography: <CameraIcon className="w-4 h-4" />,
      Gaming: <Gamepad2 className="w-4 h-4" />,
      Coffee: <Coffee className="w-4 h-4" />,
    };
    return (
      iconMap[interest] || <div className="w-4 h-4 rounded-full bg-gray-300" />
    );
  };

  const fetchUserProfile = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 404) throw new Error("User not found");
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setProfileUser(data.user);
        setTempUniversity(data.user.university || "");
      } else {
        throw new Error(data.message || "Failed to fetch user profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!profileUser || !currentUser) return;
    setConnecting(true);
    try {
      const response = await sendConnectionRequest(profileUser.id);
      if (response.success) {
        setConnectionStatus({ connected: false, pending: true });
      }
    } catch (error) {
      console.error("Error connecting:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleMessage = async () => {
    if (!profileUser || !currentUser) return;
    setMessaging(true);
    try {
      const existingConversationsResponse = await fetch(API_ENDPOINTS.MESSAGES, {
        credentials: "include",
      });

      if (existingConversationsResponse.ok) {
        const conversations = await existingConversationsResponse.json();
        const existingConversation = conversations.find((conv: any) => {
          if (!conv.members || conv.members.length !== 1) return false;
          const member = conv.members[0];
          return member.username === profileUser.username;
        });

        if (existingConversation) {
          navigate("/messages", {
            state: { selectedConversationId: existingConversation.id },
          });
        } else {
          navigate("/messages", {
            state: { createConversationWith: profileUser },
          });
        }
      } else {
        navigate("/messages");
      }
    } catch (error) {
      console.error("Error handling message:", error);
      navigate("/messages");
    } finally {
      setMessaging(false);
    }
  };

  const checkConnection = async () => {
    if (!profileUser || !currentUser) return;
    try {
      const status = await checkConnectionStatus(profileUser.id);
      setConnectionStatus(status);
    } catch (error) {
      console.error("Error checking connection status:", error);
    }
  };

  const saveStudy = async () => {
    if (!isSelf || !profileUser) return;
    setSavingStudy(true);
    try {
      const resp = await updateProfile({ university: tempUniversity });
      if (resp.success && resp.user) {
        if (login) await login(resp.user, true);
        setProfileUser((prev) =>
          prev ? { ...prev, university: tempUniversity } : prev
        );
        setEditingStudy(false);
      } else {
        console.error(resp.message || "Failed to update university");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingStudy(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  useEffect(() => {
    if (profileUser) checkConnection();
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
        </div>
      </div>
    );
  }

  const joinedLabel = new Date(profileUser.createdAt).toLocaleDateString(
    "en-US",
    {
      month: "long",
      year: "numeric",
    }
  );

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
              {/* Avatar */}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-semibold text-blue-600 mx-auto">
                  {getInitials(profileUser.firstName, profileUser.lastName)}
                </div>
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* Name */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {profileUser.firstName} {profileUser.lastName}
              </h1>

              {/* Country • Year (only if present) */}
              {(profileUser.country || profileUser.academicYear) && (
                <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
                  <Globe className="w-4 h-4" />
                  <span>
                    {profileUser.country}
                    {profileUser.country && profileUser.academicYear
                      ? " • "
                      : ""}
                    {profileUser.academicYear}
                  </span>
                </div>
              )}

              {/* Stats (Connections + Joined BridgeU) */}
              <div className="flex justify-center items-center gap-8 text-sm text-gray-600 mb-6">
                <div className="text-center">
                  <div className="font-semibold">
                    {profileUser.connections?.length || 0}
                  </div>
                  <div>Connections</div>
                </div>
                <div className="h-6 w-px bg-gray-200" />
                <div className="text-center">
                  <div className="font-semibold">{joinedLabel}</div>
                  <div>Joined BridgeU</div>
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
            </div>
          </div>

          {/* Study Info (University editable if self) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Study Info
                </h2>
              </div>
              {isSelf && !editingStudy && (
                <button
                  onClick={() => setEditingStudy(true)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Edit study info"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {!editingStudy ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University
                  </label>
                  <p className="text-gray-900">
                    {profileUser.university || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <p className="text-gray-900">
                    {profileUser.academicYear || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Major
                  </label>
                  <p className="text-gray-900">{profileUser.major || "—"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University
                  </label>
                  <input
                    type="text"
                    value={tempUniversity}
                    onChange={(e) => setTempUniversity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your university"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setTempUniversity(profileUser.university || "");
                      setEditingStudy(false);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors inline-flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={saveStudy}
                    disabled={savingStudy || !tempUniversity.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {savingStudy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {savingStudy ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* About Me */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">About Me</h2>
              {isSelf && (
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Edit about"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
            {profileUser.biography ? (
              <p className="text-gray-700 leading-relaxed">
                {profileUser.biography}
              </p>
            ) : (
              <p className="text-gray-600">
                No biography added yet. Click edit to add your story!
              </p>
            )}
          </div>

          {/* Looking For */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Looking For
                </h2>
              </div>
              {isSelf && (
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Edit looking for"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {profileUser.lookingFor && profileUser.lookingFor.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profileUser.lookingFor.map((item, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 border border-blue-200 text-blue-700 text-sm rounded-full"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                No preferences added yet. Click edit to add what you're looking
                for.
              </p>
            )}
          </div>

          {/* Languages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Languages className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Languages
                </h2>
              </div>
              {isSelf && (
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Add language"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {profileUser.languages && profileUser.languages.length > 0 ? (
              <div className="space-y-2">
                {profileUser.languages.map((lang, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center"
                  >
                    <span className="text-gray-900 font-medium">
                      {lang.name}
                    </span>
                    <span className="text-gray-600 text-sm">{lang.level}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                No languages added yet. Click the + button to add languages.
              </p>
            )}
          </div>

          {/* Interests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Interests
                </h2>
              </div>
              {isSelf && (
                <button
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Add interest"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {profileUser.interests && profileUser.interests.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {profileUser.interests.map((interest, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                  >
                    {getInterestIcon(interest)}
                    <span className="text-gray-900 text-sm">{interest}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">
                No interests added yet. Click the + button to add your
                interests.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
