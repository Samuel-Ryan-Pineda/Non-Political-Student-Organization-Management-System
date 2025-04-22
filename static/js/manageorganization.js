// Modal Management Functions
function showEditOfficerModal(position, studentNo, name, program, address) {
    const modal = document.getElementById('editOfficerModal');
    const names = name.split(' ');
    
    // Populate form fields
    document.getElementById('editOfficerPosition').value = position;
    document.getElementById('editOfficerStudentNo').value = studentNo;
    document.getElementById('editOfficerProgram').value = program;
    document.getElementById('editOfficerAddress').value = address;
    
    // Handle name fields based on parts available
    if (names.length >= 3) {
        document.getElementById('editOfficerFirstName').value = names[0];
        document.getElementById('editOfficerMiddleName').value = names[1];
        document.getElementById('editOfficerLastName').value = names[names.length - 1];
    } else if (names.length === 2) {
        document.getElementById('editOfficerFirstName').value = names[0];
        document.getElementById('editOfficerMiddleName').value = '';
        document.getElementById('editOfficerLastName').value = names[1];
    } else {
        document.getElementById('editOfficerFirstName').value = name;
        document.getElementById('editOfficerMiddleName').value = '';
        document.getElementById('editOfficerLastName').value = '';
    }
    
    modal.style.display = 'flex';
}

function hideEditOfficerModal() {
    document.getElementById('editOfficerModal').style.display = 'none';
}

function showEditMemberModal(studentNo, name, program) {
    const modal = document.getElementById('editMemberModal');
    const names = name.split(' ');
    
    // Populate form fields
    document.getElementById('editMemberStudentNo').value = studentNo;
    document.getElementById('editMemberProgram').value = program;
    
    // Handle name fields based on parts available
    if (names.length >= 3) {
        document.getElementById('editMemberFirstName').value = names[0];
        document.getElementById('editMemberMiddleName').value = names[1];
        document.getElementById('editMemberLastName').value = names[names.length - 1];
    } else if (names.length === 2) {
        document.getElementById('editMemberFirstName').value = names[0];
        document.getElementById('editMemberMiddleName').value = '';
        document.getElementById('editMemberLastName').value = names[1];
    } else {
        document.getElementById('editMemberFirstName').value = name;
        document.getElementById('editMemberMiddleName').value = '';
        document.getElementById('editMemberLastName').value = '';
    }
    
    modal.style.display = 'flex';
}

function hideEditMemberModal() {
    document.getElementById('editMemberModal').style.display = 'none';
}

function showEditPlanModal(no, title, objectives, date, people, funds, venue, outcome) {
    document.getElementById('editPlanModal').style.display = 'block';
    document.getElementById('editPlanTitle').value = title;
    document.getElementById('editPlanObjectives').value = objectives;
    document.getElementById('editPlanDate').value = formatDateForInput(date);
    document.getElementById('editPlanPeople').value = people;
    document.getElementById('editPlanFunds').value = funds.replace(/<br><small>.*<\/small>/, '');
    document.getElementById('editPlanVenue').value = venue;
    document.getElementById('editPlanOutcome').value = outcome;
}

function hideEditPlanModal() {
    document.getElementById('editPlanModal').style.display = 'none';
}

function showAddPlanModal() {
    document.getElementById('addPlanModal').style.display = 'flex';
}

function hideAddPlanModal() {
    document.getElementById('addPlanModal').style.display = 'none';
}

function formatDateForInput(dateStr) {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

// Form Submission Handlers
document.getElementById('editOfficerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Add your form submission logic here
    hideEditOfficerModal();
});

document.getElementById('editMemberForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Add your form submission logic here
    hideEditMemberModal();
});

document.getElementById('addPlanForm').addEventListener('submit', function(e) {
    e.preventDefault();
    // Add your form submission logic here
    hideAddPlanModal();
});