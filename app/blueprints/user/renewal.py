from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, abort
from flask_login import login_required, current_user
from app.models import db, Application, ApplicationFile
from datetime import datetime
from werkzeug.utils import secure_filename
import io
import os

# Create the blueprint with the correct name
user_renewal_bp = Blueprint('user_renewal', __name__)

@user_renewal_bp.route('/carry-forward-logo', methods=['POST'])
@login_required
def carry_forward_logo():
    """Carry forward the logo file from the previous year's application"""
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to carry forward files"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Generate academic years
    current_year = datetime.now().year
    current_academic_year = f"{current_year}-{current_year + 1}"
    previous_academic_year = f"{current_year - 1}-{current_year}"
    
    # Find the current renewal application
    current_renewal_application = Application.query.filter_by(
        organization_id=organization.organization_id,
        type='Renewal',
        academic_year=current_academic_year
    ).first()
    
    if not current_renewal_application:
        return jsonify({'success': False, 'message': "No current renewal application found"})
    
    # Find the previous year's application (could be renewal or initial)
    previous_application = Application.query.filter_by(
        organization_id=organization.organization_id,
        academic_year=previous_academic_year
    ).first()
    
    if not previous_application:
        return jsonify({'success': False, 'message': "No previous year's application found"})
    
    # Find the logo file from the previous application
    previous_logo = ApplicationFile.query.filter_by(
        application_id=previous_application.application_id,
        file_name='LOGO WITH EXPLANATION'
    ).first()
    
    if not previous_logo:
        return jsonify({'success': False, 'message': "No logo file found in previous year's application"})
    
    try:
        # Check if logo already exists in current application
        existing_logo = ApplicationFile.query.filter_by(
            application_id=current_renewal_application.application_id,
            file_name='LOGO WITH EXPLANATION'
        ).first()
        
        if existing_logo:
            # Update existing logo with previous year's data
            existing_logo.file = previous_logo.file
            existing_logo.status = "Pending"
            existing_logo.submission_date = datetime.utcnow()
            db.session.commit()
            
            file_id = existing_logo.app_file_id
        else:
            # Create new logo file with previous year's data
            new_logo = ApplicationFile(
                application_id=current_renewal_application.application_id,
                file_name='LOGO WITH EXPLANATION',
                file=previous_logo.file,
                status="Pending"
            )
            db.session.add(new_logo)
            db.session.commit()
            
            file_id = new_logo.app_file_id
        
        # Check if all required files are uploaded and update application status if needed
        check_and_update_renewal_status(current_renewal_application.application_id)
        
        return jsonify({
            'success': True,
            'message': 'Logo carried forward successfully from previous year',
            'filename': 'logo_carried_forward.pdf',
            'fileType': 'LOGO WITH EXPLANATION',
            'status': 'Pending',
            'file_id': file_id,
            'submission_date': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"An error occurred: {str(e)}"})

@user_renewal_bp.route('/check-previous-logo', methods=['GET'])
@login_required
def check_previous_logo():
    """Check if a logo file exists in the previous year's application"""
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to check files"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Generate academic years
    current_year = datetime.now().year
    previous_academic_year = f"{current_year - 1}-{current_year}"
    
    # Find the previous year's application (could be renewal or initial)
    previous_application = Application.query.filter_by(
        organization_id=organization.organization_id,
        academic_year=previous_academic_year
    ).first()
    
    if not previous_application:
        return jsonify({'success': False, 'has_previous_logo': False, 'message': "No previous year's application found"})
    
    # Find the logo file from the previous application
    previous_logo = ApplicationFile.query.filter_by(
        application_id=previous_application.application_id,
        file_name='LOGO WITH EXPLANATION'
    ).first()
    
    if not previous_logo:
        return jsonify({'success': True, 'has_previous_logo': False, 'message': "No logo file found in previous year's application"})
    
    return jsonify({
        'success': True,
        'has_previous_logo': True,
        'message': "Previous year's logo file is available for carry-forward",
        'previous_status': previous_logo.status,
        'previous_submission_date': previous_logo.submission_date.strftime('%Y-%m-%d %H:%M:%S') if previous_logo.submission_date else None
    })

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
    
    # Get the replace file ID if provided
    replace_file_id = request.form.get('replaceFileId')
    
    # Check if the file type is allowed (PDF only)
    if not allowed_file(file.filename, ['pdf']):
        return jsonify({'success': False, 'message': "File type not allowed. Please upload PDF documents only."})
    
    try:
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Read the file data
        file_data = file.read()
        
        # Handle file replacement if replace_file_id is provided
        if replace_file_id:
            try:
                # Find the existing file by ID
                existing_file_by_id = ApplicationFile.query.filter_by(
                    app_file_id=replace_file_id,
                    application_id=renewal_application.application_id
                ).first()
                
                if existing_file_by_id:
                    # Update existing file
                    existing_file_by_id.file = file_data
                    existing_file_by_id.status = "Pending"
                    existing_file_by_id.submission_date = datetime.utcnow()  # Reset submission date on update
                    db.session.commit()
                    
                    # Check if all required files are uploaded and update application status if needed
                    check_and_update_renewal_status(renewal_application.application_id)
                    
                    return jsonify({
                        'success': True, 
                        'message': f"{file_type} replaced successfully",
                        'filename': filename,
                        'fileType': file_type,
                        'status': "Pending",
                        'file_id': existing_file_by_id.app_file_id,
                        'submission_date': existing_file_by_id.submission_date.strftime('%Y-%m-%d %H:%M:%S')
                    })
            except Exception as e:
                # Log the error but continue with normal upload process
                print(f"Error replacing file {replace_file_id}: {str(e)}")
                # Continue with normal upload process
        
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
    
    # Define the expected file order (same as admin renewal page)
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
            return file_order.index(filename)
        except ValueError:
            # If file is not in the predefined order, put it at the end
            return len(file_order)
    
    files.sort(key=lambda x: get_file_order_index(x.file_name))
    
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

