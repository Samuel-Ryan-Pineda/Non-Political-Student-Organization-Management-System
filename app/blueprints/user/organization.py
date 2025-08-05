from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, send_file, abort, session
from flask_login import login_required, current_user
from app.models import db, Logo, Application, ApplicationFile, Organization
from datetime import datetime
from werkzeug.utils import secure_filename
import io
import os

user_organization_bp = Blueprint('user_organization', __name__)

@user_organization_bp.route('/download-excel-template')
@login_required
def download_excel_template():
    # Get template type from query parameter (officers, members, volunteers, or plans)
    template_type = request.args.get('type', 'officers')
    
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this resource", "error")
        return redirect(url_for('main.index'))
    
    # Set file name based on template type
    if template_type == 'officers':
        template_filename = 'board_of_officers_template.xlsx'
        download_name = 'board_of_officers_template.xlsx'
    elif template_type == 'volunteers':
        template_filename = 'volunteers_template.xlsx'
        download_name = 'volunteers_template.xlsx'
    elif template_type == 'plans':
        template_filename = 'plans_template.xlsx'
        download_name = 'plans_template.xlsx'
    else:  # members
        template_filename = 'members_template.xlsx'
        download_name = 'members_template.xlsx'
    
    # Path to the template file
    template_path = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), 
                               'static', 'templates', template_filename)
    
    # Check if file exists
    if not os.path.exists(template_path):
        # If template doesn't exist, create a new one with pandas
        try:
            import pandas as pd
            from app.models import Program
            
            # Get valid program codes for the example
            program_codes = [p.program_code for p in Program.query.all()[:5]]
            if not program_codes:  # Fallback if no programs in database
                program_codes = ['BSIT', 'BSDS', 'BSCE', 'BSEE', 'BSME']
            
            # Create sample data based on template type
            if template_type == 'officers':
                sample_data = [
                    {'Position': 'President', 'Student Number': '20210001', 'First Name': 'Juan', 'Middle Name': 'Dela', 'Last Name': 'Cruz', 'Program': program_codes[0]},
                    {'Position': 'Vice President', 'Student Number': '20210002', 'First Name': 'Maria', 'Middle Name': 'Santos', 'Last Name': 'Reyes', 'Program': program_codes[0]},
                    {'Position': 'Secretary', 'Student Number': '20210003-A', 'First Name': 'Pedro', 'Middle Name': 'Gomez', 'Last Name': 'Lim', 'Program': program_codes[1]},
                    {'Position': 'Treasurer', 'Student Number': '20210004', 'First Name': 'Ana', 'Middle Name': 'Marie', 'Last Name': 'Garcia', 'Program': program_codes[1]},
                    {'Position': 'Auditor', 'Student Number': 'SUM2022-00005', 'First Name': 'Jose', 'Middle Name': 'Manuel', 'Last Name': 'Santos', 'Program': program_codes[2]},
                ]
                sheet_name = 'Officers'
                instructions_title = 'Instructions for filling out the Officers template:'
            elif template_type == 'volunteers':
                sample_data = [
                    {'Student Number': '20210011', 'First Name': 'Miguel', 'Middle Name': 'Angel', 'Last Name': 'Rodriguez', 'Program': program_codes[0]},
                    {'Student Number': '20210012', 'First Name': 'Carmen', 'Middle Name': 'Rosa', 'Last Name': 'Fernandez', 'Program': program_codes[1]},
                    {'Student Number': '20210013-C', 'First Name': 'Luis', 'Middle Name': '', 'Last Name': 'Martinez', 'Program': program_codes[2]},
                    {'Student Number': '20210014', 'First Name': 'Elena', 'Middle Name': 'Grace', 'Last Name': 'Morales', 'Program': program_codes[3]},
                    {'Student Number': 'SUM2022-00015', 'First Name': 'Ricardo', 'Middle Name': 'Pablo', 'Last Name': 'Villanueva', 'Program': program_codes[4]},
                ]
                sheet_name = 'Volunteers'
                instructions_title = 'Instructions for filling out the Volunteers template:'
            elif template_type == 'plans':
                sample_data = [
                    {'Programs/Projects/Activities': 'Annual General Assembly', 'Objectives': 'To gather all members and discuss yearly plans', 'Proposed Date': '2023-08-15', 'People Involved': 'All members and officers', 'Source of Funds': 'Organization funds', 'Target Output': 'Approved annual plan'},
                    {'Programs/Projects/Activities': 'Community Outreach Program', 'Objectives': 'To help local communities with educational materials', 'Proposed Date': '2023-09-20', 'People Involved': 'Volunteer committee', 'Source of Funds': 'Donations', 'Target Output': '100 students reached'},
                    {'Programs/Projects/Activities': 'Leadership Training Workshop', 'Objectives': 'To develop leadership skills among members', 'Proposed Date': '2023-10-10', 'People Involved': 'Officers and selected members', 'Source of Funds': 'Organization funds', 'Target Output': '30 trained leaders'},
                    {'Programs/Projects/Activities': 'Academic Excellence Seminar', 'Objectives': 'To provide academic support to students', 'Proposed Date': '2023-11-05', 'People Involved': 'Academic committee', 'Source of Funds': 'University grant', 'Target Output': 'Improved academic performance'},
                    {'Programs/Projects/Activities': 'Year-End Celebration', 'Objectives': 'To celebrate achievements and recognize outstanding members', 'Proposed Date': '2023-12-15', 'People Involved': 'All members and officers', 'Source of Funds': 'Organization funds and sponsors', 'Target Output': 'Successful recognition program'},
                ]
                sheet_name = 'Plans'
                instructions_title = 'Instructions for filling out the Plans template:'
            else:  # members
                sample_data = [
                    {'Student Number': '20210006', 'First Name': 'Carlos', 'Middle Name': 'Miguel', 'Last Name': 'Tan', 'Program': program_codes[0]},
                    {'Student Number': '20210007', 'First Name': 'Sofia', 'Middle Name': 'Luna', 'Last Name': 'Reyes', 'Program': program_codes[1]},
                    {'Student Number': '20210008-B', 'First Name': 'Diego', 'Middle Name': '', 'Last Name': 'Santos', 'Program': program_codes[2]},
                    {'Student Number': '20210009', 'First Name': 'Isabella', 'Middle Name': 'Marie', 'Last Name': 'Cruz', 'Program': program_codes[3]},
                    {'Student Number': 'SUM2022-00010', 'First Name': 'Gabriel', 'Middle Name': 'Jose', 'Last Name': 'Garcia', 'Program': program_codes[4]},
                ]
                sheet_name = 'Members'
                instructions_title = 'Instructions for filling out the Members template:'
            
            # Create DataFrame
            df = pd.DataFrame(sample_data)
            
            # Create a temporary file path for the Excel file
            import tempfile
            temp_file = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
            temp_file.close()
            
            # Create Excel writer with file path instead of BytesIO
            with pd.ExcelWriter(temp_file.name, engine='xlsxwriter') as writer:
                df.to_excel(writer, sheet_name=sheet_name, index=False)
                
                # Get the xlsxwriter workbook and worksheet objects
                workbook = writer.book
                worksheet = writer.sheets[sheet_name]
                
                # Add a header format
                header_format = workbook.add_format({
                    'bold': True,
                    'text_wrap': True,
                    'valign': 'top',
                    'fg_color': '#D7E4BC',
                    'border': 1
                })
                
                # Write the column headers with the defined format
                for col_num, value in enumerate(df.columns.values):
                    worksheet.write(0, col_num, value, header_format)
                    
                    # For Plans template, adjust column width based on content
                    if template_type == 'plans':
                        # Calculate the maximum width needed for this column
                        max_len = max([len(str(value))] + [len(str(df.iloc[i, col_num])) for i in range(len(df))])
                        # Add some padding and set the column width
                        worksheet.set_column(col_num, col_num, max_len + 3)
                    else:
                        worksheet.set_column(col_num, col_num, 15)  # Set fixed column width for other templates
                
                # Add instructions in a new sheet
                instructions_sheet = workbook.add_worksheet('Instructions')
                
                # Create instructions based on template type
                instructions = [
                    [instructions_title],
                    ['']
                ]
                
                # Add column descriptions based on template type
                if template_type == 'officers':
                    instructions.extend([
                        ['1. Position: The role of the officer in the organization (e.g., President, Vice President, etc.)'],
                        ['2. Student Number: The student\'s identification number as shown on their school ID'],
                        ['3. First Name: The first name of the student'],
                        ['4. Middle Name: The middle name of the student (can be left blank)'],
                        ['5. Last Name: The last name of the student'],
                        ['6. Program: Must be one of the valid program codes listed below']
                    ])
                elif template_type == 'volunteers':
                    instructions.extend([
                        ['1. Student Number: The student\'s identification number as shown on their school ID'],
                        ['2. First Name: The first name of the student'],
                        ['3. Middle Name: The middle name of the student (can be left blank)'],
                        ['4. Last Name: The last name of the student'],
                        ['5. Program: Must be one of the valid program codes listed below'],
                        [''],
                        ['Note: All uploaded students will automatically be assigned the "Volunteer" position.']
                    ])
                elif template_type == 'plans':
                    instructions.extend([
                        ['1. Programs/Projects/Activities: The title of the planned activity'],
                        ['2. Objectives: The goals or objectives of the activity'],
                        ['3. Proposed Date: The planned date for the activity (format: YYYY-MM-DD)'],
                        ['4. People Involved: The people or groups who will be involved in the activity'],
                        ['5. Source of Funds: Where the funding for the activity will come from'],
                        ['6. Target Output: The expected outcomes or results of the activity']
                    ])
                else:  # members
                    instructions.extend([
                        ['1. Student Number: The student\'s identification number as shown on their school ID'],
                        ['2. First Name: The first name of the student'],
                        ['3. Middle Name: The middle name of the student (can be left blank)'],
                        ['4. Last Name: The last name of the student'],
                        ['5. Program: Must be one of the valid program codes listed below']
                    ])
                
                # Only add program codes for templates that need them
                if template_type != 'plans':
                    instructions.extend([
                        [''],
                        ['Valid Program Codes:']
                    ])
                    
                    # Add all program codes from the database
                    all_programs = Program.query.all()
                    for i, program in enumerate(all_programs):
                        instructions.append([f'{program.program_code}: {program.program_name}'])
                
                # Write instructions
                for row_num, instruction in enumerate(instructions):
                    instructions_sheet.write(row_num, 0, instruction[0])
                
                instructions_sheet.set_column(0, 0, 60)  # Set column width
            
            # Return the generated Excel file from the temporary file
            return send_file(
                temp_file.name,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=download_name
            )
            
        except Exception as e:
            flash(f"Error creating template: {str(e)}", "error")
            return redirect(url_for('user_organization.application'))
    
    # Return the file as an attachment
    return send_file(template_path, 
                    mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    as_attachment=True,
                    download_name=download_name)

