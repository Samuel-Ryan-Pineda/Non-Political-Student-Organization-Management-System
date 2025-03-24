from flask import Flask, get_flashed_messages, jsonify, render_template_string, request, render_template, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os
import random
import bcrypt
import time  # Added for cooldown handling

app = Flask(__name__)

# ✅ XAMPP MySQL Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/npsoms_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

app.secret_key = 'secret_key'

# ✅ UserRole Model
class UserRole(db.Model):
    __tablename__ = 'userrole'
    role_id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(100), unique=True, nullable=False)
    
    # Relationship with User
    users = db.relationship('User', backref='role', lazy=True)

# ✅ User Model
class User(db.Model):
    __tablename__ = 'user'
    user_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    last_name = db.Column(db.String(100), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    middle_name = db.Column(db.String(100), nullable=True)
    role_id = db.Column(db.Integer, db.ForeignKey('userrole.role_id'), nullable=False)

    email = db.relationship('Email', backref='user', uselist=False, cascade="all, delete-orphan")
    entrykey = db.relationship('EntryKey', backref='user', uselist=False, cascade="all, delete-orphan")


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


# ✅ Create database tables
with app.app_context():
    db.create_all()
    
    # Initialize roles if they don't exist
    if not UserRole.query.first():
        roles = [
            UserRole(role_id=1, role="OSOAD"),
            UserRole(role_id=2, role="Organization_President"),
            UserRole(role_id=3, role="Applicant")
        ]
        db.session.add_all(roles)
        db.session.commit()


# ✅ Redirect root to login
@app.route('/')
def index():
    return redirect(url_for('login'))

# ✅ Configure Flask-Mail
load_dotenv()  # Load environment variables

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_USERNAME")

mail = Mail(app)

# ✅ Registration Route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        last_name = request.form.get('last_name')
        first_name = request.form.get('first_name')
        middle_name = request.form.get('middle_name')
        email = request.form.get('email')
        entrykey = request.form.get('entrykey')
        confirm_password = request.form.get('confirm_password')
        # Default role for new users (3 = Applicant)
        role_id = 3  

        form_data = {
            "last_name": last_name,
            "first_name": first_name,
            "middle_name": middle_name,
            "email": email
        }

        # Cooldown Check for Account Creation
        if 'register_blocked_until' in session:
            if time.time() < session['register_blocked_until']:
                flash("Too many registration attempts. Try again later.", "error")
                return render_template('register.html', form_data=form_data, show_verification_modal=False)
            else:
                session.pop('register_blocked_until')  # Remove cooldown if time has passed
                session['register_attempts'] = 0  # Reset failed attempts

        if not all([last_name, first_name, email, entrykey, confirm_password]):
            flash("Please fill in all required fields.", "warning")
            return render_template('register.html', form_data=form_data, show_verification_modal=False)

        if entrykey != confirm_password:
            flash("Passwords do not match.", "error")
            return render_template('register.html', form_data=form_data, show_verification_modal=False)

        if Email.query.filter_by(email=email).first():
            flash("Email already registered.", "error")
            return render_template('register.html', form_data=form_data, show_verification_modal=False)

        # Track verification code send attempts
        session['verification_send_attempts'] = session.get('verification_send_attempts', 0) + 1
        
        # Limit to 2 verification code sends before cooldown
        if session.get('verification_send_attempts', 0) >= 3:  # 3rd attempt triggers cooldown
            if not session.get('verification_send_blocked_until'):
                session['verification_send_blocked_until'] = time.time() + 300  # 5 minute cooldown
            
            if time.time() < session['verification_send_blocked_until']:
                remaining_time = int(session['verification_send_blocked_until'] - time.time())
                flash(f"Too many verification code requests. Please wait {remaining_time} seconds before requesting another code.", "error")
                return render_template('register.html', form_data=form_data, show_verification_modal=False)
            else:
                # Reset after cooldown period expires
                session.pop('verification_send_blocked_until', None)
                session['verification_send_attempts'] = 1  # Reset but count this attempt
        
        # ✅ Generate verification code
        verification_code = str(random.randint(100000, 999999))
        session['verification_code'] = verification_code
        session['pending_user'] = {
            "last_name": last_name,
            "first_name": first_name,
            "middle_name": middle_name,
            "email": email,
            "entrykey": entrykey,
            "role_id": role_id  # Add role_id to pending user data
        }

        # ✅ Initialize verification attempt tracking
        session['verify_attempts'] = 0
        session.pop('verify_blocked_until', None)  # Remove cooldown if exists

        # ✅ Send Email
        msg = Message("Your Verification Code", recipients=[email])
        msg.body = f"Your verification code is: {verification_code}"
        mail.send(msg)

        # Record the time when the verification code was sent
        session['verification_code_sent_at'] = time.time()

        return render_template('register.html', form_data=form_data, show_verification_modal=True)

    return render_template('register.html', show_verification_modal=False)

@app.route('/verify_email', methods=['POST'])
def verify_email():
    verification_code = request.form.get('verification_code')

    # Cooldown Check
    if 'verify_blocked_until' in session:
        if time.time() < session['verify_blocked_until']:
            flash("Too many failed attempts. Try again later.", "error")
            return redirect(url_for('register'))
        else:
            session.pop('verify_blocked_until')  # Remove cooldown if time has passed
            session['verify_attempts'] = 0  # Reset failed attempts

    # Ensure there is a pending user session
    if 'verification_code' not in session or 'pending_user' not in session:
        flash("Session expired. Please register again.", "error")
        return redirect(url_for('register'))

    # Check if the entered code matches the session code
    if verification_code != session['verification_code']:
        session['verify_attempts'] = session.get('verify_attempts', 0) + 1

        if session['verify_attempts'] >= 5:
            session['verify_blocked_until'] = time.time() + 900  # Block for 15 minutes
            flash("Too many failed attempts. Please wait 15 minutes before trying again.", "error")
            return redirect(url_for('register'))

        flash("Invalid verification code. Please try again.", "error")
        return render_template('register.html', form_data=session['pending_user'], show_verification_modal=True)

    # If verified, create the user
    pending_user = session.pop('pending_user')
    session.pop('verification_code')

    new_user = User(
        last_name=pending_user['last_name'],
        first_name=pending_user['first_name'],
        middle_name=pending_user.get('middle_name'),
        role_id=pending_user['role_id']  # Add role_id to user creation
    )
    db.session.add(new_user)
    db.session.commit()

    new_email = Email(email=pending_user['email'], user_id=new_user.user_id)
    new_entrykey = EntryKey(entrykey=pending_user['entrykey'])
    new_entrykey.user_id = new_user.user_id

    db.session.add(new_email)
    db.session.add(new_entrykey)
    db.session.commit()

    flash("Email verified! Your account has been created. You can now log in.", "success")
    return redirect(url_for('register'))


# ✅ Login Route
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Check if request expects JSON
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            email = request.form.get('email')
            entrykey = request.form.get('entrykey')
            response = {'success': False, 'message': '', 'category': ''}

            # Cooldown Check for Login Attempts
            if 'login_blocked_until' in session:
                if time.time() < session['login_blocked_until']:
                    response['message'] = "Too many failed login attempts. Try again later."
                    response['category'] = "error"
                    return jsonify(response)
                else:
                    session.pop('login_blocked_until')
                    session['login_attempts'] = 0

            if not email or not entrykey:
                response['message'] = "Please enter both email and password."
                response['category'] = "warning"
                return jsonify(response)

            user_email = Email.query.filter_by(email=email).first()
            if not user_email:
                response['message'] = "Email not found."
                response['category'] = "error"
                return jsonify(response)

            user_entrykey = EntryKey.query.filter_by(user_id=user_email.user_id).first()
            if user_entrykey and user_entrykey.check_entrykey(entrykey):
                session['user_id'] = user_email.user_id
                response['success'] = True
                response['redirect'] = url_for('dashboard')
                return jsonify(response)

            # Increment login attempts
            session['login_attempts'] = session.get('login_attempts', 0) + 1

            if session['login_attempts'] >= 5:
                session['login_blocked_until'] = time.time() + 900  # Block for 15 minutes
                response['message'] = "Too many failed login attempts. Please wait 15 minutes before trying again."
                response['category'] = "error"
                return jsonify(response)

            response['message'] = "Incorrect password."
            response['category'] = "error"
            return jsonify(response)
        
        # Handle regular form submission (fallback)
        else:
            email = request.form.get('email')
            entrykey = request.form.get('entrykey')

            # Cooldown Check for Login Attempts
            if 'login_blocked_until' in session:
                if time.time() < session['login_blocked_until']:
                    flash("Too many failed login attempts. Try again later.", "error")
                    return render_template('login.html', email=email)
                else:
                    session.pop('login_blocked_until')  # Remove cooldown if time has passed
                    session['login_attempts'] = 0  # Reset failed attempts

            if not email or not entrykey:
                flash("Please enter both email and password.", "warning")
                return render_template('login.html', email=email)

            user_email = Email.query.filter_by(email=email).first()
            if not user_email:
                flash("Email not found.", "error")
                return render_template('login.html', email=email)

            user_entrykey = EntryKey.query.filter_by(user_id=user_email.user_id).first()
            if user_entrykey and user_entrykey.check_entrykey(entrykey):
                session['user_id'] = user_email.user_id
                return redirect(url_for('dashboard'))

            # Increment login attempts
            session['login_attempts'] = session.get('login_attempts', 0) + 1

            if session['login_attempts'] >= 5:
                session['login_blocked_until'] = time.time() + 900  # Block for 15 minutes
                flash("Too many failed login attempts. Please wait 15 minutes before trying again.", "error")
                return render_template('login.html', email=email)

            flash("Incorrect password.", "error")
            return render_template('login.html', email=email)

    # Make sure you have the imports
    return render_template('login.html')

# ✅ Dashboard Route
@app.route('/dashboard')
def dashboard():
    if 'user_id' in session:
        user = User.query.filter_by(user_id=session['user_id']).first()
        return render_template('dashboard.html', user=user)

    flash("Please log in to access the dashboard.", "error")
    return redirect(url_for('login'))


# ✅ Logout Route
@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash("You have been logged out.", "info")
    return redirect(url_for('login'))


if __name__ == '__main__':
    app.run(debug=True)