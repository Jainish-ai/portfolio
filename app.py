from flask import Flask, render_template, request, jsonify, send_file
import psycopg2
from io import BytesIO
import os

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'

# Database connection
conn = psycopg2.connect(
    host="ep-jolly-resonance-ahqzl9ev-pooler.c-3.us-east-1.aws.neon.tech",
    database="neondb",
    user="neondb_owner",
    password="npg_G3sbwyxhlVo5",
    sslmode="require"
)
cursor = conn.cursor()

# -------------------
# ROUTES
# -------------------

# Home Page
@app.route('/')
def index():
    cursor.execute("SELECT project_id, title, description, tech_stack, live_link FROM projects ORDER BY project_id DESC")
    projects = cursor.fetchall()

    cursor.execute("SELECT resume_id, file_name FROM resume ORDER BY uploaded_at DESC LIMIT 1")
    resume = cursor.fetchone()

    return render_template('index.html', projects=projects, resume=resume)

# Get all projects (JSON) for AJAX
@app.route('/projects_api')
def projects_api():
    cursor.execute("SELECT project_id, title, description, tech_stack, live_link FROM projects ORDER BY project_id DESC")
    rows = cursor.fetchall()
    projects_list = [
        {"project_id": r[0], "title": r[1], "description": r[2], "tech_stack": r[3], "live_link": r[4]}
        for r in rows
    ]
    return jsonify(projects_list)

# Add Project
@app.route('/add_project', methods=['POST'])
def add_project():
    data = request.get_json()
    cursor.execute(
        "INSERT INTO projects (title, description, tech_stack, live_link) VALUES (%s, %s, %s, %s)",
        (data['title'], data['description'], data['tech_stack'], data.get('live_link'))
    )
    conn.commit()
    return jsonify({"status": "success"})

# Delete Project
@app.route('/delete_project/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    cursor.execute("DELETE FROM projects WHERE project_id=%s", (project_id,))
    conn.commit()
    return jsonify({"status": "success"})

# Upload Resume
@app.route('/upload_resume', methods=['POST'])
def upload_resume():
    file = request.files['resume']
    if file:
        cursor.execute(
            "INSERT INTO resume (file_name, file_data) VALUES (%s, %s)",
            (file.filename, file.read())
        )
        conn.commit()
        return jsonify({"status": "success"})
    return jsonify({"status": "failed"})

# Download Resume
@app.route('/download_resume/<int:resume_id>')
def download_resume(resume_id):
    cursor.execute("SELECT file_name, file_data FROM resume WHERE resume_id=%s", (resume_id,))
    row = cursor.fetchone()
    if row:
        return send_file(BytesIO(row[1]), download_name=row[0], as_attachment=True)
    return "Resume not found", 404

# -------------------
# MAIN
# -------------------
if __name__ == "__main__":
    if not os.path.exists('uploads'):
        os.makedirs('uploads')
    app.run(debug=True)
