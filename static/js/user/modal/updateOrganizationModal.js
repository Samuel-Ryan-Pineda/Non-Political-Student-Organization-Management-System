// Update Organization Modal Functions

// Variables to store selected logo file and original logo source
// Using var instead of let to avoid redeclaration issues if the script is loaded multiple times
var selectedUpdateLogoFile = null;
var originalUpdateLogoSrc = null;

// Function to open the update organization modal
function openUpdateOrgModal() {
    showUpdateOrganizationModal();
}

// Show and hide modal functions
function showUpdateOrganizationModal() {
    // Show the update organization modal
    const updateOrgModal = document.getElementById('updateOrganizationModal');
    if (updateOrgModal) {
        updateOrgModal.classList.add('show');
        
        document.body.classList.add('modal-open'); // Add this line
        
        // Ensure all fields have their dataset values set and display values updated
        // Adding a small delay to ensure the modal is fully rendered
        setTimeout(() => {
            ensureUpdateDatasetValues();
            // Refresh all UI elements to ensure they're in sync with the latest data
            refreshAllOrganizationUIElements();
        }, 50);
    }
}

function hideUpdateOrganizationModal() {
    // Hide the update organization modal
    const updateOrgModal = document.getElementById('updateOrganizationModal');
    if (updateOrgModal) {
        updateOrgModal.classList.remove('show');
    }
    
    document.body.classList.remove('modal-open'); // Add this line
    
    // Reset any active edit forms back to display mode
    clearAllUpdateSectionHighlights();
    
    // Reset logo description if in edit mode
    if (document.getElementById('edit-logo-description')?.style.display !== 'none') {
        cancelEditLogoDescription();
    }
    
    // Reset organization name if in edit mode
    if (document.getElementById('edit-update-org-name')?.style.display !== 'none') {
        cancelEditUpdateOrganizationName();
    }
    
    // Reset organization type if in edit mode
    if (document.getElementById('edit-update-org-type')?.style.display !== 'none') {
        cancelEditUpdateOrganizationType();
    }
    
    // Reset logo upload if in edit mode
    if (document.getElementById('updateLogoSaveButtons')?.style.display === 'block') {
        cancelUpdateLogoUpload();
    }
    
    // Refresh all UI elements to ensure they're updated with the latest data
    refreshAllOrganizationUIElements();
}

// Logo handling functions
function uploadNewUpdateLogo() {
    // Trigger the file input click
    document.getElementById('updateLogoFileInput').click();
}

function handleUpdateLogoFileSelect(event) {
    const fileInput = event.target;
    if (fileInput.files && fileInput.files[0]) {
        // Store the selected file
        selectedUpdateLogoFile = fileInput.files[0];
        
        // Store the original logo source for cancellation
        const previewLogo = document.getElementById('updatePreviewLogo');
        originalUpdateLogoSrc = previewLogo.src;
        
        // Create a preview of the selected image
        const reader = new FileReader();
        reader.onload = function(e) {
            previewLogo.src = e.target.result;
        };
        reader.readAsDataURL(selectedUpdateLogoFile);
        
        // Show save and cancel buttons, hide upload button
        document.getElementById('updateLogoUploadButtons').style.display = 'none';
        document.getElementById('updateLogoSaveButtons').style.display = 'block';
    }
}

function cancelUpdateLogoUpload() {
    // Restore the original logo
    if (originalUpdateLogoSrc) {
        document.getElementById('updatePreviewLogo').src = originalUpdateLogoSrc;
    }
    
    // Reset the file input
    const fileInput = document.getElementById('updateLogoFileInput');
    fileInput.value = '';
    
    // Reset the selected file
    selectedUpdateLogoFile = null;
    originalUpdateLogoSrc = null;
    
    // Show upload button, hide save and cancel buttons
    document.getElementById('updateLogoUploadButtons').style.display = 'block';
    document.getElementById('updateLogoSaveButtons').style.display = 'none';
}

