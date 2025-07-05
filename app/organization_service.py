from app import db
from app.models import Logo, Organization, Application, ApplicationFile
from datetime import datetime
from flask import flash
import os

def organization_name_exists(org_name):
    """
    Check if an organization with the given name already exists
    
    Args:
        org_name (str): Name of the organization to check
        
    Returns:
        bool: True if organization name exists, False otherwise
    """
    return Organization.query.filter(Organization.organization_name.ilike(org_name)).first() is not None


def save_organization_application(org_name, org_type, logo_file, logo_description, user_id):
    """
    Save organization application data to the database
    
    Args:
        org_name (str): Name of the organization
        org_type (str): Type of the organization
        logo_file (FileStorage): Uploaded logo file
        logo_description (str): Description of the logo
        user_id (int): ID of the user creating the application
        
    Returns:
        tuple: (success, message, application_id)
    """
    try:
        # Validate required fields
        if not org_name or not org_type or not logo_description or not logo_file:
            return False, "All fields are required", None
        
        # Check if organization name already exists
        if organization_name_exists(org_name):
            return False, f"Organization name '{org_name}' is already taken. Please choose a different name.", None
        
        # Save logo to database
        logo_data = logo_file.read()
        new_logo = Logo(logo=logo_data, description=logo_description)
        db.session.add(new_logo)
        db.session.flush()  # Get the logo_id without committing
        
        # Create organization
        new_org = Organization(
            logo_id=new_logo.logo_id,
            user_id=user_id,
            organization_name=org_name,
            type=org_type,
            status="Incomplete"
        )
        db.session.add(new_org)
        db.session.flush()  # Get the organization_id without committing
        
        # Create application
        current_year = datetime.now().year
        academic_year = f"{current_year}-{current_year + 1}"
        new_application = Application(
            organization_id=new_org.organization_id,
            type="New",
            status="Incomplete",
            academic_year=academic_year,
            submission_date=None  # Set to None initially, will be populated when all files are uploaded
        )
        db.session.add(new_application)
        
        # Commit all changes
        db.session.commit()
        
        return True, "Organization information saved successfully!", new_application.application_id
        
    except Exception as e:
        db.session.rollback()
        return False, f"An error occurred: {str(e)}", None


def get_organization_by_user_id(user_id):
    """
    Get organization by user ID
    
    Args:
        user_id (int): ID of the user
        
    Returns:
        Organization: Organization object or None
    """
    return Organization.query.filter_by(user_id=user_id).first()


def user_has_organization(user_id):
    """
    Check if a user already has an organization
    
    Args:
        user_id (int): ID of the user
        
    Returns:
        bool: True if user has an organization, False otherwise
    """
    org = get_organization_by_user_id(user_id)
    return org is not None


def get_application_by_organization_id(organization_id):
    """
    Get application by organization ID
    
    Args:
        organization_id (int): ID of the organization
        
    Returns:
        Application: Application object or None
    """
    return Application.query.filter_by(organization_id=organization_id).first()


def get_logo_by_id(logo_id):
    """
    Get logo by ID
    
    Args:
        logo_id (int): ID of the logo
        
    Returns:
        Logo: Logo object or None
    """
    return Logo.query.get(logo_id)


def get_application_by_id(application_id):
    """
    Get application by ID
    
    Args:
        application_id (int): ID of the application
        
    Returns:
        Application: Application object or None
    """
    return Application.query.get(application_id)


def get_organization_by_id(organization_id):
    """
    Get organization by ID
    
    Args:
        organization_id (int): ID of the organization
        
    Returns:
        Organization: Organization object or None
    """
    return Organization.query.get(organization_id)


def get_pending_applications():
    """
    Get all pending organization applications
    
    Returns:
        list: List of dictionaries containing application information
    """
    try:
        # Query for organizations with applications that have status 'Pending' only
        applications = db.session.query(
            Application, Organization, Logo
        ).join(
            Organization, Application.organization_id == Organization.organization_id
        ).outerjoin(
            Logo, Organization.logo_id == Logo.logo_id
        ).filter(
            Application.status == 'Pending'
        ).order_by(
            Application.submission_date.desc()
        ).all()
        
        result = []
        for app, org, logo in applications:
            # Count pending files for this application
            pending_count = db.session.query(ApplicationFile).filter(
                ApplicationFile.application_id == app.application_id,
                ApplicationFile.status.in_(['Pending', 'Incomplete'])
            ).count()
            
            result.append({
                'application_id': app.application_id,
                'organization_id': org.organization_id,
                'organization_name': org.organization_name,
                'submission_date': app.submission_date.strftime('%B %d, %Y, %I:%M %p') if app.submission_date else 'Not submitted',
                'status': app.status,
                'logo_id': org.logo_id,
                'pending_count': pending_count
            })
        
        return result
    except Exception as e:
        print(f"Error fetching pending applications: {str(e)}")
        return []