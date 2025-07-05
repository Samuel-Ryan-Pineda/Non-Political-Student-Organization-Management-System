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