async function saveUpdateLogo() {
    if (selectedUpdateLogoFile) {
        // Get the save button and store its original text
        const saveButton = document.querySelector('#updateLogoSaveButtons .btn-success');
        const originalButtonText = saveButton.textContent;
        
        // Show saving indicator
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveButton.disabled = true;
        
        // Create FormData and append the file
        const formData = new FormData();
        formData.append('logo', selectedUpdateLogoFile);
        
        // Get CSRF token from meta tag or input
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                         document.querySelector('[name="csrf_token"]')?.value;
        
        if (!csrfToken) {
            console.error('CSRF token not found');
            return;
        }
        
        // Send the logo to the server
        try {
            // Create headers object with CSRF token
            const headers = {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            };
            
            const response = await fetch('/organization/update-logo', {
                method: 'POST',
                body: formData,
                headers: headers,
                credentials: 'same-origin' // Include cookies for CSRF token
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Update the logo preview with the new logo
                updateSpecificUpdateContent('logo', selectedUpdateLogoFile);
                
                // Reset the selected file
                selectedUpdateLogoFile = null;
                originalUpdateLogoSrc = null;
                
                // Show upload button, hide save and cancel buttons
                document.getElementById('updateLogoUploadButtons').style.display = 'block';
                document.getElementById('updateLogoSaveButtons').style.display = 'none';
                
                // Show success message
                handleSaveResponse(data, saveButton, originalButtonText);
            } else {
                throw new Error(data.message || 'Failed to update logo');
            }
        } catch (error) {
            console.error('Error updating logo:', error);
            handleSaveError(error, saveButton, originalButtonText);
        }
    }
}

// Helper functions
function ensureUpdateDatasetValues() {
    // Ensure all fields have their dataset.value set and display values are updated
    const logoDescField = document.getElementById('logo-description-field');
    if (logoDescField) {
        if (!logoDescField.dataset.value) {
            logoDescField.dataset.value = logoDescField.value || '';
        }
        // Make sure the visible value matches the dataset value
        logoDescField.value = logoDescField.dataset.value;
    }
    
    const orgNameField = document.getElementById('update-org-name-field');
    if (orgNameField) {
        if (!orgNameField.dataset.value) {
            orgNameField.dataset.value = orgNameField.value || '';
        }
        // Make sure the visible value matches the dataset value
        orgNameField.value = orgNameField.dataset.value;
    }
    
    const orgTypeField = document.getElementById('update-org-type-field');
    if (orgTypeField) {
        if (!orgTypeField.dataset.value) {
            orgTypeField.dataset.value = orgTypeField.value || '';
        }
        // Make sure the visible value matches the dataset value
        orgTypeField.value = orgTypeField.dataset.value;
    }
    
    // Adjust textarea heights after updating values
    autoAdjustUpdateTextareaHeight(logoDescField);
    autoAdjustUpdateTextareaHeight(orgNameField);
    autoAdjustUpdateTextareaHeight(orgTypeField);
}

function clearAllUpdateSectionHighlights() {
    // Remove highlight from all sections
    document.querySelector('.section-logo-description')?.classList.remove('section-highlighted');
    document.querySelector('.section-organization')?.classList.remove('section-highlighted');
    document.querySelector('.section-type')?.classList.remove('section-highlighted');
}

function cancelAllUpdateActiveEditForms() {
    // Cancel logo description edit if active
    const editLogoDesc = document.getElementById('edit-logo-description');
    if (editLogoDesc && editLogoDesc.style.display !== 'none' && editLogoDesc.style.display !== '') {
        cancelEditLogoDescription();
    }
    
    // Cancel organization name edit if active
    const editOrgName = document.getElementById('edit-update-org-name');
    if (editOrgName && editOrgName.style.display !== 'none' && editOrgName.style.display !== '') {
        cancelEditUpdateOrganizationName();
    }
    
    // Cancel organization type edit if active
    const editOrgType = document.getElementById('edit-update-org-type');
    if (editOrgType && editOrgType.style.display !== 'none' && editOrgType.style.display !== '') {
        cancelEditUpdateOrganizationType();
    }
    
    // Cancel logo upload if active
    const logoSaveButtons = document.getElementById('updateLogoSaveButtons');
    if (logoSaveButtons && logoSaveButtons.style.display === 'block') {
        cancelUpdateLogoUpload();
    }
}

// Auto-adjust textarea height function
function autoAdjustUpdateTextareaHeight(textarea) {
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to match the content (plus a small buffer)
    textarea.style.height = (textarea.scrollHeight + 2) + 'px';
}

// Logo Description functions
function showEditLogoDescriptionForm() {
    // Cancel all other active edit forms first
    cancelAllUpdateActiveEditForms();
    
    // Ensure all fields have their dataset.value set
    ensureUpdateDatasetValues();

    // Clear any existing highlights and add highlight to current section
    clearAllUpdateSectionHighlights();
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
            autoAdjustUpdateTextareaHeight(this);
        });
    }

    // Set the value of the edit field and show it
    editField.value = currentValue;
    editField.style.display = 'block';
    
    // Adjust the height of the textarea to fit content
    autoAdjustUpdateTextareaHeight(editField);
    
    // Focus the edit field
    editField.focus();

    // Replace the edit button with save and cancel buttons
    buttonContainer.innerHTML = `
        <label for="logo-description-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Logo Description</label>
        <div>
            <button type="button" class="btn btn-save" onclick="saveEditLogoDescription()">Save</button>
            <button type="button" class="btn btn-cancel" onclick="cancelEditLogoDescription()">Cancel</button>
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
    autoAdjustUpdateTextareaHeight(displayField);

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
    updateSpecificUpdateContent('logo_description', newValue);
    
    // Get organization name and type for fallback tooltip
    const orgName = document.getElementById('update-org-name-field')?.value || 'Organization';
    const orgType = document.getElementById('update-org-type-field')?.value || 'Organization';
    
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
    debouncedSaveOrganizationData('logoDescription', newValue);
}

// Organization Name functions
function showEditUpdateOrganizationNameForm() {
    // Cancel all other active edit forms first
    cancelAllUpdateActiveEditForms();
    
    // Ensure all fields have their dataset.value set
    ensureUpdateDatasetValues();

    // Clear any existing highlights and add highlight to current section
    clearAllUpdateSectionHighlights();
    document.querySelector('.section-organization').classList.add('section-highlighted');

    const container = document.querySelector('.section-organization .field-container');
    const buttonContainer = document.querySelector('.section-organization .d-flex');
    const currentField = document.getElementById('update-org-name-field');
    const currentValue = currentField.dataset.value || currentField.value || '';

    // Hide the display field and show the edit field
    currentField.style.display = 'none';

    // Create the edit textarea if it doesn't exist
    let editField = document.getElementById('edit-update-org-name');
    if (!editField) {
        editField = document.createElement('textarea');
        editField.id = 'edit-update-org-name';
        editField.className = 'form-control';
        editField.style.fontSize = '0.75rem';
        editField.style.minHeight = '1.625rem';
        container.appendChild(editField);
        
        // Add input event listener to adjust height as user types
        editField.addEventListener('input', function() {
            autoAdjustUpdateTextareaHeight(this);
        });
    }

    // Set the value of the edit field and show it
    editField.value = currentValue;
    editField.style.display = 'block';
    
    // Adjust the height of the textarea to fit content
    autoAdjustUpdateTextareaHeight(editField);
    
    // Focus the edit field
    editField.focus();

    // Replace the edit button with save and cancel buttons
    buttonContainer.innerHTML = `
        <label for="update-org-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Organization</label>
        <div>
            <button type="button" class="btn btn-save" onclick="saveEditUpdateOrganizationName()">Save</button>
            <button type="button" class="btn btn-cancel" onclick="cancelEditUpdateOrganizationName()">Cancel</button>
        </div>
    `;
}

function cancelEditUpdateOrganizationName() {
    // Remove highlight from current section
    document.querySelector('.section-organization').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-organization .d-flex');
    const displayField = document.getElementById('update-org-name-field');
    const editField = document.getElementById('edit-update-org-name');

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
        <label for="update-org-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Organization</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditUpdateOrganizationNameForm()">
            ${buttonText}
        </button>
    `;
}