@user_organization_bp.route('/import-excel', methods=['POST'])
@login_required
def import_excel():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access this resource"})
    
    # Check if the post request has the file part
    if 'excel_file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'})
    
    file = request.files['excel_file']
    
    # If user does not select file, browser also submits an empty part without filename
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'})
    
    # Check if the file is an Excel file
    if not allowed_file(file.filename, {'xlsx', 'xls'}):
        return jsonify({'success': False, 'message': 'File type not allowed. Please upload an Excel file.'})
    
    try:
        # Import necessary libraries for Excel processing
        import pandas as pd
        from app.models import db, Organization
        
        # Get organization ID from form data
        organization_id = request.form.get('organization_id')
        if not organization_id:
            return jsonify({'success': False, 'message': 'Organization ID is required'})
        
        # Get upload type (officers, members, or volunteers)
        upload_type = request.form.get('upload_type', 'officers')
        
        # Get the organization from the database
        organization = Organization.query.get(organization_id)
        if not organization:
            return jsonify({'success': False, 'message': 'Organization not found'})
        
        # Check if the current user is authorized to modify this organization
        if organization.user_id != current_user.user_id:
            return jsonify({'success': False, 'message': 'You are not authorized to modify this organization'})
        
        # Read the Excel file
        df = pd.read_excel(file)
        
        # Validate the Excel file structure based on upload type
        if upload_type == 'officers':
            required_columns = ['Position', 'Student Number', 'First Name', 'Middle Name', 'Last Name', 'Program']
        elif upload_type == 'volunteers':
            required_columns = ['Student Number', 'First Name', 'Middle Name', 'Last Name', 'Program']
        elif upload_type == 'plans':
            required_columns = ['Programs/Projects/Activities', 'Objectives', 'Proposed Date', 'People Involved', 'Source of Funds', 'Target Output']
        else:  # members
            required_columns = ['Student Number', 'First Name', 'Middle Name', 'Last Name', 'Program']
            
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({
                'success': False, 
                'message': f'Missing required columns: {", ".join(missing_columns)}'
            })
        
        # Check if the Excel file is empty
        if df.empty:
            return jsonify({
                'success': False,
                'message': 'The Excel file is empty. Please add data to the file.'
            })
        
        # Remove rows where all required fields are empty
        df = df.dropna(subset=required_columns, how='all')
        
        # Check if there are any rows left after removing empty rows
        if df.empty:
            return jsonify({
                'success': False,
                'message': 'No valid data found in the Excel file. Please ensure all required fields are filled.'
            })
        
        # Validate data based on upload type
        if upload_type != 'plans':
            # Validate student numbers (can contain numbers, letters, and hyphens)
            invalid_student_numbers = []
            for index, row in df.iterrows():
                student_no = str(row['Student Number']).strip()
                # Allow alphanumeric characters and hyphens
                if not student_no or not all(c.isalnum() or c == '-' for c in student_no):
                    invalid_student_numbers.append(f"Row {index+1}: '{student_no}'")
            
            if invalid_student_numbers:
                error_msg = 'Invalid student numbers found. Please check your student ID numbers.'
                if len(invalid_student_numbers) <= 5:
                    error_msg += f" Issues: {', '.join(invalid_student_numbers)}"
                else:
                    error_msg += f" Issues: {', '.join(invalid_student_numbers[:5])} and {len(invalid_student_numbers) - 5} more."
                return jsonify({
                    'success': False,
                    'message': error_msg
                })
            
            # Validate program codes against database
            from app.models import Program
            valid_program_codes = [p.program_code.upper() for p in Program.query.all()]
            invalid_programs = []
            
            for index, row in df.iterrows():
                program_code = str(row['Program']).strip().upper()
                if program_code not in valid_program_codes:
                    invalid_programs.append(f"Row {index+1}: '{row['Program']}'")
            
            if invalid_programs:
                error_msg = 'Invalid program codes found. Please use valid program codes.'
                if len(invalid_programs) <= 5:
                    error_msg += f" Issues: {', '.join(invalid_programs)}"
                else:
                    error_msg += f" Issues: {', '.join(invalid_programs[:5])} and {len(invalid_programs) - 5} more."
                return jsonify({
                    'success': False,
                    'message': error_msg
                })
        else:
            # Validate date format for Plans
            invalid_dates = []
            for index, row in df.iterrows():
                proposed_date = row['Proposed Date']
                if not pd.isna(proposed_date):
                    try:
                        # Try to parse the date
                        if isinstance(proposed_date, str):
                            pd.to_datetime(proposed_date)
                    except Exception:
                        invalid_dates.append(f"Row {index+1}: '{proposed_date}'")
            
            if invalid_dates:
                error_msg = 'Invalid date format found. Please use YYYY-MM-DD format.'
                if len(invalid_dates) <= 5:
                    error_msg += f" Issues: {', '.join(invalid_dates)}"
                else:
                    error_msg += f" Issues: {', '.join(invalid_dates[:5])} and {len(invalid_dates) - 5} more."
                return jsonify({
                    'success': False,
                    'message': error_msg
                })
        
        # Process the data and save to database
        from app.models import Student, Program, Affiliation, Address, Plan, Application
        from datetime import datetime
        
        # Get current academic year
        current_year = datetime.now().year
        academic_year = f"{current_year}-{current_year + 1}"
        
        # Process each row in the Excel file
        success_count = 0
        error_messages = []
        
        # Get the application for this organization
        from app.organization_service import get_application_by_organization_id
        application = get_application_by_organization_id(organization.organization_id, 'New')
        if not application and upload_type == 'plans':
            return jsonify({
                'success': False,
                'message': 'No application found for this organization. Please create an application first.'
            })
        
        for index, row in df.iterrows():
            try:
                if upload_type != 'plans':
                    # Get program by code (case-insensitive)
                    from sqlalchemy import func
                    program = Program.query.filter(func.upper(Program.program_code) == str(row['Program']).strip().upper()).first()
                    if not program:
                        error_messages.append(f"Row {index+1}: Program code '{row['Program']}' not found")
                        continue
                    
                    # Check if student already exists
                    student = Student.query.filter_by(student_number=row['Student Number']).first()
                    
                    if not student:
                        # Create a default address (can be updated later)
                        address = Address(city="Default City", province="Default Province")
                        db.session.add(address)
                        db.session.flush()  # Get the address ID
                        
                        # Handle nan values from pandas - convert to None for database
                        middle_name = row['Middle Name']
                        if pd.isna(middle_name):
                            middle_name = None
                        
                        # Create new student
                        student = Student(
                            program_id=program.program_id,
                            address_id=address.address_id,
                            first_name=str(row['First Name']).strip(),
                            middle_name=middle_name,
                            last_name=str(row['Last Name']).strip(),
                            student_number=str(row['Student Number']).strip()
                        )
                        db.session.add(student)
                        db.session.flush()  # Get the student ID
                    
                    # Set position based on upload type
                    if upload_type == 'officers':
                        position = row.get('Position', 'Member')
                        # Handle nan values for position
                        if pd.isna(position):
                            position = 'Member'
                        else:
                            position = str(position).strip()
                    elif upload_type == 'volunteers':
                        position = 'Volunteer'
                    else:  # members
                        position = 'Member'
                    
                    # Check if affiliation already exists
                    existing_affiliation = Affiliation.query.filter_by(
                        student_id=student.student_id,
                        organization_id=organization.organization_id,
                        position=position,
                        academic_year=academic_year
                    ).first()
                    
                    if not existing_affiliation:
                        # Create new affiliation
                        affiliation = Affiliation(
                            student_id=student.student_id,
                            organization_id=organization.organization_id,
                            position=position,
                            academic_year=academic_year
                        )
                        db.session.add(affiliation)
                else:  # Plans upload type
                    # Handle nan values from pandas - convert to None for database
                    title = str(row['Programs/Projects/Activities']).strip()
                    objectives = str(row['Objectives']).strip() if not pd.isna(row['Objectives']) else None
                    proposed_date = None
                    if not pd.isna(row['Proposed Date']):
                        if isinstance(row['Proposed Date'], str):
                            proposed_date = pd.to_datetime(row['Proposed Date']).date()
                        else:  # Already a datetime
                            proposed_date = row['Proposed Date'].date()
                    people_involved = str(row['People Involved']).strip() if not pd.isna(row['People Involved']) else None
                    funding_source = str(row['Source of Funds']).strip() if not pd.isna(row['Source of Funds']) else None
                    target_output = str(row['Target Output']).strip() if not pd.isna(row['Target Output']) else None
                    
                    # Create new plan
                    plan = Plan(
                        application_id=application.application_id,
                        title=title,
                        objectives=objectives,
                        proposed_date=proposed_date,
                        people_involved=people_involved,
                        funding_source=funding_source,
                        target_output=target_output
                    )
                    db.session.add(plan)
                
                success_count += 1
            except Exception as e:
                # Rollback the current transaction for this row
                db.session.rollback()
                error_messages.append(f"Row {index+1}: {str(e)}")
                # Continue processing other rows
        
        # Commit changes to database
        try:
            db.session.commit()
            
            # Prepare response message
            message = f"Successfully imported {success_count} records."
            if error_messages:
                message += f" Encountered {len(error_messages)} errors: {'; '.join(error_messages[:5])}"
                if len(error_messages) > 5:
                    message += f" and {len(error_messages) - 5} more."
            
            return jsonify({'success': True, 'message': message})
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'message': f"Database error: {str(e)}"})
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error importing Excel file: {str(e)}")
        return jsonify({'success': False, 'message': f'Error processing file: {str(e)}'})


