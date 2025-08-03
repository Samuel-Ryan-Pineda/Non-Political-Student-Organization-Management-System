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
        return redirect(url_for('application_first_step.first_step'))
    
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
    application = get_application_by_organization_id(organization.organization_id)
    
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
    application = get_application_by_organization_id(organization.organization_id)
    
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
    application = get_application_by_organization_id(organization.organization_id)
    
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