@user_renewal_bp.route('/mark-feedback-read', methods=['POST'])
@login_required
def mark_feedback_read():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to update feedback"})
    
    # Get feedback ID from request
    feedback_id = request.json.get('feedback_id')
    if not feedback_id:
        return jsonify({'success': False, 'message': "Feedback ID is required"})
    
    # Import the Feedback model
    from app.models import Feedback
    
    # Find the feedback
    feedback = Feedback.query.get(feedback_id)
    if not feedback:
        return jsonify({'success': False, 'message': "Feedback not found"})
    
    # Check if user has permission to access this feedback
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
    
    # Check if the feedback belongs to a file in this application
    application_files = ApplicationFile.query.filter_by(application_id=renewal_application.application_id).all()
    file_ids = [file.app_file_id for file in application_files]
    
    if not feedback.app_file_id in file_ids:
        return jsonify({'success': False, 'message': "You don't have permission to access this feedback"})
    
    # Mark feedback as read
    feedback.is_read = True
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': "Feedback marked as read"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"Error updating feedback: {str(e)}"})

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

@user_renewal_bp.route('/replace-renewal-file/<int:file_id>', methods=['POST'])
@login_required
def replace_renewal_file(file_id):
    try:
        # Get the uploaded file and other form data
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'})
            
        file = request.files.get('file')
        
        if not file or file.filename == '':
            return jsonify({'success': False, 'message': 'No file provided'})
        
        # Validate file type (PDF only)
        if not allowed_file(file.filename, ['pdf']):
            return jsonify({'success': False, 'message': 'Only PDF files are allowed'})
        
        # Ensure user is Organization President or Applicant
        if current_user.role_id not in [2, 3]:
            return jsonify({'success': False, 'message': "You don't have permission to upload files"})
        
        # Import the service module here to avoid circular imports
        from app.organization_service import get_organization_by_user_id
        
        # Get user's organization
        organization = get_organization_by_user_id(current_user.user_id)
        if not organization:
            return jsonify({'success': False, 'message': 'User or organization not found'})
        
        # Find the existing file
        existing_file = ApplicationFile.query.get(file_id)
        
        if not existing_file:
            return jsonify({'success': False, 'message': 'File not found'})
        
        # Verify the file belongs to the user's organization
        application = Application.query.get(existing_file.application_id)
        if not application or application.organization_id != organization.organization_id:
            return jsonify({'success': False, 'message': 'You do not have permission to modify this file'})
        
        # Read the file data
        file_data = file.read()
        
        # Update the existing file record
        existing_file.file = file_data
        existing_file.status = 'Pending'  # Reset status to pending after replacement
        existing_file.submission_date = datetime.utcnow()
        
        db.session.commit()
        
        # Check if all required files are uploaded and update application status if needed
        check_and_update_renewal_status(application.application_id)
        
        return jsonify({
            'success': True,
            'message': 'File replaced successfully',
            'file_id': existing_file.app_file_id,
            'status': 'Pending',
            'submission_date': existing_file.submission_date.strftime('%Y-%m-%d %H:%M:%S')
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error replacing renewal file {file_id}: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred while replacing the file'})