def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

@user_organization_bp.route('/org/dashboard')
@login_required
def org_dashboard():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        if current_user.role_id == 1:
            return redirect(url_for('admin_routes.admin_dashboard'))
        else:
            return redirect(url_for('auth.logout'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import user_has_organization
    
    # Check if user already has an organization
    if user_has_organization(current_user.user_id):
        # User has an organization, show the application page
        return redirect(url_for('user_organization.application'))
    else:
        # User doesn't have an organization, redirect to first step blueprint
        return redirect(url_for('application_first_step.first_step'))

# This route has been moved to neworganization.py
@user_organization_bp.route('/application')
@login_required
def application():
    # Redirect to the application first step if no organization exists
    from app.organization_service import user_has_organization, get_organization_by_user_id, get_application_by_organization_id
    if not user_has_organization(current_user.user_id):
        return redirect(url_for('user_organization.applicationfirststep'))
    
    # Get organization data
    organization = get_organization_by_user_id(current_user.user_id)
    
    # Get application associated with the organization
    application = None
    if organization:
        application = get_application_by_organization_id(organization.organization_id, 'New')
        # Add debug logging
        print(f"DEBUG - Application data: ID={application.application_id if application else 'None'}, Status={application.status if application else 'None'}")
    
    # Show the application page with organization and application data
    return render_template('user/application.html', 
                         active_page='application',
                         organization=organization,
                         application=application)

@user_organization_bp.route('/check-organization-name', methods=['POST'])
@login_required
def check_organization_name():
    # Import the service module here to avoid circular imports
    from app.organization_service import organization_name_exists
    
    # Get the organization name from the request
    org_name = request.json.get('orgName')
    
    if not org_name:
        return jsonify({'valid': False, 'message': 'Organization name is required'})
    
    # Check if the organization name exists
    exists = organization_name_exists(org_name)
    
    if exists:
        return jsonify({'valid': False, 'message': f"Organization name '{org_name}' is already taken. Please choose a different name."})
    else:
        return jsonify({'valid': True})

@user_organization_bp.route('/update-logo', methods=['POST'])
@login_required
def update_logo():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({
            'success': False,
            'message': "You don't have permission to update organization information"
        })
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    
    # Get the current organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        return jsonify({
            'success': False,
            'message': "No organization found for this user"
        })
    
    # Handle logo upload
    if 'logo' not in request.files or not request.files['logo'].filename:
        return jsonify({
            'success': False,
            'message': "No logo file provided"
        })
    
    logo_file = request.files['logo']
    
    # Check if the file is allowed
    if not allowed_file(logo_file.filename, ['png', 'jpg', 'jpeg', 'gif']):
        return jsonify({
            'success': False,
            'message': "File type not allowed. Please upload a PNG, JPG, JPEG, or GIF file."
        })
    
    try:
        # Create a new logo or update existing one
        if organization.logo_id:
            # Update existing logo
            logo = Logo.query.get(organization.logo_id)
            if logo:
                logo.logo = logo_file.read()
        else:
            # Create new logo
            logo = Logo(logo=logo_file.read(), description="")
            db.session.add(logo)
            db.session.flush()  # Get the logo ID
            organization.logo_id = logo.logo_id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': "Logo updated successfully",
            'logo_id': organization.logo_id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f"Error updating logo: {str(e)}"
        }), 500

