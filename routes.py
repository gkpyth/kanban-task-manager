from flask import Blueprint, request, jsonify, render_template
from models import db, Task, Tag
from datetime import datetime

# Blueprint groups related routes together - keeps things organized
# Instead of @app.route, we use @main.route, then register this blueprint in app.py
main = Blueprint('main', __name__)


# -------------------- PAGE ROUTES --------------------
@main.route('/')
def index():
    """Serve the main Kanban board page"""
    return render_template('base.html')


# -------------------- TASK ROUTES --------------------
@main.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Fetch all tasks, ordered by position within each status column"""
    tasks = Task.query.order_by(Task.position).all()

    # Convert each task object into a dictionary so it can be sent as JSON
    # JSON is how the backend will communicate with the frontend JScript
    tasks_data = []
    for task in tasks:
        tasks_data.append({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'status': task.status,
            'priority': task.priority,
            'due_date': task.due_date.isoformat() if task.due_date else None,
            'position': task.position,
            'tags': [{'id': tag.id, 'name': tag.name, 'color': tag.color} for tag in task.tags]
        })

    return jsonify(tasks_data)


@main.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task from JSON data sent by the frontend"""
    # request.json contains the data the frontend sent
    data = request.json

    # Find the highest position in the target column so new task goes to the bottom
    max_position = db.session.query(db.func.max(Task.position)).filter_by(
        status=data.get('status', 'To Do')
    ).scalar() or 0

    new_task = Task(
        title=data['title'],
        description=data.get('description', ''),
        status=data.get('status', 'To Do'),
        priority=data.get('priority', 'Medium'),
        due_date=datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data.get('due_date') else None,
        position=max_position + 1
    )

    # Handle tags if any were provided
    if data.get('tag_id'):
        # Fetch all tag objects matching the provided IDs
        tags = Tag.query.filter(Tag.id.in_(data['tag_ids'])).all()
        new_task.tags = tags

    db.session.add(new_task)
    db.session.commit()

    return jsonify({
        'id': new_task.id,
        'title': new_task.title,
        'description': new_task.description,
        'status': new_task.status,
        'priority': new_task.priority,
        'due_date': new_task.due_date.isoformat() if new_task.due_date else None,
        'position': new_task.position,
        'tags': [{'id': tag.id, 'name': tag.name, 'color': tag.color} for tag in new_task.tags]
    }), 201

@main.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task's details"""
    # Find the task or return 404 if it doesn't exist
    task = Task.query.get_or_404(task_id)
    data = request.json

    # Update only the fields that were provided - .get() returns None if not provided
    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.status = data.get('status', task.status)
    task.priority = data.get('priority', task.priority)
    task.position = data.get('position', task.position)

    # Parse due_date string into a Python date object
    if 'due_date' in data:
        task.due_data = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None

    # Replace all tags if new ones were provided
    if 'tag_ids' in data:
        tags = Tag.query.filter(Tag.id.in_(data['tag_ids'])).all()
        task.tags = tags

    db.session.commit()

    return jsonify({
        'id': task.id,
        'title': task.title,
        'description': task.description,
        'status': task.status,
        'priority': task.priority,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'position': task.position,
        'tags': [{'id': tag.id, 'name': tag.name, 'color': tag.color} for tag in task.tags]
    })


@main.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task permanently"""
    task = Task.query.get_or_404(task_id)

    db.session.delete(task)
    db.session.commit()

    # Return empty success response - nothing to send back
    return jsonify({'message': 'Task deleted'}), 200


@main.route('/api/tasks/reorder', methods=['PUT'])
def reorder_tasks():
    """Update positions when tasks are dragged and dropped.
    Receives a list of task IDs with their new status and position."""
    data = request.json

    for task_data in data['tasks']:
        task = Task.query.get(task_data['id'])
        if task:
            task.status = task_data['status']
            task.position = task_data['position']

    db.session.commit()

    return jsonify({'message': 'Tasks reordered'}), 200


# -------------------- TASK ROUTES --------------------
@main.route('/api/tags', methods=['GET'])
def get_tags():
    """Fetch all available tags"""
    tags = Tag.query.all()

    return jsonify([{
        'id': tag.id,
        'name': tag.name,
        'color': tag.color,
    } for tag in tags])


@main.route('/api/tags', methods=['POST'])
def create_tag():
    """Create a new tag"""
    data = request.json

    # Check if tag name already exists
    existing = Tag.query.filter_by(name=data['name']).first()
    if existing:
        return jsonify({'error': 'Tag already exists'}), 400

    new_tag = Tag(
        name=data['name'],
        color=data.get('color', '#6B7280')
    )

    db.session.add(new_tag)
    db.session.commit()

    return jsonify({
        'id': new_tag.id,
        'name': new_tag.name,
        'color': new_tag.color,
    }), 201


@main.route('/api/tags/<int:tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    """Delete a tag - automatically removes it from all tasks via the bridge table"""
    tag = Tag.query.get_or_404(tag_id)

    db.session.delete(tag)
    db.session.commit()

    return jsonify({'message': 'Tag deleted'}), 200