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
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:@localhost/npsoms_db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.secret_key = 'secret_key'
    
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
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(main_bp)
    
    # Create database tables
    with app.app_context():
        from app.models import UserRole
        db.create_all()
        
        # Initialize roles if they don't exist
        if not UserRole.query.first():
            roles = [
                UserRole(role_id=1, role="OSOAD"),
                UserRole(role_id=2, role="Organization_President"),
                UserRole(role_id=3, role="Applicant")
            ]
            db.session.add_all(roles)
            db.session.commit()
    
    return app