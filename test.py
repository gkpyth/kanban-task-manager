from app import create_app
from models import db, Task, Tag

app = create_app()

with app.app_context():
    # Create some tags
    tag1 = Tag(name='Urgent', color='#EF4444')
    tag2 = Tag(name='Onboarding', color='#3B82F6')
    tag3 = Tag(name='Follow-up', color='#10B981')
    db.session.add_all([tag1, tag2, tag3])
    db.session.commit()

    # Create a test task with tags
    task = Task(title='Kickoff call with Acme Corp', priority='High', status='To Do', position=1)
    task.tags.append(tag1)
    task.tags.append(tag2)
    db.session.add(task)
    db.session.commit()

    print(task)
    print(task.tags)
