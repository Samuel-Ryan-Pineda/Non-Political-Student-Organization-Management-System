function showAdviserInfoModal() {
    const adviserInfoModal = document.getElementById('adviserInfoModal');
    if (adviserInfoModal) {
        adviserInfoModal.classList.add('show');
    }
}

function hideAdviserInfoModal() {
    const adviserInfoModal = document.getElementById('adviserInfoModal');
    if (adviserInfoModal) {
        adviserInfoModal.classList.remove('show');
    }
    
    // Reset any active edit forms
    if (document.getElementById('edit-adviser-name')?.style.display !== 'none') {
        cancelEditAdviserName();
    }
}

function showEditAdviserNameForm() {
    const container = document.querySelector('.section-adviser');
    const buttonContainer = document.querySelector('.section-adviser .d-flex');
    const displayField = document.getElementById('adviser-name-display');
    const editField = document.getElementById('edit-adviser-name');
    
    // Highlight the section
    container.classList.add('section-highlighted');
    
    // Hide display and show edit fields
    displayField.style.display = 'none';
    editField.style.display = 'block';
    
    // Replace button with save/cancel
    buttonContainer.innerHTML = `
        <label for="adviser-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Adviser</label>
        <div class="d-flex gap-1">
            <button type="button" class="btn btn-success btn-sm" onclick="saveEditAdviserName()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEditAdviserName()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
        </div>
    `;
}

function cancelEditAdviserName() {
    const container = document.querySelector('.section-adviser');
    const buttonContainer = document.querySelector('.section-adviser .d-flex');
    const displayField = document.getElementById('adviser-name-display');
    const editField = document.getElementById('edit-adviser-name');
    
    // Remove highlight
    container.classList.remove('section-highlighted');
    
    // Hide edit and show display
    editField.style.display = 'none';
    displayField.style.display = 'block';
    
    // Determine button text based on whether there's data
    const firstName = document.getElementById('adviser-first-name').value;
    const middleName = document.getElementById('adviser-middle-name').value;
    const lastName = document.getElementById('adviser-last-name').value;
    const hasData = firstName || middleName || lastName;
    
    // Restore original button
    buttonContainer.innerHTML = `
        <label for="adviser-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Adviser</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditAdviserNameForm()">
            ${hasData ? 'Edit' : 'Add'}
        </button>
    `;
}

function saveEditAdviserName() {
    const container = document.querySelector('.section-adviser');
    const buttonContainer = document.querySelector('.section-adviser .d-flex');
    const displayField = document.getElementById('adviser-name-display');
    const editField = document.getElementById('edit-adviser-name');
    
    // Get new values
    const firstName = document.getElementById('adviser-first-name').value;
    const middleName = document.getElementById('adviser-middle-name').value;
    const lastName = document.getElementById('adviser-last-name').value;
    const adviserType = document.getElementById('adviser-type').value;
    const adviserStatus = document.getElementById('adviser-status').value;
    
    // Update display with formatted info
    displayField.innerHTML = `
        <div><strong>Name:</strong> ${firstName} ${middleName} ${lastName}</div>
        <div><strong>Type:</strong> ${adviserType}</div>
        <div><strong>Status:</strong> ${adviserStatus}</div>
    `;
    
    // Hide edit and show display
    editField.style.display = 'none';
    displayField.style.display = 'block';
    
    // Remove highlight
    container.classList.remove('section-highlighted');
    
    // Restore original button
    buttonContainer.innerHTML = `
        <label for="adviser-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Adviser</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditAdviserNameForm()">
            Edit
        </button>
    `;
    
    // Prepare data for AJAX call
    const adviserData = {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        type: adviserType,  // Backend expects 'type' for adviser type
        status: adviserStatus
    };
    
    // Validate required fields
    if (!firstName || !lastName || !adviserType || !adviserStatus) {
        alert('Failed to save adviser info: First name, last name, adviser type and status are required');
        return;
    }
    
    // Log the data being sent
    console.log('Sending adviser data:', adviserData);
    
    // Save data to server
    fetch('/organization/save-adviser-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(adviserData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            alert(`Failed to save adviser info: ${data.message}`);
            // Re-enable edit mode if save failed
            showEditAdviserNameForm();
        } else {
            // Update organization header with new adviser info
            const formattedName = `${adviserType}: ${firstName} ${middleName} ${lastName}`;
            const orgHeaderAdviser = document.querySelector('.org-header-adviser');
            if (orgHeaderAdviser) {
                orgHeaderAdviser.textContent = formattedName;
            }
            
            // Update organization header
            const orgAdviserElement = document.querySelector('.org-adviser');
            if (orgAdviserElement) {
                 orgAdviserElement.textContent = formattedName;
             } else {
                 const orgHeader = document.querySelector('.organization-header .flex-grow-1');
                 if (orgHeader) {
                     const newAdviserElement = document.createElement('p');
                     newAdviserElement.className = 'org-adviser';
                     newAdviserElement.textContent = formattedName;
                     orgHeader.insertBefore(newAdviserElement, orgHeader.querySelector('.org-social') || orgHeader.querySelector('.mt-3'));
                 }
             }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error saving adviser info: ${error.message}`);
        // Re-enable edit mode if error occurred
        showEditAdviserNameForm();
    });
}