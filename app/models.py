from app import db
from flask_login import UserMixin
import bcrypt

# ✅ UserRole Model
class UserRole(db.Model):
    __tablename__ = 'userrole'
    role_id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(100), unique=True, nullable=False)
    
    # Relationship with User
    users = db.relationship('User', backref='role', lazy=True)

# ✅ User Model (updated to work with Flask-Login)
class User(db.Model, UserMixin):
    __tablename__ = 'user'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    last_name = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    middle_name = db.Column(db.String(100), nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey('userrole.role_id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    email = db.relationship('Email', backref='user', uselist=False, cascade="all, delete-orphan")
    entrykey = db.relationship('EntryKey', backref='user', uselist=False, cascade="all, delete-orphan")

    # Required for Flask-Login
    def get_id(self):
        return str(self.user_id)

# ✅ Email Model
class Email(db.Model):
    __tablename__ = 'email'
    email_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)

# ✅ EntryKey Model (Password)
class EntryKey(db.Model):
    __tablename__ = 'entrykey'
    entrykey_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    entrykey = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)

    def __init__(self, entrykey):
        self.entrykey = bcrypt.hashpw(entrykey.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_entrykey(self, entrykey):
        return bcrypt.checkpw(entrykey.encode('utf-8'), self.entrykey.encode('utf-8'))

# User loader callback for Flask-Login
from app import login_manager

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))