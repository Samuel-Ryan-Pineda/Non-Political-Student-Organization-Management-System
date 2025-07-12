from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, abort, session
from flask_login import login_required, current_user, logout_user
from app.models import db, Logo, Application, ApplicationFile
from datetime import datetime
from werkzeug.utils import secure_filename
import io

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
        application = get_application_by_organization_id(organization.organization_id)
    
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
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    # Get application associated with the organization
    application = None
    if organization:
        application = get_application_by_organization_id(organization.organization_id)
    
    # current_user is provided by Flask-Login
    return render_template('user/userrenewal.html', user=current_user, organization=organization, application=application, active_page='userrenewal')

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
        application = get_application_by_organization_id(organization.organization_id)
    
    # current_user is provided by Flask-Login
    return render_template('user/userreport.html', user=current_user, organization=organization, application=application, active_page='userreport')

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
        return redirect(url_for('user_organization.applicationfirststep'))
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id)
    
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
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    # Get application associated with the organization
    application = None
    if organization:
        application = get_application_by_organization_id(organization.organization_id)
    
    # current_user is provided by Flask-Login
    return render_template('user/documentcompilation.html', user=current_user, organization=organization, application=application, active_page='documentcompilation')

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
        get_social_media_by_organization_id
    )
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        # User doesn't have an organization, redirect to first step
        return redirect(url_for('user_organization.applicationfirststep'))
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id)
    
    # Check if application is verified
    if not application or application.status != 'Verified':
        # Application is not verified, redirect to block access page
        return redirect(url_for('user_routes.blockmanageaccess'))
    
    # Get adviser information
    adviser = get_adviser_by_organization_id(organization.organization_id)
    
    # Get social media links
    social_media = get_social_media_by_organization_id(organization.organization_id)
    
    # Initialize student_nos with sample data
    student_nos = ['2023-0001', '2023-0002', '2023-0003']
    names = ['John Doe', 'Jane Smith', 'Bob Johnson']
    
    return render_template(
        'user/manageorganization.html', 
        user=current_user, 
        organization=organization, 
        application=application, 
        adviser=adviser,
        social_media=social_media,
        student_nos=student_nos, 
        names=names, 
        active_page='manageorganization'
    )

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