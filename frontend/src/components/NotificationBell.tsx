import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, UserPlus, MessageCircle, Check, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import { useToast } from '../contexts/ToastContext';
import { acceptConnectionRequest, rejectConnectionRequest } from '../services/connectionService';
import { useNavigate } from 'react-router-dom';

interface ConnectionRequest {
  id: string;
  requester_id: string;
  created_at: string;
  username: string;
  first_name: string;
  last_name: string;
  country: string;
  university: string;
}

interface RecentMessage {
  message_id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  first_name: string;
  last_name: string;
  username: string;
}

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = "" }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connections' | 'messages'>('connections');
  // Load seen notifications from localStorage on component mount
  const [seenNotifications, setSeenNotifications] = useState<{
    connections: Set<string>;
    messages: Set<string>;
  }>(() => {
    try {
      const saved = localStorage.getItem('seenNotifications');
      console.log('Loading seen notifications from localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        const result = {
          connections: new Set(parsed.connections || []),
          messages: new Set(parsed.messages || [])
        };
        console.log('Parsed seen notifications:', result);
        return result;
      }
    } catch (error) {
      console.error('Failed to load seen notifications from localStorage:', error);
    }
    console.log('No saved seen notifications, using empty sets');
    return {
      connections: new Set(),
      messages: new Set()
    };
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Save seen notifications to localStorage
  const saveSeenNotifications = (newSeenNotifications: {
    connections: Set<string>;
    messages: Set<string>;
  }) => {
    try {
      const toSave = {
        connections: Array.from(newSeenNotifications.connections),
        messages: Array.from(newSeenNotifications.messages)
      };
      console.log('Saving seen notifications to localStorage:', toSave);
      localStorage.setItem('seenNotifications', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save seen notifications to localStorage:', error);
    }
  };

  // Fetch pending connection requests
  const fetchPendingRequests = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.CONNECTIONS}/pending`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newRequests = data.requests || [];
          
          // Get current request IDs to identify new ones
          setConnectionRequests(prev => {
            const currentIds = new Set(prev.map(req => req.id));
            const newIds = new Set(newRequests.map((req: any) => req.id));
            
            // Find truly new requests (not in current list)
            const trulyNewRequests = newRequests.filter((req: any) => !currentIds.has(req.id));
            
            if (trulyNewRequests.length > 0) {
              console.log('New connection requests detected:', trulyNewRequests.length);
            }
            
            return newRequests;
          });
          
          // Clean up seen state for requests that no longer exist
          setSeenNotifications(prev => {
            const newState = {
              ...prev,
              connections: new Set([...prev.connections].filter(id => 
                newRequests.some((req: any) => req.id === id)
              ))
            };
            saveSeenNotifications(newState);
            return newState;
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
    }
  };

  // Fetch message notifications from database
  const fetchRecentMessages = async () => {
    if (!user) return;
    
    try {
      // First get the message IDs from notifications
      const notificationResponse = await fetch(`${API_ENDPOINTS.MESSAGES}/notifications/${user.id}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (notificationResponse.ok) {
        const notificationData = await notificationResponse.json();
        if (notificationData.success && notificationData.messageIds.length > 0) {
          // Get the actual message details for these message IDs
          const messageIds = notificationData.messageIds;
          const messagesResponse = await fetch(`${API_ENDPOINTS.MESSAGES}/details`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messageIds })
          });

          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            if (messagesData.success) {
              const newMessages = messagesData.messages || [];
              
              // Sort messages by creation time (newest first)
              const sortedMessages = newMessages.sort((a, b) => 
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              );
              
              setRecentMessages(sortedMessages);
              
              // Clean up seen state for messages that no longer exist
              setSeenNotifications(prev => {
                const newState = {
                  ...prev,
                  messages: new Set([...prev.messages].filter(id => 
                    newMessages.some((msg: any) => msg.message_id === id)
                  ))
                };
                saveSeenNotifications(newState);
                return newState;
              });
            }
          }
        } else {
          // No notifications, clear the messages
          setRecentMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch message notifications:', error);
    }
  };

  // Clean up old seen notifications
  const cleanupSeenNotifications = (connectionIds: string[], messageIds: string[]) => {
    setSeenNotifications(prev => {
      const newState = {
        connections: new Set([...prev.connections].filter(id => connectionIds.includes(id))),
        messages: new Set([...prev.messages].filter(id => messageIds.includes(id)))
      };
      saveSeenNotifications(newState);
      return newState;
    });
  };

  // Fetch all notifications
  const fetchAllNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingRequests(),
        fetchRecentMessages()
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle accepting a connection request
  const handleAcceptRequest = async (requestId: string, requesterName: string) => {
    try {
      setProcessingRequest(requestId);
      const response = await acceptConnectionRequest(requestId);
      
      if (response.success) {
        addToast({
          type: 'success',
          title: 'Connection Accepted!',
          message: `You are now connected with ${requesterName}`,
          duration: 4000
        });
        
        // Remove from the list (will be marked as seen when clicked)
        setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
      addToast({
        type: 'error',
        title: 'Failed to Accept',
        message: 'Could not accept the connection request',
        duration: 4000
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle rejecting a connection request
  const handleRejectRequest = async (requestId: string, requesterName: string) => {
    try {
      setProcessingRequest(requestId);
      const response = await rejectConnectionRequest(requestId);
      
      if (response.success) {
        addToast({
          type: 'info',
          title: 'Request Declined',
          message: `Connection request from ${requesterName} was declined`,
          duration: 3000
        });
        
        // Remove from the list (will be marked as seen when clicked)
        setConnectionRequests(prev => prev.filter(req => req.id !== requestId));
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
      addToast({
        type: 'error',
        title: 'Failed to Decline',
        message: 'Could not decline the connection request',
        duration: 4000
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // Calculate unseen notification counts
  const getUnseenCounts = () => {
    const unseenConnections = connectionRequests.filter(
      request => !seenNotifications.connections.has(request.id)
    ).length;
    
    const unseenMessages = recentMessages.filter(
      message => !seenNotifications.messages.has(message.message_id)
    ).length;
    
    const counts = {
      connections: unseenConnections,
      messages: unseenMessages,
      total: unseenConnections + unseenMessages
    };
    
    // Debug logging
    console.log('Notification counts:', {
      totalConnections: connectionRequests.length,
      totalMessages: recentMessages.length,
      seenConnections: seenNotifications.connections.size,
      seenMessages: seenNotifications.messages.size,
      unseenConnections: counts.connections,
      unseenMessages: counts.messages,
      totalUnseen: counts.total,
      seenConnectionsList: Array.from(seenNotifications.connections),
      seenMessagesList: Array.from(seenNotifications.messages),
      connectionRequestIds: connectionRequests.map(r => r.id),
      messageIds: recentMessages.map(m => m.message_id)
    });
    
    return counts;
  };

  // Handle message click - navigate to messages page
  const handleMessageClick = (conversationId: string, messageId: string) => {
    // Mark this specific message as seen
    setSeenNotifications(prev => {
      const newState = {
        ...prev,
        messages: new Set([...prev.messages, messageId])
      };
      saveSeenNotifications(newState);
      return newState;
    });
    
    navigate('/messages', { state: { selectedConversationId: conversationId } });
    setIsOpen(false);
  };

  // Fetch requests when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchAllNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchAllNotifications();
    };
    
    window.addEventListener('refreshNotifications', handleRefresh);
    return () => window.removeEventListener('refreshNotifications', handleRefresh);
  }, []);

  // Clean up seen notifications when connection requests or messages change
  useEffect(() => {
    if (connectionRequests.length > 0 || recentMessages.length > 0) {
      const connectionIds = connectionRequests.map(req => req.id);
      const messageIds = recentMessages.map(msg => msg.message_id);
      cleanupSeenNotifications(connectionIds, messageIds);
    }
  }, [connectionRequests, recentMessages]);

  // Refresh requests every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(fetchAllNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const unseenCounts = getUnseenCounts();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={`Notifications ${unseenCounts.total > 0 ? `(${unseenCounts.total} unseen)` : ''}`}
      >
        <Bell className="w-6 h-6" />
        {unseenCounts.total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unseenCounts.total > 9 ? '9+' : unseenCounts.total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close notifications"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="mt-3 flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('connections')}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'connections'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Connections</span>
                {unseenCounts.connections > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unseenCounts.connections}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('messages')}
                className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'messages'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Messages</span>
                {unseenCounts.messages > 0 && (
                  <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unseenCounts.messages}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Loading notifications...</p>
              </div>
            ) : activeTab === 'connections' ? (
              connectionRequests.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <UserPlus className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No pending connection requests</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {connectionRequests.map((request) => {
                    const isUnseen = !seenNotifications.connections.has(request.id);
                    return (
                    <div 
                      key={request.id} 
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${isUnseen ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                      onClick={() => {
                        // Mark this specific connection request as seen
                        setSeenNotifications(prev => {
                          const newState = {
                            ...prev,
                            connections: new Set([...prev.connections, request.id])
                          };
                          saveSeenNotifications(newState);
                          return newState;
                        });
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {request.first_name} {request.last_name}
                            </p>
                            <span className="text-xs text-gray-500">
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Wants to connect with you
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.university} • {request.country}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-3 flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent parent click handler
                            handleAcceptRequest(request.id, `${request.first_name} ${request.last_name}`);
                          }}
                          disabled={processingRequest === request.id}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingRequest === request.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>Accept</span>
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent parent click handler
                            handleRejectRequest(request.id, `${request.first_name} ${request.last_name}`);
                          }}
                          disabled={processingRequest === request.id}
                          className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )
            ) : (
              // Messages tab
              recentMessages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No recent messages</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentMessages.map((message) => {
                    const isUnseen = !seenNotifications.messages.has(message.message_id);
                    return (
                    <div 
                      key={message.message_id} 
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${isUnseen ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                      onClick={() => handleMessageClick(message.conversation_id, message.message_id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-white" />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {message.first_name} {message.last_name}
                            </p>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(message.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {message.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            Click to view conversation
                          </p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {(connectionRequests.length > 0 || recentMessages.length > 0) && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={fetchAllNotifications}
                className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Refresh notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
