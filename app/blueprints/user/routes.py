from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, abort, session, current_app
from flask_login import login_required, current_user, logout_user
from app.models import db, Logo, Application, ApplicationFile
from datetime import datetime
from werkzeug.utils import secure_filename
import io
import time

# Email change verification security constants
EMAIL_CHANGE_VERIFICATION_TIMEOUT = 15 * 60  # 15 minutes
MAX_EMAIL_CHANGE_VERIFY_ATTEMPTS = 5
EMAIL_CHANGE_VERIFICATION_COOLDOWN = 60  # 1 minute
MAX_EMAIL_CHANGE_VERIFICATION_REQUESTS = 3

# Import rate limiting decorator from auth
from app.auth import rate_limited

user_routes_bp = Blueprint('user_routes', __name__)

@user_routes_bp.route('/useraccount')
@login_required
def useraccount():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    # Get application associated with the organization
    application = None
    if organization:
        application = get_application_by_organization_id(organization.organization_id, 'New')
    
    # current_user is provided by Flask-Login
    return render_template('user/useraccount.html', user=current_user, organization=organization, application=application, active_page='useraccount')

@user_routes_bp.route('/userrenewal')
@login_required
def userrenewal():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    from app.models import Application
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        flash("You don't have an organization", "error")
        return redirect(url_for('main.dashboard'))
    
    # Generate academic year (e.g., "2025-2026")
    current_year = datetime.now().year
    academic_year = f"{current_year}-{current_year + 1}"
    
    # Check if a renewal application for this academic year exists
    renewal_application = Application.query.filter_by(
        organization_id=organization.organization_id,
        type='Renewal',
        academic_year=academic_year
    ).first()
    
    if not renewal_application:
        # No renewal application for current academic year, redirect to confirmation page
        flash(f"You need to create a renewal application for Academic Year {academic_year} first", "info")
        return redirect(url_for('user_routes.renewal_confirmation'))
    
    # Pass the renewal application to the template instead of the first application
    # This ensures we're showing the correct status for the renewal application
    
    # current_user is provided by Flask-Login
    return render_template('user/userrenewal.html', user=current_user, organization=organization, application=renewal_application, active_page='userrenewal')

@user_routes_bp.route('/userreport')
@login_required
def userreport():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    # Get application associated with the organization
    application = None
    if organization:
        application = get_application_by_organization_id(organization.organization_id, 'New')
    
    # current_user is provided by Flask-Login
    return render_template('user/userreport.html', user=current_user, organization=organization, application=application, active_page='userreport')

@user_routes_bp.route('/notifications')
@login_required
def notifications():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    from app.models import AnnouncementRecipient, Announcement, Feedback, ApplicationFile
    from sqlalchemy import desc
    from datetime import datetime
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    # Get application associated with the organization
    application = None
    if organization:
        application = get_application_by_organization_id(organization.organization_id, 'New')
    
    # Get announcements for this user
    announcements_query = db.session.query(Announcement, AnnouncementRecipient)\
        .join(AnnouncementRecipient, Announcement.announcement_id == AnnouncementRecipient.announcement_id)\
        .filter(AnnouncementRecipient.user_id == current_user.user_id)\
        .order_by(desc(Announcement.date_sent))
    
    # Get feedback for this user's application files
    feedback_query = []
    if organization and application:
        # Get all application files for this organization's application
        app_files = ApplicationFile.query.filter_by(application_id=application.application_id).all()
        app_file_ids = [file.app_file_id for file in app_files]
        
        # Get feedback for these files
        if app_file_ids:
            feedback_query = Feedback.query\
                .filter(Feedback.app_file_id.in_(app_file_ids))\
                .order_by(desc(Feedback.date_sent))\
                .all()
    
    # Combine announcements and feedback into a single notifications list
    notifications = []
    
    # Process announcements and mark them as read
    for announcement, recipient in announcements_query:
        time_diff = datetime.utcnow() - announcement.date_sent
        
        if time_diff.days > 0:
            if time_diff.days == 1:
                time_str = "1 day ago"
            else:
                time_str = f"{time_diff.days} days ago"
        elif time_diff.seconds >= 3600:
            hours = time_diff.seconds // 3600
            if hours == 1:
                time_str = "1 hour ago"
            else:
                time_str = f"{hours} hours ago"
        elif time_diff.seconds >= 60:
            minutes = time_diff.seconds // 60
            if minutes == 1:
                time_str = "1 minute ago"
            else:
                time_str = f"{minutes} minutes ago"
        else:
            time_str = "Just now"
        
        notifications.append({
            'type': 'announcement',
            'subject': announcement.subject,
            'message': announcement.message,
            'time': time_str,
            'date_sent': announcement.date_sent,
            'is_read': recipient.is_read,
            'id': recipient.user_id
        })
        
        # Mark announcement as read if it's not already
        if not recipient.is_read:
            recipient.is_read = True
            db.session.add(recipient)
    
    # Process feedback and mark them as read
    for feedback in feedback_query:
        time_diff = datetime.utcnow() - feedback.date_sent
        
        if time_diff.days > 0:
            if time_diff.days == 1:
                time_str = "1 day ago"
            else:
                time_str = f"{time_diff.days} days ago"
        elif time_diff.seconds >= 3600:
            hours = time_diff.seconds // 3600
            if hours == 1:
                time_str = "1 hour ago"
            else:
                time_str = f"{hours} hours ago"
        elif time_diff.seconds >= 60:
            minutes = time_diff.seconds // 60
            if minutes == 1:
                time_str = "1 minute ago"
            else:
                time_str = f"{minutes} minutes ago"
        else:
            time_str = "Just now"
        
        file_name = "Unknown File"
        if feedback.application_file:
            file_name = feedback.application_file.file_name
        
        notifications.append({
            'type': 'feedback',
            'subject': feedback.subject,
            'message': feedback.message,
            'time': time_str,
            'date_sent': feedback.date_sent,
            'is_read': feedback.is_read,
            'file_name': file_name,
            'id': feedback.feedback_id
        })
        
        # Mark feedback as read if it's not already
        if not feedback.is_read:
            feedback.is_read = True
            db.session.add(feedback)
    
    # Commit changes to database if any notifications were marked as read
    if db.session.dirty:
        db.session.commit()
    
    # Sort notifications by date_sent (newest first)
    notifications.sort(key=lambda x: x['date_sent'], reverse=True)
    
    # current_user is provided by Flask-Login
    return render_template('user/notifications.html', user=current_user, organization=organization, application=application, active_page='notifications', notifications=notifications)

