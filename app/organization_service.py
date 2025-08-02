from app import db
from app.models import Logo, Organization, Application, ApplicationFile
from datetime import datetime
from flask import flash
import os

def get_all_active_organizations():
    """
    Get all active organizations from the database
    
    Returns:
        list: List of dictionaries containing organization information
    """
    try:
        # Query for organizations with status 'Active'
        organizations = db.session.query(
            Organization, Logo
        ).outerjoin(
            Logo, Organization.logo_id == Logo.logo_id
        ).filter(
            Organization.status == 'Active'
        ).order_by(
            Organization.organization_name
        ).all()
        
        result = []
        for org, logo in organizations:
            result.append({
                'organization_id': org.organization_id,
                'organization_name': org.organization_name,
                'type': org.type,
                'tagline': org.tagline,
                'description': org.description,
                'logo_id': org.logo_id,
                'status': org.status
            })
        
        return result
    except Exception as e:
        print(f"Error fetching active organizations: {str(e)}")
        return []

def organization_name_exists(org_name):
    """
    Check if an organization with the given name already exists
    
    Args:
        org_name (str): Name of the organization to check
        
    Returns:
        bool: True if organization name exists, False otherwise
    """
    # Use exists() instead of first() for better performance when we only need to check existence
    return db.session.query(db.exists().where(Organization.organization_name.ilike(org_name))).scalar()


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
    # Use filter_by for exact matches and add options to optimize query
    return Organization.query.filter_by(user_id=user_id).options(db.joinedload(Organization.logo)).first()


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


def get_adviser_by_organization_id(organization_id, adviser_type='Adviser'):
    """
    Get adviser information for an organization
    
    Args:
        organization_id (int): ID of the organization
        adviser_type (str): Type of adviser (Adviser/Co-Adviser)
        
    Returns:
        dict: Dictionary containing adviser information or None
    """
    from app.models import Advisory, Adviser
    
    # Get the advisory for the organization by type
    advisory = Advisory.query.filter_by(
        organization_id=organization_id,
        type=adviser_type
    ).first()
    
    if not advisory:
        return None
    
    # Get the adviser information
    adviser = Adviser.query.get(advisory.adviser_id)
    
    if not adviser:
        return None
    
    # Return adviser information
    return {
        'adviser_id': adviser.adviser_id,
        'first_name': adviser.first_name,
        'middle_name': adviser.middle_name,
        'last_name': adviser.last_name,
        'full_name': f"{adviser.first_name} {adviser.middle_name + ' ' if adviser.middle_name else ''}{adviser.last_name}",
        'type': adviser_type
    }

def save_adviser_info(organization_id, first_name, middle_name, last_name, adviser_type, status):
    """
    Save or update adviser information for an organization
    
    Args:
        organization_id (int): ID of the organization
        first_name (str): Adviser's first name
        middle_name (str): Adviser's middle name
        last_name (str): Adviser's last name
        adviser_type (str): Type of adviser (Adviser/Co-Adviser)
        status (str): Status of adviser (active/inactive)
        
    Returns:
        dict: {'success': bool, 'message': str}
    """
    from app.models import Advisory, Adviser
    
    # Validate required fields
    if not first_name or not last_name or not adviser_type or not status:
        return {'success': False, 'message': 'First name, last name, adviser type and status are required'}
    
    try:
        # Check if an advisory of this type already exists
        advisory = Advisory.query.filter_by(
            organization_id=organization_id,
            type=adviser_type
        ).first()
        
        adviser = None
        if advisory and advisory.adviser_id:
            adviser = Adviser.query.get(advisory.adviser_id)
        
        if not adviser:
            # Create new adviser
            adviser = Adviser(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name
            )
            db.session.add(adviser)
            db.session.flush()

            # Create advisory relationship
            advisory = Advisory(
                organization_id=organization_id,
                adviser_id=adviser.adviser_id,
                type=adviser_type,
                status=status
            )
            db.session.add(advisory)
        else:
            # Update existing adviser
            adviser.first_name = first_name
            adviser.middle_name = middle_name
            adviser.last_name = last_name
            # Update advisory status
            advisory.status = status
        
        db.session.commit()
        return {'success': True, 'message': 'Adviser information saved successfully'}
        
    except Exception as e:
        db.session.rollback()
        return {'success': False, 'message': f'Error saving adviser info: {str(e)}'}


