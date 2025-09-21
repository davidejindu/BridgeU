// API service for authentication
const API_BASE_URL = '/api/auth';

export interface User {
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
  lookingFor?: string[];
  languages?: Array<{ name: string; level: string }>;
  connectionCount?: number;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  country: string;
  university: string;
}

export interface UpdateProfileData {
  biography?: string;
  country: string;
  university: string;
  interests?: string[];
  academicYear?: string;
  major?: string;
  lookingFor?: string[];
  languages?: Array<{ name: string; level: string }>;
}

// Login user
export const loginUser = async (loginData: LoginData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify(loginData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register user
export const registerUser = async (registerData: RegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify(registerData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Check if user is authenticated
export const checkAuth = async (): Promise<{ authenticated: boolean; user?: User }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Auth check error:', error);
    return { authenticated: false };
  }
};

// Logout user
export const logoutUser = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Get current user's profile
export const getProfile = async (): Promise<{ success: boolean; user: User }> => {
  try {
    const response = await fetch('/api/profileauth/profile', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to get profile');
    }

    return data;
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (profileData: UpdateProfileData): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/profileauth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Profile update failed');
    }

    return data;
  } catch (error) {
    console.error('Profile update error:', error);
    throw error;
  }
};
