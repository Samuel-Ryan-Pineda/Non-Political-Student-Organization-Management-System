from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app.models import Application, ApplicationFile, Organization, Feedback
from app import db
from app.organization_service import get_pending_renewal_applications, get_application_by_id, get_organization_by_id

# Create blueprint
organization_renewal_bp = Blueprint('organization_renewal', __name__)

@organization_renewal_bp.route('/renewal')
@login_required
def renewal():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Get all pending renewal applications
    pending_renewals = get_pending_renewal_applications()
    
    # current_user is provided by Flask-Login
    return render_template('admin/renewal.html', user=current_user, active_page='renewal', pending_renewals=pending_renewals)

@organization_renewal_bp.route('/organizationrenewals/<int:application_id>')
@login_required
def organizationrenewals(application_id):
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Get application details
    application = get_application_by_id(application_id)
    if not application:
        flash("Application not found", "error")
        return redirect(url_for('organization_renewal.renewal'))
    
    # Get organization details
    organization = get_organization_by_id(application.organization_id)
    if not organization:
        flash("Organization not found", "error")
        return redirect(url_for('organization_renewal.renewal'))
    
    # Get application files with related file information
    application_files = db.session.query(ApplicationFile, db.func.count(db.case((ApplicationFile.status == 'Pending', 1))).label('feedback_count')) \
        .outerjoin(Feedback, ApplicationFile.app_file_id == Feedback.app_file_id) \
        .filter(ApplicationFile.application_id == application_id) \
        .group_by(ApplicationFile.app_file_id) \
        .all()
    
    # Format application files for template
    files = []
    for file, feedback_count in application_files:

        
        files.append({
            "app_file_id": file.app_file_id,
            "file_id": file.app_file_id,
            "filename": file.file_name,
            "upload_date": file.submission_date,

            "status": file.status,
            "feedback_count": feedback_count
        })
    
    # Get sent and received feedback for this application
    # This is a placeholder - implement actual feedback retrieval logic
    sent_feedback = []
    received_feedback = []
    
    # current_user is provided by Flask-Login
    return render_template('admin/organizationrenewals.html', 
                           user=current_user, 
                           active_page='renewal', 
                           application=application, 
                           organization=organization,
                           files=files,
                           sent_feedback=sent_feedback,
                           received_feedback=received_feedback)