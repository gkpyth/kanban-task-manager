from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Mapped, mapped_column, relationship, DeclarativeBase
from sqlalchemy import Integer, String, Text, Date, DateTime, ForeignKey, Table, Column
from datetime import datetime, timezone
from typing import Optional, List


class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

task_tags = Table('task_tags',
    db.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class Task(db.Model):
    __tablename__ = 'tasks'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default='To Do')
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default='Medium')
    due_date: Mapped[Optional[Date]] = mapped_column(Date, nullable=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc),
                                                 onupdate=lambda: datetime.now(timezone.utc))

    tags: Mapped[List['Tag']] = relationship('Tag', secondary=task_tags,
                                             backref=db.backref('tasks', lazy='dynamic'))

    def __repr__(self):
        return f'<Task {self.title}>'

class Tag(db.Model):
    __tablename__ = 'tags'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default='#6B7280')

    def __repr__(self):
        return f'<Tag {self.name}>'
