# SteelHacks - International Student Community Platform

A comprehensive web application designed to help international students connect, learn, and integrate into their new academic and cultural environments. Built for SteelHacks 2024.

## 🌟 Features

### 🔐 Authentication & User Management
- **User Registration & Login** with secure password hashing
- **Profile Management** with detailed student information
- **Session-based Authentication** with PostgreSQL session store
- **User Search & Discovery** with filtering capabilities

### 🤝 Social Networking
- **Connection System** - Send, accept, and manage friend requests
- **Real-time Messaging** with Socket.IO
- **User Profiles** with interests, languages, and academic info
- **Meet People** - Discover and connect with other students

### 📚 Learning & Education
- **Interactive Learning Modules** with AI-generated content
- **Quiz System** with multiple categories:
  - **Culture & Social Norms** - Campus life and social etiquette
  - **Practical Skills** - Banking, transportation, housing, healthcare
  - **Language** - Modern terminology and slang
  - **Legal & Immigration** - Visa status, campus jobs, laws, student office
- **Progress Tracking** - Monitor learning achievements
- **Personalized Content** - University-specific information

### 💬 Real-time Communication
- **Instant Messaging** with Socket.IO
- **Group Conversations** - Create and manage group chats
- **Message Notifications** - Real-time notification system
- **Message Search** - Find specific conversations and messages

### 🎯 Smart Features
- **🤖 Google Gemini AI Integration** - Advanced AI-powered content generation
- **📚 Dynamic Learning Content** - Personalized educational materials
- **🧠 Intelligent Quiz Generation** - AI creates relevant quiz questions
- **🔄 Smart Fallbacks** - Hardcoded content when AI is unavailable
- **📱 Responsive Design** - Works on desktop and mobile
- **⚡ Real-time Updates** - Live notifications and messaging

## 🎥 Demo

