# backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging

# Load environment variables
load_dotenv()

# --- Import Blueprints ---
from features.jobs import jobs_bp
from features.score_predict import resume_tools_bp, load_sbert_model
from features.predict_courses import courses_bp
from features.interview_eval import interview_eval_bp

def create_app():
    """
    Creates and configures the Flask application. This is known as the
    'application factory' pattern.
    """
    app = Flask(__name__)

    # ---------------------- LOGGING ----------------------
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    app.logger.setLevel(logging.INFO)
    app.logger.info("🧠 Initializing AI Featured Job Portal Backend...")

    # ---------------------- CONFIG ----------------------
    app.config['ADZUNA_API_ID'] = os.getenv("ADZUNA_API_ID")
    app.config['ADZUNA_API_KEY'] = os.getenv("ADZUNA_API_KEY")

    # ---------------------- CORS ----------------------
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # ---------------------- BLUEPRINTS ----------------------
    app.register_blueprint(jobs_bp)
    app.register_blueprint(resume_tools_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(interview_eval_bp)

    # ---------------------- MODELS ----------------------
    try:
        load_sbert_model(app)
        app.logger.info("✅ SBERT model loaded successfully.")
    except Exception as e:
        app.logger.error(f"⚠️ Failed to load SBERT model: {e}")

    app.logger.info("✅ Interview Evaluation feature active.")

    # ---------------------- ROOT ROUTE ----------------------
    @app.route('/')
    def index():
        return jsonify({
            "message": "🚀 AI Featured Job Portal Backend Active!",
            "available_endpoints": [
                "/api/fetch_jobs",
                "/api/match_score",
                "/api/course_recommendations",
                "/api/generate_interview_questions",
                "/api/evaluate_answers"
            ]
        })

    return app

# =================================================================
#               *** THE CRITICAL CHANGE FOR DEPLOYMENT ***
# =================================================================
# This line calls the function above and creates the Flask application
# instance in the global scope. The variable MUST be named 'app' so that
# Gunicorn's command `gunicorn app:app` can find it.
app = create_app()
# =================================================================


# This block is now ONLY used for running the server locally on your computer.
# Render and Gunicorn will ignore it.
if __name__ == '__main__':
    # It uses the 'app' instance created above.
    app.run(host='0.0.0.0', port=5000, debug=True)