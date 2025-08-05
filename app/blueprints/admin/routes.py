from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, abort, session
from flask_login import login_required, current_user, logout_user
from app.models import db, Logo, Application, ApplicationFile
from datetime import datetime
from werkzeug.utils import secure_filename
import io

admin_routes_bp = Blueprint('admin_routes', __name__)

@admin_routes_bp.route('/dashboard')
@login_required
def admin_dashboard():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_all_active_organizations
    
    # Get all active organizations
    active_organizations = get_all_active_organizations()
    
    return render_template('admin/organization.html', 
                          user=current_user, 
                          active_page='organization',
                          organizations=active_organizations)

@admin_routes_bp.route('/member')
@login_required
def member():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    from app.models import Student, Program
    from sqlalchemy import or_
    
    students = []
    search_query = request.args.get('search', '').strip()
    
    if search_query:
        # Search students by student number, name, or program
        students = Student.query.join(Program).filter(
            or_(
                Student.student_number.ilike(f'%{search_query}%'),
                Student.first_name.ilike(f'%{search_query}%'),
                Student.middle_name.ilike(f'%{search_query}%'),
                Student.last_name.ilike(f'%{search_query}%'),
                Program.program_code.ilike(f'%{search_query}%'),
                Program.program_name.ilike(f'%{search_query}%')
            )
        ).limit(50).all()  # Limit results to 50 for performance
    
    return render_template('admin/member.html', 
                          user=current_user, 
                          active_page='member',
                          students=students)

@admin_routes_bp.route('/student-affiliations/<int:student_id>')
@login_required
def get_student_affiliations(student_id):
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    from app.models import Student, Affiliation, Organization
    
    try:
        # Get student
        student = Student.query.get_or_404(student_id)
        
        # Get all affiliations for this student
        affiliations = db.session.query(
            Affiliation, Organization
        ).join(
            Organization, Affiliation.organization_id == Organization.organization_id
        ).filter(
            Affiliation.student_id == student_id
        ).all()
        
        affiliation_data = []
        for affiliation, organization in affiliations:
            affiliation_data.append({
                'organization_name': organization.organization_name,
                'position': affiliation.position or 'Member',
                'academic_year': affiliation.academic_year or 'N/A'
            })
        
        return jsonify({
            'success': True,
            'affiliations': affiliation_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching affiliations: {str(e)}'
        }), 500



@admin_routes_bp.route('/organization')
@login_required
def organization():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_all_active_organizations
    
    # Get all active organizations
    active_organizations = get_all_active_organizations()
    
    # current_user is provided by Flask-Login
    return render_template('admin/organization.html', 
                          user=current_user, 
                          active_page='organization',
                          organizations=active_organizations)

@admin_routes_bp.route('/organizationdetails')
@admin_routes_bp.route('/organizationdetails/<int:organization_id>')
@login_required
def organizationdetails(organization_id=None):
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # If organization_id is provided, get organization details
    organization = None
    statistics = None
    officers = None
    members = None
    volunteers = None
    plans = None
    adviser = None
    coadviser = None
    social_media = None
    
    if organization_id:
        # Import the service modules here to avoid circular imports
        from app.organization_service import (
            get_organization_by_id, 
            get_organization_statistics, 
            get_affiliations_by_position_type,
            get_plans_by_organization_id,
            get_adviser_by_organization_id,
            get_social_media_by_organization_id
        )
        
        organization = get_organization_by_id(organization_id)
        
        if not organization:
            flash("Organization not found", "error")
            return redirect(url_for('admin_routes.organization'))
        
        # Get real statistics from the database
        statistics = get_organization_statistics(organization_id)
        
        # Get officers, members, and volunteers from the database
        officers = get_affiliations_by_position_type(organization_id, 'Officer')
        members = get_affiliations_by_position_type(organization_id, 'Member')
        volunteers = get_affiliations_by_position_type(organization_id, 'Volunteer')
        
        # Get plans from the database
        plans = get_plans_by_organization_id(organization_id)
        
        # Get adviser information
        adviser = get_adviser_by_organization_id(organization_id, adviser_type='Adviser')
        
        # Get co-adviser information
        coadviser = get_adviser_by_organization_id(organization_id, adviser_type='Co-Adviser')
        
        # Get social media links
        social_media = get_social_media_by_organization_id(organization_id)
    
    # current_user is provided by Flask-Login
    return render_template('admin/organizationdetails.html', 
                          user=current_user, 
                          active_page='organization',
                          organization=organization,
                          statistics=statistics,
                          officers=officers,
                          members=members,
                          volunteers=volunteers,
                          plans=plans,
                          adviser=adviser,
                          coadviser=coadviser,
                          social_media=social_media)

