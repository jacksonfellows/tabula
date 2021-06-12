from flask import Flask, request, render_template, jsonify, redirect, url_for

app = Flask(__name__, static_url_path='', static_folder='static')

import json

@app.route('/save', methods=('POST',))
def save():
    filename = f'notebooks/{request.json["title"]}.tabula'
    with open(filename, 'w') as f:
        json.dump(request.json, f)
    return f'saved notebook to {filename}'

import glob
from pathlib import Path

@app.route('/')
def index():
    return redirect(url_for('notebooks'))

@app.route('/notebooks')
def notebooks():
    notebooks = glob.glob('notebooks/*.tabula')
    return render_template('notebooks.html', notebooks=[{'name': Path(notebook).stem, 'href': Path(notebook).with_suffix('')} for notebook in notebooks])

@app.route('/notebooks/<path:path>')
def notebook(path):
    with open(f'notebooks/{path}.tabula') as f:
        notebook_state = f.read()
    return render_template('index.html', notebook_state=notebook_state)

# @app.route('/replacements/<path:path>')
# def replacements(path):
#     with open(f'notebooks/{path}.tabula') as f:
#         notebook_state = json.load(f)
#     return jsonify(notebook_state['replacements'])

NEW_NOTEBOOK = {
    'title': 'Untitled Notebook',
    'cells': {},
    'replacements': {}
}

@app.route('/new')
def new():
    return render_template('index.html', notebook_state=NEW_NOTEBOOK)

@app.route('/test')
def test():
    return app.send_static_file('tests/index.html')
