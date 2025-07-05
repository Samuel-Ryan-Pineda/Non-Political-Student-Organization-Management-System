from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_required, current_user, logout_user

main_bp = Blueprint('main', __name__)

@main_bp.route('/dashboard')
@login_required
def dashboard():
    if current_user.role_id == 1:  
        return redirect(url_for('admin_routes.admin_dashboard'))
    elif current_user.role_id in [2, 3]: 
        return redirect(url_for('user_organization.org_dashboard'))
    else:
        flash("Unknown user role", "error")
        return redirect(url_for('auth.logout'))

@main_bp.route('/logout')
@login_required
def logout():
    logout_user()  # Flask-Login's logout function
    flash("You have been logged out.", "info")
    return redirect(url_for('auth.login'))

# Note: The update-file-status route has been moved to the admin_new_organization blueprint
# for better organization and to avoid duplication