@admin_routes_bp.route('/announcement')
@login_required
def analytics():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_all_active_organizations
    
    # Get all active organizations for the multi-select dropdown
    active_organizations = get_all_active_organizations()
    
    # current_user is provided by Flask-Login
    return render_template('admin/announcement.html', 
                          user=current_user, 
                          active_page='announcement',
                          organizations=active_organizations)

@admin_routes_bp.route('/reports')
@login_required
def schedules():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/reports.html', user=current_user, active_page='reports')

@admin_routes_bp.route('/organizationreports')
@login_required
def organizationreports():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/organizationreports.html', user=current_user, active_page='reports')

@admin_routes_bp.route('/adminaccount')
@login_required
def adminaccount():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/adminaccount.html', user=current_user, active_page='adminaccount')

@admin_routes_bp.route('/get-application-file')
@login_required
def get_application_file():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        abort(403)  # Forbidden
    
    # Get file_id from query parameters
    file_id = request.args.get('file_id')
    if not file_id:
        abort(400)  # Bad Request
    
    # Get the application file
    app_file = ApplicationFile.query.get_or_404(int(file_id))
    
    # Check if file data exists and has content
    if not app_file.file or len(app_file.file) == 0:
        return render_template('error.html', message="The file appears to be empty or corrupted."), 500
    
    # Check file signatures to determine file type
    # PDF signature check (%PDF)
    if app_file.file[:4] == b'%PDF':
        mimetype = 'application/pdf'
        file_extension = 'pdf'
    # DOCX files (PK zip signature)
    elif len(app_file.file) > 4 and app_file.file[:4] == b'PK\x03\x04':
        mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        file_extension = 'docx'
    # DOC files (Compound File Binary Format signature)
    elif len(app_file.file) > 8 and app_file.file[:8] == b'\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1':
        mimetype = 'application/msword'
        file_extension = 'doc'
    else:
        # If we can't determine the type from signature, try to infer from filename
        if app_file.file_name.lower().endswith('.pdf'):
            mimetype = 'application/pdf'
            file_extension = 'pdf'
        elif app_file.file_name.lower().endswith('.docx'):
            mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            file_extension = 'docx'
        elif app_file.file_name.lower().endswith('.doc'):
            mimetype = 'application/msword'
            file_extension = 'doc'
        else:
            # Default to PDF as a fallback
            mimetype = 'application/pdf'
            file_extension = 'pdf'
    
    # Create a filename with proper extension for the browser
    if app_file.file_name.lower() in ['form 1a - application for recognition', 'form 2 - letter of acceptance', 
                                     'form 3 - list of programs/projects/ activities', 'form 4 - list of members',
                                     'board of officers', 'constitution and bylaws', 'logo with explanation']:
        # These are form types, add the extension
        download_name = f"{app_file.file_name}.{file_extension}"
    else:
        # For files that might already have an extension
        if '.' in app_file.file_name:
            download_name = app_file.file_name
        else:
            download_name = f"{app_file.file_name}.{file_extension}"
    
    # Check if download is requested
    download_requested = request.args.get('download', '').lower() == 'true'
    
    # For Word documents, force download regardless of the download parameter
    force_download = download_requested or mimetype in [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]
    
    try:
        # Create a BytesIO object from the file data
        file_data = io.BytesIO(app_file.file)
        
        # Attempt to send the file
        response = send_file(
            file_data,
            mimetype=mimetype,
            as_attachment=force_download,  # True to download, False to preview in browser
            download_name=download_name
        )
        
        # Add Content-Disposition header to ensure proper preview
        if not force_download:
            response.headers['Content-Disposition'] = f'inline; filename="{download_name}"'
        
        return response
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Error serving file: {str(e)}")
        print(traceback.format_exc())
        # Return a user-friendly error
        return render_template('error.html', message="Something went wrong while trying to open this file. The file may be corrupted or in an unsupported format."), 500

