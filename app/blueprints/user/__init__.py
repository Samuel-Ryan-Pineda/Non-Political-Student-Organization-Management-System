from flask import Blueprint
from .routes import user_routes_bp
from .organization import user_organization_bp
from .renewal import user_renewal_bp

user_bp = Blueprint('user', __name__)

def init_user_bp(app):
    # Register the user blueprint
    app.register_blueprint(user_bp)
    
    # Register the user routes blueprint
    app.register_blueprint(user_routes_bp, url_prefix='/user')
    
    # Register the user renewal blueprint
    app.register_blueprint(user_renewal_bp, url_prefix='/renewal')
    
    # Register the user organization blueprint
    # Note: This is registered in app/__init__.py with url_prefix='/organization'
    # We're including it here for completeness, but it should be removed from app/__init__.py
    # app.register_blueprint(user_organization_bp, url_prefix='/organization')