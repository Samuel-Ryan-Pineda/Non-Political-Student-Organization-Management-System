// Organization Management Modal Functions
function showEditOrganizationProfileModal() {
    // Show the edit organization profile modal
    const editOrgModal = document.getElementById('editOrganizationProfileModal');
    if (editOrgModal) {
        editOrgModal.classList.add('show');
    }
    
    document.body.classList.add('modal-open'); // Add this line
    
    // Ensure all fields have their dataset values set
    ensureDatasetValues();
}

function hideEditOrganizationProfileModal() {
    // Hide the edit organization profile modal
    const editOrgModal = document.getElementById('editOrganizationProfileModal');
    if (editOrgModal) {
        editOrgModal.classList.remove('show');
    }
    
    document.body.classList.remove('modal-open'); // Add this line
    
    // Reset any active edit forms back to display mode
    clearAllSectionHighlights();
    
    // Reset logo description if in edit mode
    if (document.getElementById('edit-logo-description')?.style.display !== 'none') {
        cancelEditLogoDescription();
    }
    
    // Reset organization name if in edit mode
    if (document.getElementById('edit-org-name')?.style.display !== 'none') {
        cancelEditOrganizationName();
    }
    
    // Reset organization type if in edit mode
    if (document.getElementById('edit-org-type')?.style.display !== 'none') {
        cancelEditOrganizationType();
    }
    
    // Reset tagline if in edit mode
    if (document.getElementById('edit-tagline')?.style.display !== 'none') {
        cancelEditTagline();
    }
    
    // Reset description if in edit mode
    if (document.getElementById('edit-description')?.style.display !== 'none') {
        cancelEditDescription();
    }
    
    // Reset logo upload if in edit mode
    if (document.getElementById('logoSaveButtons')?.style.display === 'block') {
        cancelLogoUpload();
    }
}

// Global variable to store the selected logo file temporarily
let selectedLogoFile = null;
let originalLogoSrc = null;

