// src/components/JobMatchScore.jsx

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserButton, SignOutButton } from "@clerk/clerk-react";
import "../styles/JobMatchScore.css";

function JobMatchScore() {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.job;

  const [resumeFile, setResumeFile] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Your Flask backend URL (from .env or fallback)
  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Redirect if job data missing
  useEffect(() => {
    if (!job) {
      navigate("/dashboard", { replace: true });
    }
  }, [job, navigate]);

  const handleFileChange = (event) => {
    setResumeFile(event.target.files[0]);
    setMatchScore(null);
    setExplanation(null);
    setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!resumeFile) {
      setError("Please upload a resume file before submitting.");
      return;
    }

    setLoading(true);
    setError(null);
    setMatchScore(null);
    setExplanation(null);

    try {
      // Prepare form data
      const formData = new FormData();
      formData.append("resume_file", resumeFile);
      formData.append("job_description_text", job.description);

      // Send POST request to Flask backend
      const response = await fetch(`${API_BASE_URL}/api/match_score`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get match score");
      }

      // Display results
      setMatchScore(data.match_score?.toFixed(2) || 0);
      setExplanation(
        `Your resume and this job description share ${data.match_score?.toFixed(
          2
        )}% similarity based on semantic embeddings.`
      );
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.message || "An error occurred while analyzing your resume."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  return (
    <div className="job-match-score-container">
      <header className="job-match-score-header">
        <h1 className="job-match-score-title">AI Job Match Score</h1>
        <div className="header-actions">
          <UserButton afterSignOutUrl="/" />
          <SignOutButton>
            <button className="sign-out-button">Sign Out</button>
          </SignOutButton>
        </div>
      </header>

      <main className="job-match-score-main">
        {/* Job Overview Section */}
        <div className="job-details-display">
          <h2 className="job-details-title">{job.title}</h2>
          <p className="job-details-company-location">
            {job.company} — {job.location}
          </p>
          {job.salary_min && (
            <p className="job-details-salary">
              💰 Salary: {job.salary_min} - {job.salary_max}
            </p>
          )}
          <div className="job-details-description-wrapper">
            <p className="job-details-description">{job.description}</p>
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="match-score-card">
          <h3 className="card-title">Upload Resume for AI Match Analysis</h3>

          <form onSubmit={handleSubmit} className="resume-upload-form">
            <label htmlFor="resume-upload" className="upload-label">
              Upload your resume (.pdf or .txt):
            </label>

            <input
              id="resume-upload"
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="file-input"
            />

            {resumeFile && (
              <p className="selected-file">Selected file: {resumeFile.name}</p>
            )}
            {error && <p className="error-message">{error}</p>}

            <button
              type="submit"
              disabled={loading || !resumeFile}
              className="submit-button"
            >
              {loading ? "Analyzing..." : "Get Match Score"}
            </button>
          </form>

          {/* Match Result Display */}
          {matchScore !== null && (
            <div className="match-results">
              <h4 className="match-score-heading">
                Job Match Score:{" "}
                <span
                  className={`score-value ${
                    matchScore > 80
                      ? "high-score"
                      : matchScore > 60
                      ? "medium-score"
                      : "low-score"
                  }`}
                >
                  {matchScore}%
                </span>
              </h4>
              <p className="match-explanation">{explanation}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          className="back-to-dashboard-button"
        >
          ← Back to Dashboard
        </button>
      </main>
    </div>
  );
}

export default JobMatchScore;
