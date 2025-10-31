import React, { useState, useEffect } from "react";
import { UserButton, useUser, SignOutButton } from "@clerk/clerk-react";
import "../styles/Dashboard.css";
import JobCard from "./JobCard";

function Dashboard() {
  const { isLoaded, isSignedIn, user } = useUser();

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [errorJobs, setErrorJobs] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ Use correct environment variable and consistent default URL
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

  useEffect(() => {
    // Run only when user is signed in and API URL is available
    if (!isSignedIn) return;

    const fetchJobs = async () => {
      setLoadingJobs(true);
      setErrorJobs(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/fetch_jobs?keywords=software%20engineer&location=india&page=${currentPage}`
        );

        if (!response.ok) {
          // Try to parse error body safely
          let errMsg = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errMsg = errorData.error || errMsg;
          } catch {
            // Ignore JSON parse errors
          }
          throw new Error(errMsg);
        }

        const data = await response.json();
        setJobs(data.jobs || []);
        const total = data.total_results || 0;
        setTotalPages(Math.max(1, Math.ceil(total / 20))); // Default 20 per page
      } catch (error) {
        console.error("❌ Error fetching jobs:", error);
        setErrorJobs(error.message || "Failed to fetch jobs");
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [isSignedIn, currentPage, API_BASE_URL]);

  // ======================== Render Logic ==========================
  if (!isLoaded) return <div className="loading-message">Loading user data...</div>;
  if (!isSignedIn) return <div className="error-message">You are not signed in.</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">
          Welcome, {user.firstName || user.emailAddresses?.[0]?.emailAddress || "User"}!
        </h1>
        <div className="header-actions">
          <UserButton afterSignOutUrl="/" />
          <SignOutButton>
            <button className="sign-out-button">Sign Out</button>
          </SignOutButton>
        </div>
      </header>

      <main className="dashboard-main">
        <h2 className="section-title">Your Job Listings</h2>

        {loadingJobs && <div className="loading-message">Fetching job listings...</div>}
        {errorJobs && <div className="error-message">Error: {errorJobs}</div>}

        {!loadingJobs && !errorJobs && jobs.length === 0 && (
          <div className="job-listings-placeholder">
            <p className="placeholder-text-main">No jobs found.</p>
            <p className="placeholder-text-sub">
              Check Adzuna API keys or backend connectivity.
            </p>
          </div>
        )}

        {!loadingJobs && !errorJobs && jobs.length > 0 && (
          <>
            <div className="job-cards-grid">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>

            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
