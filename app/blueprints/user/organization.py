from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, abort, session
from flask_login import login_required, current_user
from app.models import db, Logo, Application, ApplicationFile
from datetime import datetime
from werkzeug.utils import secure_filename
import io

user_organization_bp = Blueprint('user_organization', __name__)

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@user_organization_bp.route('/org/dashboard')
@login_required
def org_dashboard():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import user_has_organization
    
    # Check if user already has an organization
    if user_has_organization(current_user.user_id):
        # User has an organization, show the application page
        return redirect(url_for('user_organization.application'))
    else:
        # User doesn't have an organization, show the first step form
        return render_template('user/applicationfirststep.html', active_page='application')

@user_organization_bp.route('/application')
@login_required
def application():
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
    
    return render_template('user/application.html', 
                           user=current_user, 
                           organization=organization,
                           application=application,
                           active_page='application')

@user_organization_bp.route('/check-organization-name', methods=['POST'])
@login_required
def check_organization_name():
    # Import the service module here to avoid circular imports
    from app.organization_service import organization_name_exists
    
    # Get the organization name from the request
    org_name = request.json.get('orgName')
    
    if not org_name:
        return jsonify({'valid': False, 'message': 'Organization name is required'})
    
    # Check if the organization name exists
    exists = organization_name_exists(org_name)
    
    if exists:
        return jsonify({'valid': False, 'message': f"Organization name '{org_name}' is already taken. Please choose a different name."})
    else:
        return jsonify({'valid': True})

@user_organization_bp.route('/update-organization', methods=['POST'])
@login_required
def update_organization():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({
            'success': False,
            'message': "You don't have permission to update organization information"
        })
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, organization_name_exists
    
    # Get the current organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        return jsonify({
            'success': False,
            'message': "No organization found for this user"
        })
    
    # Get form data
    organization_name = request.form.get('organization_name')
    org_type = request.form.get('type')
    tagline = request.form.get('tagline')
    description = request.form.get('description')
    logo_description = request.form.get('logo_description')
    
    # Only check for name conflicts if organization_name is provided and has changed
    if organization_name and organization_name != organization.organization_name and organization_name_exists(organization_name):
        return jsonify({
            'success': False,
            'message': f"Organization name '{organization_name}' is already taken. Please choose a different name."
        })
    
    # Track if any changes were made
    changes_made = False
    
    # Update organization information only if the corresponding field is provided
    if organization_name and organization_name != organization.organization_name:
        organization.organization_name = organization_name
        changes_made = True
    if org_type and org_type != organization.type:
        organization.type = org_type
        changes_made = True
    if tagline is not None and tagline != organization.tagline:  # Allow empty string
        organization.tagline = tagline
        changes_made = True
    if description is not None and description != organization.description:  # Allow empty string
        organization.description = description
        changes_made = True
    
    # Update logo description if organization has a logo and logo_description is provided
    if organization.logo_id and logo_description is not None:
        logo = Logo.query.get(organization.logo_id)
        if logo and logo.description != logo_description:
            logo.description = logo_description
            changes_made = True
    
    # Handle logo upload if provided
    if 'logo' in request.files and request.files['logo'].filename:
        logo_file = request.files['logo']
        
        # Check if the file is allowed
        if logo_file and allowed_file(logo_file.filename, ['png', 'jpg', 'jpeg', 'gif']):
            # Create a new logo or update existing one
            if organization.logo_id:
                # Update existing logo
                logo = Logo.query.get(organization.logo_id)
                if logo:
                    logo.logo = logo_file.read()
                    changes_made = True
            else:
                # Create new logo
                logo = Logo(logo=logo_file.read(), description=logo_description)
                db.session.add(logo)
                db.session.flush()  # Get the logo ID
                organization.logo_id = logo.logo_id
                changes_made = True
        else:
            return jsonify({
                'success': False,
                'message': "Invalid file format. Please upload a valid image file."
            })
    
    # Save changes to database only if changes were made
    if changes_made:
        try:
            db.session.commit()
            return jsonify({
                'success': True,
                'message': "Organization information updated successfully"
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'message': f"An error occurred: {str(e)}"
            })
    else:
        # No changes were made, but still return success
        return jsonify({
            'success': True,
            'message': "No changes were made to organization information"
        })

