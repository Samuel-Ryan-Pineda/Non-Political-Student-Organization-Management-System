from flask import Blueprint, render_template, redirect, url_for, flash, request, current_app, send_file, abort
from flask_login import login_required, current_user, logout_user
from app import db
from app.models import User, EntryKey, Role
import os
import io

main_bp = Blueprint('main', __name__)

@main_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role_id == 1:  
        return redirect(url_for('main.admin_dashboard'))
    elif current_user.role_id in [2, 3]: 
        return redirect(url_for('main.org_dashboard'))
    else:
        flash("Unknown user role", "error")
        return redirect(url_for('auth.logout'))

@main_bp.route('/admin/dashboard')
@login_required
def admin_dashboard():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    return render_template('admin/organization.html', active_page='organization')

@main_bp.route('/org/dashboard')
@login_required
def org_dashboard():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import user_has_organization
    
    # Check if user already has an organization
    if user_has_organization(current_user.user_id):
        # User has an organization, show the application page
        return redirect(url_for('main.application'))
    else:
        # User doesn't have an organization, show the first step form
        return render_template('user/applicationfirststep.html', active_page='application')

@main_bp.route('/neworganization')
@login_required
def neworganization():
    # current_user is provided by Flask-Login
    return render_template('admin/neworganization.html', user=current_user, active_page='neworganization')

@main_bp.route('/member')
@login_required
def member():
    # current_user is provided by Flask-Login
    return render_template('admin/member.html', user=current_user, active_page='member')


@main_bp.route('/neworganizationfiles')
@login_required
def neworganizationfiles():
    # current_user is provided by Flask-Login
    return render_template('admin/neworganizationfiles.html', user=current_user, active_page='neworganization')

@main_bp.route('/renewal')
@login_required
def renewal():
    # current_user is provided by Flask-Login
    return render_template('admin/renewal.html', user=current_user, active_page='renewal')

@main_bp.route('/organizationrenewals')
@login_required
def organizationrenewals():
    # current_user is provided by Flask-Login
    return render_template('admin/organizationrenewals.html', user=current_user, active_page='renewal')

@main_bp.route('/organization')
@login_required
def organization():
    # current_user is provided by Flask-Login
    return render_template('admin/organization.html', user=current_user, active_page='organization')

@main_bp.route('/organizationdetails')
@login_required
def organizationdetails():
    # current_user is provided by Flask-Login
    return render_template('admin/organizationdetails.html', user=current_user, active_page='organization')

@main_bp.route('/announcement')
@login_required
def analytics():
    # current_user is provided by Flask-Login
    return render_template('admin/announcement.html', user=current_user, active_page='announcement')

@main_bp.route('/reports')
@login_required
def schedules():
    # current_user is provided by Flask-Login
    return render_template('admin/reports.html', user=current_user, active_page='reports')

@main_bp.route('/organizationreports')
@login_required
def organizationreports():
    # current_user is provided by Flask-Login
    return render_template('admin/organizationreports.html', user=current_user, active_page='reports')

@main_bp.route('/adminaccount')
@login_required
def adminaccount():
    # current_user is provided by Flask-Login
    return render_template('admin/adminaccount.html', user=current_user, active_page='adminaccount')

@main_bp.route('/useraccount')
@login_required
def useraccount():
    # current_user is provided by Flask-Login
    return render_template('user/useraccount.html', user=current_user, active_page='useraccount')

@main_bp.route('/userrenewal')
@login_required
def userrenewal():
    # current_user is provided by Flask-Login
    return render_template('user/userrenewal.html', user=current_user, active_page='userrenewal')

@main_bp.route('/userreport')
@login_required
def userreport():
    # current_user is provided by Flask-Login
    return render_template('user/userreport.html', user=current_user, active_page='userreport')

@main_bp.route('/blockmanageaccess')
@login_required
def blockmanageaccess():
    # current_user is provided by Flask-Login
    return render_template('user/blockmanageaccess.html', user=current_user, active_page='manageorganization')

@main_bp.route('/documentcompilation')
@login_required
def documentcompilation():
    # current_user is provided by Flask-Login
    return render_template('user/documentcompilation.html', user=current_user, active_page='documentcompilation')


# ✅ Login Route (Updated for Flask-Login)
@main_bp.route('/manageorganization')
@login_required
def manageorganization():
    # Initialize student_nos with sample data
    student_nos = ['2023-0001', '2023-0002', '2023-0003']
    names = ['John Doe', 'Jane Smith', 'Bob Johnson']
    return render_template('user/manageorganization.html', student_nos=student_nos, names=names, active_page='manageorganization')


@main_bp.route('/application')
@login_required
def application():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        # User doesn't have an organization, redirect to first step
        return redirect(url_for('main.applicationfirststep'))
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id)
    
    return render_template('user/application.html', 
                           user=current_user, 
                           organization=organization,
                           application=application,
                           active_page='application')

# ✅ Logout Route (Updated for Flask-Login)
@main_bp.route('/logout')
@login_required
def logout():
    logout_user()  # Flask-Login's logout function
    flash("You have been logged out.", "info")
    return redirect(url_for('login'))

@main_bp.route('/logo/<int:logo_id>')
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

@main_bp.route('/applicationfirststep', methods=['GET', 'POST'])
@login_required
def applicationfirststep():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import save_organization_application, user_has_organization
    
    # Check if user already has an organization
    if user_has_organization(current_user.user_id):
        flash("You already have an organization registered", "info")
        return redirect(url_for('main.application'))
    
    if request.method == 'POST':
        # Get form data
        org_name = request.form.get('orgName')
        org_type = request.form.get('orgType')
        logo_description = request.form.get('logoDescription')
        logo_file = request.files.get('logo')
        
        # Save organization application data
        success, message, application_id = save_organization_application(
            org_name, 
            org_type, 
            logo_file, 
            logo_description, 
            current_user.user_id
        )
        
        if success:
            flash(message, "success")
            return redirect(url_for('main.application'))
        else:
            flash(message, "error")
            return render_template('user/applicationfirststep.html', active_page='application')
    
    return render_template('user/applicationfirststep.html', active_page='application')