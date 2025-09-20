import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Profile from './pages/Profile';
import MeetPeople from './pages/MeetPeople';
import Messages from './pages/Messages';
import Quizzes from './pages/Quizzes';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Auth pages without header */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Main app pages with header */}
          <Route path="/*" element={
            <>
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/meet-people" element={<MeetPeople />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/quizzes" element={<Quizzes />} />
                </Routes>
              </main>
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