@admin_routes_bp.route('/download-application-file')
@login_required
def download_application_file():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        abort(403)  # Forbidden
    
    # Get file_id from query parameters
    file_id = request.args.get('file_id')
    if not file_id:
        abort(400)  # Bad Request
    
    # Add download=true parameter and redirect to get-application-file
    return redirect(url_for('admin_routes.get_application_file', file_id=file_id, download=True))

@admin_routes_bp.route('/update-name', methods=['POST'])
@login_required
def update_name():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        first_name = data.get('first_name', '').strip()
        middle_name = data.get('middle_name', '').strip()
        last_name = data.get('last_name', '').strip()
        
        # Validation
        if not first_name or not last_name:
            return jsonify({'success': False, 'message': 'First name and last name are required'}), 400
        
        # Update user information
        current_user.first_name = first_name
        current_user.middle_name = middle_name if middle_name else None
        current_user.last_name = last_name
        
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'message': 'Name updated successfully',
            'data': {
                'first_name': current_user.first_name,
                'middle_name': current_user.middle_name or '',
                'last_name': current_user.last_name
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f'Error updating name: {str(e)}'}), 500

@admin_routes_bp.route('/update-email', methods=['POST'])
@login_required
def update_email():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        import time
        import secrets
        import hashlib
        from datetime import datetime, timedelta
        
        data = request.get_json()
        new_email = data.get('email', '').strip().lower()
        current_password = data.get('current_password', '').strip()
        
        # Step 1: Re-authentication - Verify current password
        if not current_password:
            return jsonify({'success': False, 'message': 'Current password is required for email change'})
        
        from app.models import EntryKey
        entrykey_record = EntryKey.query.filter_by(user_id=current_user.user_id).first()
        if not entrykey_record or not entrykey_record.check_entrykey(current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect'})
        
        # Step 2: Validate new email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, new_email):
            return jsonify({'success': False, 'message': 'Invalid email format'})
        
        # Check uniqueness - ensure no other account is using it
        from app.models import User
        existing_user = User.query.filter(User.email == new_email, User.user_id != current_user.user_id).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'Email is already in use'})
        
        # Check if it's the same as current email
        if new_email == current_user.email:
            return jsonify({'success': False, 'message': 'This is already your current email'})
        
        # Step 3: Generate secure verification token
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expiry_time = datetime.utcnow() + timedelta(minutes=15)
        
        # Make session permanent to ensure it persists
        session.permanent = True
        # Store token data in session
        session['admin_email_change_token'] = token_hash
        session['admin_email_change_new_email'] = new_email
        session['admin_email_change_old_email'] = current_user.email
        session['admin_email_change_expiry'] = expiry_time.isoformat()
        session['admin_email_change_user_id'] = current_user.user_id
        
        # Debug: Log session creation
        print(f"Created email change session for user {current_user.user_id}")
        print(f"Token hash: {token_hash[:20]}...")
        print(f"Session ID: {session.get('_id', 'No session ID')}")
        
        # Step 4: Send verification link to new email
        from flask_mail import Message
        from app import mail
        from flask import current_app, url_for
        
        verification_url = url_for('admin_routes.confirm_email_change', token=token, _external=True)
        
        msg = Message(
            'Confirm Your Email Change - NPSOMS Admin',
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@yourdomain.com'),
            recipients=[new_email]
        )
        msg.html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Email Change Verification</h2>
                <p>Hello {current_user.first_name},</p>
                <p>You have requested to change your admin email address from <strong>{current_user.email}</strong> to <strong>{new_email}</strong>.</p>
                <p>To confirm this change, please click the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                        Confirm Email Change
                    </a>
                </div>
                <p><strong>Important:</strong></p>
                <ul>
                    <li>This link will expire in 15 minutes</li>
                    <li>If you did not request this change, please ignore this email</li>
                    <li>For security, you will be automatically logged out after the change and will need to log in again with your new email address</li>
                </ul>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 3px;">{verification_url}</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    NPSOMS Admin Team
                </p>
            </div>
        </body>
        </html>
        '''
        
        mail.send(msg)
        
        # Step 5: Send notification to old email
        old_email_msg = Message(
            'Email Change Request Notification - NPSOMS Admin',
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@yourdomain.com'),
            recipients=[current_user.email]
        )
        old_email_msg.html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e74c3c;">Email Change Request</h2>
                <p>Hello {current_user.first_name},</p>
                <p>We received a request to change your admin email address from <strong>{current_user.email}</strong> to <strong>{new_email}</strong>.</p>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
                    <p style="margin: 5px 0 0 0;">If you did not request this change, please contact the system administrator immediately.</p>
                </div>
                <p>The change will only take effect if the verification link sent to the new email address is clicked within 15 minutes.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    NPSOMS Admin Team<br>
                    Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
                </p>
            </div>
        </body>
        </html>
        '''
        
        mail.send(old_email_msg)
        
        return jsonify({
            'success': True, 
            'message': f'Verification link sent to {new_email}. Please check your email and click the link to confirm the change. A notification has also been sent to your current email address.'
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Error processing email change request: {str(e)}'}), 500

@admin_routes_bp.route('/confirm-email-change')
def confirm_email_change():
    """Handle email change confirmation via verification link"""
    token = request.args.get('token')
    
    if not token:
        return render_template('error.html', 
                             error_title='Invalid Request',
                             error_message='No verification token provided.'), 400
    
    try:
        import hashlib
        from datetime import datetime
        
        # Hash the provided token to compare with stored hash
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Debug: Log session contents (remove in production)
        print(f"Session keys: {list(session.keys())}")
        print(f"Token hash: {token_hash[:20]}...")
        if 'admin_email_change_token' in session:
            print(f"Stored token hash: {session['admin_email_change_token'][:20]}...")
        
        # Check if token exists in session
        if 'admin_email_change_token' not in session:
            return render_template('error.html',
                                 error_title='Verification Failed',
                                 error_message='Verification session not found or expired. This can happen if you opened the link in a different browser or if too much time has passed. Please go back to your admin account page and request a new email change.'), 400
        
        # Verify token matches
        if session.get('admin_email_change_token') != token_hash:
            return render_template('error.html',
                                 error_title='Verification Failed', 
                                 error_message='Invalid verification token.'), 400
        
        # Check if token has expired
        expiry_str = session.get('admin_email_change_expiry')
        if not expiry_str:
            return render_template('error.html',
                                 error_title='Verification Failed',
                                 error_message='Verification session expired.'), 400
        
        expiry_time = datetime.fromisoformat(expiry_str)
        if datetime.utcnow() > expiry_time:
            # Clear expired session data
            session.pop('admin_email_change_token', None)
            session.pop('admin_email_change_new_email', None)
            session.pop('admin_email_change_old_email', None)
            session.pop('admin_email_change_expiry', None)
            session.pop('admin_email_change_user_id', None)
            
            return render_template('error.html',
                                 error_title='Verification Expired',
                                 error_message='Verification link has expired. Please request a new email change.'), 400
        
        # Get user and new email from session
        user_id = session.get('admin_email_change_user_id')
        new_email = session.get('admin_email_change_new_email')
        old_email = session.get('admin_email_change_old_email')
        
        if not all([user_id, new_email, old_email]):
            return render_template('error.html',
                                 error_title='Verification Failed',
                                 error_message='Incomplete verification data.'), 400
        
        # Get user from database
        from app.models import User
        user = User.query.get(user_id)
        if not user or user.role_id != 1:
            return render_template('error.html',
                                 error_title='Verification Failed',
                                 error_message='User not found or unauthorized.'), 400
        
        # Double-check email uniqueness before updating
        existing_user = User.query.filter(User.email == new_email, User.user_id != user_id).first()
        if existing_user:
            return render_template('error.html',
                                 error_title='Email Already In Use',
                                 error_message='The email address is already being used by another account.'), 400
        
        # Update user email
        user.email = new_email
        db.session.commit()
        
        # Log the activity (optional - you can implement audit logging here)
        # audit_log = AuditLog(user_id=user_id, action='email_change', 
        #                     details=f'Email changed from {old_email} to {new_email}')
        # db.session.add(audit_log)
        # db.session.commit()
        
        # Clear session data
        session.pop('admin_email_change_token', None)
        session.pop('admin_email_change_new_email', None)
        session.pop('admin_email_change_old_email', None)
        session.pop('admin_email_change_expiry', None)
        session.pop('admin_email_change_user_id', None)
        
        # Log out the user for security after email change
        from flask_login import logout_user
        logout_user()
        
        # Send confirmation email to new address
        try:
            from flask_mail import Message
            from app import mail
            from flask import current_app
            
            confirmation_msg = Message(
                'Email Change Confirmed - NPSOMS Admin',
                sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@yourdomain.com'),
                recipients=[new_email]
            )
            confirmation_msg.html = f'''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #27ae60;">✅ Email Change Confirmed</h2>
                    <p>Hello {user.first_name},</p>
                    <p>Your admin email address has been successfully changed to <strong>{new_email}</strong>.</p>
                    <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Change Summary:</strong></p>
                        <p style="margin: 5px 0 0 0;">Previous email: {old_email}<br>New email: {new_email}</p>
                    </div>
                    <p>For security reasons, you may need to log in again with your new email address.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                    <p style="font-size: 12px; color: #666;">
                        Best regards,<br>
                        NPSOMS Admin Team<br>
                        Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC
                    </p>
                </div>
            </body>
            </html>
            '''
            
            mail.send(confirmation_msg)
        except Exception as mail_error:
            # Email sending failed, but the change was successful
            print(f"Failed to send confirmation email: {mail_error}")
        
        # Render success page
        return render_template('success.html',
                             success_title='Email Change Confirmed',
                             success_message=f'Your admin email has been successfully changed to {new_email}. For security reasons, you have been logged out. Please log in again with your new email address.',
                             redirect_url='/login',
                             show_login_button=True)
        
    except Exception as e:
        return render_template('error.html',
                             error_title='Verification Error',
                             error_message=f'An error occurred during verification: {str(e)}'), 500



@admin_routes_bp.route('/update-password', methods=['POST'])
@login_required
def update_password():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')
        
        if not current_password or not new_password or not confirm_password:
            return jsonify({'success': False, 'message': 'All password fields are required'})
        
        # Verify passwords match
        if new_password != confirm_password:
            return jsonify({'success': False, 'message': 'New passwords do not match'})
        
        # Verify current password
        from app.models import EntryKey
        entrykey_record = EntryKey.query.filter_by(user_id=current_user.user_id).first()
        if not entrykey_record or not entrykey_record.check_entrykey(current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect'})
        
        # Validate new password
        if len(new_password) < 8:
            return jsonify({'success': False, 'message': 'New password must be at least 8 characters long'})
        
        # Update password
        import bcrypt
        entrykey_record.entry_key = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Password updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': 'An error occurred while updating password'}), 500

@admin_routes_bp.route('/check-organization-expiry', methods=['POST'])
@login_required
def manual_check_organization_expiry():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        # Import the expiry check function
        from app import check_organization_expiry
        
        # Run the expiry check manually
        check_organization_expiry()
        
        return jsonify({
            'success': True,
            'message': 'Organization expiry check completed successfully'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500