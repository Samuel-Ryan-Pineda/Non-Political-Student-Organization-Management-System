from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_mail import Mail
from dotenv import load_dotenv
import os

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
mail = Mail()

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    
    # Load configuration
    load_dotenv()  # Load environment variables
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URI", 'mysql+pymysql://root:@localhost/npsoms_db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.secret_key = os.getenv("SECRET_KEY", 'secret_key')
    
    # Mail configuration
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv("MAIL_USERNAME")
    app.config['MAIL_PASSWORD'] = os.getenv("MAIL_PASSWORD")
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv("MAIL_USERNAME")
    
    # Initialize extensions with app
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Please log in to access this page.'
    login_manager.login_message_category = 'error'
    mail.init_app(app)
    
    # Register blueprints
    from app.auth import auth_bp
    from app.main import main_bp
    from app.blueprints.admin import init_admin_bp
    from app.blueprints.user import init_user_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    init_admin_bp(app)
    init_user_bp(app)
    
    # Register user_organization_bp separately to maintain the existing URL structure
    from app.blueprints.user.organization import user_organization_bp
    app.register_blueprint(user_organization_bp, url_prefix='/organization')
    
    # Register context processors
    from app.context_processors import inject_cache_version
    app.context_processor(inject_cache_version)
    
    # Create database tables
    with app.app_context():
        from app.models import Role
        db.create_all()
        
        # Initialize roles if they don't exist
        if not Role.query.first():
            roles = [
                Role(role_id=1, role_name="OSOAD", role_description="Office of Student Organization and Activities Development"),
                Role(role_id=2, role_name="Organization_President", role_description="President of a Student Organization"),
                Role(role_id=3, role_name="Applicant", role_description="Student Organization Applicant")
            ]
            db.session.add_all(roles)
            db.session.commit()
    
    return app