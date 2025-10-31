// frontend/src/components/AIFeaturesPage.js

import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../styles/AIFeaturesPage.css";

function AIFeaturesPage() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.job;

  if (!job) {
    return (
      <div className="ai-features-container error-state">
        <h1 className="ai-features-title">Job Details Not Found</h1>
        <p>The job details could not be loaded. Please return to the dashboard.</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="back-to-dashboard-button"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // ✅ CORRECTED: This function now passes the state object with the correct key.
  const handleNavigate = (path) => {
    // The key here is now 'jobDetails', which matches what InterviewPrep.js expects.
    navigate(path, { state: { jobDetails: job } });
  };

  return (
    <div className="ai-features-container">
      <header className="ai-features-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Jobs
        </button>
        <h1 className="ai-features-title">AI Features for: {job.title}</h1>
      </header>

      <div className="job-details-overview">
        <h2 className="job-overview-title">{job.title}</h2>
        <p className="job-overview-company">
          {job.company} - {job.location}
        </p>
        {job.salary_min && (
          <p className="job-overview-salary">
            💰 Salary: {job.salary_min} - {job.salary_max}
          </p>
        )}
        <p className="job-overview-description">{job.description}</p>
      </div>

      <div className="ai-modules-grid">
        <div className="ai-module-card">
          <h3 className="ai-module-title">1. Job Match Score</h3>
          <p className="ai-module-description">
            Upload your resume to see how well it matches this job.
          </p>
          <button
            className="ai-module-button"
            // You might want to update this one too for consistency
            onClick={() => handleNavigate("/jobscore")}
          >
            Go to Job Match Score →
          </button>
        </div>

        <div className="ai-module-card">
          <h3 className="ai-module-title">2. Recommended Courses</h3>
          <p className="ai-module-description">
            Discover relevant courses to upskill for this role.
          </p>
          <button
            className="ai-module-button"
            // And this one
            onClick={() => handleNavigate("/courses")}
          >
            Explore Courses →
          </button>
        </div>

        <div className="ai-module-card">
          <h3 className="ai-module-title">3. Interview Preparation</h3>
          <p className="ai-module-description">
            Generate tailored interview questions for this job.
          </p>
          <button
            className="ai-module-button"
            onClick={() => handleNavigate("/interview-prep")}
          >
            Start Interview Prep →
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIFeaturesPage;