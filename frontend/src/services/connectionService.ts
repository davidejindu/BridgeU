const API_BASE_URL = 'http://localhost:54112/api';

export interface ConnectionRequest {
  targetUserId: string;
}

export interface ConnectionResponse {
  success: boolean;
  message: string;
  connectionId?: string;
}

// Send a connection request to another user
export const sendConnectionRequest = async (targetUserId: string): Promise<ConnectionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/connections/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ targetUserId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to send connection request');
    }

    return data;
  } catch (error) {
    console.error('Connection request error:', error);
    throw error;
  }
};

// Accept a connection request
export const acceptConnectionRequest = async (connectionId: string): Promise<ConnectionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/connections/${connectionId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to accept connection request');
    }

    return data;
  } catch (error) {
    console.error('Accept connection error:', error);
    throw error;
  }
};

// Reject a connection request
export const rejectConnectionRequest = async (connectionId: string): Promise<ConnectionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/connections/${connectionId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject connection request');
    }

    return data;
  } catch (error) {
    console.error('Reject connection error:', error);
    throw error;
  }
};

// Get user's connections
export const getUserConnections = async (): Promise<{ success: boolean; connections: any[] }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/connections`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch connections');
    }

    return data;
  } catch (error) {
    console.error('Get connections error:', error);
    throw error;
  }
};

// Check if users are already connected
export const checkConnectionStatus = async (targetUserId: string): Promise<{ connected: boolean; pending: boolean }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/connections/status/${targetUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to check connection status');
    }

    return data;
  } catch (error) {
    console.error('Check connection status error:', error);
    throw error;
  }
};
