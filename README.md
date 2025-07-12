# Non-Political Organization Management System

A web-based system for managing non-political organizations, memberships, and activities.

## System Requirements

- Python 3.8 or higher
- MySQL Server 5.7 or higher

## Setup Instructions

1. Create a MySQL database named `npsoms_db`:
   ```sql
   CREATE DATABASE npsoms_db;
   ```

2. Configure the database connection in `.env` file:
   ```env
   DATABASE_URI=mysql+pymysql://username:password@localhost/npsoms_db
   ```
   Replace `username` and `password` with your MySQL credentials.

3. Run the setup script to install dependencies and initialize the database:
   ```bash
   python setup.py
   ```

4. Start the application:

   For development (with Flask's built-in server):
   ```bash
   python run_dev.py
   ```

   For production (with Waitress server):
   ```bash
   python run_prod.py
   ```

   Or use the original script which selects server based on environment variable:
   ```bash
   python run.py
   ```

## Default Test Accounts

- Admin Account:
  - Email: admin1@gmail.com
  - Password: @Admin123

- User Account:
  - Email: user@gmail.com
  - Password: @User123

## Features

- User authentication and role-based access control
- Organization management
- Member management
- Email verification
- And more...

## Dependencies

All required packages are listed in `requirements.txt` and will be automatically installed during setup:

- Flask
- Flask-SQLAlchemy
- Flask-Login
- Flask-Mail
- Flask-Migrate
- Flask-WTF
- Flask-Bcrypt
- Python-dotenv
- PyMySQL
- Cryptography
- Waitress