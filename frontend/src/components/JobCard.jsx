import React from 'react';
import '../styles/JobCard.css'; // Dedicated CSS for job cards
import { useNavigate } from 'react-router-dom'; // For AI Features navigation

function JobCard({ job }) {
  const navigate = useNavigate();

  const handleApplyClick = () => {
    window.open(job.redirect_url, '_blank');
  };

  const handleAIFeaturesClick = () => {
    // Navigate to a new page for AI features, passing job ID or full job object
    // For now, let's log and imagine the navigation
    console.log("Navigating to AI Features for job:", job.id, job.title);
    navigate(`/ai-features/${job.id}`, { state: { job } });
  };

  return (
    <div className="job-card">
      <h3 className="job-card-title">{job.title}</h3>
      <p className="job-card-company">{job.company}</p>
      <p className="job-card-location">{job.location}</p>
      
      {job.salary_min && job.salary_max && (
        <p className="job-card-salary">
          Salary: {job.salary_min} - {job.salary_max}
          {job.salary_is_predicted && <span className="salary-predicted">(predicted)</span>}
        </p>
      )}
      
      {/* Display a truncated description */}
      <p className="job-card-description">
        {job.description ? `${job.description.substring(0, 150)}...` : 'No description available.'}
      </p>

      <div className="job-card-actions">
        <button onClick={handleApplyClick} className="job-card-button apply-button">
          Apply
        </button>
        <button onClick={handleAIFeaturesClick} className="job-card-button ai-features-button">
          AI Features
        </button>
      </div>
    </div>
  );
}

export default JobCard;