function saveEditUpdateOrganizationName() {
    // Remove highlight from current section
    document.querySelector('.section-organization').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-organization .d-flex');
    const displayField = document.getElementById('update-org-name-field');
    const editField = document.getElementById('edit-update-org-name');
    const newValue = editField.value;

    // Update the display field's value and dataset
    displayField.value = newValue;
    displayField.dataset.value = newValue;

    // Hide the edit field and show the display field
    editField.style.display = 'none';
    displayField.style.display = 'block';
    
    // Adjust the height of the textarea to fit content
    autoAdjustUpdateTextareaHeight(displayField);

    // Determine button text based on whether there's data
    const buttonText = (!newValue || newValue.trim() === '') ? 'Add' : 'Edit';

    // Restore the button with plain blue text styling
    buttonContainer.innerHTML = `
        <label for="update-org-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Organization</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditUpdateOrganizationNameForm()">
            ${buttonText}
        </button>
    `;

    // Save the organization name to the database using debounced function
    debouncedSaveOrganizationData('orgName', newValue);
}

// Organization Type functions
function showEditUpdateOrganizationTypeForm() {
    // Cancel all other active edit forms first
    cancelAllUpdateActiveEditForms();
    
    // Ensure all fields have their dataset.value set
    ensureUpdateDatasetValues();

    // Clear any existing highlights and add highlight to current section
    clearAllUpdateSectionHighlights();
    document.querySelector('.section-type').classList.add('section-highlighted');

    const container = document.querySelector('.section-type .field-container');
    const buttonContainer = document.querySelector('.section-type .d-flex');
    const currentField = document.getElementById('update-org-type-field');
    const currentValue = currentField.dataset.value || currentField.value || '';

    // Hide the display field and show the edit field
    currentField.style.display = 'none';

    // Create the edit select if it doesn't exist
    let editField = document.getElementById('edit-update-org-type');
    if (!editField) {
        editField = document.createElement('select');
        editField.id = 'edit-update-org-type';
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

    // Set the value of the edit field and show it
    editField.value = currentValue;
    editField.style.display = 'block';
    
    // Focus the edit field
    editField.focus();

    // Replace the edit button with save and cancel buttons
    buttonContainer.innerHTML = `
        <label for="update-org-type-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Type</label>
        <div>
            <button type="button" class="btn btn-save" onclick="saveEditUpdateOrganizationType()">Save</button>
            <button type="button" class="btn btn-cancel" onclick="cancelEditUpdateOrganizationType()">Cancel</button>
        </div>
    `;
}

function cancelEditUpdateOrganizationType() {
    // Remove highlight from current section
    document.querySelector('.section-type').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-type .d-flex');
    const displayField = document.getElementById('update-org-type-field');
    const editField = document.getElementById('edit-update-org-type');

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
        <label for="update-org-type-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Type</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditUpdateOrganizationTypeForm()">
            ${buttonText}
        </button>
    `;
}

function saveEditUpdateOrganizationType() {
    // Remove highlight from current section
    document.querySelector('.section-type').classList.remove('section-highlighted');

    const buttonContainer = document.querySelector('.section-type .d-flex');
    const displayField = document.getElementById('update-org-type-field');
    const editField = document.getElementById('edit-update-org-type');
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
        <label for="update-org-type-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Type</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditUpdateOrganizationTypeForm()">
            ${buttonText}
        </button>
    `;

    // Save the organization type to the database using debounced function
    debouncedSaveOrganizationData('orgType', newValue);
}

// Save organization data to the server
function saveOrganizationUpdateData(fieldType, value) {
    // Get the appropriate save button based on field type
    let saveButton;
    let originalButtonText;
    
    // Map fieldType to the expected field_id on the server
    let field_id;
    switch(fieldType) {
        case 'logo_description':
        case 'logoDescription':
            field_id = 'logoDescription';
            saveButton = document.querySelector('.section-logo-description .btn-save');
            break;
        case 'name':
        case 'orgName':
            field_id = 'orgName';
            saveButton = document.querySelector('.section-organization .btn-save');
            break;
        case 'type':
        case 'orgType':
            field_id = 'orgType';
            saveButton = document.querySelector('.section-type .btn-save');
            break;
        case 'logo':
            saveButton = document.querySelector('#updateLogoSaveButtons .btn-success');
            break;
        default:
            console.error('Unknown field type:', fieldType);
            return;
    }
    
    if (saveButton) {
        originalButtonText = saveButton.textContent;
        saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
        saveButton.disabled = true;
    }
    
    // Create FormData for the request
    const formData = new FormData();
    
    formData.append('field_id', field_id);
    formData.append('field_value', value);
    
    // Get CSRF token from meta tag or input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        handleSaveError(new Error('CSRF token not found'), saveButton, originalButtonText);
        return;
    }
    
    console.log('CSRF Token:', csrfToken); // Debug: Log the CSRF token
    console.log('Sending data:', { field_id, field_value: value }); // Debug: Log the data being sent
    
    // Send the data to the server
    // Create headers object with CSRF token
    const headers = {
        'X-CSRFToken': csrfToken,
        'X-Requested-With': 'XMLHttpRequest' // Add this to indicate AJAX request
    };
    
    fetch('/organization/update-organization-field', {
        method: 'POST',
        body: formData,
        headers: headers,
        credentials: 'same-origin' // Include cookies for CSRF token
    })
    .then(async response => {
        console.log('Response status:', response.status); // Debug: Log the response status
        console.log('Response headers:', Object.fromEntries(response.headers.entries())); // Debug: Log all headers
        
        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
            // Clone the response to read it twice (once for logging, once for parsing)
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            console.log('Error response body:', responseText); // Debug: Log the raw response
            
            // Try to get error details from response
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = JSON.parse(responseText);
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                } catch (jsonError) {
                    throw new Error(`HTTP error! status: ${response.status}, Parse error: ${jsonError.message}`);
                }
            } else {
                // If not JSON, just throw the status with some response text
                throw new Error(`HTTP error! status: ${response.status}, Response: ${responseText.substring(0, 100)}...`);
            }
        }
        
        // Check content type to ensure it's JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const responseClone = response.clone();
            const responseText = await responseClone.text();
            console.log('Unexpected content type response:', responseText); // Debug: Log the raw response
            throw new Error(`Response is not JSON: ${contentType || 'no content type'}`);
        }
        
        return response.json();
    })
    .then(data => {
        console.log('Success response:', data); // Debug: Log the success response
        if (data.success) {
            // Show success message
            handleSaveResponse(data, saveButton, originalButtonText);
            
            // Update specific content on the page
            updateSpecificUpdateContent(fieldType, value);
            
            // Refresh all UI elements to ensure everything is updated
            refreshAllOrganizationUIElements();
        } else {
            // Show error message
            console.error('Server returned success: false', data);
            handleSaveError(new Error(data.message || 'Unknown error'), saveButton, originalButtonText);
        }
    })
    .catch(error => {
        // Show error message
        console.error('Detailed error:', error); // Debug: Log the detailed error
        handleSaveError(error, saveButton, originalButtonText);
    });
}