@user_routes_bp.route('/blockmanageaccess')
@login_required
def blockmanageaccess():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        # User doesn't have an organization, redirect to first step
        return redirect(url_for('application_first_step.first_step'))
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    
    # Check if application is verified
    if application and application.status == 'Verified':
        # Application is verified, redirect to manage organization page
        return redirect(url_for('user_routes.manageorganization'))
    
    # current_user is provided by Flask-Login
    return render_template('user/blockmanageaccess.html', user=current_user, organization=organization, application=application, active_page='manageorganization')

@user_routes_bp.route('/documentcompilation')
@login_required
def documentcompilation():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id, get_available_academic_years, get_application_by_organization_and_academic_year
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        flash("No organization found for this user", "error")
        return redirect(url_for('user_organization.applicationfirststep'))
    
    # Get selected academic year from query parameter
    selected_academic_year = request.args.get('academic_year')
    
    # Get available academic years
    available_years = get_available_academic_years(organization.organization_id)
    
    # If no academic year selected, use the current one
    if not selected_academic_year and available_years:
        selected_academic_year = available_years[0]  # Most recent year
    
    # Get application for the selected academic year
    application = None
    application_files = []
    
    if selected_academic_year:
        # Try to get application for the selected academic year (any type)
        application = get_application_by_organization_and_academic_year(organization.organization_id, selected_academic_year)
        
        if application:
            # Get all files for this application
            application_files = ApplicationFile.query.filter_by(application_id=application.application_id).all()
            
            # Define the expected file order based on application type
            if application.type == 'New':
                file_order = [
                    'Form 1A - APPLICATION FOR RECOGNITION',
                    'Form 2 - LETTER OF ACCEPTANCE',
                    'Form 3 - LIST OF PROGRAMS/PROJECTS/ ACTIVITIES',
                    'Form 4 - LIST OF MEMBERS',
                    'BOARD OF OFFICERS',
                    'CONSTITUTION AND BYLAWS',
                    'LOGO WITH EXPLANATION'
                ]
            else:  # Renewal application
                file_order = [
                    'Form 1B - APPLICATION FOR RENEWAL OF RECOGNITION',
                    'Form 2 - LETTER OF ACCEPTANCE',
                    'Form 3 - LIST OF PROGRAMS/PROJECTS/ ACTIVITIES',
                    'Form 4 - LIST OF MEMBERS',
                    'BOARD OF OFFICERS',
                    'UPDATED CONSTITUTION AND BYLAWS',
                    'ACCOMPLISHMENT REPORT AND DOCUMENTATION',
                    'FINANCIAL STATEMENT OF THE PREVIOUS ACADEMIC YEAR',
                    'LOGO WITH EXPLANATION'
                ]
            
            # Sort files according to the predefined order
            def get_file_order_index(filename):
                try:
                    # Check for partial matches in case filenames aren't exact
                    for i, expected_file in enumerate(file_order):
                        if expected_file.lower() in filename.lower():
                            return i
                    return len(file_order)  # Files not in the sequence go to the end
                except ValueError:
                    # If file is not in the predefined order, put it at the end
                    return len(file_order)
            
            application_files.sort(key=lambda x: get_file_order_index(x.file_name))
    
    # If no application found for selected year, fall back to the main 'New' application for navigation purposes
    if not application:
        application = get_application_by_organization_id(organization.organization_id, 'New')
        if not application:
            flash("No application found for this organization", "error")
            return redirect(url_for('user_organization.applicationfirststep'))
    
    # current_user is provided by Flask-Login
    return render_template('user/documentcompilation.html', 
                         user=current_user, 
                         organization=organization, 
                         application=application, 
                         application_files=application_files,
                         available_years=available_years,
                         selected_academic_year=selected_academic_year,
                         active_page='documentcompilation')

