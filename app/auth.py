from flask import Blueprint, jsonify, render_template, request, redirect, url_for, session, flash
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User, Email, EntryKey, UserRole
from app.utils import validate_name, validate_email, validate_password, sanitize_input, validate_name_length
from app import db, mail
from flask_mail import Message
import random
import time

auth_bp = Blueprint('auth', __name__)

# ✅ Redirect root to login
@auth_bp.route('/')
def index():
    return redirect(url_for('auth.login'))

# ✅ Registration Route
@auth_bp.route('/register', methods=['GET', 'POST'])
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
@auth_bp.route('/verify_email_page')
def verify_email_page():
    if 'verification_code' not in session or 'pending_user' not in session:
        flash("Please register first to verify your email.", "error")
        return redirect(url_for('auth.register'))
    user_email = session['pending_user']['email']
    return render_template('verify_email.html', user_email=user_email)

# ✅ Resend Verification Code Route
@auth_bp.route('/resend_verification', methods=['POST'])
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
@auth_bp.route('/exit_verification')
def exit_verification():
    # Clear verification-related session data
    session.pop('verification_code', None)
    session.pop('pending_user', None)
    session.pop('verification_code_sent_at', None)
    session.pop('last_resend_time', None)
    session.pop('verify_attempts', None)
    session.pop('verify_blocked_until', None)
    
    flash("Verification process cancelled. You can register again if needed.", "info")
    return redirect(url_for('auth.register'))

# ✅ Email Verification Route
@auth_bp.route('/verify_email', methods=['POST'])
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

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
        
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

            # Find user by email
            email_record = Email.query.filter_by(email=email).first()
            if not email_record:
                response['message'] = "Invalid email or password."
                response['category'] = "error"
                return jsonify(response), 401

            user = User.query.get(email_record.user_id)
            if not user:
                response['message'] = "User account not found."
                response['category'] = "error"
                return jsonify(response), 401

            # Check if user is active
            if not user.is_active:
                response['message'] = "Your account has been deactivated. Please contact support."
                response['category'] = "error"
                return jsonify(response), 403

            # Verify password
            entrykey_record = EntryKey.query.filter_by(user_id=user.user_id).first()
            if not entrykey_record or not entrykey_record.check_entrykey(entrykey):
                response['message'] = "Invalid email or password."
                response['category'] = "error"
                return jsonify(response), 401

            # Login successful
            login_user(user, remember=remember)
            
            # Redirect based on user role
            if user.role_id == 1:  # OSOAD
                response['redirect'] = url_for('main.admin_dashboard')
            elif user.role_id == 2:  # Organization President
                response['redirect'] = url_for('main.org_dashboard')
            else:  # Applicant
                response['redirect'] = url_for('main.dashboard')
                
            response['success'] = True
            response['message'] = "Login successful!"
            response['category'] = "success"
            return jsonify(response)
            
        except Exception as e:
            response['message'] = "An error occurred during login."
            response['category'] = "error"
            return jsonify(response), 500

    return render_template('login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash("You have been logged out.", "info")
    return redirect(url_for('auth.login'))

# JSON error handler for login_required decorator
@auth_bp.app_errorhandler(401)
def unauthorized_handler(error):
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'success': False, 'message': 'Please log in to access this page.', 'category': 'error'}), 401
    return redirect(url_for('auth.login'))