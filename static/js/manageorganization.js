// Modal Management Functions
// Note: showEditMemberModal and hideEditMemberModal are now defined in editmembermodal.html
// Note: showEditVolunteerModal and hideEditVolunteerModal are now defined in editvolunteermodal.html

// Note: showEditPlanModal and hideEditPlanModal are now defined in editplanmodal.html

function showAddPlanModal() {
    document.getElementById('addPlanModal').style.display = 'flex';
}

function hideAddPlanModal() {
    document.getElementById('addPlanModal').style.display = 'none';
}

// Note: formatDateForInput is now defined in editplanmodal.html

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

// Academic Year Change Function
function changeAcademicYear() {
    const selectedYear = document.getElementById('academicYearSelect').value;
    const currentUrl = new URL(window.location);
    currentUrl.searchParams.set('academic_year', selectedYear);
    window.location.href = currentUrl.toString();
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


