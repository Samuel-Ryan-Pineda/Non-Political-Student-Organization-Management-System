from flask import Flask, get_flashed_messages, jsonify, render_template_string, request, render_template, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from dotenv import load_dotenv
import os
import random
import bcrypt
import time
import re  # Added for validation

app = Flask(__name__)

# ✅ XAMPP MySQL Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/npsoms_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

app.secret_key = 'secret_key'

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message_category = 'error'

# Validation Functions
def validate_name(name):
    """Validate name fields."""
    if not name:
        return False
    # Check length between 2 and 50 characters
    if len(name) < 2 or len(name) > 50:
        return False
    # Only allow letters, spaces, hyphens, and apostrophes
    return bool(re.match(r'^[A-Za-z\s\'-]+$', name))

def validate_email(email):
    """Validate email address."""
    if not email:
        return False
    # Regex to match valid email format
    email_regex = r'^[a-zA-Z0-9.*%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))

def validate_password(password):
    """
    Validate password:
    - 8-32 characters long
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if not password:
        return False
    # Check length
    if len(password) < 8 or len(password) > 32:
        return False
    # Check complexity requirements
    password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$'
    return bool(re.match(password_regex, password))

def sanitize_input(input_string):
    """
    Sanitize input to prevent XSS and SQL injection
    Remove or escape any potentially harmful characters
    """
    if not input_string:
        return input_string
    
    # Remove HTML and script tags
    input_string = re.sub(r'<[^>]+>', '', input_string)
    
    # Remove potential SQL injection characters
    input_string = re.sub(r'[;\'"\(\)\{\}\[\]]', '', input_string)
    
    return input_string.strip()

def validate_name_length(name, max_length=50, min_length=2):
    """
    Additional name validation with explicit length checks
    """
    if not name:
        return False
    
    # Strip whitespace and check length
    name = name.strip()
    return min_length <= len(name) <= max_length

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
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# JSON error handler for login_required decorator
@login_manager.unauthorized_handler
def unauthorized():
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': False, 'message': 'Please log in to access this page.', 'category': 'error'}), 401
    return redirect(url_for('login'))

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

# ✅ Configure Flask-Mail
load_dotenv()  # Load environment variables

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_USERNAME")

mail = Mail(app)

# ✅ Redirect root to login
@app.route('/')
def index():
    return redirect(url_for('login'))

# ✅ Registration Route
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        response = {'status': 'error'}
        
        try:
            # Sanitize all inputs first
            last_name = sanitize_input(request.form.get('last_name', ''))
            first_name = sanitize_input(request.form.get('first_name', ''))
            middle_name = sanitize_input(request.form.get('middle_name', '')) or None
            email = sanitize_input(request.form.get('email', ''))
            entrykey = request.form.get('entrykey')
            confirm_password = request.form.get('confirm_password')

            # Comprehensive Name Validation
            if not last_name:
                response['message'] = "Last name is required."
                response['category'] = "error"
                return jsonify(response), 400

            if not first_name:
                response['message'] = "First name is required."
                response['category'] = "error"
                return jsonify(response), 400

            # Enhanced name validations
            if not validate_name_length(last_name):
                response['message'] = "Last name must be 2-50 characters long."
                response['category'] = "error"
                return jsonify(response), 400

            if not validate_name_length(first_name):
                response['message'] = "First name must be 2-50 characters long."
                response['category'] = "error"
                return jsonify(response), 400

            # Validate names against allowed characters
            if not validate_name(last_name):
                response['message'] = "Last name contains invalid characters."
                response['category'] = "error"
                return jsonify(response), 400

            if not validate_name(first_name):
                response['message'] = "First name contains invalid characters."
                response['category'] = "error"
                return jsonify(response), 400

            # Optional middle name validation
            if middle_name:
                if not validate_name_length(middle_name):
                    response['message'] = "Middle name must be 2-50 characters long."
                    response['category'] = "error"
                    return jsonify(response), 400

                if not validate_name(middle_name):
                    response['message'] = "Middle name contains invalid characters."
                    response['category'] = "error"
                    return jsonify(response), 400

            # Email Validation
            if not email:
                response['message'] = "Email is required."
                response['category'] = "error"
                return jsonify(response), 400

            if not validate_email(email):
                response['message'] = "Invalid email address format."
                response['category'] = "error"
                return jsonify(response), 400

            # Prevent disposable email domains (optional but recommended)
            disposable_domains = ['tempmail.com', 'throwawaymail.com', 'mailinator.com']
            email_domain = email.split('@')[-1].lower()
            if email_domain in disposable_domains:
                response['message'] = "Disposable email addresses are not allowed."
                response['category'] = "error"
                return jsonify(response), 400

            # Password Validation
            if not entrykey:
                response['message'] = "Password is required."
                response['category'] = "error"
                return jsonify(response), 400

            if not validate_password(entrykey):
                response['message'] = "Password must be 8-32 characters with uppercase, lowercase, number, and special character."
                response['category'] = "error"
                return jsonify(response), 400

            # Confirm Password Validation
            if not confirm_password:
                response['message'] = "Confirmation password is required."
                response['category'] = "error"
                return jsonify(response), 400

            if entrykey != confirm_password:
                response['message'] = "Passwords do not match."
                response['category'] = "error"
                return jsonify(response), 400

            # Prevent password reuse of common patterns
            common_patterns = ['password', '12345678', 'qwerty', 'admin']
            if any(pattern in entrykey.lower() for pattern in common_patterns):
                response['message'] = "Password is too common. Please choose a stronger password."
                response['category'] = "error"
                return jsonify(response), 400

            # Cooldown Check for Account Creation
            if 'register_blocked_until' in session:
                if time.time() < session['register_blocked_until']:
                    response['message'] = "Too many registration attempts. Please wait 15 minutes before trying again."
                    response['category'] = "error"
                    return jsonify(response), 400

            # Check if email already exists
            if Email.query.filter_by(email=email).first():
                response['message'] = "Email already registered."
                response['category'] = "error"
                return jsonify(response), 400

            # Track verification code send attempts with more robust mechanism
            # Initialize session tracking if not exists
            if 'verification_attempts' not in session:
                session['verification_attempts'] = {
                    'count': 0,
                    'first_attempt_time': time.time()
                }

            current_time = time.time()
            verification_attempts = session['verification_attempts']

            # Check if we're within the 15-minute window from first attempt
            if current_time - verification_attempts['first_attempt_time'] > 900:  # 15 minutes
                # Reset attempts if 15 minutes have passed
                verification_attempts['count'] = 0
                verification_attempts['first_attempt_time'] = current_time

            # Check if verification attempts exceed limit
            if verification_attempts['count'] >= 3:
                response['message'] = "Too many verification code requests. Please wait before trying again."
                response['category'] = "error"
                return jsonify(response), 429

            # Increment verification attempts
            verification_attempts['count'] += 1
            session['verification_attempts'] = verification_attempts

            # Generate verification code
            verification_code = str(random.randint(100000, 999999))
            session['verification_code'] = verification_code
            session['pending_user'] = {
                "last_name": last_name,
                "first_name": first_name,
                "middle_name": middle_name,
                "email": email,
                "entrykey": entrykey,
                "role_id": 3  # Default Applicant Role
            }

            # Initialize verification attempt tracking
            session['verify_attempts'] = 0
            session.pop('verify_blocked_until', None)
            session['last_code_sent_time'] = time.time()

            # Send Email
            msg = Message("Your Verification Code", recipients=[email])
            msg.body = f"Your verification code is: {verification_code}"
            mail.send(msg)

            # Record the time when the verification code was sent
            session['verification_code_sent_at'] = time.time()

            response['status'] = 'success'
            response['message'] = 'Verification code sent.'
            response['category'] = 'success'
            return jsonify(response)

        except Exception as e:
            # Catch any unexpected errors during registration
            response['message'] = "An unexpected error occurred during registration."
            response['category'] = "error"
            return jsonify(response), 500

    return render_template('register.html')

# ✅ Verification Page Route
@app.route('/verify_email_page')
def verify_email_page():
    if 'verification_code' not in session or 'pending_user' not in session:
        flash("Please register first to verify your email.", "error")
        return redirect(url_for('register'))
    user_email = session['pending_user']['email']
    return render_template('verify_email.html', user_email=user_email)

# ✅ Resend Verification Code Route
@app.route('/resend_verification', methods=['POST'])
def resend_verification():
    response = {'status': 'error'}
    
    # Check if there's a pending user session
    if 'pending_user' not in session or 'verification_code' not in session:
        response['message'] = "Session expired. Please register again."
        response['category'] = "error"
        return jsonify(response), 400
    
    # Rate limiting for resend requests
    current_time = time.time()
    if 'last_resend_time' in session:
        time_since_last_resend = current_time - session['last_resend_time']
        if time_since_last_resend < 60:  # 60 seconds cooldown
            remaining_time = int(60 - time_since_last_resend)
            response['message'] = f"Please wait {remaining_time} seconds before requesting a new code."
            response['category'] = "error"
            response['remaining_time'] = remaining_time
            return jsonify(response), 429
    
    # Generate new verification code
    verification_code = str(random.randint(100000, 999999))
    session['verification_code'] = verification_code
    session['last_resend_time'] = current_time
    session['last_code_sent_time'] = current_time
    
    # Send new email
    try:
        msg = Message("Your New Verification Code", recipients=[session['pending_user']['email']])
        msg.body = f"Your new verification code is: {verification_code}"
        mail.send(msg)
        
        response['status'] = 'success'
        response['message'] = 'New verification code sent.'
        response['category'] = 'success'
        return jsonify(response)
    except Exception as e:
        response['message'] = "Failed to send verification code. Please try again."
        response['category'] = "error"
        return jsonify(response), 500

# ✅ Exit Verification Route
@app.route('/exit_verification')
def exit_verification():
    # Clear verification-related session data
    session.pop('verification_code', None)
    session.pop('pending_user', None)
    session.pop('verification_code_sent_at', None)
    session.pop('last_resend_time', None)
    session.pop('verify_attempts', None)
    session.pop('verify_blocked_until', None)
    
    flash("Verification process cancelled. You can register again if needed.", "info")
    return redirect(url_for('register'))

# ✅ Email Verification Route
@app.route('/verify_email', methods=['POST'])
def verify_email():
    response = {'status': 'error'}
    verification_code = request.form.get('verification_code')

    # Cooldown Check
    if 'verify_blocked_until' in session:
        if time.time() < session['verify_blocked_until']:
            response['message'] = "Too many failed attempts. Please wait 15 minutes before trying again."
            response['category'] = "error"
            return jsonify(response), 429

    # Ensure there is a pending user session
    if 'verification_code' not in session or 'pending_user' not in session:
        response['message'] = "Session expired. Please register again."
        response['category'] = "error"
        return jsonify(response), 400

    # Check if the entered code matches the session code
    if verification_code != session['verification_code']:
        session['verify_attempts'] = session.get('verify_attempts', 0) + 1

        if session['verify_attempts'] >= 5:
            session['verify_blocked_until'] = time.time() + 900  # Block for 15 minutes
            response['message'] = "Too many failed attempts. Please wait 15 minutes before trying again."
            response['category'] = "error"
            return jsonify(response), 429

        response['message'] = "Invalid verification code."
        response['category'] = "error"
        return jsonify(response), 400

    # If verified, create the user
    pending_user = session.pop('pending_user')
    session.pop('verification_code', None)
    session.pop('verification_code_sent_at', None)
    session.pop('last_resend_time', None)
    session.pop('verify_attempts', None)
    session.pop('verify_blocked_until', None)

    new_user = User(
        last_name=pending_user['last_name'],
        first_name=pending_user['first_name'],
        middle_name=pending_user.get('middle_name'),
        role_id=pending_user['role_id'],
        is_active=True
    )
    db.session.add(new_user)
    db.session.commit()

    new_email = Email(email=pending_user['email'], user_id=new_user.user_id)
    new_entrykey = EntryKey(entrykey=pending_user['entrykey'])
    new_entrykey.user_id = new_user.user_id

    db.session.add(new_email)
    db.session.add(new_entrykey)
    db.session.commit()

    response['status'] = 'success'
    response['message'] = 'Email verified! Your account has been created.'
    response['category'] = 'success'
    return jsonify(response)

# ✅ Login Route (Updated for Flask-Login)
@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
        
    if request.method == 'POST':
        try:
            email = request.form.get('email', '').strip()
            entrykey = request.form.get('entrykey')
            remember = request.form.get('remember', False) == 'true'
            response = {'success': False, 'message': '', 'category': ''}

            # Validate non-empty email
            if not email:
                response['message'] = "Email cannot be empty."
                response['category'] = "error"
                return jsonify(response), 400
            
            if not validate_email(email):
                response['message'] = "Invalid email address."
                response['category'] = "error"
                return jsonify(response), 400

            # Validate non-empty password
            if not entrykey:
                response['message'] = "Password cannot be empty."
                response['category'] = "error"
                return jsonify(response), 400

            # Cooldown Check for Login Attempts
            if 'login_blocked_until' in session:
                if time.time() < session['login_blocked_until']:
                    response['message'] = "Too many failed login attempts. Try again later."
                    response['category'] = "error"
                    return jsonify(response), 429
                else:
                    session.pop('login_blocked_until')
                    session['login_attempts'] = 0

            user_email = Email.query.filter_by(email=email).first()
            if not user_email:
                response['message'] = "Email not found."
                response['category'] = "error"
                return jsonify(response), 404

            user = User.query.get(user_email.user_id)
            if not user:
                response['message'] = "User account not found."
                response['category'] = "error"
                return jsonify(response), 404

            user_entrykey = EntryKey.query.filter_by(user_id=user_email.user_id).first()
            
            if user_entrykey and user_entrykey.check_entrykey(entrykey):
                # Use Flask-Login to log in the user
                login_user(user, remember=remember)
                
                # Get the next page from the request if it exists
                next_page = request.args.get('next')
                
                # Check user role and redirect accordingly
                if user.role_id == 1:  # OSOAD (Admin)
                    redirect_url = url_for('dashboard')  # Points to admin/organization.html
                else:
                    # For non-admin roles, redirect to user application page
                    redirect_url = url_for('user_application')
                
                response['success'] = True
                response['redirect'] = next_page or redirect_url
                return jsonify(response)

            # Increment login attempts
            session['login_attempts'] = session.get('login_attempts', 0) + 1

            if session['login_attempts'] >= 5:
                session['login_blocked_until'] = time.time() + 900  # Block for 15 minutes
                response['message'] = "Too many failed login attempts. Please wait 15 minutes before trying again."
                response['category'] = "error"
                return jsonify(response), 429

            response['message'] = "Incorrect password."
            response['category'] = "error"
            return jsonify(response), 401
        
        except Exception as e:
            app.logger.error(f"Login error: {str(e)}")
            # Return the actual error message for debugging
            return jsonify({'success': False, 'message': f'Server error: {str(e)}', 'category': 'error'}), 500

    return render_template('login.html')

# ✅ Dashboard Route (protected with login_required)
@app.route('/organization')
@login_required
def dashboard():
    return render_template('admin/organization.html', user=current_user)

# ✅ User Application Route (for non-admin users)
@app.route('/user/application')
@login_required
def user_application():
    # Only accessible for non-admin users
    if current_user.role_id == 1:  # If admin tries to access
        return redirect(url_for('dashboard'))
    return render_template('user/application.html', user=current_user)

@app.route('/neworganization')
@login_required
def neworganization():
    # current_user is provided by Flask-Login
    return render_template('admin/neworganization.html', user=current_user)

@app.route('/member')
@login_required
def member():
    # current_user is provided by Flask-Login
    return render_template('admin/member.html', user=current_user)


@app.route('/neworganizationfiles')
@login_required
def neworganizationfiles():
    # current_user is provided by Flask-Login
    return render_template('admin/neworganizationfiles.html', user=current_user)

@app.route('/renewal')
@login_required
def renewal():
    # current_user is provided by Flask-Login
    return render_template('admin/renewal.html', user=current_user)

@app.route('/organizationrenewals')
@login_required
def organizationrenewals():
    # current_user is provided by Flask-Login
    return render_template('admin/organizationrenewals.html', user=current_user)

@app.route('/organization')
@login_required
def organization():
    # current_user is provided by Flask-Login
    return render_template('admin/organization.html', user=current_user)

@app.route('/organizationdetails')
@login_required
def organizationdetails():
    # current_user is provided by Flask-Login
    return render_template('admin/organizationdetails.html', user=current_user)

@app.route('/announcement')
@login_required
def analytics():
    # current_user is provided by Flask-Login
    return render_template('admin/announcement.html', user=current_user)

@app.route('/reports')
@login_required
def schedules():
    # current_user is provided by Flask-Login
    return render_template('admin/reports.html', user=current_user)

@app.route('/organizationreports')
@login_required
def organizationreports():
    # current_user is provided by Flask-Login
    return render_template('admin/organizationreports.html', user=current_user)

# ✅ Logout Route (Updated for Flask-Login)
@app.route('/logout')
@login_required
def logout():
    logout_user()  # Flask-Login's logout function
    flash("You have been logged out.", "info")
    return redirect(url_for('login'))

if __name__ == '__main__':
    # app.run(debug=True)
    app.run(host='0.0.0.0', port=5000, debug=True)