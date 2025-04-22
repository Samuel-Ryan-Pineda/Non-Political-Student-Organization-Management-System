import re

# Validation Functions
def validate_name(name):
    """Validate name fields."""
    if not name:
        return False
    # Check length between 2 and 50 characters
    if len(name) < 2 or len(name) > 50:
        return False
    # Only allow letters, spaces, hyphens, and apostrophes
    return bool(re.match(r'^[A-Za-z\s\'-]+$', name))

def validate_email(email):
    """Validate email address."""
    if not email:
        return False
    # Regex to match valid email format
    email_regex = r'^[a-zA-Z0-9.*%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_regex, email))

def validate_password(password):
    """
    Validate password:
    - 8-32 characters long
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if not password:
        return False
    # Check length
    if len(password) < 8 or len(password) > 32:
        return False
    # Check complexity requirements
    password_regex = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$'
    return bool(re.match(password_regex, password))

def sanitize_input(input_string):
    """
    Sanitize input to prevent XSS and SQL injection
    Remove or escape any potentially harmful characters
    """
    if not input_string:
        return input_string
    
    # Remove HTML and script tags
    input_string = re.sub(r'<[^>]+>', '', input_string)
    
    # Remove potential SQL injection characters
    input_string = re.sub(r'[;\'"\(\)\{\}\[\]]', '', input_string)
    
    return input_string.strip()

def validate_name_length(name, max_length=50, min_length=2):
    """
    Additional name validation with explicit length checks
    """
    if not name:
        return False
    
    # Strip whitespace and check length
    name = name.strip()
    return min_length <= len(name) <= max_length