# KanDo

A Kanban-style task management web application with drag-and-drop functionality, priority tracking, tagging, and filtering. Built with Python, Flask, SQLAlchemy, and vanilla JavaScript.

## Features
- Kanban board with three columns: To Do, In Progress, Done
- Drag-and-drop task cards between columns using SortableJS
- Create, edit, and delete tasks via modal forms
- Task priority levels (High, Medium, Low) with color-coded indicators
- Due date tracking with overdue detection
- Tagging system with searchable dropdown selector and color-coded pills
- Filter tasks by priority, tag, or search text via dropdown menus
- Task detail slide-out panel with full task information
- Persistent card ordering across drag-and-drop operations
- Toast notifications for action feedback
- Timezone-aware timestamps (auto-detects user's local timezone)
- Dark-themed professional UI with responsive layout

## Requirements
- Python 3
- Flask
- Flask-SQLAlchemy

## Installation
```
pip install -r requirements.txt
```

## How to Run
```
python app.py
```
The app runs at `http://localhost:5000`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | Fetch all tasks ordered by position |
| `POST` | `/api/tasks` | Create a new task (JSON body) |
| `PUT` | `/api/tasks/<id>` | Update a task's details |
| `DELETE` | `/api/tasks/<id>` | Delete a task |
| `PUT` | `/api/tasks/reorder` | Update task positions after drag-and-drop |
| `GET` | `/api/tags` | Fetch all tags |
| `POST` | `/api/tags` | Create a new tag |
| `DELETE` | `/api/tags/<id>` | Delete a tag |

## Project Structure
```
kando/
├── app.py                 # Entry point — application factory, DB init
├── config.py              # Configuration settings (DB path, secret key)
├── models.py              # Database models (Task, Tag, task_tags bridge)
├── routes.py              # API endpoints and page routes
├── requirements.txt
├── instance/
│   └── kando.db           # SQLite database (auto-generated on startup)
├── templates/
│   └── base.html          # Main application template
└── static/
    ├── css/
    │   └── style.css      # Full application styling (dark theme)
    └── js/
        └── main.js        # Board rendering, drag-and-drop, API calls, UI logic
```

## Database
Uses SQLite with three tables: `tasks` for task data, `tags` for tag definitions, and `task_tags` as a many-to-many bridge table linking tasks to tags. The database is auto-created on first run.

## Limitations
- No user authentication (single-user application)
- No real-time collaboration or WebSocket updates
- Tags must be created in advance (no inline tag creation from task modal)
- No mobile-optimized layout

## Author
Ghaleb Khadra