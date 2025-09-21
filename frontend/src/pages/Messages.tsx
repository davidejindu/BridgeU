import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Send, MessageCircle, Plus, X, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isFromUser: boolean;
  senderName?: string;
}

interface Conversation {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  country: string;
  university: string;
  createdAt: string;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [initialMessage, setInitialMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching conversations from:', '/api/messages');
      const response = await fetch('/api/messages', {
        credentials: 'include',
      });
      console.log('Fetch conversations response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        // Transform backend data to match frontend Conversation interface
        const transformedConversations = data.map((conv: any) => {
          // Generate group chat name
          let groupName = '';
          if (conv.members.length === 1) {
            groupName = `${conv.members[0].firstName} ${conv.members[0].lastName}`;
          } else if (conv.members.length <= 3) {
            groupName = conv.members.map((member: any) => `${member.firstName} ${member.lastName}`).join(', ');
          } else {
            const firstThree = conv.members.slice(0, 3).map((member: any) => `${member.firstName} ${member.lastName}`).join(', ');
            const remainingCount = conv.members.length - 3;
            groupName = `${firstThree} +${remainingCount} more`;
          }

          // Generate initials for group chat
          let groupInitials = '';
          if (conv.members.length === 1) {
            groupInitials = `${conv.members[0].firstName.charAt(0)}${conv.members[0].lastName.charAt(0)}`;
          } else if (conv.members.length <= 3) {
            groupInitials = conv.members.map((member: any) => member.firstName.charAt(0)).join('');
          } else {
            groupInitials = conv.members.slice(0, 3).map((member: any) => member.firstName.charAt(0)).join('') + '+';
          }

          return {
            id: conv.id,
            name: groupName,
            initials: groupInitials,
            lastMessage: conv.lastMessage,
            timestamp: new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unreadCount: 0, // You can implement unread count later
            messages: [] // You can fetch messages separately later
          };
        });
        setConversations(transformedConversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/messages/${conversationId}/messages`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Transform backend data to match frontend Message interface
        const transformedMessages = data.map((msg: any) => ({
          id: msg.message_id,
          text: msg.message,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFromUser: msg.sender_id === user.id,
          senderName: `${msg.first_name} ${msg.last_name}`
        }));
        
        // Update the conversation with the fetched messages
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: transformedMessages }
            : conv
        ));
        
        // Scroll to bottom after messages are loaded
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;
    
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          conversationId: selectedConversation,
          message: newMessage.trim()
        }),
      });
      
      if (response.ok) {
        const sentMessage = await response.json();
        console.log('Message sent successfully:', sentMessage);
        
        // Add the new message to the current conversation
        const newMessageObj = {
          id: sentMessage.message_id,
          text: sentMessage.message,
          timestamp: new Date(sentMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isFromUser: true,
          senderName: `${user.firstName} ${user.lastName}`
        };
        
        // Update the conversation with the new message
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation 
            ? { 
                ...conv, 
                messages: [...conv.messages, newMessageObj],
                lastMessage: sentMessage.message,
                timestamp: new Date(sentMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            : conv
        ));
        
        setNewMessage('');
        
        // Scroll to bottom after sending message
        setTimeout(scrollToBottom, 100);
      } else {
        const error = await response.json();
        console.error('Failed to send message:', error);
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    }
  };

  const createNewConversation = () => {
    setShowCreateConversation(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setInitialMessage('');
  };

  const closeCreateConversation = () => {
    setShowCreateConversation(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUsers([]);
    setInitialMessage('');
  };

  const searchUsers = async (query: string) => {
    console.log('Searching for:', query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/messages/search-users?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      console.log('Search response:', response.status, data);
      
      if (response.ok) {
        // Map the backend response to match the frontend User interface
        const mappedUsers = data.map((user: any) => ({
          id: user.user_id,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          country: user.country,
          university: user.university,
          createdAt: user.created_at,
        }));
        console.log('Mapped users:', mappedUsers);
        setSearchResults(mappedUsers);
      } else {
        console.error('Failed to search users:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUserSelection = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(selectedUser => selectedUser.id === user.id);
      if (isSelected) {
        return prev.filter(selectedUser => selectedUser.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const removeSelectedUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const startConversation = async () => {
    if (selectedUsers.length === 0 || !initialMessage.trim() || !user) return;
    
    try {
      // Get current user ID from auth context
      const currentUserId = user.id;
      
      // Create array of all member IDs (current user + selected users)
      const memberIds = [currentUserId, ...selectedUsers.map(selectedUser => selectedUser.id)];
      
      console.log('Creating conversation with:', { memberIds, firstMessage: initialMessage.trim() });
      
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberIds,
          firstMessage: initialMessage.trim()
        }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response URL:', response.url);
      
      if (response.ok) {
        const conversation = await response.json();
        console.log('Conversation created:', conversation);
        closeCreateConversation();
        // Refresh conversations list to show the new conversation
        await fetchConversations();
      } else {
        const error = await response.json();
        console.error('Failed to create conversation:', error);
        
        if (response.status === 409) {
          // Duplicate conversation error
          alert(`You already have a conversation with ${selectedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')}. Please check your existing conversations.`);
        } else {
          alert('Failed to create conversation. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Fetch conversations when user changes
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Scroll to bottom when conversation changes
  useEffect(() => {
    if (selectedConversation && currentConversation?.messages.length) {
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedConversation, currentConversation?.messages.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
          <p className="text-gray-600">Stay connected with your international student community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            {/* Search Bar and Create Button */}
            <div className="p-4 border-b border-gray-200 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={createNewConversation}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Conversation</span>
              </button>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                    <p className="text-gray-500 mb-4">Start a conversation with other students</p>
                    <button
                      onClick={createNewConversation}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start Chatting</span>
                    </button>
                  </div>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation.id);
                      fetchMessages(conversation.id);
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-gray-600 font-semibold text-sm">{conversation.initials}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{conversation.name}</h3>
                          <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                          {conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-sm">{currentConversation.initials}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{currentConversation.name}</h3>
                      <p className="text-sm text-gray-500">
                        {currentConversation.name.includes(',') || currentConversation.name.includes('+') 
                          ? 'Group Chat' 
                          : 'International Student'
                        }
                      </p>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {currentConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.isFromUser
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.isFromUser ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                      onClick={sendMessage}
                      className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {conversations.length === 0 ? 'No conversations yet' : 'Select a conversation'}
                  </h3>
                  <p className="text-gray-500">
                    {conversations.length === 0 
                      ? 'Start a conversation with other students to begin messaging'
                      : 'Choose a conversation from the list to start messaging'
                    }
                  </p>
                  {conversations.length === 0 && (
                    <button
                      onClick={createNewConversation}
                      className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Start Your First Conversation</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Conversation Modal */}
      {showCreateConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Start New Conversation</h2>
              <button
                onClick={closeCreateConversation}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Selected Users ({selectedUsers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{user.firstName} {user.lastName}</span>
                      <button
                        onClick={() => removeSelectedUser(user.id)}
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto p-6">
              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600">Searching...</span>
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Type at least 2 characters to search for users</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No users found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((user) => {
                    const isSelected = selectedUsers.some(selectedUser => selectedUser.id === user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUserSelection(user)}
                        className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50 border border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleUserSelection(user)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 font-semibold text-sm">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.university} • {user.country}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message Input */}
            {selectedUsers.length > 0 && (
              <div className="p-6 border-t border-gray-200">
                <label htmlFor="initialMessage" className="block text-sm font-semibold text-gray-900 mb-2">
                  Initial Message
                </label>
                <textarea
                  id="initialMessage"
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Type your first message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            )}

            {/* Footer with Start Conversation Button */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={startConversation}
                disabled={selectedUsers.length === 0 || !initialMessage.trim()}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  selectedUsers.length === 0 || !initialMessage.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {selectedUsers.length === 0
                  ? 'Select users to start conversation'
                  : !initialMessage.trim()
                  ? 'Type a message to start conversation'
                  : `Start Conversation${selectedUsers.length > 1 ? ' (Group)' : ''}`
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
