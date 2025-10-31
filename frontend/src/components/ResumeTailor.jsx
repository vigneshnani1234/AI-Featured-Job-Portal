// import React, { useState, useEffect } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { UserButton, SignOutButton } from "@clerk/clerk-react";
// import "../styles/ResumeTailor.css";

// function ResumeTailor() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const job = location.state?.job; // comes from previous page

//   const [resumeFile, setResumeFile] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [feedback, setFeedback] = useState("");
//   const [error, setError] = useState(null);

//   const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

//   // Redirect if no job data (user directly visits /resume-tailor)
//   useEffect(() => {
//     if (!job) {
//       navigate("/dashboard", { replace: true });
//     }
//   }, [job, navigate]);

//   const handleFileChange = (e) => {
//     setResumeFile(e.target.files[0]);
//     setFeedback("");
//     setError(null);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!resumeFile) {
//       setError("Please upload your resume before proceeding.");
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     setFeedback("");

//     try {
//       const formData = new FormData();
//       formData.append("resume_file", resumeFile);
//       formData.append("job_title", job.title || "Software Engineer");
//       formData.append("job_description", job.description || "");

//       const res = await fetch(`${API_BASE_URL}/api/resume_feedback`, {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) {
//         const errData = await res.json();
//         throw new Error(errData.error || "Failed to analyze resume.");
//       }

//       const data = await res.json();
//       setFeedback(data.feedback || "No suggestions found.");
//     } catch (err) {
//       console.error("Error:", err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!job) return null;

//   return (
//     <div className="resume-tailor-container">
//       <header className="resume-tailor-header">
//         <h1 className="page-title">🧠 AI Resume Tailor</h1>
//         <div className="header-actions">
//           <UserButton afterSignOutUrl="/" />
//           <SignOutButton>
//             <button className="sign-out-button">Sign Out</button>
//           </SignOutButton>
//         </div>
//       </header>

//       <main className="resume-tailor-main">
//         {/* Job Info Summary */}
//         <div className="job-summary">
//           <h2 className="job-title">{job.title}</h2>
//           <p className="job-company">{job.company}</p>
//           <p className="job-location">{job.location}</p>
//           <p className="job-location">{job.description}</p>

//         </div>

//         {/* Upload Card */}
//         <div className="upload-card">
//           <form onSubmit={handleSubmit} className="upload-form">
//             <label htmlFor="resume-upload" className="upload-label">
//               Upload Your Resume (PDF)
//             </label>
//             <input
//               id="resume-upload"
//               type="file"
//               accept=".pdf"
//               onChange={handleFileChange}
//               className="file-input"
//             />

//             {resumeFile && <p className="file-name">Selected: {resumeFile.name}</p>}

//             <button
//               type="submit"
//               className="analyze-button"
//               disabled={loading || !resumeFile}
//             >
//               {loading ? "Analyzing..." : "Get AI Suggestions"}
//             </button>
//           </form>
//         </div>

//         {/* Feedback or Error */}
//         {error && <p className="error-text">❌ {error}</p>}

//         {feedback && (
//           <div className="feedback-card">
//             <h3 className="feedback-title">💡 AI Resume Suggestions</h3>
//             <pre className="feedback-text">{feedback}</pre>
//           </div>
//         )}

//         <button onClick={() => navigate(-1)} className="back-button">
//           ← Back to Job Page
//         </button>
//       </main>
//     </div>
//   );
// }

// export default ResumeTailor;
