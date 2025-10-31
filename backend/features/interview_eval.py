# backend/features/interview_eval.py

from flask import Blueprint, request, jsonify, current_app
# NOTE: This example uses a placeholder for the actual LLM call.
# You would replace `call_llm_for_generation` and `call_llm_for_evaluation`
# with your specific implementation (e.g., using Ollama, OpenAI, or Hugging Face).

# --- Placeholder LLM Functions ---
# In a real application, these would make API calls to your language model.
def call_llm_for_generation(prompt):
    """Placeholder function to simulate an LLM call for generating questions."""
    # This mock response mimics the structure your reference code expects.
    return {
        "technical_questions": [
            "Explain the difference between a process and a thread.",
            "Describe the concept of RESTful APIs.",
            "What is a primary key in a database and why is it important?"
        ],
        "behavioral_questions": [
            "Tell me about a time you had to learn a new technology quickly.",
            "Describe a challenging project you worked on and how you handled it."
        ],
        "situational_questions": [
            "Imagine a critical bug is found in production just before a major holiday. What do you do?",
            "If you disagreed with a senior developer's technical approach, how would you handle it?"
        ]
    }

def call_llm_for_evaluation(prompt):
    """Placeholder function to simulate an LLM call for evaluating an answer."""
    # This mock response provides a score and feedback.
    import random
    score = random.randint(60, 95) # Simulate a variable score
    return {
        "score": score,
        "feedback_text": f"This is solid feedback for the answer provided. The key concepts were mentioned clearly. Score: {score}."
    }

# --- Blueprint Setup ---
interview_eval_bp = Blueprint('interview_eval', __name__, url_prefix='/api')

@interview_eval_bp.route('/generate_interview_questions', methods=['POST'])
def generate_questions_route():
    """
    Generates technical, behavioral, and situational interview questions
    based on a job role and context.
    """
    data = request.get_json()
    if not data or 'job_role' not in data:
        return jsonify({"error": "Job role is a required field."}), 400

    job_role = data.get('job_role')
    context = data.get('context_keywords', '')
    num_tech = data.get('num_technical', 3)
    num_behav = data.get('num_behavioral', 2)
    num_sit = data.get('num_situational', 2)

    # --- Prompt Engineering ---
    prompt = f"""
    Generate a set of interview questions for a '{job_role}' position.
    The job context involves: '{context}'.
    Please provide:
    - {num_tech} technical questions.
    - {num_behav} behavioral questions.
    - {num_sit} situational questions.
    Return the questions in a structured format.
    """
    
    current_app.logger.info(f"Generating questions for role: {job_role}")
    
    try:
        # Replace this with your actual LLM call
        questions = call_llm_for_generation(prompt)
        return jsonify({"questions": questions})
    except Exception as e:
        current_app.logger.error(f"Error during question generation: {e}", exc_info=True)
        return jsonify({"error": "Failed to generate questions due to an internal error."}), 500

@interview_eval_bp.route('/evaluate_answers', methods=['POST'])
def evaluate_answers_route():
    """
    Evaluates a list of user-provided answers to interview questions.
    """
    data = request.get_json()
    if not data or 'job_details' not in data or 'questions_and_answers' not in data:
        return jsonify({"error": "Missing required job_details or questions_and_answers."}), 400

    job_title = data['job_details'].get('title', 'a relevant role')
    q_and_a_list = data.get('questions_and_answers', [])
    
    detailed_feedback = []
    total_score = 0
    evaluated_count = 0

    current_app.logger.info(f"Evaluating {len(q_and_a_list)} answers for role: {job_title}")

    try:
        for item in q_and_a_list:
            question = item.get("question")
            answer = item.get("answer")

            if not answer or not answer.strip():
                detailed_feedback.append({
                    "question_id": item.get("id"),
                    "score": 0,
                    "feedback_text": "This question was not answered."
                })
                continue

            # --- Evaluation Prompt Engineering ---
            eval_prompt = f"""
            Context: The candidate is interviewing for a '{job_title}' position.
            Question: "{question}"
            Candidate's Answer: "{answer}"
            
            Please evaluate the answer. Provide constructive feedback and a score from 0 to 100.
            """

            # Replace this with your actual LLM call
            result = call_llm_for_evaluation(eval_prompt)
            
            detailed_feedback.append({
                "question_id": item.get("id"),
                "score": result.get("score", 0),
                "feedback_text": result.get("feedback_text", "Could not generate feedback.")
            })
            total_score += result.get("score", 0)
            evaluated_count += 1
            
        avg_score = (total_score / evaluated_count) if evaluated_count > 0 else 0

        # --- Overall Feedback Logic ---
        overall_feedback = f"Your overall average score is {avg_score:.0f}%."
        if avg_score > 80:
            overall_feedback += " Excellent performance! You demonstrated strong knowledge."
        elif avg_score > 60:
            overall_feedback += " Good effort. There are areas where you can provide more depth."
        else:
            overall_feedback += " Needs improvement. Focus on reviewing the key concepts for this role."

        return jsonify({
            "score": avg_score,
            "feedback": overall_feedback,
            "detailed_feedback": detailed_feedback
        })

    except Exception as e:
        current_app.logger.error(f"Error during answer evaluation: {e}", exc_info=True)
        return jsonify({"error": "Failed to evaluate answers due to an internal error."}), 500