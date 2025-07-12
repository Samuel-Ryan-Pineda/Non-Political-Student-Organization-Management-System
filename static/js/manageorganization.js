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
const editOfficerForm = document.getElementById('editOfficerForm');
if (editOfficerForm) {
    editOfficerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        // Add your form submission logic here
        hideEditOfficerModal();
    });
}

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

// Organization Management Modal Functions
function showEditOrganizationModal() {
    // Show the edit organization modal
    const editOrgModal = document.getElementById('editOrganizationModal');
    if (editOrgModal) {
        editOrgModal.classList.add('show');
    }
    
    // Ensure all fields have their dataset values set
    ensureDatasetValues();
}

function hideEditOrganizationModal() {
    // Hide the edit organization modal
    const editOrgModal = document.getElementById('editOrganizationModal');
    if (editOrgModal) {
        editOrgModal.classList.remove('show');
    }
    
    // Reset any active edit forms back to display mode
    clearAllSectionHighlights();
    
    // Reset organization name form if active
    const orgNameField = document.getElementById('org-name-field');
    const editOrgName = document.getElementById('edit-org-name');
    if (orgNameField && editOrgName && editOrgName.style.display !== 'none') {
        orgNameField.style.display = 'block';
        editOrgName.style.display = 'none';
    }
    
    // Reset organization type form if active
    const orgTypeField = document.getElementById('org-type-field');
    const editOrgType = document.getElementById('edit-org-type');
    if (orgTypeField && editOrgType && editOrgType.style.display !== 'none') {
        orgTypeField.style.display = 'block';
        editOrgType.style.display = 'none';
    }
    
    // Reset tagline form if active
    const orgTaglineField = document.getElementById('org-tagline-field');
    const editTagline = document.getElementById('edit-tagline');
    if (orgTaglineField && editTagline && editTagline.style.display !== 'none') {
        orgTaglineField.style.display = 'block';
        editTagline.style.display = 'none';
    }
    
    // Reset description form if active
    const orgDescriptionField = document.getElementById('org-description-field');
    const editDescription = document.getElementById('edit-description');
    if (orgDescriptionField && editDescription && editDescription.style.display !== 'none') {
        orgDescriptionField.style.display = 'block';
        editDescription.style.display = 'none';
    }
}

// Global variable to store the selected logo file temporarily
let selectedLogoFile = null;
let originalLogoSrc = null;

function uploadNewLogo() {
    // Trigger the file input click
    const logoFileInput = document.getElementById('logoFileInput');
    if (logoFileInput) {
        logoFileInput.click();
    }
}

function handleLogoFileSelect(event) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (file) {
        // Store the file for later use
        selectedLogoFile = file;
        
        // Store the original logo source for cancellation
        const previewLogo = document.getElementById('previewLogo');
        if (previewLogo) {
            originalLogoSrc = previewLogo.src;
        }
        
        // Preview the selected image
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewLogo) {
                previewLogo.src = e.target.result;
            }
            
            // Show save and cancel buttons, hide upload button
            document.getElementById('logoUploadButtons').style.display = 'none';
            document.getElementById('logoSaveButtons').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function saveLogo() {
    if (selectedLogoFile) {
        // Get the save button and show loading state
        const saveButton = document.querySelector('#logoSaveButtons .btn-success');
        const cancelButton = document.querySelector('#logoSaveButtons .btn-secondary');
        const originalButtonText = saveButton.innerHTML;
        
        // Disable buttons and show loading indicator
        saveButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;
        saveButton.disabled = true;
        cancelButton.disabled = true;
        
        // Create a fake file input with the selected file
        const fileInput = document.getElementById('logoFileInput');
        
        // Save the logo to the database
        const updateUrl = '/organization/update-organization';
        const formData = new FormData();
        formData.append('logo', selectedLogoFile);
        formData.append('logo_description', 'Organization Logo');
        
        fetch(updateUrl, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Show success state briefly
                saveButton.innerHTML = `<i class="fas fa-check"></i> Saved`;
                saveButton.classList.remove('btn-success');
                saveButton.classList.add('btn-outline-success');
                
                // Update the logo in the header without page refresh
                const headerLogo = document.querySelector('.org-logo');
                if (headerLogo) {
                    headerLogo.src = URL.createObjectURL(selectedLogoFile);
                }
                
                // After a short delay, restore the UI
                setTimeout(() => {
                    // Reset the selected file
                    selectedLogoFile = null;
                    originalLogoSrc = null;
                    
                    // Show upload button, hide save and cancel buttons
                    document.getElementById('logoUploadButtons').style.display = 'block';
                    document.getElementById('logoSaveButtons').style.display = 'none';
                    
                    // Reset button state
                    saveButton.disabled = false;
                    saveButton.innerHTML = originalButtonText;
                    saveButton.classList.remove('btn-outline-success');
                    saveButton.classList.add('btn-success');
                    cancelButton.disabled = false;
                }, 1000);
            } else {
                // Show error state
                saveButton.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error`;
                saveButton.classList.remove('btn-success');
                saveButton.classList.add('btn-danger');
                
                // After a short delay, restore the button
                setTimeout(() => {
                    saveButton.disabled = false;
                    saveButton.innerHTML = originalButtonText;
                    saveButton.classList.remove('btn-danger');
                    saveButton.classList.add('btn-success');
                    cancelButton.disabled = false;
                }, 2000);
                
                console.error('Error from server:', data.message);
            }
        })
        .catch(error => {
            console.error('Error saving logo:', error);
            
            // Show error state
            saveButton.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Failed`;
            saveButton.classList.remove('btn-success');
            saveButton.classList.add('btn-danger');
            
            // After a short delay, restore the button
            setTimeout(() => {
                saveButton.disabled = false;
                saveButton.innerHTML = originalButtonText;
                saveButton.classList.remove('btn-danger');
                saveButton.classList.add('btn-success');
                cancelButton.disabled = false;
            }, 2000);
        });
    }
}