@user_routes_bp.route('/manageorganization')
@login_required
def manageorganization():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import (
        get_organization_by_user_id, 
        get_application_by_organization_id,
        get_adviser_by_organization_id,
        get_social_media_by_organization_id,
        get_affiliations_by_position_type,
        get_organization_statistics,
        get_plans_by_organization_id,
        get_available_academic_years
    )
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        # User doesn't have an organization, redirect to first step
        return redirect(url_for('user_organization.applicationfirststep'))
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    
    # Check if application is verified
    if not application or application.status != 'Verified':
        # Application is not verified, redirect to block access page
        return redirect(url_for('user_routes.blockmanageaccess'))
    
    # Get selected academic year from query parameter
    selected_academic_year = request.args.get('academic_year')
    
    # Get available academic years
    available_years = get_available_academic_years(organization.organization_id)
    
    # If no academic year selected, use the current one
    if not selected_academic_year and available_years:
        selected_academic_year = available_years[0]  # Most recent year
    
    # Get adviser information
    adviser = get_adviser_by_organization_id(organization.organization_id, adviser_type='Adviser')
    
    # Get co-adviser information
    coadviser = get_adviser_by_organization_id(organization.organization_id, adviser_type='Co-Adviser')
    
    # Get social media links
    social_media = get_social_media_by_organization_id(organization.organization_id)
    
    # Get officers, members, and volunteers for the selected academic year
    officers = get_affiliations_by_position_type(organization.organization_id, 'Officer', selected_academic_year)
    members = get_affiliations_by_position_type(organization.organization_id, 'Member', selected_academic_year)
    volunteers = get_affiliations_by_position_type(organization.organization_id, 'Volunteer', selected_academic_year)
    
    # Get organization statistics for the selected academic year
    statistics = get_organization_statistics(organization.organization_id, selected_academic_year)
    
    # Get plans data for the selected academic year
    plans = get_plans_by_organization_id(organization.organization_id, selected_academic_year)
    
    # Determine if the selected year is the current academic year (editable)
    is_current_year = (selected_academic_year == organization.current_academic_year)
    
    return render_template(
        'user/manageorganization.html', 
        user=current_user, 
        organization=organization, 
        application=application, 
        adviser=adviser,
        coadviser=coadviser,
        social_media=social_media,
        officers=officers,
        members=members,
        volunteers=volunteers,
        statistics=statistics,
        plans=plans,
        available_years=available_years,
        selected_academic_year=selected_academic_year,
        is_current_year=is_current_year,
        active_page='manageorganization'
    )

@user_routes_bp.route('/renewal-confirmation')
@login_required
def renewal_confirmation():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    from app.models import Application
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        # User doesn't have an organization, redirect to first step
        return redirect(url_for('user_organization.applicationfirststep'))
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    
    # Check if application is verified
    if not application or application.status != 'Verified':
        # Application is not verified, redirect to block access page
        return redirect(url_for('user_routes.blockmanageaccess'))
    
    # Generate academic year (e.g., "2025-2026")
    current_year = datetime.now().year
    academic_year = f"{current_year}-{current_year + 1}"
    
    # Check if a renewal application for this academic year already exists
    existing_renewal = Application.query.filter_by(
        organization_id=organization.organization_id,
        type='Renewal',
        academic_year=academic_year
    ).first()
    
    if existing_renewal:
        flash(f"A renewal application for Academic Year {academic_year} already exists", "warning")
        return redirect(url_for('user_routes.userrenewal'))
    
    # Render the renewal confirmation page
    return render_template('user/renewalconfirmation.html', user=current_user, organization=organization, application=application, active_page='userrenewal')

