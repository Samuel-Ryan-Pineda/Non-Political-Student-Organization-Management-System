from flask import Blueprint, jsonify, render_template, request, redirect, url_for, session, flash
from flask_login import login_user, logout_user, login_required, current_user
from app.models import User, EntryKey, Role
from app.utils import validate_name, validate_email, validate_password, sanitize_input, validate_name_length
from app import db, mail
from flask_mail import Message
import random
import time
import functools
import hmac
from datetime import datetime, timedelta

auth_bp = Blueprint('auth', __name__)

# Constants
VERIFICATION_TIMEOUT = 900  # 15 minutes in seconds
MAX_VERIFY_ATTEMPTS = 5
VERIFICATION_COOLDOWN = 60  # 1 minute in seconds
MAX_VERIFICATION_REQUESTS = 3

# Helper functions
def create_error_response(message, status_code=400):
    """Create a standardized error response"""
    response = {'status': 'error', 'message': message, 'category': 'error'}
    return jsonify(response), status_code

def create_success_response(message, data=None):
    """Create a standardized success response"""
    response = {'status': 'success', 'message': message, 'category': 'success'}
    if data:
        response.update(data)
    return jsonify(response)

def rate_limited(max_calls, timeout_duration, count_successful=False):
    """Decorator for rate limiting endpoints
    
    Args:
        max_calls: Maximum number of calls allowed within timeout_duration
        timeout_duration: Time window in seconds for rate limiting
        count_successful: Whether to count successful responses toward the rate limit
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # For GET requests with count_successful=False, don't increment the counter
            if request.method == 'GET' and not count_successful:
                return func(*args, **kwargs)
                
            session_key = f"{func.__name__}_limit"
            current_time = time.time()
            
            # Initialize rate limiting data if not exists
            if session_key not in session:
                session[session_key] = {
                    'count': 0,
                    'reset_time': current_time + timeout_duration
                }
            
            # Reset counter if timeout has passed
            if current_time > session[session_key]['reset_time']:
                session[session_key] = {
                    'count': 0,
                    'reset_time': current_time + timeout_duration
                }
            
            # Check if limit exceeded
            if session[session_key]['count'] >= max_calls:
                remaining = int(session[session_key]['reset_time'] - current_time)
                return create_error_response(
                    f"Rate limit exceeded. Please try again in {remaining} seconds.", 429
                )
            
            # Increment counter before processing the request
            session[session_key]['count'] += 1
            
            # Call the original function
            response = func(*args, **kwargs)
            
            # If configured to not count successful responses and this was successful,
            # decrement the counter
            if not count_successful and hasattr(response, 'status_code') and response.status_code < 400:
                session[session_key]['count'] -= 1
            elif not count_successful and isinstance(response, tuple) and len(response) > 1 and response[1] < 400:
                session[session_key]['count'] -= 1
                
            return response
        return wrapper
    return decorator

def validate_user_input(form_data):
    """Validate user registration input data"""
    errors = []
    
    # Extract and sanitize inputs
    last_name = sanitize_input(form_data.get('last_name', ''))
    first_name = sanitize_input(form_data.get('first_name', ''))
    middle_name = sanitize_input(form_data.get('middle_name', '')) or None
    email = sanitize_input(form_data.get('email', ''))
    entrykey = form_data.get('entrykey')
    confirm_password = form_data.get('confirm_password')
    
    # Name validations
    if not last_name:
        errors.append(("Last name is required.", 400))
    elif not validate_name_length(last_name):
        errors.append(("Last name must be 2-50 characters long.", 400))
    elif not validate_name(last_name):
        errors.append(("Last name contains invalid characters.", 400))
        
    if not first_name:
        errors.append(("First name is required.", 400))
    elif not validate_name_length(first_name):
        errors.append(("First name must be 2-50 characters long.", 400))
    elif not validate_name(first_name):
        errors.append(("First name contains invalid characters.", 400))
    
    # Optional middle name validation
    if middle_name:
        if not validate_name_length(middle_name):
            errors.append(("Middle name must be 2-50 characters long.", 400))
        elif not validate_name(middle_name):
            errors.append(("Middle name contains invalid characters.", 400))
    
    # Email validation
    if not email:
        errors.append(("Email is required.", 400))
    elif not validate_email(email):
        errors.append(("Invalid email address format.", 400))
    else:
        # Check disposable email domains
        disposable_domains = ['tempmail.com', 'throwawaymail.com', 'mailinator.com']
        email_domain = email.split('@')[-1].lower()
        if email_domain in disposable_domains:
            errors.append(("Disposable email addresses are not allowed.", 400))
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            errors.append(("Email already registered.", 400))
    
    # Password validation
    if not entrykey:
        errors.append(("Password is required.", 400))
    elif not validate_password(entrykey):
        errors.append(("Password must be 8-32 characters with uppercase, lowercase, number, and special character.", 400))
    else:
        # Check common password patterns
        common_patterns = ['password', '12345678', 'qwerty', 'admin']
        if any(pattern in entrykey.lower() for pattern in common_patterns):
            errors.append(("Password is too common. Please choose a stronger password.", 400))
    
    # Confirm password validation
    if not confirm_password:
        errors.append(("Confirmation password is required.", 400))
    elif entrykey != confirm_password:
        errors.append(("Passwords do not match.", 400))
    
    # Return validated data and first error if any
    data = {
        'last_name': last_name,
        'first_name': first_name,
        'middle_name': middle_name,
        'email': email,
        'entrykey': entrykey
    }
    
    return data, errors[0] if errors else None

# ✅ Redirect root to login
@auth_bp.route('/')
def index():
    return redirect(url_for('auth.login'))

# ✅ Registration Route
@auth_bp.route('/register', methods=['GET', 'POST'])
@rate_limited(max_calls=5, timeout_duration=VERIFICATION_TIMEOUT, count_successful=False)
def register():
    if request.method == 'POST':
        try:
            # Cooldown Check for Account Creation
            if 'register_blocked_until' in session and time.time() < session['register_blocked_until']:
                return create_error_response("Too many registration attempts. Please wait 15 minutes before trying again.", 429)
            
            # Validate all user inputs
            user_data, error = validate_user_input(request.form)
            if error:
                return create_error_response(error[0], error[1])
            
            # Track verification code send attempts
            if 'verification_attempts' not in session:
                session['verification_attempts'] = {
                    'count': 0,
                    'first_attempt_time': time.time()
                }

            current_time = time.time()
            verification_attempts = session['verification_attempts']

            # Reset attempts if timeout has passed
            if current_time - verification_attempts['first_attempt_time'] > VERIFICATION_TIMEOUT:
                verification_attempts['count'] = 0
                verification_attempts['first_attempt_time'] = current_time

            # Check if verification attempts exceed limit
            if verification_attempts['count'] >= MAX_VERIFICATION_REQUESTS:
                return create_error_response("Too many verification code requests. Please wait before trying again.", 429)

            # Increment verification attempts
            verification_attempts['count'] += 1
            session['verification_attempts'] = verification_attempts

            # Generate verification code
            verification_code = str(random.randint(100000, 999999))
            session['verification_code'] = verification_code
            session['pending_user'] = {
                "last_name": user_data['last_name'],
                "first_name": user_data['first_name'],
                "middle_name": user_data['middle_name'],
                "email": user_data['email'],
                "entrykey": user_data['entrykey'],
                "role_id": 3  # Default Applicant Role
            }

            # Initialize verification attempt tracking
            session['verify_attempts'] = 0
            session.pop('verify_blocked_until', None)
            session['last_code_sent_time'] = current_time

            # Send Email
            msg = Message("Your Verification Code", recipients=[user_data['email']])
            msg.body = f"Your verification code is: {verification_code}"
            mail.send(msg)

            # Record the time when the verification code was sent
            session['verification_code_sent_at'] = current_time

            return create_success_response('Verification code sent.')

        except Exception as e:
            # Log the exception for debugging
            print(f"Registration error: {str(e)}")
            return create_error_response("An unexpected error occurred during registration.", 500)

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
@rate_limited(max_calls=3, timeout_duration=300, count_successful=False)  # 5 minutes timeout
def resend_verification():
    # Check if there's a pending user session
    if 'pending_user' not in session or 'verification_code' not in session:
        return create_error_response("Session expired. Please register again.", 400)
    
    # Rate limiting for resend requests
    current_time = time.time()
    if 'last_resend_time' in session:
        time_since_last_resend = current_time - session['last_resend_time']
        if time_since_last_resend < VERIFICATION_COOLDOWN:
            remaining_time = int(VERIFICATION_COOLDOWN - time_since_last_resend)
            return create_error_response(
                f"Please wait {remaining_time} seconds before requesting a new code.", 
                429, 
                {'remaining_time': remaining_time}
            )
    
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
        
        return create_success_response('New verification code sent.')
    except Exception as e:
        print(f"Resend verification error: {str(e)}")
        return create_error_response("Failed to send verification code. Please try again.", 500)

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
@rate_limited(max_calls=10, timeout_duration=300, count_successful=False)  # 5 minutes timeout
def verify_email():
    verification_code = request.form.get('verification_code')

    # Cooldown Check
    if 'verify_blocked_until' in session and time.time() < session['verify_blocked_until']:
        return create_error_response("Too many failed attempts. Please wait 15 minutes before trying again.", 429)

    # Ensure there is a pending user session
    if 'verification_code' not in session or 'pending_user' not in session:
        return create_error_response("Session expired. Please register again.", 400)

    # Check if verification code has expired (15 minutes)
    if 'verification_code_sent_at' in session:
        code_age = time.time() - session['verification_code_sent_at']
        if code_age > VERIFICATION_TIMEOUT:
            return create_error_response("Verification code has expired. Please request a new one.", 400)

    # Check if the entered code matches the session code using constant-time comparison
    if not hmac.compare_digest(verification_code, session['verification_code']):
        session['verify_attempts'] = session.get('verify_attempts', 0) + 1

        if session['verify_attempts'] >= MAX_VERIFY_ATTEMPTS:
            session['verify_blocked_until'] = time.time() + VERIFICATION_TIMEOUT
            return create_error_response("Too many failed attempts. Please wait 15 minutes before trying again.", 429)

        return create_error_response("Invalid verification code.", 400)

    try:
        # If verified, create the user
        pending_user = session.pop('pending_user')
        
        # Clear all verification-related session data
        for key in ['verification_code', 'verification_code_sent_at', 'last_resend_time', 
                   'verify_attempts', 'verify_blocked_until', 'verification_attempts']:
            session.pop(key, None)

        # Create user in a transaction to ensure data consistency
        new_user = User(
            last_name=pending_user['last_name'],
            first_name=pending_user['first_name'],
            middle_name=pending_user.get('middle_name'),
            email=pending_user['email'],
            role_id=pending_user['role_id'],
            is_active=True
        )
        
        try:
            db.session.add(new_user)
            db.session.flush()  # Get the user_id without committing
            
            new_entrykey = EntryKey(entrykey=pending_user['entrykey'])
            new_entrykey.user_id = new_user.user_id
            db.session.add(new_entrykey)
            db.session.commit()
            
            return create_success_response('Email verified! Your account has been created.')
        except Exception as e:
            db.session.rollback()
            raise e
    except Exception as e:
        print(f"Verification error: {str(e)}")
        return create_error_response("An error occurred while creating your account. Please try again.", 500)

@auth_bp.route('/login', methods=['GET', 'POST'])
@rate_limited(max_calls=5, timeout_duration=300, count_successful=False)  # 5 minutes timeout
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
        
    if request.method == 'POST':
        try:
            email = sanitize_input(request.form.get('email', '')).strip()
            entrykey = request.form.get('entrykey')
            remember = request.form.get('remember', False) == 'true'
            
            # Basic input validation
            if not email:
                return create_error_response("Email cannot be empty.", 400)
            
            if not validate_email(email):
                return create_error_response("Invalid email address.", 400)

            if not entrykey:
                return create_error_response("Password cannot be empty.", 400)

            # Track login attempts for rate limiting
            login_attempts_key = f"login_attempts_{email}"
            if login_attempts_key not in session:
                session[login_attempts_key] = {
                    'count': 0,
                    'first_attempt_time': time.time(),
                    'blocked_until': None
                }
                
            login_attempts = session[login_attempts_key]
            current_time = time.time()
            
            # Check if user is blocked from login attempts
            if login_attempts.get('blocked_until') and current_time < login_attempts['blocked_until']:
                remaining_time = int(login_attempts['blocked_until'] - current_time)
                return create_error_response(
                    f"Too many failed login attempts. Please wait {remaining_time} seconds before trying again.",
                    429
                )
                
            # Reset attempts counter if timeout has passed
            if current_time - login_attempts['first_attempt_time'] > 900:  # 15 minutes
                login_attempts['count'] = 0
                login_attempts['first_attempt_time'] = current_time
                login_attempts['blocked_until'] = None

            # Find user by email
            user = User.query.filter_by(email=email).first()
            
            # Check user existence, active status, and password
            if not user or not user.is_active:
                # Increment failed attempts
                login_attempts['count'] += 1
                
                # Block after 5 failed attempts
                if login_attempts['count'] >= 5:
                    login_attempts['blocked_until'] = current_time + 900  # 15 minutes
                    
                session[login_attempts_key] = login_attempts
                
                # Generic error message for security
                return create_error_response("Invalid email or password.", 401)

            # Verify password
            entrykey_record = EntryKey.query.filter_by(user_id=user.user_id).first()
            if not entrykey_record or not entrykey_record.check_entrykey(entrykey):
                # Increment failed attempts
                login_attempts['count'] += 1
                
                # Block after 5 failed attempts
                if login_attempts['count'] >= 5:
                    login_attempts['blocked_until'] = current_time + 900  # 15 minutes
                    
                session[login_attempts_key] = login_attempts
                
                return create_error_response("Invalid email or password.", 401)

            # Login successful - reset attempts counter
            session.pop(login_attempts_key, None)
            login_user(user, remember=remember)
            
            # Get dashboard URL based on user role
            dashboard_routes = {
                1: 'main.admin_dashboard',  # OSOAD
                2: 'main.org_dashboard',    # Organization President
                3: 'main.dashboard'         # Applicant (default)
            }
            
            redirect_url = url_for(dashboard_routes.get(user.role_id, 'main.dashboard'))
            
            return create_success_response(
                "Login successful!", 
                {'success': True, 'redirect': redirect_url}
            )
            
        except Exception as e:
            print(f"Login error: {str(e)}")
            return create_error_response("An error occurred during login.", 500)

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