
import requests
import json
from flask import Blueprint, request, jsonify, current_app

# Blueprint: all routes here will start with /api
jobs_bp = Blueprint('jobs', __name__, url_prefix='/api')

def _adzuna_job_serializer(job_data):
    """Serialize raw Adzuna job data into a clean JSON-friendly format."""
    return {
        "id": job_data.get('id'),
        "title": job_data.get('title'),
        "company": job_data.get('company', {}).get('display_name'),
        "location": job_data.get('location', {}).get('display_name'),
        "salary_is_predicted": job_data.get('salary_is_predicted'),
        "description": job_data.get('description'),
        "redirect_url": job_data.get('redirect_url'),
        "created": job_data.get('created'),
        "contract_type": job_data.get('contract_type'),
        "contract_time": job_data.get('contract_time'),
        "category": job_data.get('category', {}).get('label')
    }

def _fetch_adzuna_jobs_internal(app_id, app_key, logger, country_code="in", page=1, keywords="software engineer", location="india"):
    """Internal helper to fetch jobs from Adzuna API for India."""
    if not app_id or not app_key:
        logger.error("Error: ADZUNA_APP_ID and ADZUNA_APP_KEY must be provided.")
        return [], 0

    BASE_URL = "https://api.adzuna.com/v1/api/jobs"
    url = f"{BASE_URL}/{country_code}/search/{page}"

    search_params = {
        "app_id": app_id,
        "app_key": app_key,
        "results_per_page": 20,
        "what": keywords,
        "where": location,
        "sort_by": "date",
        "content-type": "application/json"
    }

    logger.info(f"Fetching Adzuna jobs from: {url} with params: {search_params}")

    try:
        response = requests.get(url, params=search_params)
        response.raise_for_status()
        data = response.json()
        return data.get("results", []), data.get("count", 0)

    except requests.exceptions.HTTPError as http_err:
        logger.warning(f"Adzuna India request failed ({http_err}). Trying fallback to US...")
        # fallback: use US data if India fails (Adzuna India sometimes unavailable on free plan)
        if country_code == "in":
            return _fetch_adzuna_jobs_internal(app_id, app_key, logger, country_code="us", page=page, keywords=keywords, location="usa")
        return [], 0

    except Exception as e:
        logger.error(f"Unexpected error fetching jobs: {e}", exc_info=True)
        return [], 0


@jobs_bp.route('/fetch_jobs', methods=['GET'])
def fetch_jobs_route_handler():
    """Route to fetch Adzuna India jobs, with automatic fallback to US."""
    try:
        keywords = request.args.get('keywords', "software engineer")
        location = request.args.get('location', "india")
        page = request.args.get('page', 1, type=int)
        country = request.args.get('country', 'in')

        # Load credentials from Flask config
        app_id = current_app.config.get('ADZUNA_API_ID')
        app_key = current_app.config.get('ADZUNA_API_KEY')

        if not app_id or not app_key:
            current_app.logger.error("Adzuna API keys not configured. Please set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env")
            return jsonify({"error": "Adzuna API keys not configured. Please contact the administrator."}), 500

        current_app.logger.info(f"Fetching Adzuna jobs for country={country}, location={location}, page={page}")

        # Fetch job data
        jobs_data_raw, total_results = _fetch_adzuna_jobs_internal(
            app_id, app_key, current_app.logger,
            country_code=country, page=page, keywords=keywords, location=location
        )

        serialized_jobs = [_adzuna_job_serializer(job) for job in jobs_data_raw]

        return jsonify({
            "country": country,
            "total_results": total_results,
            "jobs": serialized_jobs
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error in /fetch_jobs: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

