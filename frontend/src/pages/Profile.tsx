import React, { useState, useEffect } from "react";
import {
  Camera,
  Plus,
  X,
  ChevronDown,
  Save,
  Edit3,
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { updateProfile, UpdateProfileData } from "../services/authService";
import CountrySelector from "../components/CountrySelector";
import UniversitySelector from "../components/UniversitySelector";

const Profile: React.FC = () => {
  const { user, login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  // State for all profile data
  const [academicYear, setAcademicYear] = useState(
    user?.academicYear || "Sophomore"
  );
  const [major, setMajor] = useState(user?.major || "Computer Science");
  const [homeCountry, setHomeCountry] = useState(user?.country || "");
  const [university, setUniversity] = useState(user?.university || "");
  const [biography, setBiography] = useState(user?.biography || "");
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [lookingFor, setLookingFor] = useState<string[]>(
    user?.lookingFor || []
  );
  const [languages, setLanguages] = useState<
    Array<{ name: string; level: string }>
  >(Array.isArray(user?.languages) ? user.languages : []);
  // Editing states for each section
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Temporary editing states
  const [tempBiography, setTempBiography] = useState("");
  const [tempLookingFor, setTempLookingFor] = useState<string[]>([]);
  const [tempLanguages, setTempLanguages] = useState<
    Array<{ name: string; level: string }>
  >([]);
  const [tempInterests, setTempInterests] = useState<string[]>([]);
  const [tempMajor, setTempMajor] = useState("");
  const [tempAcademicYear, setTempAcademicYear] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newLanguage, setNewLanguage] = useState({ name: "", level: "Fluent" });
  const [newLookingFor, setNewLookingFor] = useState("");
  const [showLookingForDropdown, setShowLookingForDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showInterestDropdown, setShowInterestDropdown] = useState(false);

  // Predefined "Looking For" options
  const lookingForOptions = [
    "Study partners",
    "Cultural exchange",
    "Local recommendations",
    "Coffee chats",
    "Weekend activities",
    "Language practice",
    "Academic collaboration",
    "Campus tour guide",
    "Dining companions",
    "Gym buddies",
    "Travel companions",
    "Study group members",
    "Cultural events",
    "Networking opportunities",
    "Mentorship",
    "Friendship",
    "Roommate search",
    "Job opportunities",
    "Internship advice",
    "Career guidance",
  ];

  // Predefined language options
  const languageOptions = [
    "English",
    "Spanish",
    "French",
    "German",
    "Italian",
    "Portuguese",
    "Russian",
    "Chinese",
    "Japanese",
    "Korean",
    "Arabic",
    "Hindi",
    "Turkish",
    "Dutch",
    "Swedish",
    "Norwegian",
    "Danish",
    "Finnish",
    "Polish",
    "Czech",
    "Greek",
    "Hebrew",
    "Thai",
    "Vietnamese",
    "Indonesian",
    "Malay",
    "Tagalog",
    "Swahili",
    "Amharic",
    "Zulu",
  ];

  // Predefined interest options
  const interestOptions = [
    "Technology",
    "Programming",
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Artificial Intelligence",
    "Gaming",
    "Video Games",
    "Board Games",
    "Card Games",
    "Sports",
    "Football",
    "Basketball",
    "Tennis",
    "Swimming",
    "Music",
    "Singing",
    "Playing Instruments",
    "Concerts",
    "Photography",
    "Videography",
    "Art",
    "Drawing",
    "Painting",
    "Travel",
    "Adventure",
    "Hiking",
    "Camping",
    "Cooking",
    "Baking",
    "Coffee",
    "Tea",
    "Wine",
    "Craft Beer",
    "Reading",
    "Writing",
    "Poetry",
    "Movies",
    "TV Shows",
    "Netflix",
    "Anime",
    "Manga",
    "Comics",
    "Books",
    "Fitness",
    "Gym",
    "Yoga",
    "Meditation",
    "Dancing",
    "Fashion",
    "Design",
    "Architecture",
    "History",
    "Politics",
    "Science",
    "Mathematics",
    "Biology",
    "Chemistry",
    "Physics",
    "Astronomy",
    "Psychology",
    "Philosophy",
    "Economics",
    "Business",
    "Entrepreneurship",
    "Finance",
    "Marketing",
    "Education",
    "Teaching",
    "Learning",
    "Languages",
    "Culture",
  ];

  // Helper functions
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  // Edit section functions
  const startEditing = (section: string) => {
    setEditingSection(section);
    // Initialize temp states with current values
    switch (section) {
      case "about":
        setTempBiography(biography);
        break;
      case "looking":
        setTempLookingFor([...lookingFor]);
        break;
      case "languages":
        console.log(
          "Starting to edit languages, current languages:",
          languages
        );
        setTempLanguages([...languages]);
        console.log("Set tempLanguages to:", [...languages]);
        break;
      case "interests":
        setTempInterests([...interests]);
        break;
      case "study":
        setTempMajor(major);
        setTempAcademicYear(academicYear);
        break;
    }
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setNewInterest("");
    setNewLanguage({ name: "", level: "Fluent" });
    setNewLookingFor("");
  };

  const saveSection = async () => {
    if (!user) return;

    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      // Always include all current profile data to prevent overwriting
      let updateData: any = {
        biography: biography,
        country: homeCountry,
        university: university,
        academicYear: academicYear,
        major: major,
        interests: interests,
        lookingFor: lookingFor,
        languages: languages,
      };

      // Update only the specific section being edited
      switch (editingSection) {
        case "about":
          updateData.biography = tempBiography;
          break;
        case "looking":
          updateData.lookingFor = tempLookingFor;
          break;
        case "languages":
          updateData.languages = tempLanguages;
          console.log("Saving languages - tempLanguages:", tempLanguages);
          console.log(
            "Saving languages - updateData.languages:",
            updateData.languages
          );
          break;
        case "interests":
          updateData.interests = tempInterests;
          break;
        case "study":
          updateData.major = tempMajor;
          updateData.academicYear = tempAcademicYear;
          break;
      }

      console.log("Full updateData being sent:", updateData);

      if (Object.keys(updateData).length > 0) {
        const response = await updateProfile(updateData);
        console.log("Update profile response:", response);
        if (response.success && response.user) {
          console.log("Updated user data from response:", response.user);
          await login(response.user, true); // Skip profile fetch to avoid overriding updated data
          setSuccess("Profile updated successfully!");
          setEditingSection(null);
          // Update local state immediately
          if (editingSection === "about") {
            setBiography(tempBiography);
          } else if (editingSection === "looking") {
            setLookingFor(tempLookingFor);
          } else if (editingSection === "languages") {
            console.log("Setting languages state to:", tempLanguages);
            setLanguages(tempLanguages);
          } else if (editingSection === "interests") {
            setInterests(tempInterests);
          } else if (editingSection === "study") {
            setMajor(tempMajor);
            setAcademicYear(tempAcademicYear);
          }
          setTimeout(() => setSuccess(""), 3000);
        } else {
          setError(response.message || "Failed to update profile");
        }
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Add/remove functions
  const addInterest = () => {
    if (newInterest.trim() && !tempInterests.includes(newInterest.trim())) {
      setTempInterests([...tempInterests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setTempInterests(
      tempInterests.filter((interest) => interest !== interestToRemove)
    );
  };

  const addLanguage = () => {
    if (
      newLanguage.name.trim() &&
      !tempLanguages.some((lang) => lang.name === newLanguage.name.trim())
    ) {
      const newLang = { ...newLanguage, name: newLanguage.name.trim() };
      console.log("Adding language to tempLanguages:", newLang);
      console.log("Current tempLanguages before add:", tempLanguages);
      setTempLanguages([...tempLanguages, newLang]);
      console.log("New tempLanguages after add:", [...tempLanguages, newLang]);
      setNewLanguage({ name: "", level: "Fluent" });
    }
  };

  const removeLanguage = (languageToRemove: string) => {
    setTempLanguages(
      tempLanguages.filter((lang) => lang.name !== languageToRemove)
    );
  };

  const addLookingFor = (option?: string) => {
    const value = option || newLookingFor.trim();
    if (value && !tempLookingFor.includes(value)) {
      setTempLookingFor([...tempLookingFor, value]);
      setNewLookingFor("");
      setShowLookingForDropdown(false);
    }
  };

  const addLanguageFromOption = (languageName: string) => {
    if (
      languageName &&
      !tempLanguages.some((lang) => lang.name === languageName)
    ) {
      setTempLanguages([
        ...tempLanguages,
        { name: languageName, level: "Fluent" },
      ]);
      setNewLanguage({ name: "", level: "Fluent" });
      setShowLanguageDropdown(false);
    }
  };

  const addInterestFromOption = (interestName: string) => {
    if (interestName && !tempInterests.includes(interestName)) {
      setTempInterests([...tempInterests, interestName]);
      setNewInterest("");
      setShowInterestDropdown(false);
    }
  };

  const removeLookingFor = (itemToRemove: string) => {
    setTempLookingFor(tempLookingFor.filter((item) => item !== itemToRemove));
  };

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setHomeCountry(user.country || "");
      setUniversity(user.university || "");
      setBiography(user.biography || "");
      setInterests(Array.isArray(user.interests) ? user.interests : []);
      setAcademicYear(user.academicYear || "Sophomore");
      setMajor(user.major || "Computer Science");
      setLookingFor(Array.isArray(user.lookingFor) ? user.lookingFor : []);
      setLanguages(Array.isArray(user.languages) ? user.languages : []);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showLookingForDropdown && !target.closest(".looking-for-dropdown")) {
        setShowLookingForDropdown(false);
      }
      if (showLanguageDropdown && !target.closest(".language-dropdown")) {
        setShowLanguageDropdown(false);
      }
      if (showInterestDropdown && !target.closest(".interest-dropdown")) {
        setShowInterestDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLookingForDropdown, showLanguageDropdown, showInterestDropdown]);

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
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          {/* Profile Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              {/* Profile Picture */}
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-semibold text-blue-600 mx-auto">
                  {getInitials(user?.firstName || "", user?.lastName || "")}
                </div>
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              {/* User Info */}
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {user?.firstName} {user?.lastName}
              </h1>

              <div className="flex items-center justify-center space-x-2 text-gray-600 mb-2">
                <Globe className="w-4 h-4" />
                <span>
                  {homeCountry} • {academicYear}
                </span>
              </div>

              <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                <GraduationCap className="w-4 h-4" />
                <span>{university}</span>
              </div>

              {/* Stats */}
              <div className="flex justify-center text-sm text-gray-600 mb-6">
                <div className="text-center">
                  <div className="font-semibold">
                    {user?.connectionCount || 0}
                  </div>
                  <div>Connections</div>
                </div>
                <div className="text-center ml-6">
                  <div className="font-semibold">
                    {user?.createdAt
                      ? formatJoinDate(user.createdAt)
                      : "Unknown"}
                  </div>
                  <div>Joined BridgeU</div>
                </div>
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
              </div>
            </div>
          </div>

          {/* Study Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Study Info
                </h2>
              </div>
              <button
                onClick={() => startEditing("study")}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {editingSection === "study" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Major
                    </label>
                    <select
                      value={tempMajor}
                      onChange={(e) => setTempMajor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Business">Business</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Law">Law</option>
                      <option value="Arts">Arts</option>
                      <option value="Sciences">Sciences</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Psychology">Psychology</option>
                      <option value="Economics">Economics</option>
                      <option value="Political Science">
                        Political Science
                      </option>
                      <option value="International Relations">
                        International Relations
                      </option>
                      <option value="Languages">Languages</option>
                      <option value="Literature">Literature</option>
                      <option value="History">History</option>
                      <option value="Philosophy">Philosophy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Academic Year
                    </label>
                    <select
                      value={tempAcademicYear}
                      onChange={(e) => setTempAcademicYear(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Major
                  </label>
                  <p className="text-gray-900">{major}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year
                  </label>
                  <p className="text-gray-900">{academicYear}</p>
                </div>
              </div>
            )}
          </div>

          {/* About Me */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">About Me</h2>
              <button
                onClick={() => startEditing("about")}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {editingSection === "about" ? (
              <div>
                <textarea
                  value={tempBiography}
                  onChange={(e) => setTempBiography(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-4"
                  rows={4}
                  maxLength={500}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed">
                {biography ||
                  "No biography added yet. Click edit to add your story!"}
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
              <button
                onClick={() => startEditing("looking")}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {editingSection === "looking" ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tempLookingFor.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 border border-blue-200 text-blue-700 text-sm rounded-full"
                    >
                      {item}
                      <button
                        onClick={() => removeLookingFor(item)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative mb-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative looking-for-dropdown">
                      <input
                        type="text"
                        value={newLookingFor}
                        onChange={(e) => {
                          setNewLookingFor(e.target.value);
                          setShowLookingForDropdown(true);
                        }}
                        onFocus={() => setShowLookingForDropdown(true)}
                        placeholder="Search or type what you're looking for..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {showLookingForDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {lookingForOptions
                            .filter(
                              (option) =>
                                option
                                  .toLowerCase()
                                  .includes(newLookingFor.toLowerCase()) &&
                                !tempLookingFor.includes(option)
                            )
                            .map((option, index) => (
                              <button
                                key={index}
                                onClick={() => addLookingFor(option)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                              >
                                {option}
                              </button>
                            ))}
                          {lookingForOptions.filter(
                            (option) =>
                              option
                                .toLowerCase()
                                .includes(newLookingFor.toLowerCase()) &&
                              !tempLookingFor.includes(option)
                          ).length === 0 &&
                            newLookingFor && (
                              <button
                                onClick={() => addLookingFor()}
                                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-blue-600"
                              >
                                Add "{newLookingFor}"
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => addLookingFor()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.isArray(lookingFor) && lookingFor.length > 0 ? (
                  lookingFor.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 border border-blue-200 text-blue-700 text-sm rounded-full hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No preferences added yet. Click edit to add what you're
                    looking for.
                  </p>
                )}
              </div>
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
              <button
                onClick={() => startEditing("languages")}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {editingSection === "languages" ? (
              <div>
                <div className="space-y-2 mb-4">
                  {tempLanguages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-900 font-medium">
                        {lang.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 text-sm">
                          {lang.level}
                        </span>
                        <button
                          onClick={() => removeLanguage(lang.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative language-dropdown">
                    <input
                      type="text"
                      value={newLanguage.name}
                      onChange={(e) => {
                        setNewLanguage({
                          ...newLanguage,
                          name: e.target.value,
                        });
                        setShowLanguageDropdown(true);
                      }}
                      onFocus={() => setShowLanguageDropdown(true)}
                      placeholder="Search or type a language..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {showLanguageDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {languageOptions
                          .filter(
                            (option) =>
                              option
                                .toLowerCase()
                                .includes(newLanguage.name.toLowerCase()) &&
                              !tempLanguages.some(
                                (lang) => lang.name === option
                              )
                          )
                          .map((option, index) => (
                            <button
                              key={index}
                              onClick={() => addLanguageFromOption(option)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              {option}
                            </button>
                          ))}
                        {languageOptions.filter(
                          (option) =>
                            option
                              .toLowerCase()
                              .includes(newLanguage.name.toLowerCase()) &&
                            !tempLanguages.some((lang) => lang.name === option)
                        ).length === 0 &&
                          newLanguage.name && (
                            <button
                              onClick={() => addLanguage()}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-blue-600"
                            >
                              Add "{newLanguage.name}"
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                  <select
                    value={newLanguage.level}
                    onChange={(e) =>
                      setNewLanguage({ ...newLanguage, level: e.target.value })
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Fluent">Fluent</option>
                    <option value="Native">Native</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Beginner">Beginner</option>
                  </select>
                  <button
                    onClick={addLanguage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {Array.isArray(languages) && languages.length > 0 ? (
                  languages.map((lang, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-900 font-medium">
                        {lang.name}
                      </span>
                      <span className="text-gray-600 text-sm">
                        {lang.level}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No languages added yet. Click the + button to add languages.
                  </p>
                )}
              </div>
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
              <button
                onClick={() => startEditing("interests")}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {editingSection === "interests" ? (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {tempInterests.map((interest, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                    >
                      {getInterestIcon(interest)}
                      <span className="text-gray-900 text-sm flex-1">
                        {interest}
                      </span>
                      <button
                        onClick={() => removeInterest(interest)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative interest-dropdown">
                    <input
                      type="text"
                      value={newInterest}
                      onChange={(e) => {
                        setNewInterest(e.target.value);
                        setShowInterestDropdown(true);
                      }}
                      onFocus={() => setShowInterestDropdown(true)}
                      placeholder="Search or type an interest..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === "Enter" && addInterest()}
                    />
                    {showInterestDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {interestOptions
                          .filter(
                            (option) =>
                              option
                                .toLowerCase()
                                .includes(newInterest.toLowerCase()) &&
                              !tempInterests.includes(option)
                          )
                          .map((option, index) => (
                            <button
                              key={index}
                              onClick={() => addInterestFromOption(option)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              {option}
                            </button>
                          ))}
                        {interestOptions.filter(
                          (option) =>
                            option
                              .toLowerCase()
                              .includes(newInterest.toLowerCase()) &&
                            !tempInterests.includes(option)
                        ).length === 0 &&
                          newInterest && (
                            <button
                              onClick={() => addInterest()}
                              className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none text-blue-600"
                            >
                              Add "{newInterest}"
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={addInterest}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveSection}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.isArray(interests) && interests.length > 0 ? (
                  interests.map((interest, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"
                    >
                      {getInterestIcon(interest)}
                      <span className="text-gray-900 text-sm">{interest}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">
                    No interests added yet. Click the + button to add your
                    interests.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
