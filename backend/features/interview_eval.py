import os
from flask import Blueprint, request, jsonify, current_app
from transformers import pipeline

# Flask Blueprint
interview_eval_bp = Blueprint('interview_eval', __name__, url_prefix='/api')

# -------------------------
# Load LLM once globally
# -------------------------
generator = None

def load_llm_model(app):
    """Load a lightweight HuggingFace model suitable for CPUs."""
    global generator
    try:
        app.logger.info("Loading LaMini-Flan-T5 model for question generation and evaluation...")
        generator = pipeline(
            "text2text-generation",
            model="MBZUAI/LaMini-Flan-T5-77M",  # ~300MB, CPU-friendly
            max_new_tokens=300,
            truncation=True
        )
        app.logger.info("✅ LLM model loaded successfully.")
    except Exception as e:
        app.logger.error(f"Error loading LLM model: {e}")
        generator = None


# -------------------------
# Generate 10 Technical Questions
# -------------------------
@interview_eval_bp.route('/generate_technical_questions', methods=['POST'])
def generate_technical_questions():
    if generator is None:
        return jsonify({"error": "LLM model not loaded."}), 503

    data = request.get_json()
    job_title = data.get("job_title", "")
    job_description = data.get("job_description", "")
    num_questions = data.get("num_questions", 10)

    if not job_description:
        return jsonify({"error": "Job description required"}), 400

    prompt = f"""
    You are an expert interviewer preparing technical interview questions.
    Based on the job title "{job_title}" and job description below,
    generate {num_questions} diverse, specific technical questions that test practical understanding and reasoning.

    Job Description:
    {job_description}

    Provide each question on a new line, without numbering or explanations.
    """

    try:
        result = generator(prompt, max_new_tokens=500)
        output_text = result[0]['generated_text']

        # Split and clean questions
        questions = [
            q.strip().lstrip("1234567890.:-) ")
            for q in output_text.split("\n") if len(q.strip()) > 5
        ]
        questions = questions[:num_questions]  # limit
        return jsonify({"questions": questions}), 200
    except Exception as e:
        current_app.logger.error(f"Error generating questions: {e}", exc_info=True)
        return jsonify({"error": "Failed to generate questions"}), 500


# -------------------------
# Evaluate Answers
# -------------------------
@interview_eval_bp.route('/evaluate_technical_answers', methods=['POST'])
def evaluate_technical_answers():
    if generator is None:
        return jsonify({"error": "LLM model not loaded."}), 503

    data = request.get_json()
    job_details = data.get("job_details", {})
    q_and_a = data.get("questions_and_answers", [])

    if not q_and_a:
        return jsonify({"error": "No answers provided"}), 400

    title = job_details.get("title", "Unknown Role")
    desc = (job_details.get("description") or "")[:400]

    total_score = 0
    count = 0
    results = []

    try:
        for qa in q_and_a:
            q = qa.get("question", "")
            a = qa.get("answer", "").strip()

            if not a:
                results.append({
                    "question_id": qa.get("id"),
                    "score": 0,
                    "feedback_text": "No answer provided."
                })
                continue

            eval_prompt = f"""
            You are a senior interviewer evaluating a candidate's technical answer.

            Job Role: {title}
            Job Description: {desc}

            Question: {q}
            Candidate Answer: {a}

            Evaluate the correctness, technical depth, and clarity.
            Provide a short constructive feedback (1-2 sentences) and a score from 0 to 100.

            Respond strictly in JSON format like:
            {{
                "score": 85,
                "feedback": "Good understanding of API design but lacked mention of async patterns."
            }}
            """

            response = generator(eval_prompt, max_new_tokens=200)
            text = response[0]['generated_text']

            # Try to parse JSON-like output
            import re, json
            try:
                json_match = re.search(r"\{.*\}", text, re.S)
                if json_match:
                    parsed = json.loads(json_match.group(0))
                    score = parsed.get("score", 0)
                    feedback_text = parsed.get("feedback", "No feedback.")
                else:
                    score = 0
                    feedback_text = "LLM returned invalid format."
            except Exception:
                score = 0
                feedback_text = "Evaluation failed to parse."

            results.append({
                "question_id": qa.get("id"),
                "score": score,
                "feedback_text": feedback_text
            })

            total_score += score
            count += 1

        avg_score = total_score / count if count else 0

        overall_feedback = (
            f"Your average score is {avg_score:.0f}%. "
            + ("Excellent performance!" if avg_score > 75 else
               "Good understanding, needs improvement." if avg_score > 50 else
               "You should revise key technical areas.")
        )

        return jsonify({
            "score": avg_score,
            "feedback": overall_feedback,
            "detailed_feedback": results
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error evaluating answers: {e}", exc_info=True)
        return jsonify({"error": "Evaluation process failed"}), 500