function cancelLogoUpload() {
    // Reset the file input
    const logoFileInput = document.getElementById('logoFileInput');
    if (logoFileInput) {
        logoFileInput.value = '';
    }
    
    // Restore the original logo preview
    const previewLogo = document.getElementById('previewLogo');
    if (previewLogo && originalLogoSrc) {
        previewLogo.src = originalLogoSrc;
    }
    
    // Reset the selected file
    selectedLogoFile = null;
    originalLogoSrc = null;
    
    // Show upload button, hide save and cancel buttons
    document.getElementById('logoUploadButtons').style.display = 'block';
    document.getElementById('logoSaveButtons').style.display = 'none';
}

function showAdviserInfoModal() {
    // Create and show modal for editing adviser information
    alert('Adviser Info modal will be implemented here');
    // TODO: Implement modal for editing adviser details
}

function showSocialMediaModal() {
    // Create and show modal for managing social media links
    alert('Social Media Links modal will be implemented here');
    // TODO: Implement modal for adding/editing social media links
}

// Function removed as each section now has its own save functionality
// and the global Save Changes button has been removed

// Helper function to clear all section highlights
function clearAllSectionHighlights() {
    const sections = document.querySelectorAll('.section-organization, .section-type, .section-tagline, .section-description');
    if (sections && sections.length > 0) {
        sections.forEach(section => section.classList.remove('section-highlighted'));
    }
}

// Helper function to ensure all fields have their dataset.value set
function ensureDatasetValues() {
    const fields = [
        'org-name-field',
        'org-type-field',
        'org-tagline-field',
        'org-description-field'
    ];
    
    // Set dataset values and adjust heights
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Set dataset value if not already set
            if (!field.dataset.value && field.value) {
                field.dataset.value = field.value;
            }
            
            // Auto-adjust height if it's a textarea
            if (field.tagName.toLowerCase() === 'textarea') {
                autoAdjustTextareaHeight(field);
            }
        }
    });
}

// Function to automatically adjust textarea height based on content
// Cache for computed styles to avoid redundant calculations
const styleCache = new WeakMap();

function autoAdjustTextareaHeight(textarea) {
    if (!textarea) return;
    
    // If empty, set a reasonable minimum height and return
    const content = textarea.value || textarea.textContent || '';
    if (!content.trim()) {
        textarea.style.height = 'auto';
        textarea.style.minHeight = '1.625rem';
        return;
    }
    
    // Check if the textarea is hidden - use cached computed style if available
    let isHidden;
    if (styleCache.has(textarea)) {
        isHidden = styleCache.get(textarea).isHidden;
    } else {
        const computedStyle = window.getComputedStyle(textarea);
        isHidden = computedStyle.display === 'none';
        styleCache.set(textarea, { isHidden });
    }
    
    // Skip processing for hidden textareas that haven't changed
    if (isHidden && textarea.dataset.processed === 'true') {
        return;
    }
    
    // Save original display value if hidden
    const originalDisplay = isHidden ? textarea.style.display : null;
    
    // Temporarily make the textarea visible if it's hidden
    if (isHidden) {
        textarea.style.display = 'block';
        textarea.style.visibility = 'hidden';
        textarea.style.position = 'absolute';
    }
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to match the content (plus a small buffer)
    textarea.style.height = Math.max(textarea.scrollHeight, 20) + 'px';
    
    // Restore original display if it was hidden
    if (isHidden) {
        textarea.style.display = originalDisplay || 'none';
        textarea.style.visibility = '';
        textarea.style.position = '';
    }
    
    // Mark as processed
    textarea.dataset.processed = 'true';
}

