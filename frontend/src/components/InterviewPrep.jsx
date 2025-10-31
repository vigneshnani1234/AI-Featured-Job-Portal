import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/InterviewPrep.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function InterviewPrep() {
  const location = useLocation();
  const navigate = useNavigate();
  const [job, setJob] = useState(location.state?.job || null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [averageScore, setAverageScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Persist job context
  useEffect(() => {
    if (location.state?.job) {
      localStorage.setItem("selectedJob", JSON.stringify(location.state.job));
      setJob(location.state.job);
    } else {
      const saved = localStorage.getItem("selectedJob");
      if (saved) setJob(JSON.parse(saved));
      else navigate("/dashboard");
    }
  }, [location.state, navigate]);

  // ✅ Fetch 10 technical questions
  useEffect(() => {
    if (!job) return;

    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/generate_technical_questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_title: job.title,
            job_description: job.description,
            num_questions: 10,
          }),
        });

        const data = await res.json();

        if (res.ok && Array.isArray(data.questions)) {
          setQuestions(data.questions);
          setAnswers(Array(data.questions.length).fill(""));
        } else {
          setError(data.error || "Failed to generate questions.");
        }
      } catch (err) {
        setError("Network error while fetching questions.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [job]);

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const handleSubmit = async () => {
    if (answers.every((a) => !a.trim())) {
      alert("Please answer at least one question!");
      return;
    }

    setEvaluating(true);
    setFeedback(null);
    setAverageScore(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/evaluate_technical_answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_details: {
            title: job.title,
            description: job.description,
          },
          questions_and_answers: questions.map((q, i) => ({
            id: i + 1,
            question: q,
            answer: answers[i],
          })),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback(data.detailed_feedback || []);
        setAverageScore(data.score || 0);
      } else {
        setError(data.error || "Evaluation failed.");
      }
    } catch (err) {
      setError("Error evaluating answers. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  if (!job)
    return <div className="loading">Redirecting to dashboard...</div>;

  return (
    <div className="tech-interview-container">
      <header className="tech-interview-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1 className="tech-title">Technical Interview Practice</h1>
      </header>

      <div className="job-context">
        <h2>{job.title}</h2>
        <p className="company">{job.company} — {job.location}</p>
        <p className="description">
          {job.description ? job.description.slice(0, 300) + "..." : "No description available"}
        </p>
      </div>

      {loading ? (
        <p className="loading">🧠 Generating technical questions...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <h3>Answer the following 10 questions:</h3>
          {questions.map((q, i) => (
            <div key={i} className="question-block">
              <p className="question"><strong>Q{i + 1}:</strong> {q}</p>
              <textarea
                rows={4}
                value={answers[i]}
                onChange={(e) => handleAnswerChange(i, e.target.value)}
                placeholder="Type your answer..."
                disabled={evaluating}
              />
            </div>
          ))}
          <button
            className="submit-button"
            onClick={handleSubmit}
            disabled={evaluating}
          >
            {evaluating ? "Evaluating..." : "Submit Answers"}
          </button>

          {feedback && (
            <div className="feedback-section">
              <h3>💬 AI Feedback</h3>
              {feedback.map((f, i) => (
                <div key={i} className="feedback-item">
                  <strong>Q{i + 1}:</strong> {f.feedback_text} ({f.score}/100)
                </div>
              ))}
              <p className="score-display">
                🏆 Average Score: <strong>{averageScore.toFixed(1)}%</strong>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default InterviewPrep;
