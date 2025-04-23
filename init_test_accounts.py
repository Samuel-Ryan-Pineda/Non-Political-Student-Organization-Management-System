from app import create_app, db
from app.models import User, Email, EntryKey, UserRole

def init_test_accounts():
    app = create_app()
    
    with app.app_context():
        # Check if test accounts already exist
        if not Email.query.filter_by(email='admin1@gmail.com').first() and \
           not Email.query.filter_by(email='user@gmail.com').first():
            
            # Create admin account
            admin = User(
                last_name='Admin',
                first_name='Test',
                middle_name=None,
                role_id=1,  # OSOAD role
                is_active=True
            )
            admin_email = Email(email='admin1@gmail.com')
            admin_password = EntryKey('@Admin123')
            admin.email = admin_email
            admin.entrykey = admin_password
            db.session.add(admin)
            
            # Create user account
            user = User(
                last_name='User',
                first_name='Test',
                middle_name=None,
                role_id=3,  # Applicant role
                is_active=True
            )
            user_email = Email(email='user@gmail.com')
            user_password = EntryKey('@User123')
            user.email = user_email
            user.entrykey = user_password
            db.session.add(user)
            
            # Commit changes
            db.session.commit()
            print('Test accounts created successfully!')
        else:
            print('Test accounts already exist!')

if __name__ == '__main__':
    init_test_accounts()