function showEditOrganizationNameForm() {
    // Ensure all fields have their dataset.value set
    ensureDatasetValues();

    // Clear any existing highlights and add highlight to current section
    clearAllSectionHighlights();
    document.querySelector('.section-organization').classList.add('section-highlighted');

    const container = document.querySelector('.section-organization .field-container');
    const buttonContainer = document.querySelector('.section-organization .d-flex');
    const currentField = document.getElementById('org-name-field');
    const currentValue = currentField.dataset.value || currentField.value || '';

    // Hide the display field and show the edit field
    currentField.style.display = 'none';

    // Create the edit textarea if it doesn't exist
    let editField = document.getElementById('edit-org-name');
    if (!editField) {
        editField = document.createElement('textarea');
        editField.id = 'edit-org-name';
        editField.className = 'form-control';
        editField.style.fontSize = '0.75rem';
        editField.style.minHeight = '1.625rem';
        container.appendChild(editField);
        
        // Add input event listener to adjust height as user types
        editField.addEventListener('input', function() {
            autoAdjustTextareaHeight(this);
        });
    }

    editField.value = currentValue;
    editField.style.display = 'block';
    
    // Auto-adjust the height of the edit textarea
    setTimeout(() => {
        autoAdjustTextareaHeight(editField);
        // Focus at the end of the text
        editField.focus();
        editField.setSelectionRange(currentValue.length, currentValue.length);
    }, 0);

    // Replace the edit button with save and cancel buttons
    buttonContainer.innerHTML = `
        <label for="org-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Organization</label>
        <div class="d-flex gap-1">
            <button type="button" class="btn btn-success btn-sm" onclick="saveEditOrganizationName()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEditOrganizationName()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
        </div>
    `;
}

function cancelEditOrganizationName() {
    // Remove highlight from current section
    document.querySelector('.section-organization').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-organization .d-flex');
    const displayField = document.getElementById('org-name-field');
    const editField = document.getElementById('edit-org-name');

    // Hide the edit field and show the display field
    if (editField) {
        editField.style.display = 'none';
    }
    displayField.style.display = 'block';

    // Restore the original value
    displayField.value = displayField.dataset.value || '';

    // Determine button text based on whether there's data
    const buttonText = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'Add' : 'Edit';
    const buttonIcon = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'fas fa-plus' : 'fas fa-pen';
    const buttonClass = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'btn btn-primary' : 'btn btn-outline-secondary';

    // Restore the original button with appropriate text
    buttonContainer.innerHTML = `
        <label for="org-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Organization</label>
        <button type="button" class="${buttonClass} d-flex align-items-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="showEditOrganizationNameForm()">
            <i class="${buttonIcon}" style="font-size: 0.75rem;"></i>
            ${buttonText}
        </button>
    `;
}

function saveEditOrganizationName() {
    // Remove highlight from current section
    document.querySelector('.section-organization').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-organization .d-flex');
    const displayField = document.getElementById('org-name-field');
    const editField = document.getElementById('edit-org-name');
    const newValue = editField.value;

    // Update the display field's value and dataset
    displayField.value = newValue;
    displayField.dataset.value = newValue;

    // Hide the edit field and show the display field
    editField.style.display = 'none';
    displayField.style.display = 'block';
    
    // Auto-adjust the height of the display field
    autoAdjustTextareaHeight(displayField);

    // Determine button text based on whether there's data
    const buttonText = (!newValue || newValue.trim() === '') ? 'Add' : 'Edit';
    const buttonIcon = (!newValue || newValue.trim() === '') ? 'fas fa-plus' : 'fas fa-pen';
    const buttonClass = (!newValue || newValue.trim() === '') ? 'btn btn-primary' : 'btn btn-outline-secondary';

    // Restore the button with appropriate text
    buttonContainer.innerHTML = `
        <label for="org-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Organization</label>
        <button type="button" class="${buttonClass} d-flex align-items-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="showEditOrganizationNameForm()">
            <i class="${buttonIcon}" style="font-size: 0.75rem;"></i>
            ${buttonText}
        </button>
    `;

    // Save the organization name to the database using debounced function
    debouncedSaveOrganizationData('name', newValue);
}

