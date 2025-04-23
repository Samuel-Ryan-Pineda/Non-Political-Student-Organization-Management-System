import subprocess
import sys
import os

def run_command(command):
    try:
        subprocess.run(command, check=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f'Error running command: {e}')
        return False

def setup():
    print('Setting up Non-Political Organization Management System...')
    
    # Install dependencies
    print('\nInstalling dependencies...')
    if not run_command([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt']):
        print('Failed to install dependencies!')
        return
    
    # Initialize database
    print('\nInitializing database...')
    if not run_command([sys.executable, 'init_db.py']):
        print('Failed to initialize database!')
        return
    
    # Create test accounts
    print('\nCreating test accounts...')
    if not run_command([sys.executable, 'init_test_accounts.py']):
        print('Failed to create test accounts!')
        return
    
    print('\nSetup completed successfully!')
    print('You can now run the application using: python run.py')

if __name__ == '__main__':
    setup()