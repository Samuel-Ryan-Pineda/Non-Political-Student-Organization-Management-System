/**
 * User Application Module
 * Handles file upload and management for user application interface
 */

(function() {
  // Constants for file types
  const FILE_TYPES = {
    VALID_EXTENSIONS: ['.pdf', '.doc', '.docx'],
    ACCEPTED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  // Required files for a complete application
  const REQUIRED_FILES = [
    'Form 1A -APPLICATION FOR RECOGNITION',
    'Form 2 - LETTER OF ACCEPTANCE',
    'Form 3 - LIST OF PROGRAMS/PROJECTS/ ACTIVITIES',
    'Form 4 - LIST OF MEMBERS',
    'BOARD OF OFFICERS',
    'CONSTITUTION AND BYLAWS',
    'LOGO WITH EXPLANATION'
  ];

  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize file uploads
    initializeFileUploads();
    
    // Load existing application files
    loadApplicationFiles();
    
    // Set up form submissions
    setupFormSubmissions();
  });

  // Function to initialize file uploads
  function initializeFileUploads() {
    setupDropzoneEvents();
    setupButtonEvents();
  }

  // Function to set up dropzone events
  function setupDropzoneEvents() {
    // Get all dropzones
    const dropzones = DOMUtils.getAll('.dropzone');
    
    dropzones.forEach(dropzone => {
      // Get the parent card
      const card = dropzone.closest('.document-card');
      if (!card) return;
      
      // Get the file input
      const fileInput = card.querySelector('input[type="file"]');
      if (!fileInput) return;
      
      // Set up click event on dropzone
      dropzone.addEventListener('click', function() {
        fileInput.click();
      });
      
      // Set up drag and drop events
      dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      
      dropzone.addEventListener('dragleave', function() {
        dropzone.classList.remove('dragover');
      });
      
      dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          fileInput.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  // Function to set up button events
  function setupButtonEvents() {
    // Get all document cards
    const cards = DOMUtils.getAll('.document-card');
    
    cards.forEach(card => {
      // Get the file input
      const fileInput = card.querySelector('input[type="file"]');
      if (!fileInput) return;
      
      // Get buttons
      const selectBtn = card.querySelector('button:nth-child(2)');
      const uploadBtn = card.querySelector('button:nth-child(3)');
      const previewBtn = card.querySelector('button:nth-child(1)');
      
      // Set up file input change event
      fileInput.addEventListener('change', function() {
        handleFileSelected(this, card);
      });
      
      // Add click event to handle selecting the same file again
      fileInput.addEventListener('click', function() {
        // Store the current value to detect if the same file is selected again
        this.dataset.previousValue = this.value;
      });
      
      // Set up select button click event with fix for same file selection
      if (selectBtn) {
        DOMUtils.setButtonState(selectBtn, DOMUtils.BUTTON_STATES.ENABLED.SELECT);
        selectBtn.addEventListener('click', function() {
          // Clear the file input value before clicking it
          // This forces the browser to trigger a change event even if the same file is selected
          fileInput.value = '';
          fileInput.click();
        });
      }
      
      // Set up upload button click event
      if (uploadBtn) {
        uploadBtn.addEventListener('click', function() {
          if (fileInput.files.length) {
            uploadFile(fileInput.files[0], card);
          }
        });
      }
      
      // Set up preview button click event
      if (previewBtn) {
        previewBtn.addEventListener('click', function() {
          const statusBadge = card.querySelector('.status-badge');
          if (statusBadge && statusBadge.dataset.fileId) {
            const fileId = statusBadge.dataset.fileId;
            const fileType = card.querySelector('.fw-semibold').textContent.trim();
            
            // Use the FilePreview module to preview the file
            FilePreview.previewFile(fileId, fileType, function(fileId) {
              return `/organization/get-application-file/${fileId}`;
            });
          }
        });
      }
    });
  }

  // Function to handle file selection
  function handleFileSelected(input, card) {
    if (!input.files.length) return;
    
    const file = input.files[0];
    const fileType = card.querySelector('.fw-semibold').textContent.trim();
    
    // Validate file type
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!FILE_TYPES.VALID_EXTENSIONS.includes(fileExtension) || !FILE_TYPES.ACCEPTED_TYPES.includes(file.type)) {
      alert('Invalid file type. Please upload a PDF, DOC, or DOCX file.');
      input.value = '';
      return;
    }
    
    // Update dropzone to show selected file
    const dropzone = card.querySelector('.dropzone');
    if (dropzone) {
      dropzone.innerHTML = `
        <i class="fas fa-file-alt mb-1"></i>
        <div>${file.name}</div>
        <div class="small text-muted">${(file.size / 1024).toFixed(2)} KB</div>
      `;
      
      dropzone.classList.add('selected');
    }
    
    // Enable upload button
    const uploadBtn = card.querySelector('button:nth-child(3)');
    if (uploadBtn) {
      DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.ENABLED.UPLOAD);
    }
    
    // Enable preview button for PDF files
    const previewBtn = card.querySelector('button:nth-child(1)');
    if (previewBtn && fileExtension === '.pdf') {
      DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.DISABLED.PREVIEW); // Initially disable
      
      // Set up preview button to preview the local file
      previewBtn.onclick = function() {
        const reader = new FileReader();
        reader.onload = function(e) {
          const previewModal = FilePreview.ensureModalInDOM();
          
          // Create modal content
          const modalContent = document.createElement('div');
          modalContent.className = 'preview-modal-content';
          modalContent.innerHTML = `
            <div class="preview-header">
              <h3>Preview: ${file.name}</h3>
              <div class="header-buttons">
                <a href="${e.target.result}" class="download-button" download="${file.name}">
                  <i class="fas fa-download"></i> Download
                </a>
                <button class="close-button" aria-label="Close preview">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div class="preview-body">
              <iframe src="${e.target.result}" class="preview-iframe"></iframe>
            </div>
          `;
          
          // Add close button listener
          const closeButton = modalContent.querySelector('.close-button');
          if (closeButton) {
            closeButton.addEventListener('click', function() {
              FilePreview.closePreviewModal();
            });
          }
          
          // Clear previous content and add new content
          previewModal.innerHTML = '';
          previewModal.appendChild(modalContent);
          
          // Show the modal
          previewModal.classList.add('show');
          document.body.classList.add('modal-open');
        };
        
        reader.readAsDataURL(file);
      };
    }
  }

  // Function to upload a file
  function uploadFile(file, card) {
    const fileType = card.querySelector('.fw-semibold').textContent.trim();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    
    // Get UI elements
    const statusBadge = card.querySelector('.status-badge');
    const uploadBtn = card.querySelector('button:nth-child(3)');
    const fileInput = card.querySelector('input[type="file"]');
    
    // Show loading state
    statusBadge.className = 'badge bg-secondary status-badge';
    statusBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    // Update dropzone to show loading state
    const dropzone = card.querySelector('.dropzone');
    if (dropzone) {
      dropzone.innerHTML = `
        <i class="fas fa-spinner fa-spin mb-1"></i>
        <div>Uploading...</div>
        <div class="small text-muted">${file.name}</div>
      `;
      
      // Set dropzone to loading style
      dropzone.classList.remove('selected');
      dropzone.classList.add('loading');
    }
    
    // Disable the upload button during upload
    DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);
    
    // Handle upload errors
    const handleError = (message) => {
      statusBadge.className = 'badge bg-danger status-badge';
      statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
      alert('Upload failed: ' + message);
      
      // Re-enable the upload button if upload fails
      DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.ENABLED.UPLOAD);
    };
    
    // Send the file to the server
    fetch('/organization/upload-application-file', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Reset the file input value to allow selecting the same file again
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Reload application files to update UI with the new file
        loadApplicationFiles();
        
        // Keep the upload button disabled after successful upload
        DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);

        // Enable preview button after successful upload
        const previewBtn = card.querySelector('button:nth-child(1)');
        if (previewBtn) {
          DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.ENABLED.PREVIEW);
        }
        
        // Check if we need to refresh the page to show updated application status
        // Add a delay to ensure loadApplicationFiles has completed
        setTimeout(() => {
          checkIfAllFilesUploaded();
        }, 500);
      } else {
        handleError(data.message);
      }
    })
    .catch(error => {
      handleError('Network error');
    });
  }

  // Function to load application files
  function loadApplicationFiles() {
    // Reset all cards to "No File" state first
    resetAllCards();
    
    // Then load existing files
    fetch('/organization/get-application-files')
      .then(response => response.json())
      .then(data => {
        if (data.success && data.files) {
          // Update each file card with the file data
          data.files.forEach(file => {
            updateFileCard(file.name, file.id, file.status, file.submission_date);
          });
          
          // Update progress line and status counts
          updateProgressAndStatusCounts();
        }
      })
      .catch(error => {
        console.error('Error loading application files:', error);
      });
  }

  // Helper function to reset all document cards to their initial state
  function resetAllCards() {
    DOMUtils.getAll('.document-card').forEach(card => {
      // Reset status badge
      const statusBadge = card.querySelector('.status-badge');
      statusBadge.className = 'badge bg-secondary status-badge';
      statusBadge.innerHTML = '<i class="fas fa-question-circle"></i> No File';
      statusBadge.removeAttribute('data-file-id');
      statusBadge.removeAttribute('data-status');
      
      // Reset buttons
      const uploadBtn = card.querySelector('button:nth-child(3)');
      const previewBtn = card.querySelector('button:nth-child(1)');
      const selectBtn = card.querySelector('button:nth-child(2)');
      
      // Show all buttons and reset their states
      if (uploadBtn) {
        uploadBtn.style.display = '';
        DOMUtils.setButtonState(uploadBtn, DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);
      }
      if (selectBtn) {
        selectBtn.style.display = '';
        DOMUtils.setButtonState(selectBtn, DOMUtils.BUTTON_STATES.ENABLED.SELECT);
      }
      if (previewBtn) {
        previewBtn.style.margin = '';
        DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.DISABLED.PREVIEW);
      }
      
      // Reset file input to allow selecting the same file again
      // But preserve current selection if user has selected a file
      const fileInput = card.querySelector('input[type="file"]');
      if (fileInput) {
        // Only clear if no file is currently selected
        if (!fileInput.files || fileInput.files.length === 0) {
          fileInput.value = '';
        }
        fileInput.disabled = false;
      }
      
      // Reset dropzone
      const dropzone = card.querySelector('.dropzone');
      if (dropzone) {
        dropzone.style.pointerEvents = '';
        dropzone.style.opacity = '';
        dropzone.classList.remove('selected', 'loading', 'status-verified', 'status-pending', 'status-needs-revision', 'status-rejected');
        dropzone.innerHTML = `
          <i class="fas fa-cloud-upload-alt mb-1"></i>
          <div>Drag & Drop or Click to Upload</div>
          <div class="small text-muted">PDF files only</div>
        `;
      }
    });
  }

  // Function to delete all files
  function deleteAllFiles() {
    if (!confirm('Are you sure you want to delete all application files? This action cannot be undone.')) {
      return;
    }
    
    // Show loading modal
    DOMUtils.showLoadingModal('Deleting all files...');
    
    // Call the delete endpoint
    fetch('/organization/delete-all-application-files')
      .then(response => response.json())
      .then(data => {
        // Remove loading modal
        DOMUtils.hideLoadingModal();
        
        if (data.success) {
          // Refresh the file list and update progress
          loadApplicationFiles();
          
          // Check if application status needs to be updated and refresh page if needed
          setTimeout(() => {
            checkIfAllFilesUploaded();
          }, 500); // Small delay to ensure files are loaded first
          
          console.log('Files deleted, checking application status...');
        } else {
          // Show error
          alert('Error: ' + data.message);
        }
      })
      .catch(error => {
        // Remove loading modal and show error
        DOMUtils.hideLoadingModal();
        alert('Error deleting files: Network error');
      });
  }

  // Function to update file card
  function updateFileCard(fileType, fileId, status, submissionDate) {
    // Find the card for this file type
    const targetCard = Array.from(DOMUtils.getAll('.document-card')).find(card => {
      const cardTitle = card.querySelector('.fw-semibold').textContent.trim();
      return cardTitle === fileType;
    });
    
    if (!targetCard) return;
    
    // Get UI elements
    const statusBadge = targetCard.querySelector('.status-badge');
    const uploadBtn = targetCard.querySelector('button:nth-child(3)');
    const selectBtn = targetCard.querySelector('button:nth-child(2)');
    const previewBtn = targetCard.querySelector('button:nth-child(1)');
    const dropzone = targetCard.querySelector('.dropzone');
    const fileInput = targetCard.querySelector('input[type="file"]');
    
    // Don't reset the file input if a file is currently selected
    // This preserves user's file selection when updating card state
    if (fileInput && (!fileInput.files || fileInput.files.length === 0)) {
      fileInput.value = '';
    }
    
    // Update the status badge data attributes
    statusBadge.dataset.fileId = fileId;
    statusBadge.dataset.status = status; // Store status for counting
    statusBadge.dataset.submissionDate = submissionDate; // Store submission date
    
    // Set button states based on status
    if (status === 'Verified') {
      // Hide select and upload buttons, center preview button
      if (uploadBtn) uploadBtn.style.display = 'none';
      if (selectBtn) selectBtn.style.display = 'none';
      if (previewBtn) {
        DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.ENABLED.PREVIEW);
        previewBtn.style.margin = '0 auto';
      }
      
      // Disable dropzone click and drag events
      if (dropzone) {
        dropzone.style.pointerEvents = 'none';
        dropzone.style.opacity = '0.7';
      }
      
      // Disable file input
      if (fileInput) {
        fileInput.disabled = true;
      }
    } else {
      // Show all buttons for non-verified files
      if (uploadBtn) {
        uploadBtn.style.display = '';
        // Check if a file is currently selected to determine upload button state
        const hasSelectedFile = fileInput && fileInput.files && fileInput.files.length > 0;
        DOMUtils.setButtonState(uploadBtn, hasSelectedFile ? 
          DOMUtils.BUTTON_STATES.ENABLED.UPLOAD : 
          DOMUtils.BUTTON_STATES.DISABLED.UPLOAD);
      }
      if (selectBtn) {
        selectBtn.style.display = '';
        DOMUtils.setButtonState(selectBtn, DOMUtils.BUTTON_STATES.ENABLED.SELECT);
      }
      if (previewBtn) {
        previewBtn.style.margin = '';
        DOMUtils.setButtonState(previewBtn, DOMUtils.BUTTON_STATES.ENABLED.PREVIEW);
      }
      
      // Enable dropzone
      if (dropzone) {
        dropzone.style.pointerEvents = '';
        dropzone.style.opacity = '';
      }
      
      // Enable file input
      if (fileInput) {
        fileInput.disabled = false;
      }
    }
    
    // Apply status badge configuration
    FileStatus.applyStatusBadgeConfig(statusBadge, status);
    
    // Update the dropzone to show that a file is uploaded
    if (dropzone) {
      // Update dropzone content
      dropzone.innerHTML = `
        <i class="fas fa-file-alt mb-1"></i>
        <div>File Uploaded</div>
        ${submissionDate ? `<div class="small text-muted">Submitted: ${submissionDate}</div>` : ''}
        ${status === 'Verified' ? 
          '<div class="small text-muted verified-message">File verified - cannot be changed</div>' : 
          '<div class="small text-muted">Click to replace</div>'}
      `;
      
      // Remove all status classes first
      dropzone.classList.remove('selected', 'loading', 'status-verified', 'status-pending', 'status-needs-revision', 'status-rejected');
      
      // Add appropriate status class
      dropzone.classList.add(FileStatus.getStatusClass(status));
    }
    
    // Update progress and status counts
    updateProgressAndStatusCounts();
  }

  // Function to update progress line and status counts
  function updateProgressAndStatusCounts() {
    let totalFiles = 0;
    
    // Reset counts
    Object.keys(FileStatus.STATUS_TYPES).forEach(key => {
      FileStatus.STATUS_TYPES[key].count = 0;
    });
    
    // Count files by status
    DOMUtils.getAll('.status-badge').forEach(badge => {
      // Only count badges that have a file ID (meaning a file is uploaded)
      if (!badge.dataset.fileId) return;
      
      totalFiles++;
      const status = badge.dataset.status || 'Pending';
      
      // Increment the appropriate counter
      if (FileStatus.STATUS_TYPES[status]) {
        FileStatus.STATUS_TYPES[status].count++;
      } else {
        FileStatus.STATUS_TYPES['Pending'].count++;
      }
    });
    
    // Generate status count HTML
    const statusCountsHTML = FileStatus.generateStatusCountsHTML(FileStatus.STATUS_TYPES);
    
    // Update status counts in the UI
    document.querySelector('.d-flex.justify-content-between.small.text-secondary').innerHTML = statusCountsHTML;
    
    // Calculate and update progress
    FileStatus.updateProgressBar(FileStatus.STATUS_TYPES['Verified'].count, totalFiles);
    
    return totalFiles;
  }

  // Function to check if all required files are uploaded
  function checkIfAllFilesUploaded() {
    // Get all document cards
    const cards = DOMUtils.getAll('.document-card');
    
    // Check if all required files are uploaded
    let allFilesUploaded = true;
    let uploadedFileCount = 0;
    
    // Check each required file
    REQUIRED_FILES.forEach(requiredFile => {
      let fileUploaded = false;
      
      // Look for this file in the document cards
      cards.forEach(card => {
        const cardTitle = card.querySelector('.fw-semibold').textContent.trim();
        const statusBadge = card.querySelector('.status-badge');
        
        if (cardTitle === requiredFile && statusBadge && statusBadge.dataset.fileId) {
          fileUploaded = true;
          uploadedFileCount++;
        }
      });
      
      if (!fileUploaded) {
        allFilesUploaded = false;
      }
    });
    
    console.log(`All files uploaded: ${allFilesUploaded}, Count: ${uploadedFileCount}/${REQUIRED_FILES.length}`);
    
    // If all files are uploaded, check the application status
    if (allFilesUploaded && uploadedFileCount === REQUIRED_FILES.length) {
      console.log('All required files are uploaded, checking application status...');
      // Get the current application status
      fetch('/organization/get-application-status')
        .then(response => response.json())
        .then(data => {
          console.log('Application status response:', data);
          if (data.success) {
            console.log(`Current status: ${data.status}, Previous status: ${data.previousStatus}`);
            // Check for status changes that require page refresh
            if ((data.status === 'Pending' && data.previousStatus === 'Incomplete') ||
                (data.status === 'Verified' && data.previousStatus === 'Pending')) {
              console.log(`Status changed from ${data.previousStatus} to ${data.status}, refreshing page...`);
              // Refresh the page after a short delay to show the new status
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } else {
              console.log('No relevant status change detected');
            }
          }
        })
        .catch(error => {
          console.error('Error checking application status:', error);
        });
    }
  }

  // Function to set up form submissions
  function setupFormSubmissions() {
    // Reply form submission
    const replyForm = document.getElementById('reply-form');
    if (replyForm) {
      replyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const subject = document.getElementById('reply-subject').value;
        const message = document.getElementById('reply-message').value;
        
        // Validate form
        if (!subject || !message) {
          alert('Please fill in all required fields.');
          return;
        }
        
        // In a real application, you would send this data to the server
        console.log('Reply submitted:', {
          subject: subject,
          message: message
        });
        
        // Show success message
        alert('Reply sent successfully!');
        
        // Reset form and close modal
        this.reset();
        DOMUtils.toggleModal('replyModal', false);
      });
    }
    
    // Update organization form submission
    const updateOrgForm = document.getElementById('updateOrgForm');
    if (updateOrgForm) {
      updateOrgForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show loading modal
        DOMUtils.showLoadingModal('Updating organization information...');
        
        // Get form data
        const formData = new FormData(this);
        
        // Send the form data to the server
        fetch('/organization/update-organization', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          // Hide loading modal
          DOMUtils.hideLoadingModal();
          
          if (data.success) {
            // Show success message
            alert('Organization information updated successfully!');
            
            // Close modal
            DOMUtils.toggleModal('updateOrgModal', false);
            
            // Refresh the page to show updated information
            window.location.reload();
          } else {
            // Show error message
            alert('Error: ' + data.message);
          }
        })
        .catch(error => {
          // Hide loading modal and show error
          DOMUtils.hideLoadingModal();
          alert('Error updating organization information: Network error');
        });
      });
    }
  }

  // Expose public functions
  window.handleFileSelected = handleFileSelected;
  window.checkIfAllFilesUploaded = checkIfAllFilesUploaded;
  window.previewFile = function(fileId, fileName) {
    return FilePreview.previewFile(fileId, fileName, function(fileId) {
      return `/organization/get-application-file/${fileId}`;
    });
  };
  window.deleteAllFiles = deleteAllFiles;
  window.loadApplicationFiles = loadApplicationFiles;
  window.openReplyModal = function() {
    DOMUtils.toggleModal('replyModal', true);
  };
  window.closeReplyModal = function() {
    DOMUtils.toggleModal('replyModal', false);
  };
  window.openUpdateOrgModal = function() {
    DOMUtils.toggleModal('updateOrgModal', true);
  };
  window.closeUpdateOrgModal = function() {
    DOMUtils.toggleModal('updateOrgModal', false);
  };
  window.openFeedbackDetail = function() {
    // Implementation would depend on the feedback detail modal structure
  };
  window.showTab = function(tabId) {
    // Hide all tab content
    document.querySelectorAll('.feedback-tab-content').forEach(function(tab) {
      tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.feedback-tab').forEach(function(tab) {
      tab.classList.remove('active');
    });
    
    // Show the selected tab content
    document.getElementById(tabId + '-tab').classList.add('active');
    
    // Add active class to the clicked tab
    document.querySelectorAll('.feedback-tab').forEach(function(tab) {
      if (tab.textContent.toLowerCase().includes(tabId)) {
        tab.classList.add('active');
      }
    });
  };
})();