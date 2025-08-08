from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app.models import Application, ApplicationFile, Organization, Feedback
from app import db
from app.organization_service import get_pending_renewal_applications, get_application_by_id, get_organization_by_id
from datetime import datetime

# Create blueprint
organization_renewal_bp = Blueprint('organization_renewal', __name__)

def check_and_update_application_status(application_id):
    """Helper function to check and update application status"""
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
            
            # Also update organization status and dates when renewal is verified
            organization = Organization.query.get(application.organization_id)
            if organization:
                organization.status = 'Active'
                now = datetime.now()
                organization.activation_date = now
                organization.last_renewal_date = now
            
            db.session.commit()
    except Exception as e:
        # Log the error but don't disrupt the file upload process
        print(f"Error checking application status: {str(e)}")
        db.session.rollback()

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
    
    # Define the expected file order (same as user renewal page)
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
    
    # Sort files according to the predefined order
    def get_file_order_index(filename):
        try:
            return file_order.index(filename)
        except ValueError:
            # If file is not in the predefined order, put it at the end
            return len(file_order)
    
    files.sort(key=lambda x: get_file_order_index(x['filename']))
    
    # Get feedback data for this application
    file_ids = [file.app_file_id for file in ApplicationFile.query.filter_by(application_id=application_id).all()]
    sent_feedbacks = Feedback.query.filter(Feedback.app_file_id.in_(file_ids)).order_by(Feedback.date_sent.desc()).all() if file_ids else []
    
    # current_user is provided by Flask-Login
    return render_template('admin/organizationrenewals.html', 
                           user=current_user, 
                           active_page='renewal', 
                           application=application, 
                           organization=organization,
                           files=files,
                           sent_feedbacks=sent_feedbacks)

@organization_renewal_bp.route('/get-feedback-detail/<int:feedback_id>')
@login_required
def get_feedback_detail(feedback_id):
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'error': "You don't have permission to access this data"}), 403
    
    try:
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

@organization_renewal_bp.route('/update-feedback', methods=['POST'])
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

@organization_renewal_bp.route('/update_renewal_file_status/<int:file_id>', methods=['POST'])
@login_required
def update_renewal_file_status(file_id):
    """Update the status of a renewal application file"""
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': "You don't have permission to update file status"})
    
    try:
        # Get JSON data from request
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'message': 'No data provided'})
        
        new_status = data.get('status')
        feedback_message = data.get('feedback_message')
        
        if not new_status:
            return jsonify({'success': False, 'message': 'Status is required'})
        
        # For 'Needs Revision' or 'Rejected' status, feedback should be required
        if (new_status == 'Needs Revision' or new_status == 'Rejected') and not feedback_message:
            return jsonify({'success': False, 'message': 'Feedback is required for Needs Revision or Rejected status'})
        
        # Get the application file
        app_file = ApplicationFile.query.get(file_id)
        if not app_file:
            return jsonify({'success': False, 'message': 'File not found'})
        
        # Update the status
        app_file.status = new_status
        
        # Store feedback if provided
        if feedback_message:
            new_feedback = Feedback(
                app_file_id=file_id,
                subject=f"Status Update: {new_status}",
                message=feedback_message,
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