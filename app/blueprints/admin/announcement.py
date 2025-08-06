from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app
from flask_login import login_required, current_user
from flask_mail import Message
from app.models import db, Announcement, AnnouncementRecipient, User, Organization
from app import mail
from datetime import datetime
import html

announcement_bp = Blueprint('announcement', __name__)

@announcement_bp.route('/announcement')
@login_required
def announcement_page():
    """Display the announcement page"""
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_all_active_organizations
    
    # Get all active organizations for the multi-select dropdown
    active_organizations = get_all_active_organizations()
    
    # Get sent announcements for history
    sent_announcements = Announcement.query.order_by(Announcement.date_sent.desc()).all()
    
    return render_template('admin/announcement.html', 
                          user=current_user, 
                          active_page='announcement',
                          organizations=active_organizations,
                          sent_announcements=sent_announcements)

@announcement_bp.route('/send-announcement', methods=['POST'])
@login_required
def send_announcement():
    """Handle sending announcements"""
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
    
    try:
        # Get form data
        subject = request.form.get('subject', '').strip()
        message = request.form.get('message', '').strip()
        selected_organizations = request.form.getlist('organization_ids')
        
        # Validation
        if not subject:
            return jsonify({'success': False, 'message': 'Subject is required'}), 400
        
        if not message:
            return jsonify({'success': False, 'message': 'Message is required'}), 400
        
        if not selected_organizations:
            return jsonify({'success': False, 'message': 'Please select at least one organization'}), 400
        
        # Clean the message content (remove HTML tags for storage)
        clean_message = html.unescape(message)
        
        # Create the announcement
        announcement = Announcement(
            subject=subject,
            message=clean_message,
            date_sent=datetime.utcnow()
        )
        
        db.session.add(announcement)
        db.session.flush()  # Get the announcement_id
        
        # Determine recipients based on selection
        recipient_users = []
        
        if 'all' in selected_organizations:
            # Send to all organization users (role_id 2 and 3)
            recipient_users = User.query.filter(User.role_id.in_([2, 3])).all()
        else:
            # Send to specific organizations
            for org_id in selected_organizations:
                try:
                    org_id = int(org_id)
                    # Get users associated with this organization
                    # The relationship is Organization.user_id -> User.user_id
                    org_users = User.query.join(Organization, User.user_id == Organization.user_id).filter(
                        Organization.organization_id == org_id,
                        User.role_id.in_([2, 3])
                    ).all()
                    recipient_users.extend(org_users)
                except ValueError:
                    continue
        
        # Remove duplicates
        recipient_users = list(set(recipient_users))
        
        # Create announcement recipients
        for user in recipient_users:
            recipient = AnnouncementRecipient(
                announcement_id=announcement.announcement_id,
                user_id=user.user_id,
                is_read=False
            )
            db.session.add(recipient)
        
        # Commit the transaction
        db.session.commit()
        
        # Send email notifications to all recipients
        try:
            for user in recipient_users:
                if user.email:  # Only send if user has an email
                    msg = Message(
                        subject=f"New Announcement: {subject}",
                        sender=current_app.config.get('MAIL_DEFAULT_SENDER', 'noreply@yourdomain.com'),
                        recipients=[user.email]
                    )
                    
                    # Create HTML email content
                    msg.html = f'''
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0; font-size: 28px;">📢 New Announcement</h1>
                            <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">NPSOMS - Student Organization Management</p>
                        </div>
                        
                        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
                            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; border-bottom: 2px solid #3498db; padding-bottom: 10px;">{subject}</h2>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
                                <div style="white-space: pre-wrap; font-size: 16px; line-height: 1.6;">{clean_message}</div>
                            </div>
                            
                            <div style="margin: 30px 0; padding: 20px; background: #e8f4fd; border-radius: 8px; border: 1px solid #bee5eb;">
                                <p style="margin: 0; font-size: 14px; color: #0c5460;">
                                    <strong>📅 Date:</strong> {announcement.date_sent.strftime('%B %d, %Y at %I:%M %p')}<br>
                                    <strong>👤 From:</strong> OSOAD Administration<br>
                                    <strong>📧 Recipient:</strong> {user.first_name} {user.last_name}
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="http://127.0.0.1:5000/login" 
                                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                          color: white; 
                                          text-decoration: none; 
                                          padding: 12px 30px; 
                                          border-radius: 25px; 
                                          font-weight: bold; 
                                          display: inline-block;
                                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                                    🔗 Access NPSOMS Portal
                                </a>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
                            
                            <p style="font-size: 12px; color: #6c757d; text-align: center; margin: 0;">
                                This is an automated message from the Non-Political Student Organization Management System (NPSOMS).<br>
                                Please do not reply to this email. For support, contact your OSOAD administrator.
                            </p>
                        </div>
                    </body>
                    </html>
                    '''
                    
                    # Send the email
                    mail.send(msg)
                    
        except Exception as email_error:
            # Log email error but don't fail the announcement creation
            print(f"Warning: Failed to send email notifications: {str(email_error)}")
            # The announcement was still created successfully in the database
        
        # Prepare response data
        recipient_count = len(recipient_users)
        organization_names = []
        
        if 'all' in selected_organizations:
            organization_names = ['All Organizations']
        else:
            from app.organization_service import get_all_active_organizations
            all_orgs = get_all_active_organizations()
            org_dict = {str(org.organization_id): org.organization_name for org in all_orgs}
            organization_names = [org_dict.get(org_id, f'Organization {org_id}') for org_id in selected_organizations if org_id in org_dict]
        
        return jsonify({
            'success': True,
            'message': f'Announcement sent successfully to {recipient_count} recipients via email and system notification',
            'data': {
                'announcement_id': announcement.announcement_id,
                'subject': subject,
                'recipient_count': recipient_count,
                'organizations': organization_names,
                'date_sent': announcement.date_sent.strftime('%B %d, %Y at %I:%M %p')
            }
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error sending announcement: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred while sending the announcement'}), 500

@announcement_bp.route('/get-announcements')
@login_required
def get_announcements():
    """Get all announcements for the history table"""
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
    
    try:
        announcements = Announcement.query.order_by(Announcement.date_sent.desc()).all()
        
        announcement_list = []
        for announcement in announcements:
            announcement_list.append({
                'announcement_id': announcement.announcement_id,
                'subject': announcement.subject,
                'date_sent': announcement.date_sent.strftime('%b %d, %Y'),
                'recipient_count': AnnouncementRecipient.query.filter_by(
                    announcement_id=announcement.announcement_id
                ).count()
            })
        
        return jsonify({
            'success': True,
            'announcements': announcement_list
        })
        
    except Exception as e:
        print(f"Error getting announcements: {str(e)}")
        return jsonify({'success': False, 'message': 'Error loading announcements'}), 500

@announcement_bp.route('/get-announcement-details/<int:announcement_id>')
@login_required
def get_announcement_details(announcement_id):
    """Get details of a specific announcement"""
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
    
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        
        # Get recipient count
        recipient_count = AnnouncementRecipient.query.filter_by(
            announcement_id=announcement_id
        ).count()
        
        return jsonify({
            'success': True,
            'announcement': {
                'announcement_id': announcement.announcement_id,
                'subject': announcement.subject,
                'message': announcement.message,
                'date_sent': announcement.date_sent.strftime('%B %d, %Y at %I:%M %p'),
                'recipient_count': recipient_count
            }
        })
        
    except Exception as e:
        print(f"Error getting announcement details: {str(e)}")
        return jsonify({'success': False, 'message': 'Announcement not found'}), 404

@announcement_bp.route('/delete-announcement/<int:announcement_id>', methods=['DELETE'])
@login_required
def delete_announcement(announcement_id):
    """Delete a specific announcement"""
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
    
    try:
        announcement = Announcement.query.get_or_404(announcement_id)
        
        # Delete associated recipients first (due to foreign key constraints)
        AnnouncementRecipient.query.filter_by(announcement_id=announcement_id).delete()
        
        # Delete the announcement
        db.session.delete(announcement)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Announcement deleted successfully'
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting announcement: {str(e)}")
        return jsonify({'success': False, 'message': 'An error occurred while deleting the announcement'}), 500

@announcement_bp.route('/get-announcement-recipients/<int:announcement_id>')
@login_required
def get_announcement_recipients(announcement_id):
    """Get all recipients of a specific announcement"""
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        return jsonify({'success': False, 'message': 'Unauthorized access'}), 403
    
    try:
        # Get announcement to verify it exists
        announcement = Announcement.query.get_or_404(announcement_id)
        
        # Get all recipients with their user and organization information
        recipients_query = db.session.query(
            AnnouncementRecipient, User, Organization
        ).join(
            User, AnnouncementRecipient.user_id == User.user_id
        ).outerjoin(
            Organization, User.user_id == Organization.user_id
        ).filter(
            AnnouncementRecipient.announcement_id == announcement_id
        ).order_by(User.first_name, User.last_name)
        
        recipients_list = []
        for recipient, user, organization in recipients_query:
            org_name = organization.organization_name if organization else "No Organization"
            recipients_list.append({
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email,
                'organization': org_name,
                'is_read': recipient.is_read
            })
        
        return jsonify({
            'success': True,
            'recipients': recipients_list,
            'announcement': {
                'subject': announcement.subject,
                'date_sent': announcement.date_sent.strftime('%B %d, %Y at %I:%M %p')
            }
        })
        
    except Exception as e:
        print(f"Error getting announcement recipients: {str(e)}")
        return jsonify({'success': False, 'message': 'Error loading recipients'}), 500