def get_social_media_by_organization_id(organization_id):
    """
    Get social media links for an organization
    
    Args:
        organization_id (int): ID of the organization
        
    Returns:
        list: List of dictionaries containing social media information
    """
    from app.models import SocialMedia
    
    # Get all social media links for the organization
    social_media = SocialMedia.query.filter_by(organization_id=organization_id).all()
    
    result = []
    for sm in social_media:
        result.append({
            'social_media_id': sm.social_media_id,
            'platform': sm.platform,
            'link': sm.link
        })
    
    return result

def save_social_media(organization_id, platform, link):
    """
    Save social media link for an organization
    
    Args:
        organization_id (int): ID of the organization
        platform (str): Social media platform name
        link (str): URL of the social media profile
        
    Returns:
        dict: Dictionary with success status and message
    """
    from app.models import SocialMedia
    
    try:
        # Check if this platform already exists for this organization
        existing = SocialMedia.query.filter_by(
            organization_id=organization_id,
            platform=platform
        ).first()
        
        if existing:
            return {
                'success': False,
                'message': f'{platform.capitalize()} link already exists for this organization'
            }
        
        # Create new social media link
        new_social_media = SocialMedia(
            organization_id=organization_id,
            platform=platform,
            link=link
        )
        db.session.add(new_social_media)
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Social media link saved successfully'
        }
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'message': f'Error saving social media link: {str(e)}'
        }

def update_social_media(organization_id, platform, link):
    """
    Update existing social media link for an organization
    
    Args:
        organization_id (int): ID of the organization
        platform (str): Social media platform name
        link (str): URL of the social media profile
        
    Returns:
        dict: Dictionary with success status and message
    """
    from app.models import SocialMedia
    
    try:
        # Find the social media record to update
        social_media = SocialMedia.query.filter_by(
            organization_id=organization_id,
            platform=platform
        ).first()
        
        if not social_media:
            return {
                'success': False,
                'message': f'{platform.capitalize()} link not found for this organization'
            }
        
        # Update the link
        social_media.link = link
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Social media link updated successfully'
        }
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'message': f'Error updating social media link: {str(e)}'
        }

def delete_social_media(organization_id, platform):
    """
    Delete social media link for an organization
    
    Args:
        organization_id (int): ID of the organization
        platform (str): Social media platform name
        
    Returns:
        dict: Dictionary with success status and message
    """
    from app.models import SocialMedia
    
    try:
        # Find the social media record to delete
        social_media = SocialMedia.query.filter_by(
            organization_id=organization_id,
            platform=platform
        ).first()
        
        if not social_media:
            return {
                'success': False,
                'message': f'{platform.capitalize()} link not found for this organization'
            }
        
        # Delete the record
        db.session.delete(social_media)
        db.session.commit()
        
        return {
            'success': True,
            'message': 'Social media link deleted successfully'
        }
    except Exception as e:
        db.session.rollback()
        return {
            'success': False,
            'message': f'Error deleting social media link: {str(e)}'
        }

def get_affiliations_by_position_type(organization_id, position_type):
    """
    Get affiliations for an organization by position type
    
    Args:
        organization_id (int): ID of the organization
        position_type (str): Type of position (Officer, Member, Volunteer)
        
    Returns:
        list: List of dictionaries containing affiliation information
    """
    from app.models import Affiliation, Student, Program
    
    # Define position categories
    officer_positions = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'P.I.O', 'Business Manager']
    member_positions = ['Member']
    volunteer_positions = ['Volunteer']
    
    # Determine which positions to query based on position_type
    if position_type == 'Officer':
        positions = officer_positions
    elif position_type == 'Member':
        positions = member_positions
    elif position_type == 'Volunteer':
        positions = volunteer_positions
    else:
        return []
    
    # Get all affiliations for the organization with the specified positions
    affiliations = db.session.query(
        Affiliation, Student, Program
    ).join(
        Student, Affiliation.student_id == Student.student_id
    ).join(
        Program, Student.program_id == Program.program_id
    ).filter(
        Affiliation.organization_id == organization_id,
        Affiliation.position.in_(positions)
    ).all()
    
    result = []
    for affiliation, student, program in affiliations:
        result.append({
            'affiliation_id': affiliation.affiliation_id,
            'student_id': student.student_id,
            'student_no': student.student_number,
            'name': f"{student.first_name} {student.middle_name + ' ' if student.middle_name else ''}{student.last_name}",
            'position': affiliation.position,
            'program': program.program_code,
            'academic_year': affiliation.academic_year
        })
    
    return result

