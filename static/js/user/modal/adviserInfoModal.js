function showAdviserInfoModal() {
    const adviserInfoModal = document.getElementById('adviserInfoModal');
    if (adviserInfoModal) {
        adviserInfoModal.classList.add('show');
    }
    
    document.body.classList.add('modal-open'); // Add this line
}

function hideAdviserInfoModal() {
    const adviserInfoModal = document.getElementById('adviserInfoModal');
    if (adviserInfoModal) {
        adviserInfoModal.classList.remove('show');
    }
    
    document.body.classList.remove('modal-open'); // Add this line
    
    // Reset any active edit forms
    if (document.getElementById('edit-adviser-name')?.style.display !== 'none') {
        cancelEditAdviserName();
    }
    
    // Reset co-adviser edit form if active
    if (document.getElementById('edit-coadviser-name')?.style.display !== 'none') {
        cancelEditCoAdviserName();
    }
}

function showEditAdviserNameForm() {
    // Cancel co-adviser edit form if active
    if (document.getElementById('edit-coadviser-name')?.style.display !== 'none') {
        cancelEditCoAdviserName();
    }
    
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
    // Get CSRF token from meta tag or input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        alert('Failed to save adviser info: CSRF token not found');
        return;
    }
    
    fetch('/organization/save-adviser-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin', // Include cookies for CSRF token
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
                     
                     // Find the appropriate insertion point
                     const socialDiv = orgHeader.querySelector('.d-flex.justify-content-between');
                     if (socialDiv) {
                         // Insert before the social media div
                         orgHeader.insertBefore(newAdviserElement, socialDiv);
                     } else {
                         // If social div not found, append to the end of the header
                         orgHeader.appendChild(newAdviserElement);
                     }
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

// Co-Adviser Functions
function showEditCoAdviserNameForm() {
    // Cancel adviser edit form if active
    if (document.getElementById('edit-adviser-name')?.style.display !== 'none') {
        cancelEditAdviserName();
    }
    
    const container = document.querySelector('.section-coadviser');
    const buttonContainer = document.querySelector('.section-coadviser .d-flex');
    const displayField = document.getElementById('coadviser-name-display');
    const editField = document.getElementById('edit-coadviser-name');
    
    // Highlight the section
    container.classList.add('section-highlighted');
    document.querySelectorAll('.modal-section').forEach(section => {
        if (!section.classList.contains('section-coadviser')) {
            section.classList.remove('section-highlighted');
        }
    });
    
    // Hide display and show edit fields
    displayField.style.display = 'none';
    editField.style.display = 'block';
    
    // Replace button with save/cancel
    buttonContainer.innerHTML = `
        <label for="coadviser-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Co-Adviser</label>
        <div class="d-flex gap-1">
            <button type="button" class="btn btn-success btn-sm" onclick="saveEditCoAdviserName()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Save</button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="cancelEditCoAdviserName()" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Cancel</button>
        </div>
    `;
}

function cancelEditCoAdviserName() {
    const container = document.querySelector('.section-coadviser');
    const buttonContainer = document.querySelector('.section-coadviser .d-flex');
    const displayField = document.getElementById('coadviser-name-display');
    const editField = document.getElementById('edit-coadviser-name');
    
    // Remove highlight
    container.classList.remove('section-highlighted');
    
    // Hide edit and show display
    editField.style.display = 'none';
    displayField.style.display = 'block';
    
    // Determine button text based on whether there's data
    const firstName = document.getElementById('coadviser-first-name').value;
    const middleName = document.getElementById('coadviser-middle-name').value;
    const lastName = document.getElementById('coadviser-last-name').value;
    const hasData = firstName || middleName || lastName;
    
    // Restore original button
    buttonContainer.innerHTML = `
        <label for="coadviser-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Co-Adviser</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditCoAdviserNameForm()">
            ${hasData ? 'Edit' : 'Add'}
        </button>
    `;
}

function saveEditCoAdviserName() {
    const container = document.querySelector('.section-coadviser');
    const buttonContainer = document.querySelector('.section-coadviser .d-flex');
    const displayField = document.getElementById('coadviser-name-display');
    const editField = document.getElementById('edit-coadviser-name');
    
    // Get new values
    const firstName = document.getElementById('coadviser-first-name').value;
    const middleName = document.getElementById('coadviser-middle-name').value;
    const lastName = document.getElementById('coadviser-last-name').value;
    
    // Update display with formatted info
    displayField.innerHTML = `
        <div><strong>Name:</strong> ${firstName} ${middleName} ${lastName}</div>
        <div><strong>Type:</strong> Co-Adviser</div>
    `;
    
    // Hide edit and show display
    editField.style.display = 'none';
    displayField.style.display = 'block';
    
    // Remove highlight
    container.classList.remove('section-highlighted');
    
    // Restore original button
    buttonContainer.innerHTML = `
        <label for="coadviser-name-field" class="fw-semibold text-gray-900 mb-0" style="font-size: 0.75rem;">Co-Adviser</label>
        <button type="button" class="text-primary" style="font-size: 0.75rem; background: none; border: none; padding: 0.25rem 0.5rem;" onclick="showEditCoAdviserNameForm()">
            Edit
        </button>
    `;
    
    // Prepare data for AJAX call
    const coadviserData = {
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        type: 'Co-Adviser',
        status: document.getElementById('coadviser-status').value
    };
    
    // Function to update organization header
    const updateHeader = (data) => {
        // Find all co-adviser elements
        const coadviserElements = document.querySelectorAll('.org-adviser');
        let coadviserElement = null;
        
        // Find the co-adviser element (if any)
        for (const element of coadviserElements) {
            if (element.textContent.includes('Co-Adviser')) {
                coadviserElement = element;
                break;
            }
        }
        
        // Update or create the co-adviser element
        if (coadviserElement) {
            coadviserElement.textContent = `Co-Adviser: ${data.first_name} ${data.middle_name} ${data.last_name}`;
        } else {
            const headerDiv = document.querySelector('.flex-grow-1.text-start');
            if (headerDiv) {
                const newElement = document.createElement('p');
                newElement.className = 'org-adviser';
                newElement.textContent = `Co-Adviser: ${data.first_name} ${data.middle_name} ${data.last_name}`;
                
                // Find the appropriate insertion point
                const socialDiv = headerDiv.querySelector('.d-flex.justify-content-between');
                if (socialDiv) {
                    // Insert before the social media div
                    headerDiv.insertBefore(newElement, socialDiv);
                } else {
                    // If social div not found, append to the end of the header
                    headerDiv.appendChild(newElement);
                }
            }
        }
    };
    
    // Validate required fields
    if (!firstName || !lastName || !coadviserData.status) {
        alert('Failed to save co-adviser info: First name, last name and status are required');
        return;
    }
    
    // Save data to server using the same endpoint as adviser
    // Get CSRF token from meta tag or input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        alert('Failed to save co-adviser info: CSRF token not found');
        return;
    }
    
    fetch('/organization/save-adviser-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin', // Include cookies for CSRF token
        body: JSON.stringify(coadviserData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (!data.success) {
            throw new Error(data.message || 'Failed to save co-adviser info');
        }
        // Update header without reloading
        updateHeader(coadviserData);
    })
    .catch(error => {
        console.error('Error saving co-adviser info:', error);
        alert('Failed to save co-adviser info: ' + error.message);
    });
}