@user_organization_bp.route('/applicationfirststep', methods=['GET', 'POST'])
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

@user_organization_bp.route('/upload-application-file', methods=['POST'])
@login_required
def upload_application_file():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to upload files"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id)
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': "No file part"})
    
    file = request.files['file']
    file_type = request.form.get('fileType')
    
    # If user does not select file, browser also submits an empty part without filename
    if file.filename == '':
        return jsonify({'success': False, 'message': "No selected file"})
    
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
            application_id=application.application_id,
            file_name=file_type
        ).first()
        
        if existing_file:
            # Update existing file
            existing_file.file = file_data
            existing_file.status = "Pending"
            existing_file.submission_date = datetime.utcnow()  # Reset submission date on update
            db.session.commit()
            
            # Check if all required files are uploaded and update application status if needed
            check_and_update_application_status(application.application_id)
            
            return jsonify({
                'success': True, 
                'message': f"{file_type} updated successfully",
                'filename': filename,
                'fileType': file_type,
                'status': "Pending",
                'submission_date': existing_file.submission_date.strftime('%Y-%m-%d %H:%M:%S')
            })
        else:
            # Create new application file
            new_file = ApplicationFile(
                application_id=application.application_id,
                file_name=file_type,
                file=file_data,
                status="Pending"
            )
            db.session.add(new_file)
            db.session.commit()
            
            # Check if all required files are uploaded and update application status if needed
            check_and_update_application_status(application.application_id)
            
            return jsonify({
                'success': True, 
                'message': f"{file_type} uploaded successfully",
                'filename': filename,
                'fileType': file_type,
                'status': "Pending",
                'submission_date': new_file.submission_date.strftime('%Y-%m-%d %H:%M:%S')
            })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"An error occurred: {str(e)}"})

def check_and_update_application_status(application_id):
    """
    Check application files and update status:
    - 'Incomplete' to 'Pending' when all required files are uploaded
    - 'Pending' to 'Verified' when all files are verified
    Also updates the submission_date when status changes to 'Pending'
    
    Args:
        application_id (int): ID of the application to check
    """
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

@user_organization_bp.route('/get-application-file/<int:file_id>')
@login_required
def get_application_file(file_id):
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

@user_organization_bp.route('/get-application-status')
@login_required
def get_application_status():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access application status"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id)
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Get the current status
    current_status = application.status
    
    # For the previous status, we'll use a session variable
    # If the previous status isn't set, default to 'Incomplete'
    # This ensures that when status changes from Incomplete to Pending, it will be detected
    previous_status = session.get('previous_application_status', 'Incomplete')
    
    # Log the status for debugging
    print(f"Application status check - Current: {current_status}, Previous: {previous_status}")
    
    # Update the previous status in the session
    session['previous_application_status'] = current_status
    
    return jsonify({
        'success': True,
        'status': current_status,
        'previousStatus': previous_status
    })

@user_organization_bp.route('/get-application-files')
@login_required
def get_application_files():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access files"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id)
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Get all files for this application
    files = ApplicationFile.query.filter_by(application_id=application.application_id).all()
    
    # Format the response
    file_list = [{
        'id': f.app_file_id,
        'name': f.file_name,
        'status': f.status,
        'submission_date': f.submission_date.strftime('%Y-%m-%d %H:%M:%S') if f.submission_date else None
    } for f in files]
    
    return jsonify({'success': True, 'files': file_list})

# Endpoint for delete-all-application-files removed as it was only used for testing

@user_organization_bp.route('/logo/<int:logo_id>')
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

@user_organization_bp.route('/get-application-feedback')
@login_required
def get_application_feedback():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access feedback"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    from app.models import Feedback
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id)
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Get all files for this application
    application_files = ApplicationFile.query.filter_by(application_id=application.application_id).all()
    
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

@user_organization_bp.route('/mark-feedback-read', methods=['POST'])
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
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id)
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Check if the feedback belongs to a file in this application
    if not feedback.application_file or feedback.application_file.application_id != application.application_id:
        return jsonify({'success': False, 'message': "You don't have permission to access this feedback"})
    
    # Mark feedback as read
    feedback.is_read = True
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': "Feedback marked as read"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"Error updating feedback: {str(e)}"})