@user_routes_bp.route('/create-renewal', methods=['POST'])
@login_required
def create_renewal():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    from app.models import Application
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        # User doesn't have an organization, redirect to first step
        flash("No organization found for this user", "error")
        return redirect(url_for('application_first_step.first_step'))
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    
    # Check if application is verified
    if not application or application.status != 'Verified':
        # Application is not verified, redirect to block access page
        flash("Your organization must be verified before you can renew", "error")
        return redirect(url_for('user_routes.blockmanageaccess'))
    
    # Generate academic year (e.g., "2025-2026")
    current_year = datetime.now().year
    academic_year = f"{current_year}-{current_year + 1}"
    
    # Check if a renewal application for this academic year already exists
    existing_renewal = Application.query.filter_by(
        organization_id=organization.organization_id,
        type='Renewal',
        academic_year=academic_year
    ).first()
    
    if existing_renewal:
        flash(f"A renewal application for Academic Year {academic_year} already exists", "warning")
        return redirect(url_for('user_routes.userrenewal'))
    
    # Create a new renewal application
    new_application = Application(
        organization_id=organization.organization_id,
        type='Renewal',
        academic_year=academic_year,
        status='Incomplete'
        # submission_date will be set when all required files are uploaded
    )
    
    try:
        # Add the new application
        db.session.add(new_application)
        
        # Update the organization's current academic year
        organization.current_academic_year = academic_year
        organization.last_renewal_date = datetime.now()
        
        # Clear current academic year data (but don't delete - just mark as previous year)
        # Note: The data is preserved with their academic_year field, so it can be viewed later
        # No need to delete anything - the academic year filtering will handle showing current vs past data
        
        db.session.commit()
        flash(f"Renewal application for Academic Year {academic_year} has been created successfully. Previous year data has been preserved and can be viewed using the Academic Year selector.", "success")
        return redirect(url_for('user_routes.userrenewal'))
    except Exception as e:
        db.session.rollback()
        flash(f"Error creating renewal application: {str(e)}", "error")
        return redirect(url_for('user_routes.userrenewal'))

@user_routes_bp.route('/logo/<int:logo_id>')
def get_logo(logo_id):
    # Import the service module here to avoid circular imports
    from app.organization_service import get_logo_by_id
    
    logo = get_logo_by_id(logo_id)
    if not logo:
        abort(404)
    
    return send_file(
        io.BytesIO(logo.logo),
        mimetype='image/jpeg',
        as_attachment=False,
        download_name=f'logo_{logo_id}.jpg'
    )

@user_routes_bp.route('/update-name', methods=['POST'])
@login_required
def update_name():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
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

