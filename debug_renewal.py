#!/usr/bin/env python3

import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.organization_service import get_pending_renewal_applications
from app.models import Application, Organization

def debug_renewal_applications():
    app = create_app()
    
    with app.app_context():
        print("=== DEBUG: Checking Renewal Applications ===")
        
        # First, let's check all applications in the database
        print("\n1. All applications in database:")
        all_apps = Application.query.all()
        for app in all_apps:
            print(f"   ID: {app.application_id}, Org ID: {app.organization_id}, Type: {app.type}, Status: {app.status}")
        
        # Check specifically for renewal applications
        print("\n2. Renewal applications:")
        renewal_apps = Application.query.filter_by(type='Renewal').all()
        for app in renewal_apps:
            print(f"   ID: {app.application_id}, Org ID: {app.organization_id}, Type: {app.type}, Status: {app.status}")
        
        # Check specifically for pending renewal applications
        print("\n3. Pending renewal applications:")
        pending_renewal_apps = Application.query.filter_by(type='Renewal', status='Pending').all()
        for app in pending_renewal_apps:
            print(f"   ID: {app.application_id}, Org ID: {app.organization_id}, Type: {app.type}, Status: {app.status}")
            # Get organization info
            org = Organization.query.get(app.organization_id)
            if org:
                print(f"      Organization: {org.organization_name}")
        
        # Test the service function
        print("\n4. Testing get_pending_renewal_applications() function:")
        try:
            pending_renewals = get_pending_renewal_applications()
            print(f"   Function returned {len(pending_renewals)} results:")
            for renewal in pending_renewals:
                print(f"   - {renewal}")
        except Exception as e:
            print(f"   Error: {str(e)}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    debug_renewal_applications()