function showEditOrganizationTypeForm() {
    // Ensure all fields have their dataset.value set
    ensureDatasetValues();

    // Clear any existing highlights and add highlight to current section
    clearAllSectionHighlights();
    document.querySelector('.section-type').classList.add('section-highlighted');

    const container = document.querySelector('.section-type .field-container');
    const buttonContainer = document.querySelector('.section-type .d-flex');
    const currentField = document.getElementById('org-type-field');
    const currentValue = currentField.dataset.value || currentField.value || '';

    // Hide the display field and show the edit field
    currentField.style.display = 'none';

    // Create the edit select if it doesn't exist
    let editField = document.getElementById('edit-org-type');
    if (!editField) {
        editField = document.createElement('select');
        editField.id = 'edit-org-type';
        editField.className = 'form-control';
        editField.style.fontSize = '0.75rem';
        container.appendChild(editField);
        editField.innerHTML = `
            <option value="Academic">Academic</option>
            <option value="Technology">Technology</option>
            <option value="Cultural">Cultural</option>
            <option value="Sports">Sports</option>
            <option value="Religious">Religious</option>
            <option value="Community Service">Community Service</option>
        `;
    }

    editField.value = currentValue;
    editField.style.display = 'block';

    // Replace the edit button with save and cancel buttons
    buttonContainer.innerHTML = `
        <label for="org-type-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Type</label>
        <div class="d-flex gap-1">
            <button type="button" class="btn btn-success btn-sm" onclick="saveEditOrganizationType()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEditOrganizationType()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
        </div>
    `;
}

function cancelEditOrganizationType() {
    // Remove highlight from current section
    document.querySelector('.section-type').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-type .d-flex');
    const displayField = document.getElementById('org-type-field');
    const editField = document.getElementById('edit-org-type');

    // Hide the edit field and show the display field
    if (editField) {
        editField.style.display = 'none';
    }
    displayField.style.display = 'block';

    // Restore the original value
    displayField.value = displayField.dataset.value || '';

    // Determine button text based on whether there's data
    const buttonText = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'Add' : 'Edit';
    const buttonIcon = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'fas fa-plus' : 'fas fa-pen';
    const buttonClass = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'btn btn-primary' : 'btn btn-outline-secondary';

    // Restore the original button with appropriate text
    buttonContainer.innerHTML = `
        <label for="org-type-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Type</label>
        <button type="button" class="${buttonClass} d-flex align-items-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="showEditOrganizationTypeForm()">
            <i class="${buttonIcon}" style="font-size: 0.75rem;"></i>
            ${buttonText}
        </button>
    `;
}

function saveEditOrganizationType() {
    // Remove highlight from current section
    document.querySelector('.section-type').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-type .d-flex');
    const displayField = document.getElementById('org-type-field');
    const editField = document.getElementById('edit-org-type');
    const newValue = editField.value;

    // Update the display field's value and dataset
    displayField.value = newValue;
    displayField.dataset.value = newValue;

    // Hide the edit field and show the display field
    editField.style.display = 'none';
    displayField.style.display = 'block';

    // Determine button text based on whether there's data
    const buttonText = (!newValue || newValue.trim() === '') ? 'Add' : 'Edit';
    const buttonIcon = (!newValue || newValue.trim() === '') ? 'fas fa-plus' : 'fas fa-pen';
    const buttonClass = (!newValue || newValue.trim() === '') ? 'btn btn-primary' : 'btn btn-outline-secondary';

    // Restore the button with appropriate text
    buttonContainer.innerHTML = `
        <label for="org-type-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Type</label>
        <button type="button" class="${buttonClass} d-flex align-items-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="showEditOrganizationTypeForm()">
            <i class="${buttonIcon}" style="font-size: 0.75rem;"></i>
            ${buttonText}
        </button>
    `;

    // Save the organization type to the database using debounced function
    debouncedSaveOrganizationData('type', newValue);
}

function showEditTaglineForm() {
    // Ensure all fields have their dataset.value set
    ensureDatasetValues();
    
    // Clear any existing highlights and add highlight to current section
    clearAllSectionHighlights();
    document.querySelector('.section-tagline').classList.add('section-highlighted');
    
    const container = document.querySelector('.section-tagline .field-container');
    const buttonContainer = document.querySelector('.section-tagline .d-flex');
    const currentField = document.getElementById('org-tagline-field');
    const currentValue = currentField.dataset.value || currentField.value || '';
    
    // Hide the display field and show the edit field
    currentField.style.display = 'none';
    
    // Create the edit textarea if it doesn't exist
    let editField = document.getElementById('edit-tagline');
    if (!editField) {
        editField = document.createElement('textarea');
        editField.id = 'edit-tagline';
        editField.className = 'form-control';
        editField.style.fontSize = '0.75rem';
        editField.style.minHeight = '1.625rem';
        container.appendChild(editField);
        
        // Add input event listener to adjust height as user types
        editField.addEventListener('input', function() {
            autoAdjustTextareaHeight(this);
        });
    }
    
    editField.value = currentValue;
    editField.style.display = 'block';
    
    // Auto-adjust the height of the edit textarea
    setTimeout(() => {
        autoAdjustTextareaHeight(editField);
        // Focus at the end of the text
        editField.focus();
        editField.setSelectionRange(currentValue.length, currentValue.length);
    }, 0);
    
    // Replace the edit button with save and cancel buttons
    buttonContainer.innerHTML = `
        <label for="org-tagline-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Tagline</label>
        <div class="d-flex gap-1">
            <button type="button" class="btn btn-success btn-sm" onclick="saveEditTagline()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEditTagline()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
        </div>
    `;
}

