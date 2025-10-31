import os
import re
import joblib
import numpy as np
from flask import Blueprint, jsonify, request, current_app
from sklearn.metrics.pairwise import cosine_similarity

# -----------------------------
# Blueprint setup
# -----------------------------
courses_bp = Blueprint("courses", __name__, url_prefix="/api")

# -----------------------------
# File paths (relative to project root)
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))        # backend/features
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "..", ".."))  # project root
MODEL_DIR = os.path.join(PROJECT_ROOT, "ML prediction")

VECTORIZER_PATH = os.path.join(MODEL_DIR, "tfidf_vectorizer.joblib")
COURSE_MATRIX_PATH = os.path.join(MODEL_DIR, "course_tfidf_matrix.joblib")
COURSE_METADATA_PATH = os.path.join(MODEL_DIR, "course_metadata.joblib")

# -----------------------------
# Utility functions
# -----------------------------
def clean_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def load_model():
    """Load model components from the ML prediction directory."""
    try:
        if not all(os.path.exists(p) for p in [VECTORIZER_PATH, COURSE_MATRIX_PATH, COURSE_METADATA_PATH]):
            current_app.logger.error("❌ Missing one or more .joblib files in 'ML prediction' directory.")
            return None, None, None

        vectorizer = joblib.load(VECTORIZER_PATH)
        tfidf_matrix = joblib.load(COURSE_MATRIX_PATH)
        metadata_df = joblib.load(COURSE_METADATA_PATH)
        current_app.logger.info("✅ Course recommender model loaded successfully.")
        return vectorizer, tfidf_matrix, metadata_df
    except Exception as e:
        current_app.logger.error(f"Error loading course model: {e}", exc_info=True)
        return None, None, None

# -----------------------------
# Prediction Route
# -----------------------------
@courses_bp.route("/predict_courses", methods=["POST"])
def predict_courses():
    """
    POST /api/predict_courses
    JSON:
        {
            "job_title": "Data Scientist",
            "job_description": "We are hiring a data scientist...",
            "top_n": 5
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        job_title = data.get("job_title", "")
        job_description = data.get("job_description", "")
        top_n = int(data.get("top_n", 5))

        if not job_title and not job_description:
            return jsonify({"error": "Both job_title and job_description are empty"}), 400

        vectorizer, tfidf_matrix, metadata_df = load_model()
        if vectorizer is None:
            return jsonify({"error": "Model not loaded. Please ensure .joblib files exist."}), 503

        query_text = clean_text(f"{job_title} {job_description}")
        if not query_text.strip():
            return jsonify({"courses": [], "message": "Query text is empty after cleaning."}), 200

        query_vector = vectorizer.transform([query_text])
        cosine_sim = cosine_similarity(query_vector, tfidf_matrix).flatten()

        top_indices = cosine_sim.argsort()[-top_n:][::-1]
        recommendations = []

        for idx in top_indices:
            score = float(cosine_sim[idx])
            if score < 0.01:
                continue

            course_info = metadata_df.iloc[idx]
            recommendations.append({
                "id": f"course_{idx}",
                "name": course_info.get("course_title", "N/A"),
                "url": course_info.get("Course URL", "#"),
                "skills_taught": course_info.get("course_skills", "N/A"),
                "description_snippet": (course_info.get("course_description", "")[:200] + "..."),
                "relevance": f"{round(score * 100, 2)}%",
                "similarity_score": round(score, 4)
            })

        return jsonify({"courses": recommendations}), 200

    except Exception as e:
        current_app.logger.error(f"Error during course prediction: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500