@user_organization_bp.route('/update-organization', methods=['POST'])
@login_required
def update_organization():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({
            'success': False,
            'message': "You don't have permission to update organization information"
        })
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, organization_name_exists
    
    # Get the current organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        return jsonify({
            'success': False,
            'message': "No organization found for this user"
        })
    
    # Get form data
    organization_name = request.form.get('organization_name')
    org_type = request.form.get('type')
    tagline = request.form.get('tagline')
    description = request.form.get('description')
    logo_description = request.form.get('logo_description')
    
    # Only check for name conflicts if organization_name is provided and has changed
    if organization_name and organization_name != organization.organization_name and organization_name_exists(organization_name):
        return jsonify({
            'success': False,
            'message': f"Organization name '{organization_name}' is already taken. Please choose a different name."
        })
    
    # Track if any changes were made
    changes_made = False
    
    # Update organization information only if the corresponding field is provided
    if organization_name and organization_name != organization.organization_name:
        organization.organization_name = organization_name
        changes_made = True
    if org_type and org_type != organization.type:
        organization.type = org_type
        changes_made = True
    if tagline is not None and tagline != organization.tagline:  # Allow empty string
        organization.tagline = tagline
        changes_made = True
    if description is not None and description != organization.description:  # Allow empty string
        organization.description = description
        changes_made = True
    
    # Update logo description if organization has a logo and logo_description is provided
    if organization.logo_id and logo_description is not None:
        logo = Logo.query.get(organization.logo_id)
        if logo and logo.description != logo_description:
            logo.description = logo_description
            changes_made = True
    
    # Handle logo upload if provided
    if 'logo' in request.files and request.files['logo'].filename:
        logo_file = request.files['logo']
        
        # Check if the file is allowed
        if logo_file and allowed_file(logo_file.filename, ['png', 'jpg', 'jpeg', 'gif']):
            # Create a new logo or update existing one
            if organization.logo_id:
                # Update existing logo
                logo = Logo.query.get(organization.logo_id)
                if logo:
                    logo.logo = logo_file.read()
                    changes_made = True
            else:
                # Create new logo
                logo = Logo(logo=logo_file.read(), description=logo_description)
                db.session.add(logo)
                db.session.flush()  # Get the logo ID
                organization.logo_id = logo.logo_id
                changes_made = True
        else:
            return jsonify({
                'success': False,
                'message': "Invalid file format. Please upload a valid image file."
            })
    
    # Save changes to database only if changes were made
    if changes_made:
        try:
            db.session.commit()
            return jsonify({
                'success': True,
                'message': "Organization information updated successfully"
            })
        except Exception as e:
            db.session.rollback()
            return jsonify({
                'success': False,
                'message': f"An error occurred: {str(e)}"
            })
    else:
        # No changes were made, but still return success
        return jsonify({
            'success': True,
            'message': "No changes were made to organization information"
        })