function cancelEditTagline() {
    // Remove highlight from current section
    document.querySelector('.section-tagline').classList.remove('section-highlighted');
    
    const container = document.querySelector('.section-tagline .field-container');
    const buttonContainer = document.querySelector('.section-tagline .d-flex');
    const displayField = document.getElementById('org-tagline-field');
    const editField = document.getElementById('edit-tagline');
    
    // Hide the edit field and show the display field
    if (editField) {
        editField.style.display = 'none';
    }
    displayField.style.display = 'block';
    
    // Restore the original value
    displayField.value = displayField.dataset.value || '';
    
    // Determine button text based on whether there's data
    const buttonText = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'Add' : 'Edit';
    const buttonIcon = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'fas fa-plus' : 'fas fa-pen';
    const buttonClass = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'btn btn-primary' : 'btn btn-outline-secondary';
    
    // Restore the original button with appropriate text
    buttonContainer.innerHTML = `
        <label for="org-tagline-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Tagline</label>
        <button type="button" class="${buttonClass} d-flex align-items-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="showEditTaglineForm()">
            <i class="${buttonIcon}" style="font-size: 0.75rem;"></i>
            ${buttonText}
        </button>
    `;
}

function saveEditTagline() {
    // Remove highlight from current section
    document.querySelector('.section-tagline').classList.remove('section-highlighted');
    
    const buttonContainer = document.querySelector('.section-tagline .d-flex');
    const displayField = document.getElementById('org-tagline-field');
    const editField = document.getElementById('edit-tagline');
    const newValue = editField.value;
    
    // Update the display field's value and dataset
    displayField.value = newValue;
    displayField.dataset.value = newValue;
    
    // Hide the edit field and show the display field
    editField.style.display = 'none';
    displayField.style.display = 'block';
    
    // Auto-adjust the height of the display field
    autoAdjustTextareaHeight(displayField);
    
    // Determine button text based on whether there's data
    const buttonText = (!newValue || newValue.trim() === '') ? 'Add' : 'Edit';
    const buttonIcon = (!newValue || newValue.trim() === '') ? 'fas fa-plus' : 'fas fa-pen';
    const buttonClass = (!newValue || newValue.trim() === '') ? 'btn btn-primary' : 'btn btn-outline-secondary';
    
    // Restore the button with appropriate text
    buttonContainer.innerHTML = `
        <label for="org-tagline-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Tagline</label>
        <button type="button" class="${buttonClass} d-flex align-items-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="showEditTaglineForm()">
            <i class="${buttonIcon}" style="font-size: 0.75rem;"></i>
            ${buttonText}
        </button>
    `;
    
    // Save the organization tagline to the database using debounced function
    debouncedSaveOrganizationData('tagline', newValue);
}

function showEditDescriptionForm() {
    // Ensure all fields have their dataset.value set
    ensureDatasetValues();

    // Clear any existing highlights and add highlight to current section
    clearAllSectionHighlights();
    document.querySelector('.section-description').classList.add('section-highlighted');

    const container = document.querySelector('.section-description .field-container');
    const buttonContainer = document.querySelector('.section-description .d-flex');
    const currentField = document.getElementById('org-description-field');
    const currentValue = currentField.dataset.value || currentField.value || '';

    // Hide the display field and show the edit field
    currentField.style.display = 'none';

    // Create the edit textarea if it doesn't exist
    let editField = document.getElementById('edit-description');
    if (!editField) {
        editField = document.createElement('textarea');
        editField.id = 'edit-description';
        editField.className = 'form-control';
        editField.rows = '3';
        editField.style.fontSize = '0.75rem';
        editField.style.minHeight = '100px';
        container.appendChild(editField);
        
        // Add input event listener to adjust height as user types
        editField.addEventListener('input', function() {
            autoAdjustTextareaHeight(this);
        });
    }

    editField.value = currentValue;
    editField.style.display = 'block';
    
    // Auto-adjust the height of the edit textarea
    setTimeout(() => {
        autoAdjustTextareaHeight(editField);
        // Focus at the end of the text
        editField.focus();
        editField.setSelectionRange(currentValue.length, currentValue.length);
    }, 0);

    // Replace the edit button with save and cancel buttons
    buttonContainer.innerHTML = `
        <label for="org-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Description</label>
        <div class="d-flex gap-1">
            <button type="button" class="btn btn-success btn-sm" onclick="saveEditDescription()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEditDescription()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
        </div>
    `;
}

