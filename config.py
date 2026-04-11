import os

class Config:
    # Secret key for session security - checks environment variable first and falls back to a dev key if not set
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key'

    # Database location - SQLite file stored in the instance folder
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance', 'cs_sentinel.db')

    # Disable modification tracking to save on memory usage
    SQLALCHEMY_TRACK_MODIFICATIONS = False