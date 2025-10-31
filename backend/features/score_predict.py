# backend/features/score_predict.py

import os
import PyPDF2
from flask import Blueprint, request, jsonify, current_app
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

# Create a Blueprint
resume_tools_bp = Blueprint('resume_tools', __name__, url_prefix='/api')

# -------------------------------
# PDF TEXT EXTRACTION
# -------------------------------
def extract_text_from_pdf(file_stream, logger):
    """Extract text content from a PDF file."""
    try:
        pdf_reader = PyPDF2.PdfReader(file_stream)
        text_parts = [page.extract_text() for page in pdf_reader.pages if page.extract_text()]
        if not text_parts:
            logger.warning("No text extracted from PDF (possibly scanned document).")
            return ""
        return "\n".join(text_parts).strip()
    except Exception as e:
        logger.error(f"Error reading PDF: {e}", exc_info=True)
        raise ValueError(f"Could not process PDF: {e}")

# -------------------------------
# COSINE SIMILARITY CALCULATION
# -------------------------------
def calculate_similarity(text1, text2, sbert_model, logger):
    """Calculate cosine similarity between two texts using SBERT."""
    if not sbert_model:
        raise RuntimeError("SBERT model not provided for similarity calculation.")
    try:
        logger.info("Generating embeddings for resume and job description...")
        emb1 = sbert_model.encode(text1).reshape(1, -1)
        emb2 = sbert_model.encode(text2).reshape(1, -1)
        score = cosine_similarity(emb1, emb2)[0][0]
        return round(max(0.0, min(1.0, float(score))) * 100, 2)
    except Exception as e:
        logger.error(f"Error calculating similarity: {e}", exc_info=True)
        raise RuntimeError(f"Similarity calculation failed: {e}")

# -------------------------------
# MATCH SCORE ENDPOINT
# -------------------------------
@resume_tools_bp.route('/match_score', methods=['POST'])
def match_score_route_handler():
    """POST /api/match_score
    FormData:
        - resume_file: uploaded PDF file
        - job_description_text: text description of the job
    Returns:
        - JSON: {"match_score": float}
    """
    if not current_app.config.get('SBERT_MODEL_LOADED'):
        current_app.logger.error("Match score: SBERT model not loaded.")
        return jsonify({"error": "Scoring engine unavailable."}), 503

    if 'resume_file' not in request.files:
        return jsonify({"error": "No resume file uploaded."}), 400

    resume_file = request.files['resume_file']
    job_desc = request.form.get('job_description_text')

    if not job_desc:
        return jsonify({"error": "Job description text missing."}), 400

    try:
        resume_text = extract_text_from_pdf(resume_file, current_app.logger)
        sbert_model = current_app.config.get('SBERT_MODEL')
        score = calculate_similarity(resume_text, job_desc, sbert_model, current_app.logger)
        return jsonify({"match_score": score})
    except Exception as e:
        current_app.logger.error(f"Error in /match_score: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

# -------------------------------
# MODEL INITIALIZATION
# -------------------------------
def load_sbert_model(app):
    """Load SBERT model once and store in app config."""
    try:
        app.logger.info("Loading SBERT model (paraphrase-MiniLM-L6-v2)...")
        model = SentenceTransformer('paraphrase-MiniLM-L6-v2')
        app.config['SBERT_MODEL'] = model
        app.config['SBERT_MODEL_LOADED'] = True
        app.logger.info("SBERT model loaded successfully.")
    except Exception as e:
        app.logger.error(f"Error loading SBERT model: {e}", exc_info=True)
        app.config['SBERT_MODEL_LOADED'] = False
