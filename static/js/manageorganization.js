// Modal Management Functions
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

// Social Media Modal Function
function showSocialMediaModal() {
    const socialMediaModal = document.getElementById('socialMediaModal');
    if (socialMediaModal) {
        socialMediaModal.classList.add('show');
    }
}

// Adviser Modal Functions
function showEditAdviserNameForm() {
    document.getElementById('adviser-name-display').style.display = 'none';
    document.getElementById('edit-adviser-name').style.display = 'block';
}

// Form Submission Handlers
const editMemberForm = document.getElementById('editMemberForm');
if (editMemberForm) {
    editMemberForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Add your form submission logic here
        hideEditMemberModal();
    });
}

const addPlanForm = document.getElementById('addPlanForm');
if (addPlanForm) {
    addPlanForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Add your form submission logic here
        hideAddPlanModal();
    });
}

// Initialize tabs when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Bootstrap 5 handles tab functionality automatically through data attributes
    // This is just for any additional initialization if needed
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
        console.log('Tabs container initialized');
    }
});


