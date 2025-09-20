import React, { useState } from 'react';
import { Search, MoreVertical, Send } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  timestamp: string;
  isFromUser: boolean;
}

interface Conversation {
  id: number;
  name: string;
  initials: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  messages: Message[];
}

const Messages: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState(1);
  const [newMessage, setNewMessage] = useState('');

  const conversations: Conversation[] = [
    {
      id: 1,
      name: 'Maria Rodriguez',
      initials: 'MR',
      lastMessage: 'Thanks for helping me with the project!',
      timestamp: '2 min',
      unreadCount: 2,
      messages: [
        { id: 1, text: "Hey! How's your semester going so far?", timestamp: '10:30 AM', isFromUser: false },
        { id: 2, text: "It's going well! Really enjoying my classes this term.", timestamp: '10:32 AM', isFromUser: true },
        { id: 3, text: "That's awesome! I'm glad you're settling in well.", timestamp: '10:33 AM', isFromUser: false },
        { id: 4, text: "Thanks! Are you planning to attend the cultural festival next week?", timestamp: '10:35 AM', isFromUser: true },
        { id: 5, text: "Thanks for helping me with the project!", timestamp: '2 min', isFromUser: false }
      ]
    },
    {
      id: 2,
      name: 'Chen Wei',
      initials: 'CW',
      lastMessage: 'Are you free to grab coffee this afternoon?',
      timestamp: '1 hour',
      unreadCount: 0,
      messages: []
    },
    {
      id: 3,
      name: 'Priya Patel',
      initials: 'PP',
      lastMessage: 'See you at the library tomorrow!',
      timestamp: 'Yesterday',
      unreadCount: 0,
      messages: []
    },
    {
      id: 4,
      name: 'Ahmed Hassan',
      initials: 'AH',
      lastMessage: 'How was your weekend?',
      timestamp: '2 days',
      unreadCount: 0,
      messages: []
    },
    {
      id: 5,
      name: 'Sophie Martin',
      initials: 'SM',
      lastMessage: 'Looking forward to the event!',
      timestamp: '3 days',
      unreadCount: 1,
      messages: []
    }
  ];

  const currentConversation = conversations.find(conv => conv.id === selectedConversation);

  const sendMessage = () => {
    if (newMessage.trim()) {
      // In a real app, this would send the message to the backend
      setNewMessage('');
    }
  };

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
            {/* Search Bar */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
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
              ))}
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
                      <p className="text-sm text-gray-500">International Student</p>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
