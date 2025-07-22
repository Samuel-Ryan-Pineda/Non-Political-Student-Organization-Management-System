-- MariaDB Database Schema Creation Script
-- Based on the provided ERD - Updated with snake_case naming conventions

-- Create database (optional)
-- CREATE DATABASE student_management;
-- USE student_management;

-- 1. programs table
CREATE TABLE programs (
    program_id INT PRIMARY KEY AUTO_INCREMENT,
    program_name VARCHAR(255) NOT NULL,
    program_code VARCHAR(50) UNIQUE NOT NULL
);

-- 2. addresses table
CREATE TABLE addresses (
    address_id INT PRIMARY KEY AUTO_INCREMENT,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL
);

-- 3. logos table
CREATE TABLE logos (
    logo_id INT PRIMARY KEY AUTO_INCREMENT,
    logo LONGBLOB,
    description TEXT
);

-- 4. roles table
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT
);

-- 5. users table
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- 6. organizations table
CREATE TABLE organizations (
    organization_id INT PRIMARY KEY AUTO_INCREMENT,
    logo_id INT,
    user_id INT,
    organization_name VARCHAR(255) NOT NULL,
    tagline TEXT,
    description TEXT,
    type VARCHAR(100),
    status VARCHAR(100), -- ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (logo_id) REFERENCES logos(logo_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 5. students table
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    program_id INT NOT NULL,
    address_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    student_number VARCHAR(50) UNIQUE NOT NULL,
    FOREIGN KEY (program_id) REFERENCES programs(program_id),
    FOREIGN KEY (address_id) REFERENCES addresses(address_id)
);

-- 6. affiliations table
CREATE TABLE affiliations (
    affiliation_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    organization_id INT NOT NULL,
    position VARCHAR(100),
    academic_year VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
);

-- 7. social_media table
CREATE TABLE social_media (
    social_media_id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    platform VARCHAR(100) NOT NULL,
    link VARCHAR(500) NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
);

-- 8. roles table
CREATE TABLE roles (
    role_id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT
);

-- 7. entry_keys table
CREATE TABLE entry_keys (
    entry_key_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    entry_key VARCHAR(255) UNIQUE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 8. applications table
CREATE TABLE applications (
    application_id INT PRIMARY KEY AUTO_INCREMENT,
    organization_id INT NOT NULL,
    type VARCHAR(100),
    status VARCHAR(100), -- ENUM('pending', 'approved', 'rejected', 'under_review') DEFAULT 'pending',
    academic_year VARCHAR(20),
    submission_date DATETIME,
    reviewed_by VARCHAR(255),
    review_date DATE,
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
);

-- 9. plans table
CREATE TABLE plans (
    plan_id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT,
    title VARCHAR(255) NOT NULL,
    objectives TEXT,
    proposed_date DATE,
    people_involved TEXT,
    funding_source VARCHAR(255),
    accomplished_date DATE,
    target_output TEXT,
    outcome TEXT,
    FOREIGN KEY (application_id) REFERENCES applications(application_id)
);

-- 10. application_files table
CREATE TABLE application_files (
    app_file_id INT PRIMARY KEY AUTO_INCREMENT,
    application_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file LONGBLOB,
    status VARCHAR(50),-- ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(application_id)
);

-- 11. advisers table
CREATE TABLE advisers (
    adviser_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL
);

-- 12. advisories table
CREATE TABLE advisories (
    advisory_id INT PRIMARY KEY AUTO_INCREMENT,
    adviser_id INT NOT NULL,
    organization_id INT NOT NULL,
    type VARCHAR(100),
    status VARCHAR(100), -- ENUM('active', 'inactive') DEFAULT 'active',
    FOREIGN KEY (adviser_id) REFERENCES advisers(adviser_id),
    FOREIGN KEY (organization_id) REFERENCES organizations(organization_id)
);

-- 13. feedback table
CREATE TABLE feedback (
    feedback_id INT PRIMARY KEY AUTO_INCREMENT,
    app_file_id INT,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date_sent DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (app_file_id) REFERENCES application_files(app_file_id)
);

-- 14. announcements table
CREATE TABLE announcements (
    announcement_id INT PRIMARY KEY AUTO_INCREMENT,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    date_sent DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. announcement_recipients table
CREATE TABLE announcement_recipients (
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (announcement_id, user_id),
    FOREIGN KEY (announcement_id) REFERENCES announcements(announcement_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_student_number ON students(student_number);
CREATE INDEX idx_student_program ON students(program_id);
CREATE INDEX idx_affiliation_student ON affiliations(student_id);
CREATE INDEX idx_affiliation_org ON affiliations(organization_id);
CREATE INDEX idx_application_org ON applications(organization_id);
CREATE INDEX idx_application_status ON applications(status);
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_announcement_date ON announcements(date_sent);