@user_organization_bp.route('/get_social_media_by_organization_id', methods=['GET'])
@login_required
def get_social_media_by_organization_id():
    """
    Get social media links for an organization
    
    Returns:
        JSON response with social media links
    """
    from app.organization_service import get_social_media_by_organization_id
    
    organization_id = request.args.get('organization_id')
    if not organization_id:
        return jsonify({'success': False, 'message': 'Organization ID is required'}), 400
    
    try:
        social_media = get_social_media_by_organization_id(organization_id)
        return jsonify({'success': True, 'social_media': social_media})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@user_organization_bp.route('/save_social_media', methods=['POST'])
@login_required
def save_social_media():
    """
    Save social media link for an organization
    
    Returns:
        JSON response with success status
    """
    from app.organization_service import save_social_media
    
    data = request.get_json()
    if not data or 'organization_id' not in data or 'platform' not in data or 'link' not in data:
        return jsonify({'success': False, 'message': 'Organization ID, platform and link are required'}), 400
    
    try:
        result = save_social_media(data['organization_id'], data['platform'], data['link'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@user_organization_bp.route('/update-organization-field', methods=['POST'])
@login_required
def update_organization_field():
    """
    Update a single field of an organization
    
    Returns:
        JSON response with success status
    """
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({
            'success': False,
            'message': "You don't have permission to update organization information"
        })
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    
    # Get the current organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        return jsonify({
            'success': False,
            'message': "No organization found for this user"
        })
    
    # Get form data
    field_id = request.form.get('field_id')
    field_value = request.form.get('field_value')
    
    if not field_id or field_value is None:
        return jsonify({
            'success': False,
            'message': "Field ID and value are required"
        })
    
    try:
        # Map field_id to database field
        field_mapping = {
            'orgName': 'organization_name',
            'orgType': 'type',
            'logoDescription': 'logo_description'
        }
        
        db_field = field_mapping.get(field_id)
        if not db_field:
            return jsonify({
                'success': False,
                'message': f"Unknown field ID: {field_id}"
            })
        
        # Update the appropriate field
        if db_field == 'logo_description' and organization.logo_id:
            # Update logo description
            logo = Logo.query.get(organization.logo_id)
            if logo:
                logo.description = field_value
        else:
            # Update organization field
            setattr(organization, db_field, field_value)
        
        # Save changes
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': "Field updated successfully"
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

@user_organization_bp.route('/update_social_media', methods=['POST'])
@login_required
def update_social_media():
    """
    Update social media link for an organization
    
    Returns:
        JSON response with success status
    """
    from app.organization_service import update_social_media
    
    data = request.get_json()
    if not data or 'organization_id' not in data or 'platform' not in data or 'link' not in data:
        return jsonify({'success': False, 'message': 'Organization ID, platform and link are required'}), 400
    
    try:
        result = update_social_media(data['organization_id'], data['platform'], data['link'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@user_organization_bp.route('/get_organization_header', methods=['GET'])
@login_required
def get_organization_header():
    """
    Get organization header information including social media links
    
    Returns:
        JSON response with organization header information
    """
    from app.organization_service import get_organization_by_id, get_social_media_by_organization_id, get_adviser_by_organization_id
    
    organization_id = request.args.get('organization_id')
    if not organization_id:
        return jsonify({'success': False, 'message': 'Organization ID is required'}), 400
    
    try:
        # Get organization data
        organization = get_organization_by_id(organization_id)
        if not organization:
            return jsonify({'success': False, 'message': 'Organization not found'}), 404
        
        # Get social media links
        social_media = get_social_media_by_organization_id(organization_id)
        
        # Get adviser information
        adviser = get_adviser_by_organization_id(organization_id)
        
        # Prepare response data
        response_data = {
            'success': True,
            'organization': {
                'organization_id': organization.organization_id,
                'organization_name': organization.organization_name,
                'type': organization.type,
                'tagline': organization.tagline,
                'description': organization.description,
                'logo_id': organization.logo_id
            },
            'social_media': social_media,
            'adviser': adviser
        }
        
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@user_organization_bp.route('/delete_social_media', methods=['POST'])
@login_required
def delete_social_media():
    """
    Delete social media link for an organization
    
    Returns:
        JSON response with success status
    """
    from app.organization_service import delete_social_media
    
    data = request.get_json()
    if not data or 'organization_id' not in data or 'platform' not in data:
        return jsonify({'success': False, 'message': 'Organization ID and platform are required'}), 400
    
    try:
        result = delete_social_media(data['organization_id'], data['platform'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@user_organization_bp.route('/save-adviser-info', methods=['POST'])
@login_required
def save_adviser_info():
    """
    Save adviser information for an organization
    
    Returns:
        JSON response with success status and message
    """
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({
            'success': False,
            'message': "You don't have permission to update adviser information"
        })
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, save_adviser_info
    
    # Get the current organization
    organization = get_organization_by_user_id(current_user.user_id)
    
    if not organization:
        return jsonify({
            'success': False,
            'message': "No organization found for this user"
        })
    
    # Get form data
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': "Invalid request data"
            })
        
        # Log received data for debugging
        print(f"Received adviser data: {data}")
    except Exception as e:
        print(f"Error parsing JSON data: {str(e)}")
        return jsonify({
            'success': False,
            'message': "Invalid request data format"
        })
    
    first_name = data.get('first_name')
    middle_name = data.get('middle_name')
    last_name = data.get('last_name')
    adviser_type = data.get('type')
    status = data.get('status')
    
    # Validate required fields
    if not first_name or not last_name or not adviser_type or not status:
        return jsonify({
            'success': False,
            'message': "First name, last name, adviser type and status are required"
        })
    
    # Call the service function
    result = save_adviser_info(
        organization_id=organization.organization_id,
        first_name=first_name,
        middle_name=middle_name,
        last_name=last_name,
        adviser_type=adviser_type,
        status=status
    )
    
    return jsonify(result)


@user_organization_bp.route('/applicationfirststep', methods=['GET', 'POST'])
@login_required
def applicationfirststep():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        flash("You don't have permission to access this page", "error")
        return redirect(url_for('main.dashboard'))
    
    # Import the service module here to avoid circular imports
    from app.organization_service import save_organization_application, user_has_organization
    
    # Check if user already has an organization
    if user_has_organization(current_user.user_id):
        flash("You already have an organization registered", "info")
        return redirect(url_for('user_organization.application'))
    
    if request.method == 'POST':
        # Get form data
        org_name = request.form.get('orgName')
        org_type = request.form.get('orgType')
        logo_description = request.form.get('logoDescription')
        logo_file = request.files.get('logo')
        
        # Save organization application data
        success, message, application_id = save_organization_application(
            org_name, 
            org_type, 
            logo_file, 
            logo_description, 
            current_user.user_id
        )
        
        if success:
            flash(message, "success")
            return redirect(url_for('user_organization.application'))
        else:
            flash(message, "error")
            return render_template('user/applicationfirststep.html', active_page='application')
    
    return render_template('user/applicationfirststep.html', active_page='application')

@user_organization_bp.route('/upload-application-file', methods=['POST'])
@login_required
def upload_application_file():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to upload files"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': "No file part"})
    
    file = request.files['file']
    file_type = request.form.get('fileType')
    
    # If user does not select file, browser also submits an empty part without filename
    if file.filename == '':
        return jsonify({'success': False, 'message': "No selected file"})
    
    # Check if the file type is allowed (PDF only)
    if not allowed_file(file.filename, ['pdf']):
        return jsonify({'success': False, 'message': "File type not allowed. Please upload PDF documents only."})
    
    try:
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Read the file data
        file_data = file.read()
        
        # Check if a file with this type already exists for this application
        existing_file = ApplicationFile.query.filter_by(
            application_id=application.application_id,
            file_name=file_type
        ).first()
        
        if existing_file:
            # Update existing file
            existing_file.file = file_data
            existing_file.status = "Pending"
            existing_file.submission_date = datetime.utcnow()  # Reset submission date on update
            db.session.commit()
            
            # Check if all required files are uploaded and update application status if needed
            check_and_update_application_status(application.application_id)
            
            return jsonify({
                'success': True, 
                'message': f"{file_type} updated successfully",
                'filename': filename,
                'fileType': file_type,
                'status': "Pending",
                'submission_date': existing_file.submission_date.strftime('%Y-%m-%d %H:%M:%S')
            })
        else:
            # Create new application file
            new_file = ApplicationFile(
                application_id=application.application_id,
                file_name=file_type,
                file=file_data,
                status="Pending"
            )
            db.session.add(new_file)
            db.session.commit()
            
            # Check if all required files are uploaded and update application status if needed
            check_and_update_application_status(application.application_id)
            
            return jsonify({
                'success': True, 
                'message': f"{file_type} uploaded successfully",
                'filename': filename,
                'fileType': file_type,
                'status': "Pending",
                'submission_date': new_file.submission_date.strftime('%Y-%m-%d %H:%M:%S')
            })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"An error occurred: {str(e)}"})

def check_and_update_application_status(application_id):
    """
    Check application files and update status:
    - 'Incomplete' to 'Pending' when all required files are uploaded
    - 'Pending' to 'Verified' when all files are verified
    Also updates the submission_date when status changes to 'Pending'
    
    Args:
        application_id (int): ID of the application to check
    """
    try:
        # Get the application
        application = Application.query.get(application_id)
        if not application:
            return
        
        # Define the required files for a complete application
        required_files = [
            'Form 1A -APPLICATION FOR RECOGNITION',
            'Form 2 - LETTER OF ACCEPTANCE',
            'Form 3 - LIST OF PROGRAMS/PROJECTS/ ACTIVITIES',
            'Form 4 - LIST OF MEMBERS',
            'BOARD OF OFFICERS',
            'CONSTITUTION AND BYLAWS',
            'LOGO WITH EXPLANATION'
        ]
        
        # Get all files for this application
        application_files = ApplicationFile.query.filter_by(application_id=application_id).all()
        
        # Create a set of uploaded file names for easy checking
        uploaded_file_names = {file.file_name for file in application_files}
        
        # Check if all required files are uploaded
        all_files_uploaded = all(required_file in uploaded_file_names for required_file in required_files)
        
        # Check if all files are verified
        all_files_verified = all(file.status == 'Verified' for file in application_files) if application_files else False
        
        # Update application status based on conditions
        if application.status.lower() == 'incomplete' and all_files_uploaded:
            application.status = 'Pending'
            # Update the submission_date to the current date and time
            application.submission_date = datetime.now()
            db.session.commit()
        elif application.status.lower() == 'pending' and all_files_uploaded and all_files_verified:
            application.status = 'Verified'
            
            # Also update organization status from Incomplete to Active when application is verified
            organization = Organization.query.get(application.organization_id)
            if organization and organization.status and organization.status.lower() == 'incomplete':
                organization.status = 'Active'
            
            db.session.commit()
    except Exception as e:
        # Log the error but don't disrupt the file upload process
        print(f"Error checking application status: {str(e)}")
        db.session.rollback()

@user_organization_bp.route('/get-application-file/<int:file_id>')
@login_required
def get_application_file(file_id):
    # Get the application file
    app_file = ApplicationFile.query.get_or_404(file_id)
    
    # Check if the user has permission to access this file
    from app.organization_service import get_organization_by_user_id
    organization = get_organization_by_user_id(current_user.user_id)
    
    # Admin can access any file, organization users can only access their own files
    if current_user.role_id != 1:  # Not an admin
        application = Application.query.get(app_file.application_id)
        if not organization or application.organization_id != organization.organization_id:
            abort(403)  # Forbidden
    
    # Check if file data exists and has content
    if not app_file.file or len(app_file.file) == 0:
        return render_template('error.html', message="The file appears to be empty or corrupted."), 500
    
    # Check file signatures to determine file type
    # PDF signature check (%PDF)
    if app_file.file[:4] == b'%PDF':
        mimetype = 'application/pdf'
        file_extension = 'pdf'
    # DOCX files (PK zip signature)
    elif len(app_file.file) > 4 and app_file.file[:4] == b'PK\x03\x04':
        mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        file_extension = 'docx'
    # DOC files (Compound File Binary Format signature)
    elif len(app_file.file) > 8 and app_file.file[:8] == b'\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1':
        mimetype = 'application/msword'
        file_extension = 'doc'
    else:
        # If we can't determine the type from signature, try to infer from filename
        if app_file.file_name.lower().endswith('.pdf'):
            mimetype = 'application/pdf'
            file_extension = 'pdf'
        elif app_file.file_name.lower().endswith('.docx'):
            mimetype = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            file_extension = 'docx'
        elif app_file.file_name.lower().endswith('.doc'):
            mimetype = 'application/msword'
            file_extension = 'doc'
        else:
            # Default to PDF as a fallback
            mimetype = 'application/pdf'
            file_extension = 'pdf'
    
    # Create a filename with proper extension for the browser
    if app_file.file_name.lower() in ['form 1a - application for recognition', 'form 2 - letter of acceptance', 
                                     'form 3 - list of programs/projects/ activities', 'form 4 - list of members',
                                     'board of officers', 'constitution and bylaws', 'logo with explanation']:
        # These are form types, add the extension
        download_name = f"{app_file.file_name}.{file_extension}"
    else:
        # For files that might already have an extension
        if '.' in app_file.file_name:
            download_name = app_file.file_name
        else:
            download_name = f"{app_file.file_name}.{file_extension}"
    
    # Check if download is requested
    download_requested = request.args.get('download', '').lower() == 'true'
    
    # For Word documents, force download regardless of the download parameter
    force_download = download_requested or mimetype in [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]
    
    try:
        # Create a BytesIO object from the file data
        file_data = io.BytesIO(app_file.file)
        
        # Attempt to send the file
        response = send_file(
            file_data,
            mimetype=mimetype,
            as_attachment=force_download,  # True to download, False to preview in browser
            download_name=download_name
        )
        
        # Add Content-Disposition header to ensure proper preview
        if not force_download:
            response.headers['Content-Disposition'] = f'inline; filename="{download_name}"'
        
        return response
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(f"Error serving file: {str(e)}")
        print(traceback.format_exc())
        # Return a user-friendly error
        return render_template('error.html', message="Something went wrong while trying to open this file. The file may be corrupted or in an unsupported format."), 500

@user_organization_bp.route('/get-application-status')
@login_required
def get_application_status():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access application status"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Get the current status
    current_status = application.status
    
    # For the previous status, we'll use a session variable
    # If the previous status isn't set, default to 'Incomplete'
    # This ensures that when status changes from Incomplete to Pending, it will be detected
    previous_status = session.get('previous_application_status', 'Incomplete')
    
    # Log the status for debugging
    print(f"Application status check - Current: {current_status}, Previous: {previous_status}")
    
    # Update the previous status in the session
    session['previous_application_status'] = current_status
    
    return jsonify({
        'success': True,
        'status': current_status,
        'previousStatus': previous_status
    })

@user_organization_bp.route('/get-application-files')
@login_required
def get_application_files():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access files"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Get all files for this application
    files = ApplicationFile.query.filter_by(application_id=application.application_id).all()
    
    # Format the response
    file_list = [{
        'id': f.app_file_id,
        'name': f.file_name,
        'status': f.status,
        'submission_date': f.submission_date.strftime('%Y-%m-%d %H:%M:%S') if f.submission_date else None
    } for f in files]
    
    return jsonify({'success': True, 'files': file_list})

# Endpoint for delete-all-application-files removed as it was only used for testing

@user_organization_bp.route('/logo/<int:logo_id>')
def get_logo(logo_id):
    # Import the service module here to avoid circular imports
    from app.organization_service import get_logo_by_id
    
    logo = get_logo_by_id(logo_id)
    if not logo:
        abort(404)
    
    return send_file(
        io.BytesIO(logo.logo),
        mimetype='image/jpeg',
        as_attachment=False,
        download_name=f'logo_{logo_id}.jpg'
    )

@user_organization_bp.route('/get-application-feedback')
@login_required
def get_application_feedback():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access feedback"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    from app.models import Feedback
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Get all files for this application
    application_files = ApplicationFile.query.filter_by(application_id=application.application_id).all()
    
    # Get all feedback for files in this application
    file_ids = [file.app_file_id for file in application_files]
    feedbacks = Feedback.query.filter(Feedback.app_file_id.in_(file_ids)).order_by(Feedback.date_sent.desc()).all() if file_ids else []
    
    # Format the response
    feedback_list = [{
        'id': f.feedback_id,
        'file_id': f.app_file_id,
        'file_name': f.application_file.file_name if f.application_file else 'Unknown',
        'subject': f.subject,
        'message': f.message,
        'date_sent': f.date_sent.strftime('%Y-%m-%d %H:%M:%S') if f.date_sent else None,
        'is_read': f.is_read
    } for f in feedbacks]
    
    return jsonify({'success': True, 'feedbacks': feedback_list})

@user_organization_bp.route('/mark-feedback-read', methods=['POST'])
@login_required
def mark_feedback_read():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to update feedback"})
    
    # Get feedback ID from request
    feedback_id = request.json.get('feedback_id')
    if not feedback_id:
        return jsonify({'success': False, 'message': "Feedback ID is required"})
    
    # Import the Feedback model
    from app.models import Feedback
    
    # Find the feedback
    feedback = Feedback.query.get(feedback_id)
    if not feedback:
        return jsonify({'success': False, 'message': "Feedback not found"})
    
    # Check if user has permission to access this feedback
    from app.organization_service import get_organization_by_user_id, get_application_by_organization_id
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get application associated with the organization
    application = get_application_by_organization_id(organization.organization_id, 'New')
    if not application:
        return jsonify({'success': False, 'message': "No application found for this organization"})
    
    # Check if the feedback belongs to a file in this application
    if not feedback.application_file or feedback.application_file.application_id != application.application_id:
        return jsonify({'success': False, 'message': "You don't have permission to access this feedback"})
    
    # Mark feedback as read
    feedback.is_read = True
    
    try:
        db.session.commit()
        return jsonify({'success': True, 'message': "Feedback marked as read"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"Error updating feedback: {str(e)}"})

@user_organization_bp.route('/get-officer-details/<int:student_id>')
@login_required
def get_officer_details(student_id):
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access officer details"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    from app.models import Student
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get the student details
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'success': False, 'message': "Student not found"})
    
    # Return the student details
    return jsonify({
        'success': True,
        'officer': {
            'student_id': student.student_id,
            'first_name': student.first_name,
            'middle_name': student.middle_name,
            'last_name': student.last_name,
            'student_number': student.student_number
        }
    })

@user_organization_bp.route('/update-officer/<int:student_id>', methods=['POST'])
@login_required
def update_officer(student_id):
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to update officer details"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    from app.models import Student, Program
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get the student
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'success': False, 'message': "Student not found"})
    
    # Get the data from the request
    data = request.get_json()
    first_name = data.get('first_name', '').strip()
    middle_name = data.get('middle_name', '').strip()
    last_name = data.get('last_name', '').strip()
    program_code = data.get('program_code', '').strip()
    
    # Validate required fields
    if not first_name or not last_name:
        return jsonify({'success': False, 'message': "First name and last name are required"})
    
    # Get the program by code
    program = Program.query.filter_by(program_code=program_code).first()
    if not program:
        return jsonify({'success': False, 'message': "Invalid program code"})
    
    try:
        # Update the student details
        student.first_name = first_name
        student.middle_name = middle_name if middle_name else None
        student.last_name = last_name
        student.program_id = program.program_id
        
        db.session.commit()
        return jsonify({'success': True, 'message': "Officer updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"Error updating officer: {str(e)}"})

@user_organization_bp.route('/get-programs')
@login_required
def get_programs():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access programs"})
    
    from app.models import Program
    
    # Get all programs
    programs = Program.query.all()
    
    # Format the response
    program_list = [{
        'program_id': p.program_id,
        'program_code': p.program_code,
        'program_name': p.program_name
    } for p in programs]
    
    return jsonify({'success': True, 'programs': program_list})

@user_organization_bp.route('/get-member-details/<string:student_number>')
@login_required
def get_member_details(student_number):
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access member details"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    from app.models import Student
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get the student details by student number
    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify({'success': False, 'message': "Student not found"})
    
    # Return the student details
    return jsonify({
        'success': True,
        'member': {
            'student_id': student.student_id,
            'first_name': student.first_name,
            'middle_name': student.middle_name,
            'last_name': student.last_name,
            'student_number': student.student_number
        }
    })

@user_organization_bp.route('/update-member/<string:student_number>', methods=['POST'])
@login_required
def update_member(student_number):
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to update member details"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    from app.models import Student, Program
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get the student by student number
    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify({'success': False, 'message': "Student not found"})
    
    # Get the data from the request
    data = request.get_json()
    first_name = data.get('first_name', '').strip()
    middle_name = data.get('middle_name', '').strip()
    last_name = data.get('last_name', '').strip()
    program_code = data.get('program_code', '').strip()
    
    # Validate required fields
    if not first_name or not last_name:
        return jsonify({'success': False, 'message': "First name and last name are required"})
    
    # Get the program by code
    program = Program.query.filter_by(program_code=program_code).first()
    if not program:
        return jsonify({'success': False, 'message': "Invalid program code"})
    
    try:
        # Update the student details
        student.first_name = first_name
        student.middle_name = middle_name if middle_name else None
        student.last_name = last_name
        student.program_id = program.program_id
        
        db.session.commit()
        return jsonify({'success': True, 'message': "Member updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"Error updating member: {str(e)}"})

@user_organization_bp.route('/get-volunteer-details/<string:student_number>')
@login_required
def get_volunteer_details(student_number):
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to access volunteer details"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    from app.models import Student
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get the student details by student number
    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify({'success': False, 'message': "Student not found"})
    
    # Return the student details
    return jsonify({
        'success': True,
        'volunteer': {
            'student_id': student.student_id,
            'first_name': student.first_name,
            'middle_name': student.middle_name,
            'last_name': student.last_name,
            'student_number': student.student_number
        }
    })

@user_organization_bp.route('/update-volunteer/<string:student_number>', methods=['POST'])
@login_required
def update_volunteer(student_number):
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to update volunteer details"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    from app.models import Student, Program
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get the student by student number
    student = Student.query.filter_by(student_number=student_number).first()
    if not student:
        return jsonify({'success': False, 'message': "Student not found"})
    
    # Get the data from the request
    data = request.get_json()
    first_name = data.get('first_name', '').strip()
    middle_name = data.get('middle_name', '').strip()
    last_name = data.get('last_name', '').strip()
    program_code = data.get('program_code', '').strip()
    
    # Validate required fields
    if not first_name or not last_name:
        return jsonify({'success': False, 'message': "First name and last name are required"})
    
    # Get the program by code
    program = Program.query.filter_by(program_code=program_code).first()
    if not program:
        return jsonify({'success': False, 'message': "Invalid program code"})
    
    try:
        # Update the student details
        student.first_name = first_name
        student.middle_name = middle_name if middle_name else None
        student.last_name = last_name
        student.program_id = program.program_id
        
        db.session.commit()
        return jsonify({'success': True, 'message': "Volunteer updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"Error updating volunteer: {str(e)}"})

@user_organization_bp.route('/update-plan', methods=['POST'])
@login_required
def update_plan():
    # Ensure user is Organization President or Applicant
    if current_user.role_id not in [2, 3]:
        return jsonify({'success': False, 'message': "You don't have permission to update plan details"})
    
    # Import the service module here to avoid circular imports
    from app.organization_service import get_organization_by_user_id
    from app.models import Plan
    from datetime import datetime
    
    # Get user's organization
    organization = get_organization_by_user_id(current_user.user_id)
    if not organization:
        return jsonify({'success': False, 'message': "No organization found for this user"})
    
    # Get the data from the request
    data = request.get_json()
    plan_id = data.get('plan_id')
    title = data.get('title', '').strip()
    objectives = data.get('objectives', '').strip()
    proposed_date = data.get('proposed_date')
    people_involved = data.get('people_involved', '').strip()
    funding_source = data.get('funding_source', '').strip()
    target_output = data.get('target_output', '').strip()
    status = data.get('status', 'Pending').strip()
    
    # Validate required fields
    if not title or not objectives or not proposed_date:
        return jsonify({'success': False, 'message': "Title, objectives, and proposed date are required"})
    
    # Get the plan by ID and ensure it belongs to the user's organization
    plan = Plan.query.filter_by(plan_id=plan_id).first()
    if not plan:
        return jsonify({'success': False, 'message': "Plan not found"})
    
    # Check if the plan belongs to the user's organization
    if plan.application_id:
        from app.models import Application
        application = Application.query.get(plan.application_id)
        if not application or application.organization_id != organization.organization_id:
            return jsonify({'success': False, 'message': "You don't have permission to update this plan"})
    
    try:
        # Parse the proposed date
        if isinstance(proposed_date, str):
            proposed_date = datetime.strptime(proposed_date, '%Y-%m-%d').date()
        
        # Update the plan details
        plan.title = title
        plan.objectives = objectives
        plan.proposed_date = proposed_date
        plan.people_involved = people_involved
        plan.funding_source = funding_source
        plan.target_output = target_output
        plan.outcome = status
        
        # Set accomplished_date based on status
        if status == 'Accomplished':
            if not plan.accomplished_date:
                plan.accomplished_date = datetime.now().date()
        elif status == 'Failed to Accomplish':
            if not plan.accomplished_date:
                plan.accomplished_date = datetime.now().date()
        else:  # Pending
            plan.accomplished_date = None
        
        db.session.commit()
        return jsonify({'success': True, 'message': "Plan updated successfully"})
    except ValueError as e:
        return jsonify({'success': False, 'message': "Invalid date format. Please use YYYY-MM-DD"})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': f"Error updating plan: {str(e)}"})
