from app import create_app, db
from app.models import User, EntryKey, Role

def init_test_accounts():
    app = create_app()
    
    with app.app_context():
        # Check if test accounts already exist
        if not User.query.filter_by(email='admin@gmail.com').first() and \
           not User.query.filter_by(email='user@gmail.com').first():
            
            # Create admin account
            admin = User(
                last_name='Admin',
                first_name='Test',
                middle_name=None,
                role_id=1,  # OSOAD role
                email='admin@gmail.com',  # Direct string assignment
                is_active=True
            )
            
            # Create admin password
            admin_password = EntryKey('@Admin123')
            admin_password.user_id = admin.user_id  # This will be set after flush
            
            # Add admin to session and flush to get the ID
            db.session.add(admin)
            db.session.flush()  # This assigns the user_id
            
            # Now set the user_id for the password
            admin_password.user_id = admin.user_id
            db.session.add(admin_password)
            
            # Create user account
            user = User(
                last_name='User',
                first_name='Test',
                middle_name=None,
                role_id=3,  # Applicant role
                email='user@gmail.com',  # Direct string assignment
                is_active=True
            )
            
            # Create user password
            user_password = EntryKey('@User123')
            
            # Add user to session and flush to get the ID
            db.session.add(user)
            db.session.flush()  # This assigns the user_id
            
            # Now set the user_id for the password
            user_password.user_id = user.user_id
            db.session.add(user_password)
            
            # Commit all changes
            db.session.commit()
            print('Test accounts created successfully!')
        else:
            print('Test accounts already exist!')

if __name__ == '__main__':
    init_test_accounts()