**Watch our project demonstration:**  
[![YouTube Demo](https://img.shields.io/badge/YouTube-Demo%20Video-red?style=for-the-badge&logo=youtube)](https://www.youtube.com/watch?v=qviMgNVRC7I)


## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Neon
- **Socket.IO** for real-time communication
- **🤖 Google Gemini AI** for intelligent content generation
- **Express Session** with PostgreSQL store
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Socket.IO Client** for real-time features
- **Lucide React** for icons

### Deployment
- **Backend**: Deployed on Render
- **Frontend**: Deployed on Vercel
- **Database**: Neon PostgreSQL
- **Environment**: Production-ready with proper CORS and session handling

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd steelhacks-5
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   # Database Configuration
   PGHOST=your-postgres-host
   PGDATABASE=your-database-name
   PGUSER=your-username
   PGPASSWORD=your-password
   
   # 🤖 Google Gemini AI Configuration
   GEMINI_KEY=your-google-gemini-api-key
   
   # Server Configuration
   SESSION_SECRET=your-session-secret
   PORT=8000
   NODE_ENV=production
   ```
   
   **Get your Google Gemini API key:**
   1. Go to [Google AI Studio](https://aistudio.google.com/)
   2. Create a new project
   3. Generate an API key
   4. Add it to your `.env` file

   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

5. **Set up the database**
   
   The application will automatically create the necessary tables on first run.

6. **Start the development servers**

   **Backend:**
   ```bash
   npm run dev
   ```

   **Frontend (in a new terminal):**
   ```bash
   cd frontend
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000

## 📁 Project Structure

```
steelhacks-5/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── connectionController.js # User connections
│   │   ├── learningController.js # Learning modules & quizzes
│   │   ├── messagingController.js # Real-time messaging
│   │   └── profileController.js  # User profiles
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── connections.js       # Connection routes
│   │   ├── learning.js          # Learning routes
│   │   ├── messagingRoute.js    # Messaging routes
│   │   └── profileauth.js       # Profile routes
│   ├── server.js                # Main server file
│   └── socketio.js              # Socket.IO configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx       # Navigation header
│   │   │   ├── NotificationBell.tsx # Notification system
│   │   │   └── Toast.tsx        # Toast notifications
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx  # Authentication context
│   │   │   └── ToastContext.tsx # Toast context
│   │   ├── pages/
│   │   │   ├── Home.tsx         # Dashboard
│   │   │   ├── LoginPage.tsx    # Login/Register
│   │   │   ├── Profile.tsx      # User profile
│   │   │   ├── Messages.tsx     # Messaging interface
│   │   │   ├── MeetPeople.tsx   # User discovery
│   │   │   ├── Quizzes.tsx      # Learning modules
│   │   │   └── CategoryDetail.tsx # Quiz categories
│   │   ├── services/
│   │   │   ├── authService.ts   # Authentication API
│   │   │   ├── connectionService.ts # Connection API
│   │   │   └── learningService.ts # Learning API
│   │   └── config/
│   │       └── api.ts           # API configuration
│   ├── package.json
│   └── vite.config.ts
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - Get all users (with pagination)

### Profile Management
- `GET /api/profileauth/profile` - Get user profile
- `PUT /api/profileauth/profile` - Update user profile

### Connections
- `POST /api/connections/request` - Send connection request
- `POST /api/connections/:id/accept` - Accept connection
- `DELETE /api/connections/:id/reject` - Reject connection
- `GET /api/connections/pending` - Get pending requests
- `GET /api/connections/status/:userId` - Check connection status

### Learning & Quizzes
- `POST /api/learning/content` - Get learning content
- `POST /api/learning/quiz/generate` - Generate quiz questions
- `POST /api/learning/quiz/submit` - Submit quiz answers
- `GET /api/learning/progress/:userId` - Get user progress
- `GET /api/learning/recent-activity/:userId` - Get recent activity

### Messaging
- `GET /api/messages` - Get conversations
- `POST /api/messages` - Create conversation
- `GET /api/messages/:id/messages` - Get messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/search-users` - Search users
- `GET /api/messages/notifications/:userId` - Get notifications

## 🎨 Key Features Explained

### 🤖 AI-Powered Learning Content (Google Gemini)
- **Advanced AI Integration** - Uses Google Gemini 1.5 Flash model
- **Personalized Content Generation** - Creates unique learning materials
- **University-Specific Information** - Tailored content for different institutions
- **Intelligent Quiz Creation** - AI generates relevant quiz questions
- **Smart Fallback System** - Hardcoded content when AI is unavailable
- **Real-time Content Updates** - Fresh content generated on demand
- **Multi-language Support** - AI adapts content for different languages

### Real-time Messaging
- Socket.IO for instant messaging
- Group conversation support
- Message notifications with persistence
- Real-time typing indicators and online status

### Smart User Discovery
- Advanced filtering by interests, university, country
- Connection request system
- Profile browsing with detailed information
- Smart matching based on common interests

### Session Management
- Secure session handling with PostgreSQL store
- Cross-origin session support
- Automatic session cleanup
- Environment-aware configuration

## 🚀 Deployment

### Backend (Render)
1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy as a Web Service
4. Build Command: `npm install`
5. Start Command: `npm start`

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set root directory to `frontend`
3. Set build command to `npm run build`
4. Set output directory to `dist`
5. Add environment variable: `VITE_API_URL=https://your-backend-url.onrender.com`

### Database (Neon)
1. Create a new PostgreSQL database on Neon
2. Get connection details
3. Add to environment variables
4. Tables will be created automatically

## 🔒 Security Features

- **Password Hashing** with bcryptjs
- **Session Security** with httpOnly cookies
- **CORS Protection** with specific origin allowlist
- **Input Validation** with express-validator
- **SQL Injection Protection** with parameterized queries
- **XSS Protection** with helmet.js

## 🧪 Testing

### Backend Testing
```bash
# Start backend server
npm run dev

# Test API endpoints
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","firstName":"Test","lastName":"User","country":"US","university":"Test University"}'
```

### Frontend Testing
```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 👥 Team

Built for SteelHacks 2025.

### Team Members
- **Ryan Berry** - [rpb62@pitt.edu]
- **David Ejindu** - [ejindudavid540@gmail.com]
- **Aarav Kakade** - [ask272@pitt.edu]

## 🛠️ Credits & Tools

### Design & Prototyping
- **🎨 Figma** - Used for UI/UX design, wireframing, and prototyping the user interface

### Development Assistance
- **🤖 Claude AI** - Assisted with code architecture, debugging, and implementation guidance
- **⚡ Cursor AI** - Provided real-time coding assistance, code completion, and development support

### AI Integration
- **🤖 Google Gemini** - Powers the intelligent content generation and quiz creation features

## 🆘 Support

For support or questions, please open an issue in the repository.

---

**Built with ❤️ for the international student community**
