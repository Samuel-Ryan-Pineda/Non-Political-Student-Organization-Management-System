from flask import Blueprint
from .new_organization import admin_new_organization_bp
from .routes import admin_routes_bp

admin_bp = Blueprint('admin', __name__)

def init_admin_bp(app):
    # Register the admin blueprint
    app.register_blueprint(admin_bp)
    
    # Register the admin routes blueprint
    app.register_blueprint(admin_routes_bp, url_prefix='/admin')
    
    # Register the new organization blueprint without admin prefix
    app.register_blueprint(admin_new_organization_bp, url_prefix='')