function cancelEditDescription() {
    // Remove highlight from current section
    document.querySelector('.section-description').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-description .d-flex');
    const displayField = document.getElementById('org-description-field');
    const editField = document.getElementById('edit-description');

    // Hide the edit field and show the display field
    if (editField) {
        editField.style.display = 'none';
    }
    displayField.style.display = 'block';

    // Restore the original value
    displayField.value = displayField.dataset.value || '';

    // Determine button text based on whether there's data
    const buttonText = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'Add' : 'Edit';
    const buttonIcon = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'fas fa-plus' : 'fas fa-pen';
    const buttonClass = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'btn btn-primary' : 'btn btn-outline-secondary';

    // Restore the original button with appropriate text
    buttonContainer.innerHTML = `
        <label for="org-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Description</label>
        <button type="button" class="${buttonClass} d-flex align-items-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="showEditDescriptionForm()">
            <i class="${buttonIcon}" style="font-size: 0.75rem;"></i>
            ${buttonText}
        </button>
    `;
}

function saveEditDescription() {
    // Remove highlight from current section
    document.querySelector('.section-description').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-description .d-flex');
    const displayField = document.getElementById('org-description-field');
    const editField = document.getElementById('edit-description');
    const newValue = editField.value;

    // Update the display field's value and dataset
    displayField.value = newValue;
    displayField.dataset.value = newValue;

    // Hide the edit field and show the display field
    editField.style.display = 'none';
    displayField.style.display = 'block';
    
    // Adjust the height of the textarea to fit content
    autoAdjustTextareaHeight(displayField);

    // Determine button text based on whether there's data
    const buttonText = (!newValue || newValue.trim() === '') ? 'Add' : 'Edit';
    const buttonIcon = (!newValue || newValue.trim() === '') ? 'fas fa-plus' : 'fas fa-pen';
    const buttonClass = (!newValue || newValue.trim() === '') ? 'btn btn-primary' : 'btn btn-outline-secondary';

    // Restore the button with appropriate text
    buttonContainer.innerHTML = `
        <label for="org-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Description</label>
        <button type="button" class="${buttonClass} d-flex align-items-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="showEditDescriptionForm()">
            <i class="${buttonIcon}" style="font-size: 0.75rem;"></i>
            ${buttonText}
        </button>
    `;

    // Save the organization description to the database using debounced function
    debouncedSaveOrganizationData('description', newValue);
}

