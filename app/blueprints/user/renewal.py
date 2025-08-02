from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, abort
from flask_login import login_required, current_user
from app.models import db, Application, ApplicationFile
from datetime import datetime
from werkzeug.utils import secure_filename
import io
import os

# Create the blueprint with the correct name
user_renewal_bp = Blueprint('user_renewal', __name__)

def allowed_file(filename, allowed_extensions):
    """Check if the file has an allowed extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@user_renewal_bp.route('/upload-renewal-file', methods=['POST'])
@login_required
def upload_renewal_file():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to upload files"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get renewal application for the organization
    # Generate academic year (e.g., "2025-2026")
    current_year = datetime.now().year
    academic_year = f"{current_year}-{current_year + 1}"
    
    # Find the renewal application for this academic year
    renewal_application = Application.query.filter_by(
        organization_id=organization.organization_id,
        type='Renewal',
        academic_year=academic_year
    ).first()
    
    if not renewal_application:
        return jsonify({'success': False, 'message': "No renewal application found for this organization"})
    
    # Check if file was included in the request
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': "No file part in the request"})
    
    file = request.files['file']
    
    # Check if a file was selected
    if file.filename == '':
        return jsonify({'success': False, 'message': "No file selected"})
    
    # Get the file type from the form
    file_type = request.form.get('fileType')
    if not file_type:
        return jsonify({'success': False, 'message': "File type not specified"})
    
    # Check if the file type is allowed (PDF only)
    if not allowed_file(file.filename, ['pdf']):
        return jsonify({'success': False, 'message': "File type not allowed. Please upload PDF documents only."})
    
    try:
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Read the file data
        file_data = file.read()
        
        # Check if a file with this type already exists for this application
        existing_file = ApplicationFile.query.filter_by(
            application_id=renewal_application.application_id,
            file_name=file_type
        ).first()
        
        if existing_file:
            # Update existing file
            existing_file.file = file_data
            existing_file.status = "Pending"
            existing_file.submission_date = datetime.utcnow()  # Reset submission date on update
            db.session.commit()
            
            # Check if all required files are uploaded and update application status if needed
            check_and_update_renewal_status(renewal_application.application_id)
            
            return jsonify({
                'success': True, 
                'message': f"{file_type} updated successfully",
                'filename': filename,
                'fileType': file_type,
                'status': "Pending",
                'file_id': existing_file.app_file_id,
                'submission_date': existing_file.submission_date.strftime('%Y-%m-%d %H:%M:%S')
            })
        else:
            # Create new application file
            new_file = ApplicationFile(
                application_id=renewal_application.application_id,
                file_name=file_type,
                file=file_data,
                status="Pending"
            )
            db.session.add(new_file)
            db.session.commit()
            
            # Check if all required files are uploaded and update application status if needed
            check_and_update_renewal_status(renewal_application.application_id)
            
            return jsonify({
                'success': True, 
                'message': f"{file_type} uploaded successfully",
                'filename': filename,
                'fileType': file_type,
                'status': "Pending",
                'file_id': new_file.app_file_id,
                'submission_date': new_file.submission_date.strftime('%Y-%m-%d %H:%M:%S')
            })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"An error occurred: {str(e)}"})

def check_and_update_renewal_status(application_id):
    """
    Check renewal application files and update status:
    - 'Incomplete' to 'Pending' when all required files are uploaded
    - 'Pending' to 'Verified' when all files are verified
    Also updates the submission_date when status changes to 'Pending'
    
    Args:
        application_id (int): ID of the renewal application to check
    """
    try:
        # Get the application
        application = Application.query.get(application_id)
        if not application:
            return
        
        # Define the required files for a complete renewal application
        required_files = [
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
        print(f"Error checking renewal application status: {str(e)}")
        db.session.rollback()

@user_renewal_bp.route('/get-renewal-files')
@login_required
def get_renewal_files():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access files"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Generate academic year (e.g., "2025-2026")
    current_year = datetime.now().year
    academic_year = f"{current_year}-{current_year + 1}"
    
    # Find the renewal application for this academic year
    renewal_application = Application.query.filter_by(
        organization_id=organization.organization_id,
        type='Renewal',
        academic_year=academic_year
    ).first()
    
    if not renewal_application:
        return jsonify({'success': False, 'message': "No renewal application found for this organization"})
    
    # Get all files for this application
    files = ApplicationFile.query.filter_by(application_id=renewal_application.application_id).all()
    
    # Format the response
    file_list = [{
        'id': f.app_file_id,
        'name': f.file_name,
        'status': f.status,
        'submission_date': f.submission_date.strftime('%Y-%m-%d %H:%M:%S') if f.submission_date else None
    } for f in files]
    
    return jsonify({'success': True, 'files': file_list})

@user_renewal_bp.route('/get-renewal-feedback')
@login_required
def get_renewal_feedback():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access feedback"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    from app.models import Feedback
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Generate academic year (e.g., "2025-2026")
    current_year = datetime.now().year
    academic_year = f"{current_year}-{current_year + 1}"
    
    # Find the renewal application for this academic year
    renewal_application = Application.query.filter_by(
        organization_id=organization.organization_id,
        type='Renewal',
        academic_year=academic_year
    ).first()
    
    if not renewal_application:
        return jsonify({'success': False, 'message': "No renewal application found for this organization"})
    
    # Get all files for this application
    application_files = ApplicationFile.query.filter_by(application_id=renewal_application.application_id).all()
    
    # Get all feedback for files in this application
    file_ids = [file.app_file_id for file in application_files]
    feedbacks = Feedback.query.filter(Feedback.app_file_id.in_(file_ids)).order_by(Feedback.date_sent.desc()).all() if file_ids else []
    
    # Format the response
    feedback_list = [{
        'id': f.feedback_id,
        'file_id': f.app_file_id,
        'file_name': f.application_file.file_name if f.application_file else 'Unknown',
        'subject': f.subject,
        'message': f.message,
        'date_sent': f.date_sent.strftime('%Y-%m-%d %H:%M:%S') if f.date_sent else None,
        'is_read': f.is_read
    } for f in feedbacks]
    
    return jsonify({'success': True, 'feedbacks': feedback_list})

@user_renewal_bp.route('/get-renewal-file/<int:file_id>')
@login_required
def get_renewal_file(file_id):
    # Get the application file
    app_file = ApplicationFile.query.get_or_404(file_id)
    
    # Check if the user has permission to access this file
    from app.organization_service import get_organization_by_user_id
    organization = get_organization_by_user_id(current_user.user_id)
    
    # Admin can access any file, organization users can only access their own files
    if current_user.role_id != 1:  # Not an admin
        application = Application.query.get(app_file.application_id)
        if not organization or application.organization_id != organization.organization_id:
            abort(403)  # Forbidden
    
    # Check if file data exists and has content
    if not app_file.file or len(app_file.file) == 0:
        return render_template('error.html', message="The file appears to be empty or corrupted."), 500
    
    # Check file signatures to determine file type
    # PDF signature check (%PDF)
    if app_file.file[:4] == b'%PDF':
        mimetype = 'application/pdf'
        file_extension = 'pdf'
    else:
        # Default to PDF if signature check fails
        mimetype = 'application/pdf'
        file_extension = 'pdf'
    
    return send_file(
        io.BytesIO(app_file.file),
        mimetype=mimetype,
        as_attachment=False,
        download_name=f'{app_file.file_name}.{file_extension}'
    )