@user_routes_bp.route('/update-email', methods=['POST'])
@login_required
def update_email():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        new_email = data.get('email', '').strip().lower()
        current_password = data.get('current_password', '').strip()
        
        # Validation
        if not new_email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400
        
        if not current_password:
            return jsonify({'success': False, 'message': 'Current password is required for email change'}), 400
        
        # Basic email validation
        if '@' not in new_email or '.' not in new_email.split('@')[1]:
            return jsonify({'success': False, 'message': 'Invalid email format'}), 400
        
        # Verify current password
        from app.models import User, EntryKey
        entrykey_record = EntryKey.query.filter_by(user_id=current_user.user_id).first()
        if not entrykey_record or not entrykey_record.check_entrykey(current_password):
            return jsonify({'success': False, 'message': 'Current password is incorrect'}), 400
        
        # Check if email already exists (excluding current user)
        existing_user = User.query.filter(User.email == new_email, User.user_id != current_user.user_id).first()
        if existing_user:
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
        
        # Generate secure token
        import secrets
        import hashlib
        from datetime import datetime, timedelta
        
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        expiry_time = datetime.utcnow() + timedelta(minutes=15)
        
        # Store verification data in session with permanent flag
        session.permanent = True
        session['user_email_change_token'] = token_hash
        session['user_email_change_new_email'] = new_email
        session['user_email_change_old_email'] = current_user.email
        session['user_email_change_expiry'] = expiry_time.isoformat()
        session['user_email_change_user_id'] = current_user.user_id
        
        # Debug: Log session creation (remove in production)
        print(f"Created email change session for user {current_user.user_id}")
        
        # Send verification email with link
        from flask_mail import Message
        from app import mail
        from flask import url_for
        
        verification_url = url_for('user_routes.confirm_email_change', token=token, _external=True)
        
        msg = Message(
            'Confirm Your Email Change - NPSOMS',
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@yourdomain.com'),
            recipients=[new_email]
        )
        msg.html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50;">Email Change Verification</h2>
                <p>Hello {current_user.first_name},</p>
                <p>You have requested to change your email address from <strong>{current_user.email}</strong> to <strong>{new_email}</strong>.</p>
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
                    NPSOMS Team
                </p>
            </div>
        </body>
        </html>
        '''
        
        mail.send(msg)
        
        # Send notification to old email
        old_email_msg = Message(
            'Email Change Request Notification - NPSOMS',
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@yourdomain.com'),
            recipients=[current_user.email]
        )
        old_email_msg.html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #e74c3c;">Email Change Request</h2>
                <p>Hello {current_user.first_name},</p>
                <p>We received a request to change your email address from <strong>{current_user.email}</strong> to <strong>{new_email}</strong>.</p>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>⚠️ Security Notice:</strong></p>
                    <p style="margin: 5px 0 0 0;">If you did not request this change, please contact the system administrator immediately.</p>
                </div>
                <p>The change will only take effect if the verification link sent to the new email address is clicked within 15 minutes.</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #666;">
                    Best regards,<br>
                    NPSOMS Team<br>
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

@user_routes_bp.route('/confirm-email-change/<token>')
def confirm_email_change(token):
    try:
        import hashlib
        from datetime import datetime
        
        # Hash the provided token
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
        # Debug: Log token verification attempt (remove in production)
        print(f"Verifying email change token: {token_hash[:16]}...")
        
        # Check session for verification data
        stored_token_hash = session.get('user_email_change_token')
        new_email = session.get('user_email_change_new_email')
        old_email = session.get('user_email_change_old_email')
        expiry_str = session.get('user_email_change_expiry')
        user_id = session.get('user_email_change_user_id')
        
        if not all([stored_token_hash, new_email, old_email, expiry_str, user_id]):
            return render_template('user/email_verification_result.html', 
                                 success=False, 
                                 message="Verification session not found or has expired. This could happen if you opened the link in a different browser, or if too much time has passed. Please request a new email change from your account page.")
        
        # Check if token matches
        if token_hash != stored_token_hash:
            return render_template('user/email_verification_result.html', 
                                 success=False, 
                                 message="Invalid verification link. Please request a new email change from your account page.")
        
        # Check if token has expired
        expiry_time = datetime.fromisoformat(expiry_str)
        if datetime.utcnow() > expiry_time:
            # Clear expired session data
            session.pop('user_email_change_token', None)
            session.pop('user_email_change_new_email', None)
            session.pop('user_email_change_old_email', None)
            session.pop('user_email_change_expiry', None)
            session.pop('user_email_change_user_id', None)
            return render_template('user/email_verification_result.html', 
                                 success=False, 
                                 message="Verification link has expired. Please request a new email change from your account page.")
        
        # Update the user's email
        from app.models import User
        user = User.query.get(user_id)
        if not user:
            return render_template('user/email_verification_result.html', 
                                 success=False, 
                                 message="User not found. Please contact the administrator.")
        
        user.email = new_email
        db.session.commit()
        
        # Clear verification session data
        session.pop('user_email_change_token', None)
        session.pop('user_email_change_new_email', None)
        session.pop('user_email_change_old_email', None)
        session.pop('user_email_change_expiry', None)
        session.pop('user_email_change_user_id', None)
        
        # Log out the user for security after email change
        from flask_login import logout_user
        logout_user()
        
        # Debug: Log successful email change (remove in production)
        print(f"Email successfully changed for user {user_id} from {old_email} to {new_email}")
        
        return render_template('user/email_verification_result.html', 
                             success=True, 
                             message=f"Your email has been successfully changed from {old_email} to {new_email}. For security reasons, you have been logged out. Please log in again with your new email address.",
                             new_email=new_email,
                             logged_out=True)
        
    except Exception as e:
        print(f"Error in confirm_email_change: {str(e)}")
        return render_template('user/email_verification_result.html', 
                             success=False, 
                             message="An error occurred while processing your request. Please try again or contact the administrator.")

@user_routes_bp.route('/update-password', methods=['POST'])
@login_required
def update_password():
    try:
        data = request.get_json()
        
        # Check if user has permission (roles 2 and 3)
        if current_user.role_id not in [2, 3]:
            return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
        
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