function uploadNewLogo() {
    // Cancel all other active edit forms first
    cancelAllActiveEditForms();
    
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
        
        // Get CSRF token from meta tag or input
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                         document.querySelector('[name="csrf_token"]')?.value;
        
        if (!csrfToken) {
            console.error('CSRF token not found');
            handleSaveError(new Error('CSRF token not found'), saveButton, originalButtonText);
            return;
        }
        
        // Create headers object with CSRF token
        const headers = {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        fetch(updateUrl, {
            method: 'POST',
            body: formData,
            headers: headers,
            credentials: 'same-origin' // Include cookies for CSRF token
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            handleSaveResponse(data, saveButton, originalButtonText);
            if (data.success) {
                // Update the logo in the header without page refresh
                const headerLogo = document.querySelector('.org-logo');
                if (headerLogo) {
                    headerLogo.src = URL.createObjectURL(selectedLogoFile);
                }
                updateSpecificContent('logo', selectedLogoFile);
                // Reset the selected file
                selectedLogoFile = null;
                originalLogoSrc = null;
                
                // Show upload button, hide save and cancel buttons
                document.getElementById('logoUploadButtons').style.display = 'block';
                document.getElementById('logoSaveButtons').style.display = 'none';
            }
        })
        .catch(error => {
            handleSaveError(error, saveButton, originalButtonText);
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

// Logo Description functions
function showEditLogoDescriptionForm() {
    // Cancel all other active edit forms first
    cancelAllActiveEditForms();
    
    // Ensure all fields have their dataset.value set
    ensureDatasetValues();

    // Clear any existing highlights and add highlight to current section
    clearAllSectionHighlights();
    document.querySelector('.section-logo-description').classList.add('section-highlighted');

    const container = document.querySelector('.section-logo-description .field-container');
    const buttonContainer = document.querySelector('.section-logo-description .d-flex');
    const currentField = document.getElementById('logo-description-field');
    const currentValue = currentField.dataset.value || currentField.value || '';

    // Hide the display field and show the edit field
    currentField.style.display = 'none';

    // Create the edit textarea if it doesn't exist
    let editField = document.getElementById('edit-logo-description');
    if (!editField) {
        editField = document.createElement('textarea');
        editField.id = 'edit-logo-description';
        editField.className = 'form-control';
        editField.style.fontSize = '0.75rem';
        editField.style.minHeight = '1.625rem';
        container.appendChild(editField);
        
        // Add input event listener to adjust height as user types
        editField.addEventListener('input', function() {
            autoAdjustTextareaHeight(this);
        });
    }

    // Set the value of the edit field and show it
    editField.value = currentValue;
    editField.style.display = 'block';
    
    // Adjust the height of the textarea to fit content
    autoAdjustTextareaHeight(editField);
    
    // Focus the edit field
    editField.focus();

    // Replace the edit button with save and cancel buttons
    buttonContainer.innerHTML = `
        <label for="logo-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Logo Description</label>
        <div class="d-flex gap-1">
            <button type="button" class="btn btn-success btn-sm" onclick="saveEditLogoDescription()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEditLogoDescription()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
        </div>
    `;
}

function cancelEditLogoDescription() {
    // Remove highlight from current section
    document.querySelector('.section-logo-description').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-logo-description .d-flex');
    const displayField = document.getElementById('logo-description-field');
    const editField = document.getElementById('edit-logo-description');

    // Hide the edit field and show the display field
    if (editField) {
        editField.style.display = 'none';
    }
    displayField.style.display = 'block';

    // Restore the original value
    displayField.value = displayField.dataset.value || '';
    
    // Update the logo preview with the original description
    // This ensures all logo images and preview elements are updated with the correct description
    updateSpecificContent('logo_description', displayField.dataset.value || '');

    // Determine button text based on whether there's data
    const buttonText = (!displayField.dataset.value || displayField.dataset.value.trim() === '') ? 'Add' : 'Edit';

    // Restore the original button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="logo-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Logo Description</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditLogoDescriptionForm()">
            ${buttonText}
        </button>
    `;
}

function saveEditLogoDescription() {
    // Remove highlight from current section
    document.querySelector('.section-logo-description').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-logo-description .d-flex');
    const displayField = document.getElementById('logo-description-field');
    const editField = document.getElementById('edit-logo-description');
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

    // Restore the button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="logo-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Logo Description</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditLogoDescriptionForm()">
            ${buttonText}
        </button>
    `;

    // Immediately update all logo tooltips in the UI
    updateSpecificContent('logo_description', newValue);
    
    // Get organization name and type for fallback tooltip
    const orgName = document.getElementById('org-name-field')?.value || 'Organization';
    const orgType = document.getElementById('org-type-field')?.value || 'Organization';
    
    // Update all logo images in the organization header
    const headerLogoImages = document.querySelectorAll('.org-logo, .sticky-org-logo');
    headerLogoImages.forEach(img => {
        if (newValue && newValue.trim() !== '') {
            img.title = newValue;
            img.alt = newValue;
        } else {
            img.title = `${orgName} - ${orgType} Logo`;
            img.alt = `${orgName} - ${orgType} Logo`;
        }
    });

    // Save the logo description to the database using debounced function
    debouncedSaveOrganizationData('logo_description', newValue);
}

// Helper function to clear all section highlights
function clearAllSectionHighlights() {
    const sections = document.querySelectorAll('.section-logo-description, .section-organization, .section-type, .section-tagline, .section-description');
    if (sections && sections.length > 0) {
        sections.forEach(section => section.classList.remove('section-highlighted'));
    }
}

// Helper function to cancel all active edit forms
function cancelAllActiveEditForms() {
    // Cancel logo description edit if active
    const editLogoDesc = document.getElementById('edit-logo-description');
    if (editLogoDesc && editLogoDesc.style.display !== 'none' && editLogoDesc.style.display !== '') {
        cancelEditLogoDescription();
    }
    
    // Cancel organization name edit if active
    const editOrgName = document.getElementById('edit-org-name');
    if (editOrgName && editOrgName.style.display !== 'none' && editOrgName.style.display !== '') {
        cancelEditOrganizationName();
    }
    
    // Cancel organization type edit if active
    const editOrgType = document.getElementById('edit-org-type');
    if (editOrgType && editOrgType.style.display !== 'none' && editOrgType.style.display !== '') {
        cancelEditOrganizationType();
    }
    
    // Cancel tagline edit if active
    const editTagline = document.getElementById('edit-tagline');
    if (editTagline && editTagline.style.display !== 'none' && editTagline.style.display !== '') {
        cancelEditTagline();
    }
    
    // Cancel description edit if active
    const editDescription = document.getElementById('edit-description');
    if (editDescription && editDescription.style.display !== 'none' && editDescription.style.display !== '') {
        cancelEditDescription();
    }
    
    // Cancel logo upload if active
    const logoSaveButtons = document.getElementById('logoSaveButtons');
    if (logoSaveButtons && logoSaveButtons.style.display === 'block') {
        cancelLogoUpload();
    }
}

// Helper function to ensure all fields have their dataset.value set
function ensureDatasetValues() {
    const fields = [
        'org-name-field',
        'org-type-field',
        'org-tagline-field',
        'org-description-field',
        'logo-description-field'
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
    // Cancel all other active edit forms first
    cancelAllActiveEditForms();
    
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

    // Restore the original button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="org-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Organization</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditOrganizationNameForm()">
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

    // Restore the button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="org-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Organization</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditOrganizationNameForm()">
            ${buttonText}
        </button>
    `;

    // Save the organization name to the database using debounced function
    debouncedSaveOrganizationData('name', newValue);
}

function showEditOrganizationTypeForm() {
    // Cancel all other active edit forms first
    cancelAllActiveEditForms();
    
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
            <option value="Religious">Religious</option>
            <option value="Arts">Arts</option>
            <option value="Outreach">Outreach</option>
            <option value="Academic">Academic</option>
            <option value="Indigenous People">Indigenous People</option>
            <option value="Sports">Sports</option>
            <option value="Gender">Gender</option>
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

    // Restore the original button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="org-type-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Type</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditOrganizationTypeForm()">
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

    // Restore the button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="org-type-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Type</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditOrganizationTypeForm()">
            ${buttonText}
        </button>
    `;

    // Save the organization type to the database using debounced function
    debouncedSaveOrganizationData('type', newValue);
}

function showEditTaglineForm() {
    // Cancel all other active edit forms first
    cancelAllActiveEditForms();
    
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
    
    // Restore the original button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="org-tagline-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Tagline</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditTaglineForm()">
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
    
    // Restore the button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="org-tagline-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Tagline</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditTaglineForm()">
            ${buttonText}
        </button>
    `;
    
    // Save the organization tagline to the database using debounced function
    debouncedSaveOrganizationData('tagline', newValue);
}

function showEditDescriptionForm() {
    // Cancel all other active edit forms first
    cancelAllActiveEditForms();
    
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

    // Restore the original button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="org-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Description</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditDescriptionForm()">
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

    // Restore the button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="org-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Description</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditDescriptionForm()">
            ${buttonText}
        </button>
    `;

    // Save the organization description to the database using debounced function
    debouncedSaveOrganizationData('description', newValue);
}

// Helper function to update specific content on the page after a successful save
function updateSpecificContent(fieldType, value) {
    switch (fieldType) {
        case 'name':
            // Update organization name in the header
            const orgTitleElements = document.querySelectorAll('.org-title');
            orgTitleElements.forEach(element => {
                element.textContent = value;
            });
            
            // Update any input fields if they exist
            const orgNameInput = document.getElementById('organizationNameInput');
            if (orgNameInput) orgNameInput.value = value;
            break;
        case 'type':
            // Update organization type in the header
            const orgTypeElements = document.querySelectorAll('.org-type');
            orgTypeElements.forEach(element => {
                element.textContent = value;
            });
            break;
        case 'tagline':
            // Update organization tagline in the header
            const orgTaglineElements = document.querySelectorAll('.org-tagline');
            orgTaglineElements.forEach(element => {
                element.textContent = value;
            });
            break;
        case 'description':
            // Update organization description in the header
            const orgDescElements = document.querySelectorAll('.org-description');
            orgDescElements.forEach(element => {
                element.textContent = value;
            });
            break;
            
        case 'logo':
            // For logo updates, we don't need to do anything here as the page will refresh
            // or the logo is already updated via the file input preview
            break;
            
        case 'logo_description':
            // Update the logo alt and title attributes
            const logoImages = document.querySelectorAll('.org-logo, .sticky-org-logo, #logoPreview, .rounded-circle[alt="Organization Logo"]');
            logoImages.forEach(img => {
                if (value && value.trim() !== '') {
                    img.title = value;
                    img.alt = value;
                } else {
                    // If no description, use default title
                    const orgName = document.getElementById('org-name-field')?.value || 'Organization';
                    const orgType = document.getElementById('org-type-field')?.value || 'Organization';
                    img.title = `${orgName} - ${orgType} Logo`;
                    img.alt = `${orgName} - ${orgType} Logo`;
                }
            });
            
            // Update the logo description field and its dataset value
            const logoDescField = document.getElementById('logo-description-field');
            if (logoDescField) {
                logoDescField.value = value || '';
                logoDescField.dataset.value = value || '';
                autoAdjustTextareaHeight(logoDescField);
            }
            break;
    }
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
        case 'logo_description':
            saveButton = document.querySelector('.section-logo-description .btn-success');
            fieldElement = document.getElementById('logo-description-field');
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
        case 'logo_description':
            formData.append('logo_description', value);
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
    
    // Get CSRF token from meta tag or input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        if (saveButton) {
            handleSaveError(new Error('CSRF token not found'), saveButton, originalButtonText);
        }
        return;
    }
    
    // Send the data to the server
    const updateUrl = '/organization/update-organization';
    
    // Create headers object with CSRF token
    const headers = {
        'X-CSRFToken': csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
    };
    
    fetch(updateUrl, {
        method: 'POST',
        body: formData,
        headers: headers,
        credentials: 'same-origin' // Include cookies for CSRF token
    })
    .then(response => response.json())
    .then(data => {
        handleSaveResponse(data, saveButton, originalButtonText);
        if (data.success) {
            updateSpecificContent(fieldType, value);
        }
    })
    .catch(error => {
        handleSaveError(error, saveButton, originalButtonText);
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

// Helper functions for save response and error handling
function handleSaveResponse(data, saveButton, originalButtonText) {
    if (data.success) {
        if (saveButton) {
            saveButton.innerHTML = `<i class="fas fa-check"></i> Saved`;
            saveButton.classList.remove('btn-success');
            saveButton.classList.add('btn-outline-success');

            setTimeout(() => {
                if (document.body.contains(saveButton)) {
                    saveButton.disabled = false;
                    saveButton.innerHTML = originalButtonText;
                    saveButton.classList.remove('btn-outline-success');
                    saveButton.classList.add('btn-success');
                }
            }, 1000);
        }
    } else {
        console.error('Error from server:', data.message);
        if (saveButton) {
            saveButton.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error`;
            saveButton.classList.remove('btn-success');
            saveButton.classList.add('btn-danger');

            setTimeout(() => {
                if (document.body.contains(saveButton)) {
                    saveButton.disabled = false;
                    saveButton.innerHTML = originalButtonText;
                    saveButton.classList.remove('btn-danger');
                    saveButton.classList.add('btn-success');
                }
            }, 2000);
        }
    }
}

function handleSaveError(error, saveButton, originalButtonText) {
    console.error('Error saving data:', error);
    if (saveButton) {
        saveButton.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Failed`;
        saveButton.classList.remove('btn-success');
        saveButton.classList.add('btn-danger');
        
        setTimeout(() => {
            if (document.body.contains(saveButton)) {
                saveButton.disabled = false;
                saveButton.innerHTML = originalButtonText;
                saveButton.classList.remove('btn-danger');
                saveButton.classList.add('btn-success');
            }
        }, 2000);
    }
}

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
            
            // Update the organization name in the sidebar
            const sidebarOrgName = document.querySelector('.custom-sidebar .custom-name');
            if (sidebarOrgName && value) {
                sidebarOrgName.textContent = value;
            }
            
            // Update the field element's dataset
            const nameField = document.getElementById('org-name-field');
            if (nameField) {
                nameField.dataset.value = value;
                nameField.value = value;
            }
            break;
            
        case 'type':
            // Update organization type in the header
            const orgTypeElements = document.querySelectorAll('.org-type');
            orgTypeElements.forEach(element => {
                element.innerHTML = `<strong>Type:</strong> ${value}`;
            });
            
            // Update any select fields if they exist
            const orgTypeSelect = document.getElementById('organizationTypeSelect');
            if (orgTypeSelect) orgTypeSelect.value = value;
            break;
            
        case 'tagline':
            // Update tagline in the organization header
            const taglineElements = document.querySelectorAll('.org-quote');
            
            if (value && value.trim() !== '') {
                // If there's a tagline, update or create the element
                taglineElements.forEach(element => {
                    element.textContent = `"${value}"`;
                    element.style.display = 'block';
                });
                
                // If no tagline element exists, create one after org-type
                if (taglineElements.length === 0) {
                    const orgTypeEl = document.querySelector('.org-type');
                    if (orgTypeEl) {
                        const newTagline = document.createElement('p');
                        newTagline.className = 'org-quote';
                        newTagline.textContent = `"${value}"`;
                        orgTypeEl.insertAdjacentElement('afterend', newTagline);
                    }
                }
            } else {
                // If tagline is empty, hide the elements
                taglineElements.forEach(element => {
                    element.style.display = 'none';
                });
            }
            
            // Update any input fields if they exist
            const taglineInput = document.getElementById('organizationTaglineInput');
            if (taglineInput) taglineInput.value = value;
            break;
        case 'description':
            // Update description in the organization header
            const descElements = document.querySelectorAll('.org-description');
            
            if (value && value.trim() !== '') {
                // If there's a description, update or create the element
                descElements.forEach(element => {
                    element.textContent = value;
                    element.style.display = 'block';
                });
                
                // If no description element exists, create one after org-quote or org-type
                if (descElements.length === 0) {
                    const taglineEl = document.querySelector('.org-quote');
                    const orgTypeEl = document.querySelector('.org-type');
                    const insertAfter = taglineEl || orgTypeEl;
                    
                    if (insertAfter) {
                        const newDesc = document.createElement('p');
                        newDesc.className = 'org-description';
                        newDesc.textContent = value;
                        insertAfter.insertAdjacentElement('afterend', newDesc);
                    }
                }
            } else {
                // If description is empty, hide the elements
                descElements.forEach(element => {
                    element.style.display = 'none';
                });
            }
            
            // Update any input fields if they exist
            const descInput = document.getElementById('organizationDescriptionInput');
            if (descInput) descInput.value = value;
            break;
        case 'logo':
            // Assuming 'value' for logo is the file input element
            // And the server response contains the new logo URL
            // For now, we'll just update the preview if it's a file input
            if (value instanceof HTMLInputElement && value.type === 'file' && value.files.length > 0) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    // Update all logo images
                    document.querySelectorAll('.org-logo, .sticky-org-logo').forEach(img => {
                        img.src = e.target.result;
                    });
                    
                    // Update preview images if they exist
                    const currentLogo = document.getElementById('currentLogo');
                    if (currentLogo) currentLogo.src = e.target.result;
                    
                    const logoPreview = document.getElementById('logoPreview');
                    if (logoPreview) logoPreview.src = e.target.result;
                };
                reader.readAsDataURL(value.files[0]);
            } else if (typeof value === 'string') {
                // If value is a string, assume it's the new URL from the server
                // Update all logo images
                document.querySelectorAll('.org-logo, .sticky-org-logo').forEach(img => {
                    img.src = value;
                });
                
                // Update preview images if they exist
                const currentLogo = document.getElementById('currentLogo');
                if (currentLogo) currentLogo.src = value;
                
                const logoPreview = document.getElementById('logoPreview');
                if (logoPreview) logoPreview.src = value;
            }
            break;
        default:
            console.warn('No specific content update defined for field type:', fieldType);
    }
}