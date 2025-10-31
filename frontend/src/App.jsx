import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import AIFeaturesPage from './components/AIFeaturesPage'; // Import the AI Features Page
import JobScorePage from "./components/JobMatchScore"; // create this next
import CoursesPage from './components/CoursesPage';
import InterviewPrep from './components/InterviewPrep';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public route for the login page */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/ai-features/:jobId" 
          element={
            <>
              <SignedIn>
                <AIFeaturesPage />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
        <Route path="/jobscore" element={<JobScorePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/interview-prep" element={<InterviewPrep />} />

      </Routes>
    </Router>
  );
}

export default App;