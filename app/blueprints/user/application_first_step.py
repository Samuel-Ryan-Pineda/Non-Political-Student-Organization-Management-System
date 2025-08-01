from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import current_user, login_required
from app.models import db, ApplicationFile
from datetime import datetime
from werkzeug.utils import secure_filename

application_first_step_bp = Blueprint('application_first_step', __name__, url_prefix='/application')

@application_first_step_bp.route('/first-step', methods=['GET', 'POST'])
@login_required
def first_step():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import save_organization_application, user_has_organization
    
    # Check if user already has an organization
    if user_has_organization(current_user.user_id):
        flash("You already have an organization registered", "info")
        return redirect(url_for('user_organization.application'))
    
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
            return redirect(url_for('user_organization.application'))
        else:
            flash(message, "error")
            return render_template('user/applicationfirststep.html', active_page='application')
    
    return render_template('user/applicationfirststep.html', active_page='application')