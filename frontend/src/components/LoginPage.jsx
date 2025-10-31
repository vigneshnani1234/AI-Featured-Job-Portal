import React, { useEffect } from 'react';
import { SignInButton, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css'; // Import the new CSS file

function LoginPage() {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // Redirect to the dashboard after successful login
      navigate('/dashboard'); 
    }
  }, [isLoaded, isSignedIn, navigate]);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Welcome to the AI Job Portal</h1>
        <p className="login-description">
          Sign in to access personalized job listings and AI career enhancement tools.
        </p>
        
        <SignedOut>
          <SignInButton mode="modal">
            <button className="login-button">
              Sign in with Google
            </button>
          </SignInButton>
        </SignedOut>
        
        <SignedIn>
          <p className="redirect-message">Redirecting to dashboard...</p>
        </SignedIn>
      </div>
    </div>
  );
}

export default LoginPage;