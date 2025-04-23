from app import create_app, db
from app.models import User, Email, EntryKey, UserRole

def init_database():
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if roles already exist
        if not UserRole.query.first():
            # Create default roles
            roles = [
                UserRole(role_id=1, role='OSOAD'),
                UserRole(role_id=2, role='Organization'),
                UserRole(role_id=3, role='Applicant')
            ]
            db.session.add_all(roles)
            db.session.commit()
            print('Default roles created successfully!')
        else:
            print('Roles already exist!')

if __name__ == '__main__':
    init_database()