// Debounce function to prevent multiple rapid saves
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Create debounced version of the save function
// Using var instead of const to avoid redeclaration issues if the script is loaded multiple times
var debouncedSaveOrganizationData = debounce(saveOrganizationUpdateData, 500);

// Handle save response
function handleSaveResponse(data, saveButton, originalButtonText) {
    if (saveButton) {
        // Show success checkmark
        saveButton.innerHTML = '<i class="fas fa-check"></i> Saved';
        
        // Reset button after a delay
        setTimeout(() => {
            if (saveButton) {
                saveButton.innerHTML = originalButtonText;
                saveButton.disabled = false;
            }
        }, 2000);
    }
}

// Handle save error
function handleSaveError(error, saveButton, originalButtonText) {
    console.error('Error saving data:', error);
    
    if (saveButton) {
        // Show error X
        saveButton.innerHTML = '<i class="fas fa-times"></i> Error';
        saveButton.classList.add('btn-danger');
        
        // Reset button after a delay
        setTimeout(() => {
            if (saveButton) {
                saveButton.innerHTML = originalButtonText;
                saveButton.disabled = false;
                saveButton.classList.remove('btn-danger');
            }
        }, 2000);
    }
}

// Function to update all logo tooltips across the application
function updateAllLogoTooltips(logoDesc, orgName, orgType) {
    // Get all logo images across the application
    const allLogoImages = document.querySelectorAll('img[alt*="Logo"], img[title*="Logo"], .rounded-circle, .org-logo, .sticky-org-logo');
    
    allLogoImages.forEach(img => {
        if (logoDesc && logoDesc.trim() !== '') {
            // If we have a logo description, use it as the tooltip
            img.title = logoDesc;
        } else {
            // Otherwise, use a default format with organization name and type
            img.title = `${orgName} - ${orgType} Logo`;
        }
        
        // Keep the alt text as "Organization Logo" for accessibility
        if (img.alt.includes('Logo')) {
            img.alt = "Organization Logo";
        }
    });
}

