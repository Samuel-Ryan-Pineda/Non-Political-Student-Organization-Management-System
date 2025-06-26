from app import create_app, db
from app.models import User, EntryKey, Role

def init_database():
    app = create_app()
    
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if roles already exist
        if not Role.query.first():
            # Create default roles
            roles = [
                Role(role_id=1, role_name='OSOAD', role_description='Office of Student Organization and Activities Development'),
                Role(role_id=2, role_name='Organization', role_description='Student Organization'),
                Role(role_id=3, role_name='Applicant', role_description='Student Organization Applicant')
            ]
            db.session.add_all(roles)
            db.session.commit()
            print('Default roles created successfully!')
        else:
            print('Roles already exist!')

if __name__ == '__main__':
    init_database()