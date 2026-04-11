from flask import Flask
from config import Config
from models import db

def create_app():
    """Application factory - builds and configures the Flask app"""
    app = Flask(__name__)

    # Load settings from Config class
    app.config.from_object(Config)

    # Connect SQLAlchemy database instance to this Flask app
    db.init_app(app)

    # Create database tables if they don't exist yet
    # app_context() tells Flask which app we're working with
    with app.app_context():
        db.create_all()

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
