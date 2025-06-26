from app import db
from flask_login import UserMixin
import bcrypt
from datetime import datetime

# ✅ Role Model
class Role(db.Model):
    __tablename__ = 'roles'
    role_id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(100), nullable=False)
    role_description = db.Column(db.Text)
    
    # Relationship with User
    users = db.relationship('User', backref='role', lazy=True)

# ✅ User Model (updated to work with Flask-Login)
class User(db.Model, UserMixin):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.role_id'), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    middle_name = db.Column(db.String(100), nullable=True)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    entry_key = db.relationship('EntryKey', backref='user', uselist=False, cascade="all, delete-orphan")
    announcement_recipients = db.relationship('AnnouncementRecipient', backref='user', lazy=True)
    # organizations relationship is defined in the Organization model

    # Required for Flask-Login
    def get_id(self):
        return str(self.user_id)

# ✅ EntryKey Model (Password)
class EntryKey(db.Model):
    __tablename__ = 'entry_keys'
    entry_key_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    entry_key = db.Column(db.String(255), nullable=False)

    def __init__(self, entrykey):
        self.entry_key = bcrypt.hashpw(entrykey.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    def check_entrykey(self, entrykey):
        return bcrypt.checkpw(entrykey.encode('utf-8'), self.entry_key.encode('utf-8'))

# ✅ Program Model
class Program(db.Model):
    __tablename__ = 'programs'
    program_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    program_name = db.Column(db.String(255), nullable=False)
    program_code = db.Column(db.String(50), unique=True, nullable=False)
    
    # Relationships
    students = db.relationship('Student', backref='program', lazy=True)

# ✅ Address Model
class Address(db.Model):
    __tablename__ = 'addresses'
    address_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    city = db.Column(db.String(100), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    
    # Relationships
    students = db.relationship('Student', backref='address', lazy=True)

# ✅ Logo Model
class Logo(db.Model):
    __tablename__ = 'logos'
    logo_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    logo = db.Column(db.LargeBinary)  # LONGBLOB equivalent
    description = db.Column(db.Text)
    
    # Relationships
    organizations = db.relationship('Organization', backref='logo', lazy=True)

# ✅ Organization Model
class Organization(db.Model):
    __tablename__ = 'organizations'
    organization_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    logo_id = db.Column(db.Integer, db.ForeignKey('logos.logo_id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=True)
    organization_name = db.Column(db.String(255), nullable=False)
    tagline = db.Column(db.Text)
    description = db.Column(db.Text)
    type = db.Column(db.String(100))
    status = db.Column(db.String(100))  # active, inactive
    
    # Relationships
    affiliations = db.relationship('Affiliation', backref='organization', lazy=True)
    social_media = db.relationship('SocialMedia', backref='organization', lazy=True)
    applications = db.relationship('Application', backref='organization', lazy=True)
    advisories = db.relationship('Advisory', backref='organization', lazy=True)
    user = db.relationship('User', backref='organizations', lazy=True)

# ✅ Student Model
class Student(db.Model):
    __tablename__ = 'students'
    student_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    program_id = db.Column(db.Integer, db.ForeignKey('programs.program_id'), nullable=False)
    address_id = db.Column(db.Integer, db.ForeignKey('addresses.address_id'), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    middle_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100), nullable=False)
    student_number = db.Column(db.String(50), unique=True, nullable=False)
    
    # Relationships
    affiliations = db.relationship('Affiliation', backref='student', lazy=True)

# ✅ Affiliation Model
class Affiliation(db.Model):
    __tablename__ = 'affiliations'
    affiliation_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.organization_id'), nullable=False)
    position = db.Column(db.String(100))
    academic_year = db.Column(db.String(20))

# ✅ Social Media Model
class SocialMedia(db.Model):
    __tablename__ = 'social_media'
    social_media_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.organization_id'), nullable=False)
    platform = db.Column(db.String(100), nullable=False)
    link = db.Column(db.String(500), nullable=False)

# ✅ Application Model
class Application(db.Model):
    __tablename__ = 'applications'
    application_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.organization_id'), nullable=False)
    type = db.Column(db.String(100))
    status = db.Column(db.String(100))  # pending, approved, rejected, under_review
    academic_year = db.Column(db.String(20))
    submission_date = db.Column(db.Date)
    reviewed_by = db.Column(db.String(255))
    review_date = db.Column(db.Date)
    
    # Relationships
    plans = db.relationship('Plan', backref='application', lazy=True)
    application_files = db.relationship('ApplicationFile', backref='application', lazy=True)

# ✅ Plan Model
class Plan(db.Model):
    __tablename__ = 'plans'
    plan_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.application_id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    objectives = db.Column(db.Text)
    proposed_date = db.Column(db.Date)
    people_involved = db.Column(db.Text)
    funding_source = db.Column(db.String(255))
    accomplished_date = db.Column(db.Date)
    target_output = db.Column(db.Text)
    outcome = db.Column(db.Text)

# ✅ Application File Model
class ApplicationFile(db.Model):
    __tablename__ = 'application_files'
    app_file_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.application_id'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file = db.Column(db.LargeBinary)  # LONGBLOB equivalent
    status = db.Column(db.String(50))  # pending, approved, rejected
    
    # Note: feedback relationship is defined in the Feedback model

# ✅ Adviser Model
class Adviser(db.Model):
    __tablename__ = 'advisers'
    adviser_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    first_name = db.Column(db.String(100), nullable=False)
    middle_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100), nullable=False)
    
    # Relationships
    advisories = db.relationship('Advisory', backref='adviser', lazy=True)

# ✅ Advisory Model
class Advisory(db.Model):
    __tablename__ = 'advisories'
    advisory_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    adviser_id = db.Column(db.Integer, db.ForeignKey('advisers.adviser_id'), nullable=False)
    organization_id = db.Column(db.Integer, db.ForeignKey('organizations.organization_id'), nullable=False)
    date_started = db.Column(db.Date)
    type = db.Column(db.String(100))
    status = db.Column(db.String(100))  # active, inactive

# ✅ Feedback Model
class Feedback(db.Model):
    __tablename__ = 'feedback'
    feedback_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    app_file_id = db.Column(db.Integer, db.ForeignKey('application_files.app_file_id'))
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    date_sent = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship
    application_file = db.relationship('ApplicationFile', backref='feedback', lazy=True)

# ✅ Announcement Model
class Announcement(db.Model):
    __tablename__ = 'announcements'
    announcement_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    subject = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    date_sent = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    announcement_recipients = db.relationship('AnnouncementRecipient', backref='announcement', lazy=True)

# ✅ Announcement Recipient Model (Junction table)
class AnnouncementRecipient(db.Model):
    __tablename__ = 'announcement_recipients'
    announcement_id = db.Column(db.Integer, db.ForeignKey('announcements.announcement_id'), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), primary_key=True)
    is_read = db.Column(db.Boolean, default=False)

# User loader callback for Flask-Login
from app import login_manager

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))