// Function to refresh all organization UI elements with the latest data
function refreshAllOrganizationUIElements() {
    // Get the current values from the form fields
    const orgName = document.getElementById('update-org-name-field')?.value || '';
    const orgType = document.getElementById('update-org-type-field')?.value || '';
    const logoDesc = document.getElementById('logo-description-field')?.value || '';
    
    console.log('Refreshing UI with:', { orgName, orgType, logoDesc });
    
    // Update all UI elements with these values
    updateSpecificUpdateContent('name', orgName);
    updateSpecificUpdateContent('type', orgType);
    updateSpecificUpdateContent('logo_description', logoDesc);
    
    // Update all logo tooltips across the application
    updateAllLogoTooltips(logoDesc, orgName, orgType);
}

// Update specific content on the page based on field type
function updateSpecificUpdateContent(fieldType, value) {
    switch(fieldType) {
        case 'logo_description':
            // Get current organization name and type
            const orgName = document.getElementById('update-org-name-field')?.value || 'Organization';
            const orgType = document.getElementById('update-org-type-field')?.value || 'Organization';
            
            // Use our comprehensive function to update all logo tooltips
            updateAllLogoTooltips(value, orgName, orgType);
            
            // Update any logo description text elements
            const logoDescElements = document.querySelectorAll('.logo-description');
            logoDescElements.forEach(element => {
                element.textContent = value || '';
            });
            
            // Update the logo description field and its dataset value
            const logoDescField = document.getElementById('logo-description-field');
            if (logoDescField) {
                logoDescField.value = value || '';
                logoDescField.dataset.value = value || '';
                autoAdjustUpdateTextareaHeight(logoDescField);
            }
            break;
            
        case 'name':
            // Update organization name in the header and other elements
            const nameElements = document.querySelectorAll('.org-name');
            if (value && value.trim() !== '') {
                nameElements.forEach(element => {
                    element.textContent = value;
                    element.style.display = 'block';
                });
            } else {
                // If name is empty, hide the elements
                nameElements.forEach(element => {
                    element.style.display = 'none';
                });
            }
            
            // Update any input fields if they exist
            const nameInput = document.getElementById('organizationNameInput');
            if (nameInput) nameInput.value = value;
            
            // Update the organization name field and its dataset value
            const orgNameField = document.getElementById('update-org-name-field');
            if (orgNameField) {
                orgNameField.value = value || '';
                orgNameField.dataset.value = value || '';
                autoAdjustUpdateTextareaHeight(orgNameField);
            }
            
            // Update organization name in the application card
            const orgCardNameElements = document.querySelectorAll('.org-card .lh-sm.small');
            orgCardNameElements.forEach(element => {
                element.textContent = value;
            });
            
            // Update organization name in any other places on the page
            const orgNameElements = document.querySelectorAll('.org-name');
            orgNameElements.forEach(element => {
                element.textContent = value;
            });
            break;
            
        case 'type':
            // Update organization type in the header and other elements
            const typeElements = document.querySelectorAll('.org-type');
            if (value && value.trim() !== '') {
                typeElements.forEach(element => {
                    element.textContent = value;
                    element.style.display = 'block';
                });
            } else {
                // If type is empty, hide the elements
                typeElements.forEach(element => {
                    element.style.display = 'none';
                });
            }
            
            // Update any input fields if they exist
            const typeInput = document.getElementById('organizationTypeInput');
            if (typeInput) typeInput.value = value;
            
            // Update the organization type field and its dataset value
            const orgTypeField = document.getElementById('update-org-type-field');
            if (orgTypeField) {
                orgTypeField.value = value || '';
                orgTypeField.dataset.value = value || '';
                autoAdjustUpdateTextareaHeight(orgTypeField);
            }
            
            // Update organization type in the application card
            const orgCardTypeElements = document.querySelectorAll('.org-card .mb-0.small');
            orgCardTypeElements.forEach(element => {
                const typeSpan = element.querySelector('.fw-semibold');
                if (typeSpan) {
                    // Keep the "Type:" label and update the value
                    element.innerHTML = '';
                    element.appendChild(typeSpan);
                    element.appendChild(document.createTextNode(' ' + value));
                }
            });
            
            // Update organization type in any other places on the page
            const orgTypeElements = document.querySelectorAll('.org-type');
            orgTypeElements.forEach(element => {
                element.textContent = value;
            });
            break;
            
        case 'logo':
            // Logo updates are handled in the saveUpdateLogo function
            // But we need to update the logo in the application card
            if (value instanceof File) {
                // If we have a File object (from upload), create an object URL
                const orgCardLogo = document.querySelector('.org-card .rounded-circle[alt="Organization Logo"]');
                if (orgCardLogo) {
                    // Create a temporary object URL for immediate display
                    orgCardLogo.src = URL.createObjectURL(value);
                }
            } else {
                // Try to get the logo ID from the preview image
                const logoId = document.querySelector('#updatePreviewLogo')?.src.split('/').pop();
                if (logoId) {
                    const orgCardLogo = document.querySelector('.org-card .rounded-circle[alt="Organization Logo"]');
                    if (orgCardLogo) {
                        // Update the src attribute to point to the new logo
                        orgCardLogo.src = `/organization/logo/${logoId}`;
                    }
                }
            }
            break;
    }
}

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Ensure all fields have their dataset values set
    ensureUpdateDatasetValues();
    
    // Refresh all UI elements to ensure they're in sync with the latest data
    refreshAllOrganizationUIElements();
    
    // Adjust all textarea heights
    const textareas = document.querySelectorAll('textarea.field-display');
    textareas.forEach(textarea => {
        // For textareas that are currently visible
        if (textarea.offsetParent !== null) {
            autoAdjustUpdateTextareaHeight(textarea);
        } else {
            // For textareas that might be hidden initially
            // Temporarily make them visible to calculate height, then hide again
            const originalDisplay = textarea.style.display;
            textarea.style.display = 'block';
            textarea.style.visibility = 'hidden';
            autoAdjustUpdateTextareaHeight(textarea);
            textarea.style.display = originalDisplay;
            textarea.style.visibility = 'visible';
        }
    });
    
    // Set up MutationObserver to adjust textarea heights when their containers change
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const textareas = mutation.target.querySelectorAll('textarea.field-display');
                textareas.forEach(autoAdjustUpdateTextareaHeight);
            } else if (mutation.type === 'childList') {
                const textareas = document.querySelectorAll('textarea.field-display');
                textareas.forEach(autoAdjustUpdateTextareaHeight);
            }
        });
    });
    
    // Observe the entire document for changes
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
});