def get_pending_applications():
    """
    Get all pending NEW organization applications
    
    Returns:
        list: List of dictionaries containing application information
    """
    try:
        # Query for organizations with applications that have status 'Pending' and type 'New' only
        applications = db.session.query(
            Application, Organization, Logo
        ).join(
            Organization, Application.organization_id == Organization.organization_id
        ).outerjoin(
            Logo, Organization.logo_id == Logo.logo_id
        ).filter(
            Application.status == 'Pending',
            Application.type == 'New'
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

def get_pending_renewal_applications():
    """
    Get all pending RENEWAL organization applications
    
    Returns:
        list: List of dictionaries containing renewal application information
    """
    try:
        # Query for organizations with applications that have status 'Pending' and type 'Renewal' only
        applications = db.session.query(
            Application, Organization, Logo
        ).join(
            Organization, Application.organization_id == Organization.organization_id
        ).outerjoin(
            Logo, Organization.logo_id == Logo.logo_id
        ).filter(
            Application.status == 'Pending',
            Application.type == 'Renewal'
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
        print(f"Error fetching pending renewal applications: {str(e)}")
        return []

def get_organization_statistics(organization_id):
    """
    Get statistics for an organization
    
    Args:
        organization_id (int): ID of the organization
        
    Returns:
        dict: Dictionary containing organization statistics
    """
    from app.models import Affiliation, Application, Plan
    
    try:
        # Get member count (officers + members, not including volunteers)
        officer_positions = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor', 'P.I.O', 'Business Manager']
        member_positions = ['Member']
        
        # Count officers
        officer_count = db.session.query(Affiliation).filter(
            Affiliation.organization_id == organization_id,
            Affiliation.position.in_(officer_positions)
        ).count()
        
        # Count members
        member_count = db.session.query(Affiliation).filter(
            Affiliation.organization_id == organization_id,
            Affiliation.position.in_(member_positions)
        ).count()
        
        # Total members = officers + members (not including volunteers)
        total_members = officer_count + member_count
        
        # Count volunteers
        volunteer_count = db.session.query(Affiliation).filter(
            Affiliation.organization_id == organization_id,
            Affiliation.position == 'Volunteer'
        ).count()
        
        # Count accomplished activities (plans with accomplished_date set)
        application = Application.query.filter_by(organization_id=organization_id).first()
        accomplished_activities = 0
        if application:
            accomplished_activities = db.session.query(Plan).filter(
                Plan.application_id == application.application_id,
                Plan.accomplished_date.isnot(None)
            ).count()
        
        # Get organization status
        organization = get_organization_by_id(organization_id)
        org_status = organization.status if organization else 'Unknown'
        
        return {
            'member_count': total_members,
            'volunteer_count': volunteer_count,
            'accomplished_activities': accomplished_activities,
            'organization_status': org_status
        }
        
    except Exception as e:
        print(f"Error calculating organization statistics: {str(e)}")
        return {
            'member_count': 0,
            'volunteer_count': 0,
            'accomplished_activities': 0,
            'organization_status': 'Unknown'
        }

def get_plans_by_organization_id(organization_id):
    """
    Get plans for an organization
    
    Args:
        organization_id (int): ID of the organization
        
    Returns:
        list: List of dictionaries containing plan information
    """
    from app.models import Plan, Application
    
    try:
        # Get the application for this organization
        application = Application.query.filter_by(organization_id=organization_id).first()
        
        if not application:
            return []
        
        # Get all plans for this application
        plans = Plan.query.filter_by(application_id=application.application_id).all()
        
        result = []
        for plan in plans:
            result.append({
                'plan_id': plan.plan_id,
                'title': plan.title,
                'objectives': plan.objectives,
                'proposed_date': plan.proposed_date.strftime('%Y-%m-%d') if plan.proposed_date else '',
                'people_involved': plan.people_involved,
                'funding_source': plan.funding_source,
                'accomplished_date': plan.accomplished_date.strftime('%Y-%m-%d') if plan.accomplished_date else '',
                'target_output': plan.target_output,
                'outcome': plan.outcome,
                'is_accomplished': plan.accomplished_date is not None
            })
        
        return result
        
    except Exception as e:
        print(f"Error fetching plans: {str(e)}")
        return []
