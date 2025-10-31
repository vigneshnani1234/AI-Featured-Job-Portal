import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserButton, SignOutButton } from "@clerk/clerk-react";
import "../styles/CoursesPage.css";

function CoursesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state?.jobDetails; // Get job passed from AI Features Page

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Redirect if job data missing
  useEffect(() => {
    if (!job) {
      navigate("/dashboard", { replace: true });
    }
  }, [job, navigate]);

  // Fetch courses automatically
  useEffect(() => {
    const fetchCourses = async () => {
      if (!job) return;
      setLoading(true);
      setError(null);
      setCourses([]);

      try {
        const response = await fetch(`${API_BASE_URL}/api/predict_courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_title: job.title || "Software Engineer",
            job_description: job.description || "",
            top_n: 5,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Server error");
        }

        const data = await response.json();
        setCourses(data.courses || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [job, API_BASE_URL]);

  if (!job) return null;

  return (
    <div className="courses-container">
      {/* Header */}
      <header className="courses-header">
        <h1 className="courses-title">🎓 AI Course Recommendations</h1>
        <div className="header-actions">
          <UserButton afterSignOutUrl="/" />
          <SignOutButton>
            <button className="sign-out-button">Sign Out</button>
          </SignOutButton>
        </div>
      </header>

      {/* Job Overview */}
      <section className="job-summary-card">
        <h2 className="job-title">{job.title}</h2>
        <p className="job-company">{job.company || "Unknown Company"}</p>
        <p className="job-location">📍 {job.location || "Not specified"}</p>
        <p className="job-description">
          {job.description?.slice(0, 500) || "No job description available."}
        </p>
      </section>

      {/* Loading/Error/Results */}
      <main className="courses-main">
        {loading && <p className="loading-text">⏳ Fetching AI course recommendations...</p>}
        {error && <p className="error-text">❌ {error}</p>}
        {!loading && !error && courses.length === 0 && (
          <p className="placeholder-text">No relevant courses found for this role.</p>
        )}

        {/* Course Results */}
        <div className="courses-grid">
          {courses.map((course, index) => (
            <div className="course-card" key={course.id || index}>
              <h3 className="course-name">{course.name}</h3>
              <p className="course-similarity">
                🔹 Relevance: <span>{course.relevance}</span>
              </p>
              <p className="course-description">{course.description_snippet}</p>
              <p className="course-skills">
                🧩 Skills: <span>{course.skills_taught}</span>
              </p>
              <a
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="course-link"
              >
                View on Coursera →
              </a>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate(-1)}
          className="back-to-dashboard-button"
        >
          ← Back to Job Page
        </button>
      </main>
    </div>
  );
}

export default CoursesPage;
