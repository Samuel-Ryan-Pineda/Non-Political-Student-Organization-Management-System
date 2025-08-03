from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_mail import Mail
from flask_wtf.csrf import CSRFProtect
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

# Initialize extensions
db = SQLAlchemy()
login_manager = LoginManager()
mail = Mail()
csrf = CSRFProtect()
migrate = Migrate()

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    
    # Load configuration
    load_dotenv()  # Load environment variables
    
    # Import scheduler for organization status checks
    from apscheduler.schedulers.background import BackgroundScheduler
    from datetime import datetime, timedelta
    from app.models import Organization
    
    # Initialize scheduler
    scheduler = BackgroundScheduler()
    
    def check_organization_expiry():
        """Check and update organization statuses that have been active for over a year"""
        with app.app_context():
            one_year_ago = datetime.now() - timedelta(days=365)
            expired_orgs = Organization.query.filter(
                Organization.status == 'Active',
                Organization.activation_date <= one_year_ago,
                Organization.last_renewal_date <= one_year_ago
            ).all()
            
            for org in expired_orgs:
                org.status = 'Inactive'
                db.session.commit()
    
    # Schedule the job to run daily at midnight
    scheduler.add_job(check_organization_expiry, 'cron', hour=0, minute=0)
    scheduler.start()
    
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
    csrf.init_app(app)
    migrate.init_app(app, db)
    
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
    
    # Register application_first_step_bp
    from app.blueprints.user.application_first_step import application_first_step_bp
    app.register_blueprint(application_first_step_bp)
    
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