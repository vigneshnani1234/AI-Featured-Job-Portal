// frontend/src/components/InterviewPrep.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// Make sure you have a CSS file for styling if you uncomment this
// import './InterviewPrep.css'; 

// Use environment variables for the API URL. Ensure it matches your backend port.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const InterviewPrep = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State for the core data
  const [jobDetails, setJobDetails] = useState(null);
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [evaluationResult, setEvaluationResult] = useState(null);
  
  // State to manage the UI (loading, evaluating, errors)
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState('');
  
  // --- Effect for Persisting and Retrieving Job Context ---
  useEffect(() => {
    let currentJobDetails = null;

    // 1. Prioritize job details from navigation state (when coming from another page)
    if (location.state?.jobDetails) {
      currentJobDetails = location.state.jobDetails;
      // Save to localStorage to persist it across page reloads
      localStorage.setItem('practicingJob', JSON.stringify(currentJobDetails));
    } else {
      // 2. Fallback to localStorage (if the page was refreshed)
      const savedJob = localStorage.getItem('practicingJob');
      if (savedJob) {
        currentJobDetails = JSON.parse(savedJob);
      }
    }

    // 3. Decide what to do based on whether we have job details
    if (currentJobDetails && currentJobDetails.title) {
      setJobDetails(currentJobDetails);
      fetchInterviewQuestions(currentJobDetails);
    } else {
      // If no job details are found anywhere, set an error.
      setError("No job context found. Please select a job to start practicing.");
      setIsLoading(false);
    }
  }, [location.state]); // This effect runs when the component loads or location state changes

  const fetchInterviewQuestions = async (jobData) => {
    setIsLoading(true);
    setError(''); // Clear previous errors
    setInterviewQuestions([]); // Clear old questions

    try {
      const payload = {
        job_role: jobData.title,
        context_keywords: jobData.description || "",
        num_technical: 3,
        num_behavioral: 2,
        num_situational: 2,
      };

      const response = await fetch(`${API_BASE_URL}/api/generate_interview_questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to generate questions.");
      }

      const data = await response.json();
      let allQuestions = [];
      let idCounter = 1;
      
      const questionCategories = ['technical_questions', 'behavioral_questions', 'situational_questions'];
      questionCategories.forEach(category => {
        if (data.questions && Array.isArray(data.questions[category])) {
          data.questions[category].forEach(qText => {
            allQuestions.push({
              id: idCounter++,
              type: category.split('_')[0],
              question: qText,
              answer: '',
            });
          });
        }
      });
      
      setInterviewQuestions(allQuestions);

      if (allQuestions.length === 0) {
        setError("The AI could not generate questions for this role. You can try another role.");
      }
    } catch (err) {
      setError(err.message || "A network error occurred. Is the backend server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (id, value) => {
    setInterviewQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, answer: value } : q))
    );
  };

  const handleSubmit = async () => {
    if (interviewQuestions.every(q => !q.answer.trim())) {
      setError("Please provide an answer to at least one question.");
      return;
    }

    setIsEvaluating(true);
    setError('');
    setEvaluationResult(null);

    try {
      const payload = {
        job_details: {
          title: jobDetails.title,
          description: jobDetails.description,
        },
        questions_and_answers: interviewQuestions,
      };

      const response = await fetch(`${API_BASE_URL}/api/evaluate_answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to evaluate answers.");
      }

      setEvaluationResult(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setIsEvaluating(false);
    }
  };

  // --- Render Logic ---

  if (isLoading) {
    return <div className="practice-container loading">🧠 Generating AI questions...</div>;
  }

  // If there's an error and no questions, show a dedicated error screen
  if (error && interviewQuestions.length === 0) {
    return (
      <div className="practice-container error-page">
        <h2>Something went wrong</h2>
        <p className="error-message">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="button-primary">
          Select a Different Job
        </button>
      </div>
    );
  }

  return (
    <div className="practice-container">
      <header className="practice-header">
        <button onClick={() => navigate(-1)} className="back-button">← Back</button>
        <h1>Interview Practice</h1>
        {jobDetails && (
          <div className="job-context">
            <h2>Practicing for: {jobDetails.title}</h2>
            {jobDetails.company?.display_name && <p>At: {jobDetails.company.display_name}</p>}
          </div>
        )}
      </header>

      {/* Display a submission-related error here, above the button */}
      {error && evaluationResult === null && <p className="error-message">{error}</p>}
      
      {interviewQuestions.length > 0 ? (
        <div className="questions-section">
          {interviewQuestions.map((q) => (
            <div key={q.id} className="question-item">
              <label htmlFor={`q-${q.id}`} className="question-label">
                <strong>{q.id}. ({q.type})</strong> {q.question}
              </label>
              <textarea
                id={`q-${q.id}`}
                rows="5"
                value={q.answer}
                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                placeholder="Type your answer here..."
                disabled={isEvaluating}
              />
            </div>
          ))}
          <button
            onClick={handleSubmit}
            className="submit-button"
            disabled={isEvaluating}
          >
            {isEvaluating ? 'Evaluating...' : 'Submit for AI Evaluation'}
          </button>
        </div>
      ) : (
        <p>No questions could be loaded for this role.</p>
      )}

      {evaluationResult && (
        <div className="evaluation-section">
          <h2>Evaluation Complete</h2>
          <div className="overall-score">
            Overall Score: <strong>{evaluationResult.score.toFixed(0)}%</strong>
          </div>
          <p className="overall-feedback">
            <strong>AI Feedback:</strong> {evaluationResult.feedback}
          </p>
          <div className="detailed-feedback">
            <h4>Detailed Breakdown:</h4>
            <ul>
              {evaluationResult.detailed_feedback.map((item) => (
                <li key={item.question_id}>
                  <strong>Q{item.question_id} ({item.score}/100):</strong> {item.feedback_text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewPrep;