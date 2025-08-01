from app import create_app, db
from app.models import Program

def seed_programs():
    app = create_app()
    
    with app.app_context():
        # Check if programs already exist
        if Program.query.first():
            print('Programs already exist in the database!')
            return
        
        # Undergraduate Programs
        undergraduate_programs = [
            {'program_code': 'BSArchi', 'program_name': 'Bachelor of Science in Architecture'},
            {'program_code': 'BSCrim', 'program_name': 'Bachelor of Science in Criminology'},
            {'program_code': 'BEED', 'program_name': 'Bachelor of Elementary Education'},
            {'program_code': 'BPE', 'program_name': 'Bachelor of Physical Education'},
            {'program_code': 'BSED', 'program_name': 'Bachelor of Secondary Education'},
            {'program_code': 'BTLED', 'program_name': 'Bachelor of Technology and Livelihood Education'},
            {'program_code': 'BSIS', 'program_name': 'Bachelor of Science in Industrial Education'},
            {'program_code': 'BSPED', 'program_name': 'Bachelor of Science in Physical Education'},
            {'program_code': 'BSNE', 'program_name': 'Bachelor of Special Needs Education with specialization in Early Childhood Education'},
            {'program_code': 'BSCE', 'program_name': 'Bachelor of Science in Civil Engineering'},
            {'program_code': 'BSME', 'program_name': 'Bachelor of Science in Mechanical Engineering'},
            {'program_code': 'BSEE', 'program_name': 'Bachelor of Science in Electrical Engineering'},
            {'program_code': 'BSIT', 'program_name': 'Bachelor of Science in Information Technology'},
            {'program_code': 'BSDS', 'program_name': 'Bachelor of Science in Data Science'},
            {'program_code': 'BSBA', 'program_name': 'Bachelor of Science in Business Administration'},
            {'program_code': 'BSEntrep', 'program_name': 'Bachelor of Science in Entrepreneurship'},
            {'program_code': 'BSHM', 'program_name': 'Bachelor of Science in Hospitality Management'},
            {'program_code': 'BSHRM', 'program_name': 'Bachelor of Science in Hotel and Restaurant Management'},
            {'program_code': 'BSTM', 'program_name': 'Bachelor of Science in Tourism Management'},
            {'program_code': 'BPA', 'program_name': 'Bachelor of Public Administration'},
            {'program_code': 'BSBio', 'program_name': 'Bachelor of Science in Biology'},
            {'program_code': 'BSFT', 'program_name': 'Bachelor of Science in Food Technology'},
            {'program_code': 'BSPsych', 'program_name': 'Bachelor of Science in Psychology'},
            {'program_code': 'BSChem', 'program_name': 'Bachelor of Science in Chemistry'},
            {'program_code': 'BSEnvSci', 'program_name': 'Bachelor of Science in Environmental Science'},
            {'program_code': 'BIT', 'program_name': 'Bachelor of Industrial Technology'},
            {'program_code': 'BSN', 'program_name': 'Bachelor of Science in Nursing'}
        ]
        
        # Graduate Programs
        graduate_programs = [
            {'program_code': 'EdD-ITE', 'program_name': 'Doctor of Education in Industrial Technology Education'},
            {'program_code': 'PhD-SCI', 'program_name': 'Doctor of Philosophy in Science'},
            {'program_code': 'PhD-MATH', 'program_name': 'Doctor of Philosophy in Mathematics'},
            {'program_code': 'PhD-EM', 'program_name': 'Doctor of Philosophy in Engineering Management'},
            {'program_code': 'PhD-EDM', 'program_name': 'Doctor of Philosophy in Educational Management'},
            {'program_code': 'PhD-BA', 'program_name': 'Doctor of Philosophy in Business Administration'},
            {'program_code': 'PhD-PA', 'program_name': 'Doctor of Philosophy in Public Administration'},
            {'program_code': 'MAENG', 'program_name': 'Master of Arts in English'},
            {'program_code': 'MAIE', 'program_name': 'Master of Arts in Industrial Education'},
            {'program_code': 'MAT-SCI', 'program_name': 'Master of Arts in Teaching major in Science'},
            {'program_code': 'MAT-PHY', 'program_name': 'Master of Arts in Teaching major in Physics'},
            {'program_code': 'MAT-MATH', 'program_name': 'Master of Arts in Teaching major in Mathematics'},
            {'program_code': 'MAVTE', 'program_name': 'Master of Arts in Vocational – Technological Education'},
            {'program_code': 'MBA', 'program_name': 'Master of Business Administration'},
            {'program_code': 'MEM', 'program_name': 'Master of Education Management'},
            {'program_code': 'MEngM', 'program_name': 'Master of Engineering Management'},
            {'program_code': 'MPA', 'program_name': 'Master of Public Administration'},
            {'program_code': 'MSAGRI', 'program_name': 'Master of Science in Agriculture'},
            {'program_code': 'MSIT', 'program_name': 'Master of Science in Information Technology'}
        ]
        
        # Combine all programs
        all_programs = undergraduate_programs + graduate_programs
        
        # Create Program objects and add to session
        program_objects = [Program(program_code=p['program_code'], program_name=p['program_name']) for p in all_programs]
        db.session.add_all(program_objects)
        
        # Commit the changes
        db.session.commit()
        print(f'Successfully added {len(all_programs)} programs to the database!')

if __name__ == '__main__':
    seed_programs()