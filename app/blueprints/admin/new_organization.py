from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app.models import db, ApplicationFile, Application
from datetime import datetime

admin_new_organization_bp = Blueprint('admin_new_organization', __name__)

def check_and_update_application_status(application_id):
    """Helper function to check and update application status"""
    try:
        # Get the application
        application = Application.query.get(application_id)
        if not application:
            return
        
        # Define the required files for a complete application
        required_files = [
            'Form 1A -APPLICATION FOR RECOGNITION',
            'Form 2 - LETTER OF ACCEPTANCE',
            'Form 3 - LIST OF PROGRAMS/PROJECTS/ ACTIVITIES',
            'Form 4 - LIST OF MEMBERS',
            'BOARD OF OFFICERS',
            'CONSTITUTION AND BYLAWS',
            'LOGO WITH EXPLANATION'
        ]
        
        # Get all files for this application
        application_files = ApplicationFile.query.filter_by(application_id=application_id).all()
        
        # Create a set of uploaded file names for easy checking
        uploaded_file_names = {file.file_name for file in application_files}
        
        # Check if all required files are uploaded
        all_files_uploaded = all(required_file in uploaded_file_names for required_file in required_files)
        
        # Check if all files are verified
        all_files_verified = all(file.status == 'Verified' for file in application_files) if application_files else False
        
        # Update application status based on conditions
        if application.status.lower() == 'incomplete' and all_files_uploaded:
            application.status = 'Pending'
            # Update the submission_date to the current date and time
            application.submission_date = datetime.now()
            db.session.commit()
        elif application.status.lower() == 'pending' and all_files_uploaded and all_files_verified:
            application.status = 'Verified'
            db.session.commit()
    except Exception as e:
        # Log the error but don't disrupt the file upload process
        print(f"Error checking application status: {str(e)}")
        db.session.rollback()

@admin_new_organization_bp.route('/neworganization')
@login_required
def neworganization():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_pending_applications
    
    # Get all pending applications
    pending_applications = get_pending_applications()
    
    return render_template('admin/neworganization.html', 
                           user=current_user, 
                           active_page='neworganization',
                           pending_applications=pending_applications)

@admin_new_organization_bp.route('/neworganizationfiles')
@login_required
def neworganizationfiles():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Get application_id from query parameters
    application_id = request.args.get('application_id')
    
    if not application_id:
        flash("No application specified", "error")
        return redirect(url_for('admin_new_organization.neworganization'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_application_by_id, get_organization_by_id
    
    # Get application and organization details
    application = get_application_by_id(application_id)
    
    if not application:
        flash("Application not found", "error")
        return redirect(url_for('admin_new_organization.neworganization'))
    
    organization = get_organization_by_id(application.organization_id)
    
    # Get application files and order them according to the specified sequence
    file_order = {
        'form 1a': 1,
        'form 2': 2,
        'form 3': 3,
        'form 4': 4,
        'board of officers': 5,
        'constitution and bylaws': 6,
        'c&b': 6,  # Alternate name
        'logo with explanation': 7,
        'logo with exp': 7  # Alternate name
    }
    
    def get_file_order(file_name):
        file_name_lower = file_name.lower()
        for key, order in file_order.items():
            if key in file_name_lower:
                return order
        return 999  # Files not in the sequence go to the end
    
    application_files = ApplicationFile.query.filter_by(application_id=application_id).all()
    application_files.sort(key=lambda x: get_file_order(x.file_name))
    
    return render_template('admin/neworganizationfiles.html', 
                           user=current_user, 
                           active_page='neworganization',
                           application=application,
                           organization=organization,
                           application_files=application_files)

@admin_new_organization_bp.route('/update-file-status', methods=['POST'])
@login_required
def update_file_status():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': "You don't have permission to update file status"})
    
    # Log request information for debugging
    print(f"Request Content-Type: {request.content_type}")
    print(f"Request method: {request.method}")
    print(f"Request form data: {request.form}")
    print(f"Request JSON: {request.get_json(silent=True)}")
    
    # Handle both FormData and JSON requests
    if request.is_json:
        data = request.json
        file_id = data.get('file_id')
        new_status = data.get('status')
    else:
        file_id = request.form.get('file_id')
        new_status = request.form.get('status')
    
    print(f"Extracted file_id: {file_id}, new_status: {new_status}")
    
    if not file_id or not new_status:
        return jsonify({'success': False, 'message': 'File ID and status are required'})
    
    try:
        # Get the application file
        app_file = ApplicationFile.query.get(file_id)
        if not app_file:
            return jsonify({'success': False, 'message': 'File not found'})
        
        # Update the status
        app_file.status = new_status
        db.session.commit()
        
        # Check and update application status
        check_and_update_application_status(app_file.application_id)
        
        return jsonify({
            'success': True,
            'message': 'File status updated successfully',
            'new_status': new_status
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating file status: {str(e)}'
        })