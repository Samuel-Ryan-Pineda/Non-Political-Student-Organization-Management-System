/**
 * Excel Upload Modal functionality with separate file handling for Officers and Members tabs
 */

// Get the modal element
const excelUploadModal = document.getElementById('excelUploadModal');

// Get the file input elements for all tabs
const officersFileInput = document.getElementById('officers-file-input');
const membersFileInput = document.getElementById('members-file-input');
const volunteersFileInput = document.getElementById('volunteers-file-input');
const plansFileInput = document.getElementById('plans-file-input');

// Get the dropzone elements for all tabs
const officersDropzone = document.getElementById('officers-dropzone');
const membersDropzone = document.getElementById('members-dropzone');
const volunteersDropzone = document.getElementById('volunteers-dropzone');
const plansDropzone = document.getElementById('plans-dropzone');

// Get the upload sections for all tabs
const officersUploadSection = document.getElementById('officers-upload-section');
const membersUploadSection = document.getElementById('members-upload-section');
const volunteersUploadSection = document.getElementById('volunteers-upload-section');
const plansUploadSection = document.getElementById('plans-upload-section');

// Current active tab
let currentTab = 'officers';

// Custom toast function as fallback
function showCustomToast(message) {
    // Remove any existing custom toast
    const existingToast = document.getElementById('custom-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create custom toast element
    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #28a745;
        border-left: 4px solid #155724;
        color: white;
        padding: 12px 15px;
        border-radius: 4px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        min-width: 300px;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        text-align: center;
        animation: fadeInScale 0.3s ease-out;
    `;
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
                ${message}
            </div>
        </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInScale {
            from {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
            }
            to {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
        }
        @keyframes fadeOut {
            from {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            to {
                transform: translate(-50%, -50%) scale(0.8);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(toast);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// Function to show the Excel upload modal
function showExcelUploadModal() {
    excelUploadModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // Set default upload type to officers and show officers section
    document.getElementById('upload-type').value = 'officers';
    currentTab = 'officers';
    showUploadSection('officers');
}

// Function to hide the Excel upload modal
function hideExcelUploadModal() {
    excelUploadModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    
    // Reset all file inputs and dropzones
    resetFileInput('officers');
    resetFileInput('members');
    resetFileInput('volunteers');
    resetFileInput('plans');
}

// Function to show the appropriate upload section based on tab
function showUploadSection(tabType) {
    // Get the program codes section by ID
    const programCodesSection = document.getElementById('program-codes-section');
    
    if (tabType === 'officers') {
        officersUploadSection.style.display = 'block';
        membersUploadSection.style.display = 'none';
        volunteersUploadSection.style.display = 'none';
        plansUploadSection.style.display = 'none';
        // Show program codes for officers
        if (programCodesSection) programCodesSection.style.display = 'block';
    } else if (tabType === 'members') {
        officersUploadSection.style.display = 'none';
        membersUploadSection.style.display = 'block';
        volunteersUploadSection.style.display = 'none';
        plansUploadSection.style.display = 'none';
        // Show program codes for members
        if (programCodesSection) programCodesSection.style.display = 'block';
    } else if (tabType === 'volunteers') {
        officersUploadSection.style.display = 'none';
        membersUploadSection.style.display = 'none';
        volunteersUploadSection.style.display = 'block';
        plansUploadSection.style.display = 'none';
        // Show program codes for volunteers
        if (programCodesSection) programCodesSection.style.display = 'block';
    } else if (tabType === 'plans') {
        officersUploadSection.style.display = 'none';
        membersUploadSection.style.display = 'none';
        volunteersUploadSection.style.display = 'none';
        plansUploadSection.style.display = 'block';
        // Hide program codes for plans
        if (programCodesSection) programCodesSection.style.display = 'none';
    }
}

// Function to reset file input and dropzone for a specific tab
function resetFileInput(tabType) {
    const fileInput = tabType === 'officers' ? officersFileInput : 
                     tabType === 'members' ? membersFileInput : 
                     tabType === 'volunteers' ? volunteersFileInput : plansFileInput;
    const dropzone = tabType === 'officers' ? officersDropzone : 
                    tabType === 'members' ? membersDropzone : 
                    tabType === 'volunteers' ? volunteersDropzone : plansDropzone;
    const errorContainer = document.getElementById(`${tabType}-error-container`);
    
    if (fileInput) {
        fileInput.value = '';
    }
    
    if (dropzone) {
        dropzone.innerHTML = `<i class="fas fa-cloud-upload-alt mb-1"></i><div>Drag & Drop or Click to Upload</div><div class="small text-muted">EXCEL files only</div>`;
        dropzone.classList.remove('selected', 'highlight', 'dragover', 'loading');
    }
    
    // Clear any error messages for this tab
    if (errorContainer) {
        errorContainer.innerHTML = '';
    }
    
    // Reset the action button for this tab
    updateActionButton(tabType, false);
}

// Function to handle tab switching
document.addEventListener('DOMContentLoaded', function() {
    // Check for stored success message after page reload
    const successMessage = sessionStorage.getItem('excelUploadSuccess');
    if (successMessage) {
        // Remove the stored message
        sessionStorage.removeItem('excelUploadSuccess');
        
        // Show the toast after a brief delay to ensure page is fully loaded
        setTimeout(() => {
            // Check if toastr is available
            if (typeof toastr !== 'undefined') {
                // Configure toastr options for success notification
                 toastr.options = {
                     "closeButton": false,
                     "debug": false,
                     "newestOnTop": false,
                     "progressBar": false,
                     "positionClass": "toast-top-center",
                     "preventDuplicates": false,
                     "onclick": null,
                     "showDuration": "300",
                     "hideDuration": "1000",
                     "timeOut": "3000", // Auto-hide after 3 seconds
                     "extendedTimeOut": "0",
                     "showEasing": "swing",
                     "hideEasing": "linear",
                     "showMethod": "fadeIn",
                     "hideMethod": "fadeOut",
                     "tapToDismiss": false,
                     "toastClass": "toast custom-success-toast",
                     "iconClass": "", // Disable toastr's icon
                     "titleClass": "toast-title",
                     "messageClass": "toast-message"
                 };

                // Add custom CSS for the toast
                const style = document.createElement('style');
                style.textContent = `
                    .custom-success-toast {
                        background-color: #28a745 !important;
                        border-left: 4px solid #155724 !important;
                        color: white !important;
                        border-radius: 4px !important;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
                        padding: 12px 15px !important;
                        font-size: 14px !important;
                        min-width: 300px !important;
                        max-width: 400px !important;
                        margin: 0 auto !important;
                    }
                    .custom-success-toast .toast-message {
                        color: white !important;
                        font-weight: normal !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    .custom-success-toast .toast-close-button {
                        color: white !important;
                        opacity: 0.8 !important;
                        font-size: 18px !important;
                        font-weight: bold !important;
                        text-shadow: none !important;
                    }
                    .custom-success-toast .toast-close-button:hover {
                        opacity: 1 !important;
                    }
                    .toast-top-center {
                        top: 50% !important;
                        left: 50% !important;
                        transform: translate(-50%, -50%) !important;
                        width: auto !important;
                    }
                    /* Hide any toastr icons */
                    .custom-success-toast .toast-success:before,
                    .custom-success-toast .toast-info:before,
                    .custom-success-toast .toast-warning:before,
                    .custom-success-toast .toast-error:before {
                        display: none !important;
                    }
                `;
                document.head.appendChild(style);
                
                // Show success toast
                const toastMessage = `
                    <div style="display: flex; align-items: center; justify-content: center;">
                        <div style="text-align: center;">
                            ${successMessage}
                        </div>
                    </div>
                `;
                
                toastr.success(toastMessage);
            } else {
                // Fallback: Create a custom toast-like notification
                showCustomToast(successMessage);
            }
        }, 500); // 500ms delay to ensure page is fully loaded
    }
    
    // Set up tab event listeners
    const officersTab = document.getElementById('excel-officers-tab');
    const membersTab = document.getElementById('excel-members-tab');
    const volunteersTab = document.getElementById('excel-volunteers-tab');
    const plansTab = document.getElementById('excel-plans-tab');
    const uploadTypeInput = document.getElementById('upload-type');
    
    if (officersTab && membersTab && volunteersTab && plansTab && uploadTypeInput) {
        // Use Bootstrap's tab events for better integration
        officersTab.addEventListener('shown.bs.tab', function() {
            uploadTypeInput.value = 'officers';
            currentTab = 'officers';
            showUploadSection('officers');
            resetFileInput('members'); // Clear the other tabs' files
            resetFileInput('volunteers');
        });
        
        membersTab.addEventListener('shown.bs.tab', function() {
            uploadTypeInput.value = 'members';
            currentTab = 'members';
            showUploadSection('members');
            resetFileInput('officers'); // Clear the other tabs' files
            resetFileInput('volunteers');
        });
        
        volunteersTab.addEventListener('shown.bs.tab', function() {
            uploadTypeInput.value = 'volunteers';
            currentTab = 'volunteers';
            showUploadSection('volunteers');
            resetFileInput('officers'); // Clear the other tabs' files
            resetFileInput('members');
            resetFileInput('plans');
        });
        
        plansTab.addEventListener('shown.bs.tab', function() {
            uploadTypeInput.value = 'plans';
            currentTab = 'plans';
            showUploadSection('plans');
            resetFileInput('officers'); // Clear the other tabs' files
            resetFileInput('members');
            resetFileInput('volunteers');
        });
        
        // Fallback for click events if Bootstrap events don't work
        officersTab.addEventListener('click', function() {
            uploadTypeInput.value = 'officers';
            currentTab = 'officers';
            showUploadSection('officers');
        });
        
        membersTab.addEventListener('click', function() {
            uploadTypeInput.value = 'members';
            currentTab = 'members';
            showUploadSection('members');
        });
        
        volunteersTab.addEventListener('click', function() {
            uploadTypeInput.value = 'volunteers';
            currentTab = 'volunteers';
            showUploadSection('volunteers');
        });
        
        plansTab.addEventListener('click', function() {
            uploadTypeInput.value = 'plans';
            currentTab = 'plans';
            showUploadSection('plans');
        });
    }
    
    // Set up file handling for all tabs
    setupFileHandling('officers');
    setupFileHandling('members');
    setupFileHandling('volunteers');
    setupFileHandling('plans');
});

// Function to set up file handling for a specific tab
function setupFileHandling(tabType) {
    const fileInput = tabType === 'officers' ? officersFileInput : 
                     tabType === 'members' ? membersFileInput : 
                     tabType === 'volunteers' ? volunteersFileInput : plansFileInput;
    const dropzone = tabType === 'officers' ? officersDropzone : 
                    tabType === 'members' ? membersDropzone : 
                    tabType === 'volunteers' ? volunteersDropzone : plansDropzone;
    
    if (!fileInput || !dropzone) return;
    
    // Click on dropzone to trigger file input
    dropzone.addEventListener('click', function() {
        fileInput.click();
    });
    
    // Display file name when selected
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const fileName = this.files[0].name;
            dropzone.innerHTML = `
                <i class="fas fa-file-excel mb-1"></i> 
                <div>${fileName}</div>
                <div class="small text-muted mt-1" style="font-style: italic;">Click here to change the file</div>
            `;
            dropzone.classList.add('selected');
            updateActionButton(tabType, true);
        } else {
            dropzone.innerHTML = `<i class="fas fa-cloud-upload-alt mb-1"></i><div>Drag & Drop or Click to Upload</div><div class="small text-muted">EXCEL files only</div>`;
            dropzone.classList.remove('selected');
            updateActionButton(tabType, false);
        }
    });
    
    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, function() {
            dropzone.classList.add('highlight');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, function() {
            dropzone.classList.remove('highlight');
        }, false);
    });
    
    dropzone.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        
        // Trigger change event
        const event = new Event('change');
        fileInput.dispatchEvent(event);
    }, false);
}

// Function to update the action button based on file selection for a specific tab
function updateActionButton(tabType, fileSelected) {
    const actionButtonContainer = document.getElementById(`${tabType}-action-buttons`);
    if (!actionButtonContainer) return;
    
    if (fileSelected) {
        // Change to dual-button appearance with Submit and Cancel
        actionButtonContainer.innerHTML = `
            <button type="button" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="cancelExcelUpload('${tabType}')">
                Cancel
            </button>
            <button type="button" id="${tabType}-action-button" class="btn btn-success" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="uploadExcelFile('${tabType}')">
                Submit
            </button>
        `;
    } else {
        // Reset to original state with single Upload Excel button
        actionButtonContainer.innerHTML = `
            <button type="button" id="${tabType}-action-button" class="btn btn-primary" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" onclick="handleExcelAction('${tabType}')">
                Upload Excel
            </button>
        `;
    }
}

// Function to handle the action button click for a specific tab
function handleExcelAction(tabType) {
    const fileInput = tabType === 'officers' ? officersFileInput : 
                     tabType === 'members' ? membersFileInput : 
                     tabType === 'volunteers' ? volunteersFileInput : plansFileInput;
    
    // If no file is selected, trigger the file input click
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        fileInput.click();
    } else {
        // If a file is selected, upload it
        uploadExcelFile(tabType);
    }
}

// Function to cancel the Excel upload for a specific tab
function cancelExcelUpload(tabType) {
    resetFileInput(tabType);
}

// Function to upload the Excel file for a specific tab
function uploadExcelFile(tabType) {
    const fileInput = tabType === 'officers' ? officersFileInput : 
                     tabType === 'members' ? membersFileInput : 
                     tabType === 'volunteers' ? volunteersFileInput : plansFileInput;
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        alert('Please select an Excel file first.');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('excel_file', file);
    
    // Get the organization ID
    const organizationId = document.getElementById('organization-id').value;
    formData.append('organization_id', organizationId);
    
    // Set the upload type based on the tab
    formData.append('upload_type', tabType);
    
    // Show loading state
    const actionButton = document.getElementById(`${tabType}-action-button`);
    if (!actionButton) return;
    
    const originalButtonText = actionButton.innerHTML;
    actionButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    actionButton.disabled = true;
    
    // Disable the cancel button if it exists
    const cancelButton = document.querySelector(`#${tabType}-action-buttons .btn-secondary`);
    if (cancelButton) {
        cancelButton.disabled = true;
    }
    
    // Get CSRF token from meta tag or input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        const errorMessage = document.createElement('div');
        errorMessage.className = 'alert alert-danger mb-3';
        errorMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Error:</strong> CSRF token not found`;
        
        const errorContainer = document.getElementById(`${tabType}-error-container`);
        if (errorContainer) {
            errorContainer.innerHTML = '';
            errorContainer.appendChild(errorMessage);
        }
        return;
    }
    
    // Send the file to the server
    fetch('/organization/import-excel', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin' // Include cookies for CSRF token
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Hide the modal first
            hideExcelUploadModal();
            
            // Refresh the page first, then show toast after a brief delay
            window.location.reload();
            
            // Store the message in sessionStorage to show after reload
            sessionStorage.setItem('excelUploadSuccess', data.message || 'Excel file uploaded successfully!');
        } else {
            // Create a more detailed error message
            const errorMessage = document.createElement('div');
            errorMessage.className = 'alert alert-danger mb-3';
            errorMessage.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <strong>Error:</strong> ${data.message || 'Unknown error'}`;
            
            // Add the error message to the specific tab's error container
            const errorContainer = document.getElementById(`${tabType}-error-container`);
            if (errorContainer) {
                // Remove any previous error messages from this tab
                errorContainer.innerHTML = '';
                
                // Add the new error message
                errorContainer.appendChild(errorMessage);
            } else {
                // Fallback if error container not found
                alert('Error: ' + (data.message || 'Unknown error'));
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while uploading the file. Please try again.');
    })
    .finally(() => {
        // Re-enable the buttons
        const currentActionButton = document.getElementById(`${tabType}-action-button`);
        if (currentActionButton) {
            currentActionButton.disabled = false;
            currentActionButton.innerHTML = originalButtonText;
        }
        
        // Re-enable the cancel button if it exists
        const cancelButton = document.querySelector(`#${tabType}-action-buttons .btn-secondary`);
        if (cancelButton) {
            cancelButton.disabled = false;
        }
    });
}

// Close the modal when clicking outside of it
window.addEventListener('click', function(event) {
    if (event.target === excelUploadModal) {
        hideExcelUploadModal();
    }
});

// Close the modal when pressing the Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && excelUploadModal.style.display === 'flex') {
        hideExcelUploadModal();
    }
});