from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, abort, session
from flask_login import login_required, current_user, logout_user
from app.models import db, Logo, Application, ApplicationFile
from datetime import datetime
from werkzeug.utils import secure_filename
import io

admin_routes_bp = Blueprint('admin_routes', __name__)

@admin_routes_bp.route('/dashboard')
@login_required
def admin_dashboard():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    return render_template('admin/organization.html', active_page='organization')

@admin_routes_bp.route('/member')
@login_required
def member():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/member.html', user=current_user, active_page='member')

@admin_routes_bp.route('/renewal')
@login_required
def renewal():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/renewal.html', user=current_user, active_page='renewal')

@admin_routes_bp.route('/organizationrenewals')
@login_required
def organizationrenewals():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/organizationrenewals.html', user=current_user, active_page='renewal')

@admin_routes_bp.route('/organization')
@login_required
def organization():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/organization.html', user=current_user, active_page='organization')

@admin_routes_bp.route('/organizationdetails')
@login_required
def organizationdetails():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/organizationdetails.html', user=current_user, active_page='organization')

@admin_routes_bp.route('/announcement')
@login_required
def analytics():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/announcement.html', user=current_user, active_page='announcement')

@admin_routes_bp.route('/reports')
@login_required
def schedules():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/reports.html', user=current_user, active_page='reports')

@admin_routes_bp.route('/organizationreports')
@login_required
def organizationreports():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/organizationreports.html', user=current_user, active_page='reports')

@admin_routes_bp.route('/adminaccount')
@login_required
def adminaccount():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    # current_user is provided by Flask-Login
    return render_template('admin/adminaccount.html', user=current_user, active_page='adminaccount')

@admin_routes_bp.route('/get-application-file')
@login_required
def get_application_file():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        abort(403)  # Forbidden
    
    # Get file_id from query parameters
    file_id = request.args.get('file_id')
    if not file_id:
        abort(400)  # Bad Request
    
    # Get the application file
    app_file = ApplicationFile.query.get_or_404(int(file_id))
    
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

@admin_routes_bp.route('/download-application-file')
@login_required
def download_application_file():
    # Ensure user is OSOAD
    if current_user.role_id != 1:
        abort(403)  # Forbidden
    
    # Get file_id from query parameters
    file_id = request.args.get('file_id')
    if not file_id:
        abort(400)  # Bad Request
    
    # Add download=true parameter and redirect to get-application-file
    return redirect(url_for('admin_routes.get_application_file', file_id=file_id, download=True))