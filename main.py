from flask import Flask, jsonify, request, send_from_directory
import os
import time

app = Flask(__name__, static_folder='.', static_url_path='')

table7_users = [
    {'initials': 'P1', 'name': 'Placeholder 1', 'color': '#10b981'},
    {'initials': 'P2', 'name': 'Placeholder 2', 'color': '#f59e0b'}
]

@app.route('/api/users', methods=['GET', 'POST'])
def handle_users():
    global table7_users
    now = time.time()
    if request.method == 'POST':
        user = request.json
        user['last_seen'] = now
        # Filter out existing by name to avoid duplicates
        table7_users = [u for u in table7_users if u['name'] != user['name']]
        table7_users.append(user)
        
    # Filter out inactive users (inactive for more than 15 seconds), except placeholders
    table7_users = [u for u in table7_users if u.get('name', '').startswith('Placeholder') or now - u.get('last_seen', 0) < 15]
    return jsonify(table7_users)

@app.route('/')
def root():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def send_static(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)