// Function to save organization data to the database
function saveOrganizationData(fieldType, value) {
    // Get the save button for the current field type
    let saveButton;
    let fieldElement;
    
    switch(fieldType) {
        case 'name':
            saveButton = document.querySelector('.section-organization .btn-success');
            fieldElement = document.getElementById('org-name-field');
            break;
        case 'type':
            saveButton = document.querySelector('.section-type .btn-success');
            fieldElement = document.getElementById('org-type-field');
            break;
        case 'tagline':
            saveButton = document.querySelector('.section-tagline .btn-success');
            fieldElement = document.getElementById('org-tagline-field');
            break;
        case 'description':
            saveButton = document.querySelector('.section-description .btn-success');
            fieldElement = document.getElementById('org-description-field');
            break;
        case 'logo':
            // For logo, we don't have a specific save button or field element
            break;
        default:
            console.error('Unknown field type:', fieldType);
            return;
    }
    
    // Update the dataset.value for the field element if it exists
    // This ensures the cancel function will have the correct value to restore
    if (fieldElement && fieldType !== 'logo') {
        fieldElement.dataset.value = value;
    }
    
    // Show saving animation on the button if it exists
    const originalButtonText = saveButton ? saveButton.innerHTML : '';
    if (saveButton) {
        saveButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...`;
        saveButton.disabled = true;
    }
    
    // Create data object to send to the server
    let formData = new FormData();
    
    // Add the specific field data based on the field type
    switch(fieldType) {
        case 'name':
            formData.append('organization_name', value);
            break;
        case 'type':
            formData.append('type', value);
            break;
        case 'tagline':
            formData.append('tagline', value);
            break;
        case 'description':
            formData.append('description', value);
            break;
        case 'logo':
            // For logo, value should be the file input element
            if (value && value.files && value.files.length > 0) {
                formData.append('logo', value.files[0]);
                formData.append('logo_description', 'Organization Logo');
            }
            break;
        default:
            console.error('Unknown field type:', fieldType);
            return;
    }
    
    // Send the data to the server
    const updateUrl = '/organization/update-organization';
    
    fetch(updateUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Endpoint not found. Please check the URL.');
            } else if (response.status === 500) {
                throw new Error('Server error. Please try again later or contact support.');
            } else {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        }
        return response.json();
    })
    .then(data => {
        // Restore the button state if it exists
        if (saveButton) {
            if (data.success) {
                // Show success state briefly
                saveButton.innerHTML = `<i class="fas fa-check"></i> Saved`;
                saveButton.classList.remove('btn-success');
                saveButton.classList.add('btn-outline-success');
                
                // Update the specific part of the page content
                updateSpecificContent(fieldType, value);
                
                // After a short delay, restore the button or hide it (depending on the UI flow)
                setTimeout(() => {
                    // The button might not exist anymore if the UI has changed
                    if (document.body.contains(saveButton)) {
                        saveButton.disabled = false;
                        saveButton.innerHTML = originalButtonText;
                        saveButton.classList.remove('btn-outline-success');
                        saveButton.classList.add('btn-success');
                    }
                }, 1000);
            } else {
                // Show error state
                saveButton.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error`;
                saveButton.classList.remove('btn-success');
                saveButton.classList.add('btn-danger');
                
                // After a short delay, restore the button
                setTimeout(() => {
                    // The button might not exist anymore if the UI has changed
                    if (document.body.contains(saveButton)) {
                        saveButton.disabled = false;
                        saveButton.innerHTML = originalButtonText;
                        saveButton.classList.remove('btn-danger');
                        saveButton.classList.add('btn-success');
                    }
                }, 2000);
                
                console.error('Error from server:', data.message);
            }
        } else {
            // If there's no button (like for logo upload), still update the content
            if (data.success) {
                updateSpecificContent(fieldType, value);
            } else {
                console.error('Error from server:', data.message);
            }
        }
    })
    .catch(error => {
        console.error('Error saving organization data:', error);
        
        // Restore the button state if it exists
        if (saveButton) {
            saveButton.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Failed`;
            saveButton.classList.remove('btn-success');
            saveButton.classList.add('btn-danger');
            
            // After a short delay, restore the button
            setTimeout(() => {
                // The button might not exist anymore if the UI has changed
                if (document.body.contains(saveButton)) {
                    saveButton.disabled = false;
                    saveButton.innerHTML = originalButtonText;
                    saveButton.classList.remove('btn-danger');
                    saveButton.classList.add('btn-success');
                }
            }, 2000);
        }
    });
}

// Debounce function to limit how often a function can be called
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Create debounced version of saveOrganizationData
const debouncedSaveOrganizationData = debounce((fieldType, value) => {
    saveOrganizationData(fieldType, value);
}, 500); // 500ms delay

// Batch processor for textarea adjustments
const textareaAdjustmentBatch = {
    queue: new Set(),
    isProcessing: false,
    add(textarea) {
        this.queue.add(textarea);
        if (!this.isProcessing) {
            this.process();
        }
    },
    process() {
        if (this.queue.size === 0) {
            this.isProcessing = false;
            return;
        }
        
        this.isProcessing = true;
        requestAnimationFrame(() => {
            const textareasToProcess = Array.from(this.queue);
            this.queue.clear();
            
            textareasToProcess.forEach(textarea => {
                autoAdjustTextareaHeight(textarea);
            });
            
            // Check if more items were added during processing
            this.process();
        });
    }
}

// Function removed as we now use button animations instead of notifications

// Initialize dataset values when the page loads
document.addEventListener('DOMContentLoaded', function() {
    ensureDatasetValues();
    
    // Use the batch processor instead of individual debounced calls
     const debouncedAdjustTextarea = debounce((textarea) => {
         textareaAdjustmentBatch.add(textarea);
     }, 50); // 50ms delay
    
    // Function to collect and adjust all textareas in a single animation frame
     function adjustAllTextareas() {
         const textareas = document.querySelectorAll('textarea');
         
         // Process visible textareas immediately
         const visibleTextareas = [];
         const hiddenTextareas = [];
         
         // Separate visible and hidden textareas
         textareas.forEach(textarea => {
             const computedStyle = window.getComputedStyle(textarea);
             const isHidden = computedStyle.display === 'none';
             
             if (isHidden) {
                 hiddenTextareas.push(textarea);
             } else {
                 visibleTextareas.push(textarea);
             }
         });
         
         // Process visible textareas first
         if (visibleTextareas.length > 0) {
             visibleTextareas.forEach(textarea => {
                 textareaAdjustmentBatch.add(textarea);
             });
         }
         
         // Then process hidden textareas if needed
         if (hiddenTextareas.length > 0) {
             // Use a separate batch for hidden textareas
             requestAnimationFrame(() => {
                 hiddenTextareas.forEach(textarea => {
                     // Force the textarea to be temporarily visible for height calculation
                     const originalDisplay = textarea.style.display;
                     const originalVisibility = textarea.style.visibility;
                     const originalPosition = textarea.style.position;
                     
                     // Make it visible but hidden for calculation
                     textarea.style.display = 'block';
                     textarea.style.visibility = 'hidden';
                     textarea.style.position = 'absolute';
                     
                     // Add to batch
                     textareaAdjustmentBatch.add(textarea);
                     
                     // Schedule restoration of properties
                     setTimeout(() => {
                         textarea.style.display = originalDisplay || 'none';
                         textarea.style.visibility = originalVisibility || '';
                         textarea.style.position = originalPosition || '';
                     }, 0);
                 });
             });
         }
     }
    
    // Adjust height of all textareas on page load with a slight delay to ensure DOM is fully rendered
    setTimeout(adjustAllTextareas, 100);
    
    // Add resize event listener to adjust textarea heights when window is resized
     // Use debounce to prevent excessive calculations during resize
     window.addEventListener('resize', debounce(function() {
         const visibleTextareas = document.querySelectorAll('textarea:not([style*="display: none"])');
         
         // Use the batch processor for better performance
         visibleTextareas.forEach(textarea => {
             textareaAdjustmentBatch.add(textarea);
         });
     }, 100));
    
    // Get the specific containers that contain textareas
    const textareaContainers = document.querySelectorAll('.section-organization, .section-type, .section-tagline, .section-description, .field-container');
    
    // Set up a MutationObserver to detect when elements become visible
    const observer = new MutationObserver(function(mutations) {
        // Collect all textareas that need adjustment
        const textareasToAdjust = new Set();
        
        mutations.forEach(function(mutation) {
            // Check if style attribute changed
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                // If this is a textarea or contains textareas
                if (target.tagName === 'TEXTAREA') {
                    textareasToAdjust.add(target);
                } else if (target.querySelector && target.querySelector('textarea')) {
                    target.querySelectorAll('textarea').forEach(textarea => {
                        textareasToAdjust.add(textarea);
                    });
                }
            }
            // Check for added nodes
            else if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // Element node
                        // If this is a textarea or contains textareas
                        if (node.tagName === 'TEXTAREA') {
                            textareasToAdjust.add(node);
                        } else if (node.querySelector && node.querySelector('textarea')) {
                            node.querySelectorAll('textarea').forEach(textarea => {
                                textareasToAdjust.add(textarea);
                            });
                        }
                    }
                });
            }
        });
        
        // If we have textareas to adjust, use the batch processor
         if (textareasToAdjust.size > 0) {
             textareasToAdjust.forEach(textarea => {
                 textareaAdjustmentBatch.add(textarea);
             });
         }
    });
    
    // Observe only specific containers instead of the entire document
    textareaContainers.forEach(container => {
        observer.observe(container, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            childList: true,
            subtree: true
        });
    });
});

// Function to update the specific part of the page content
function updateSpecificContent(fieldType, value) {
    // Update UI elements based on field type
    switch(fieldType) {
        case 'name':
            // Update the organization title in the header
            const orgTitle = document.querySelector('.org-title');
            if (orgTitle && value) {
                orgTitle.textContent = value;
            }
            
            // Update the field element's dataset
            const nameField = document.getElementById('org-name-field');
            if (nameField) {
                nameField.dataset.value = value;
                nameField.value = value;
            }
            break;
            
        case 'type':
            // Update the organization type in the header
            const orgType = document.querySelector('.org-type');
            if (orgType) {
                if (value) {
                    orgType.innerHTML = `<strong>Type:</strong> ${value}`;
                    orgType.style.display = '';
                } else {
                    orgType.style.display = 'none';
                }
            }
            
            // Update the field element's dataset
            const typeField = document.getElementById('org-type-field');
            if (typeField) {
                typeField.dataset.value = value;
                typeField.value = value;
            }
            break;
            
        case 'tagline':
            // Update the tagline in the header
            const orgQuote = document.querySelector('.org-quote');
            if (orgQuote) {
                if (value) {
                    orgQuote.textContent = `"${value}"`;
                    orgQuote.style.display = '';
                } else {
                    orgQuote.style.display = 'none';
                }
            }
            
            // Update the field element's dataset
            const taglineField = document.getElementById('org-tagline-field');
            if (taglineField) {
                taglineField.dataset.value = value;
                taglineField.value = value;
            }
            break;
            
        case 'description':
            // Update the description in the header
            const orgDescription = document.querySelector('.org-description');
            if (orgDescription) {
                if (value) {
                    orgDescription.textContent = value;
                    orgDescription.style.display = '';
                } else {
                    orgDescription.style.display = 'none';
                }
            }
            
            // Update the field element's dataset
            const descField = document.getElementById('org-description-field');
            if (descField) {
                descField.dataset.value = value;
                descField.value = value;
            }
            break;
            
        case 'logo':
            // For logo updates, we don't need to do anything here as the page will refresh
            // or the logo is already updated via the file input preview
            break;
    }
}