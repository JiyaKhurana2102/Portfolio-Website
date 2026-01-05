from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import os
from datetime import datetime

# Create the Flask app instance.
# We keep the instance named `app` so deployment tools (Gunicorn) can import it via `gunicorn app:app`.
app = Flask(__name__)

# SECRET_KEY is required for session features like flash().
# For production, set this via an environment variable and keep it secret.
app.config['SECRET_KEY'] = os.environ['SECRET_KEY']

# ============================================================================
# Sample content data (projects, certifications, experience, nexus, gallery)
# These are simple Python lists/dicts that will be passed to the Jinja templates
# so your frontend can render dynamic content. Replace these placeholders with
# real data or load them from a database or external file in the future.
# ============================================================================

PROJECTS = [
    {
        'id': 'proj-1',
        'title': 'Personal Portfolio Site',
        'description': 'A responsive single-page portfolio built with Flask and vanilla JS.',
        'thumb': 'NEW Bitmoji Portfolio/Prof-Headshot.jpg',
        'link': '#',
        'dates': '2024',
        'tags': ['flask', 'frontend', 'responsive']
    },
    {
        'id': 'proj-2',
        'title': 'Interactive Carousel Demo',
        'description': 'A smooth auto-scrolling carousel with pure JS and CSS.',
        'thumb': 'NEW Bitmoji Portfolio/reading a book.png',
        'link': '#',
        'dates': '2024',
        'tags': ['javascript', 'ui']
    }
]

CERTIFICATIONS = [
    {
        'id': 'cert-1',
        'title': 'Example Certificate',
        'organization': 'Online Academy',
        'date': '2023-08',
        'credential_id': 'ABC-1234'
    }
]

EXPERIENCE = [
    {
        'id': 'exp-1',
        'role': 'Frontend Developer',
        'company': 'Acme Co',
        'dates': '2022 - Present',
        'summary': 'Worked on responsive UIs, accessibility, and animation.'
    }
]



# Helper to surface common context used across multiple templates. This keeps templates
# simple: they access `projects`, `certifications`, etc. from the context.
def get_common_context():
    return {
        'projects': PROJECTS,
        'certifications': CERTIFICATIONS,
        'experience': EXPERIENCE,
        # provide current year for footer or copyright
        'current_year': datetime.utcnow().year
    }

# ============================================================================
# Routes
# Each route renders a Jinja template and receives the appropriate data via
# render_template. Keep templates small and logic in Python where possible.
# ============================================================================

@app.route('/')
def index():
    """Home / About page.
    Renders `templates/index.html` and passes dynamic content (projects, etc.).
    """
    ctx = get_common_context()
    # index.html can show highlights and the carousel; pass all data so the page
    # has access to everything it needs.
    return render_template('index.html', **ctx)

@app.route('/projects')
def projects():
    """Projects listing page.
    Renders `templates/projects.html` and passes the PROJECTS list for iteration.
    """
    ctx = get_common_context()
    return render_template('projects.html', **ctx)

@app.route('/certifications')
def certifications():
    """Certifications page.
    Renders `templates/certifications.html` (create this template if needed) and
    passes the CERTIFICATIONS list.
    """
    ctx = get_common_context()
    return render_template('certifications.html', **ctx)

@app.route('/experience')
def experience():
    """Experience / Work history page.
    Renders `templates/experience.html` and passes the EXPERIENCE list.
    """
    ctx = get_common_context()
    return render_template('experience.html', **ctx)

# Health-check endpoint useful for platform load balancers and Render
@app.route('/health')
def health():
    return jsonify({'status': 'OK'}), 200

# ============================================================================
# Contact form handling
# - Accepts POST submissions from a form on the frontend.
# - For now we log the data; later you can integrate an email service (SendGrid,
#   Mailgun) or persist to a database.
# ============================================================================

@app.route('/contact', methods=['POST'])
def contact():
    """Handle contact form submissions.

    Expects form fields: name, email, message. If the form is submitted via
    AJAX (JSON) this route will return JSON. For standard form POSTs we redirect
    back to the index (or another page) and flash a message.
    """
    # Support both form-encoded and JSON payloads
    if request.is_json:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
    else:
        name = request.form.get('name')
        email = request.form.get('email')
        message = request.form.get('message')

    # Basic validation (expand as needed)
    if not name or not email or not message:
        app.logger.warning('Contact form submission missing fields: %s', {'name': name, 'email': email})
        if request.is_json:
            return jsonify({'ok': False, 'error': 'Missing required fields'}), 400
        flash('Please fill out all required fields.', 'warning')
        return redirect(url_for('index'))

    # For now, log the message to the application log. In production you would:
    # - Send the message as an email using a transactional email service, OR
    # - Save the message to a database or a ticketing system.
    app.logger.info('Contact form submitted: name=%s email=%s message=%s', name, email, message)

    # Example: return JSON for AJAX or redirect back with a success flash message
    if request.is_json:
        return jsonify({'ok': True}), 200

    flash('Thanks — your message was received!', 'success')
    return redirect(url_for('index'))

# ============================================================================
# Error handlers (optional but useful for nicer UX)
# ============================================================================

@app.errorhandler(404)
def page_not_found(e):
    # Render a friendly 404 page; create `templates/404.html` if you want a
    # custom template, otherwise fallback to a simple message.
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    app.logger.exception('Server error: %s', e)
    return render_template('500.html'), 500

# ============================================================================
# Entrypoint for local development
# - When using `python app.py` this block runs a dev server. DO NOT enable
#   debug=True in production. Render and Gunicorn will import the `app` object
#   and manage the server lifecycle.
# - For Render: set up your Render service to run `gunicorn app:app` and set
#   appropriate environment variables (SECRET_KEY, etc.).
# ============================================================================
if __name__ == '__main__':
    # LOCAL DEVELOPMENT: enable debugging only when you intentionally run this
    # file locally. Keep debug off in all staging/production deployments.
    app.run(host='127.0.0.1', port=8080, debug=True)

# End of file