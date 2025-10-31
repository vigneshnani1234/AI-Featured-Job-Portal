# backend/app.py

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import logging

# Load environment variables
load_dotenv()

# Import blueprints
from features.jobs import jobs_bp
from features.score_predict import resume_tools_bp, load_sbert_model
from features.predict_courses import courses_bp
from features.interview_eval import interview_eval_bp, load_llm_model

def create_app():
    app = Flask(__name__)

    # ---------------------- LOGGING ----------------------
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    app.logger.setLevel(logging.INFO)

    # ---------------------- CONFIG ----------------------
    app.config['ADZUNA_API_ID'] = os.getenv("ADZUNA_API_ID")
    app.config['ADZUNA_API_KEY'] = os.getenv("ADZUNA_API_KEY")

    # ---------------------- CORS ----------------------
    CORS(app, resources={r"/*": {"origins": "*"}},supports_credentials=True)

    # ---------------------- BLUEPRINTS ----------------------
    app.register_blueprint(jobs_bp)
    app.register_blueprint(resume_tools_bp)
    app.register_blueprint(courses_bp)
    app.register_blueprint(interview_eval_bp)
    
    # ---------------------- MODELS ----------------------
    load_sbert_model(app)
    load_llm_model(app)

    @app.route('/')
    def index():
        return jsonify({
            "message": "AI Job Portal Backend Active!",
            "endpoints": [
                "/api/fetch_jobs",
                "/api/match_score",
                "/api/course_recommendations",
                "/api/resume_feedback"
            ]
        })

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
