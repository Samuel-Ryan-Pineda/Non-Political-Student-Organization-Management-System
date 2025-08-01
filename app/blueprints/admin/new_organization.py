from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app.models import db, ApplicationFile, Application, Organization
from datetime import datetime
from app import csrf

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
            
            # Also update organization status from Incomplete to Active when application is verified
            organization = Organization.query.get(application.organization_id)
            if organization and organization.status and organization.status.lower() == 'incomplete':
                organization.status = 'Active'
            
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
    
    # Get feedback data for this application
    from app.models import Feedback
    
    # Get all feedback for files in this application
    file_ids = [file.app_file_id for file in application_files]
    sent_feedbacks = Feedback.query.filter(Feedback.app_file_id.in_(file_ids)).order_by(Feedback.date_sent.desc()).all() if file_ids else []
    
    return render_template('admin/neworganizationfiles.html', 
                           user=current_user, 
                           active_page='neworganization',
                           application=application,
                           organization=organization,
                           application_files=application_files,
                           sent_feedbacks=sent_feedbacks)

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
    print(f"Request headers: {request.headers}")
    
    # Handle both FormData and JSON requests
    if request.is_json:
        data = request.json
        file_id = data.get('file_id')
        new_status = data.get('status')
        feedback = data.get('feedback')
    else:
        file_id = request.form.get('file_id')
        new_status = request.form.get('status')
        feedback = request.form.get('feedback')
    
    print(f"Extracted file_id: {file_id}, new_status: {new_status}, feedback: {feedback}")
    
    if not file_id or not new_status:
        return jsonify({'success': False, 'message': 'File ID and status are required'})
    
    # For 'Needs Revision' or 'Rejected' status, feedback should be required
    if (new_status == 'Needs Revision' or new_status == 'Rejected') and not feedback:
        return jsonify({'success': False, 'message': 'Feedback is required for Needs Revision or Rejected status'})
    
    try:
        # Get the application file
        app_file = ApplicationFile.query.get(file_id)
        if not app_file:
            return jsonify({'success': False, 'message': 'File not found'})
        
        # Update the status
        app_file.status = new_status
        
        # Store feedback if provided
        if feedback:
            # Import the feedback model and create a new feedback entry
            from app.models import Feedback
            new_feedback = Feedback(
                app_file_id=file_id,
                subject=f"Status Update: {new_status}",
                message=feedback,
                date_sent=datetime.now()
            )
            db.session.add(new_feedback)
        
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

@admin_new_organization_bp.route('/get-feedback-detail/<int:feedback_id>')
@login_required
def get_feedback_detail(feedback_id):
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'error': "You don't have permission to access this data"}), 403
    
    try:
        # Import the feedback model
        from app.models import Feedback
        
        # Get the feedback record
        feedback = Feedback.query.get(feedback_id)
        if not feedback:
            return jsonify({'error': 'Feedback not found'}), 404
        
        # Return feedback details
        return jsonify({
            'subject': feedback.subject,
            'message': feedback.message,
            'date': feedback.date_sent.strftime('%B %d, %Y, %I:%M %p') if feedback.date_sent else 'Not available',
            'file_name': feedback.application_file.file_name if feedback.application_file else 'Unknown'
        })
    except Exception as e:
        return jsonify({'error': f'Error fetching feedback details: {str(e)}'}), 500

@admin_new_organization_bp.route('/update-feedback', methods=['POST'])
@login_required
def update_feedback():
    """Update feedback content"""
    try:
        # Ensure user is OSOAD
        if current_user.role_id != 1:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 403
        
        # Get form data
        feedback_id = request.form.get('feedback_id')
        subject = request.form.get('subject')
        message = request.form.get('message')
        
        # Validate input
        if not feedback_id or not subject or not message:
            return jsonify({'success': False, 'message': 'Missing required fields'})
        
        # Import the feedback model
        from app.models import Feedback
        
        # Get feedback from database
        feedback = Feedback.query.get(feedback_id)
        if not feedback:
            return jsonify({'success': False, 'message': 'Feedback not found'})
        
        # Update feedback
        feedback.subject = subject
        feedback.message = message
        feedback.date_sent = datetime.now()
        
        # Save to database
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Feedback updated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500