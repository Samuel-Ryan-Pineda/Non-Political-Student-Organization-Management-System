// Constants and cached DOM elements
const DOM = {
  getById: (id) => document.getElementById(id),
  getAll: (selector) => document.querySelectorAll(selector)
};

const FILE_TYPES = {
  VALID_EXTENSIONS: ['pdf'],
  ACCEPT_TYPES: '.pdf,.doc,.docx'
};

const BUTTON_STATES = {
  DISABLED: {
    UPLOAD: { disabled: true, addClasses: ['btn-secondary'], removeClasses: ['btn-primary'] },
    PREVIEW: { disabled: true, addClasses: ['btn-secondary'], removeClasses: ['btn-outline-dark'] }
  },
  ENABLED: {
    UPLOAD: { disabled: false, addClasses: ['btn-primary'], removeClasses: ['btn-secondary'] },
    PREVIEW: { disabled: false, addClasses: ['btn-outline-dark'], removeClasses: ['btn-secondary'] }
  }
};

// Constants for preview modal
const PREVIEW_MODAL = {
  TIMEOUT_MS: 10000,
  ANIMATION_DELAY_MS: 300,
  ICONS: {
    WORD: 'fa-file-word text-primary',
    ERROR: 'fa-exclamation-circle text-danger',
    WARNING: 'fa-exclamation-triangle text-danger',
    TIMEOUT: 'fa-clock text-warning'
  },
  CONTENT_TYPES: {
    WORD: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
  }
};

// Status tracking configuration
const STATUS_TYPES = {
  'Verified': { icon: 'check-circle', color: 'success', count: 0 },
  'Pending': { icon: 'clock', color: 'primary', count: 0 },
  'Needs Revision': { icon: 'exclamation-circle', color: 'warning', count: 0 },
  'Rejected': { icon: 'times-circle', color: 'danger', count: 0 }
};

// Status badge configurations
const STATUS_CONFIGS = {
  'Verified': {
    className: 'badge bg-success status-badge',
    html: '<i class="fas fa-check"></i> Verified'
  },
  'Needs Revision': {
    className: 'badge bg-warning text-dark status-badge',
    html: '<i class="fas fa-exclamation"></i> Needs Revision'
  },
  'Rejected': {
    className: 'badge bg-danger status-badge',
    html: '<i class="fas fa-times"></i> Rejected'
  },
  'Pending': {
    className: 'badge bg-primary status-badge',
    html: '<i class="fas fa-clock"></i> Pending'
  }
};

// Tab management functions
function showTab(tabId) {
  // Hide all tab contents and deactivate buttons
  DOM.getAll('.feedback-tab-content').forEach(tab => tab.classList.remove('active'));
  DOM.getAll('.feedback-tab').forEach(button => button.classList.remove('active'));
  
  // Show selected tab and activate button
  DOM.getById(tabId + '-tab').classList.add('active');
  DOM.getById(tabId + '-tab-btn').classList.add('active');
}

// Modal management functions
function toggleModal(modalId, show) {
  const modal = DOM.getById(modalId);
  if (show) {
    modal.classList.add('show');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  } else {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

function openReplyModal(feedbackDate) {
  toggleModal('replyModal', true);
}

function closeReplyModal() {
  toggleModal('replyModal', false);
}

function openUpdateOrgModal() {
  toggleModal('updateOrgModal', true);
}

function closeUpdateOrgModal() {
  toggleModal('updateOrgModal', false);
}

function openFeedbackDetail(tabType, id) {
  alert('Opening details for ' + tabType + ' feedback #' + id);
  // Implement detailed view functionality here
}

// Button state management helper
function setButtonState(button, state) {
  button.disabled = state.disabled;
  state.addClasses.forEach(cls => button.classList.add(cls));
  state.removeClasses.forEach(cls => button.classList.remove(cls));
}

// File Upload Functions
document.addEventListener('DOMContentLoaded', function() {
  // Initialize all dropzones and file upload buttons
  initializeFileUploads();
  
  // Load existing files
  loadApplicationFiles();
  
  // Initialize progress line and status counts
  updateProgressAndStatusCounts();
  
  // Set up reply form submission
  DOM.getById('reply-form')?.addEventListener('submit', function(event) {
    event.preventDefault();
    const subject = DOM.getById('reply-subject').value;
    const message = DOM.getById('reply-message').value;
    
    if (!subject || !message) {
      alert('Please fill in all required fields.');
      return;
    }
    
    alert('Reply sent successfully!');
    this.reset();
    closeReplyModal();
  });
});

function initializeFileUploads() {
  // Add event listeners to each dropzone
  DOM.getAll('.dropzone').forEach((dropzone) => {
    const card = dropzone.closest('.card');
    const fileType = card.querySelector('.fw-semibold').textContent.trim();
    const previewBtn = card.querySelector('button:nth-child(1)');
    const selectBtn = card.querySelector('button:nth-child(2)');
    const uploadBtn = card.querySelector('button:nth-child(3)');
    
    // Initially disable buttons
    setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
    setButtonState(previewBtn, BUTTON_STATES.DISABLED.PREVIEW);
    
    // Create hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = FILE_TYPES.ACCEPT_TYPES;
    fileInput.style.display = 'none';
    fileInput.dataset.fileType = fileType;
    card.appendChild(fileInput);
    
    // Set up event listeners
    setupDropzoneEvents(dropzone, fileInput, fileType, uploadBtn);
    setupButtonEvents(selectBtn, uploadBtn, previewBtn, fileInput, fileType, card);
  });
}

function setupDropzoneEvents(dropzone, fileInput, fileType, uploadBtn) {
  // Drag and drop events
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      handleFileSelected(fileInput, dropzone, fileType, uploadBtn);
    }
  });
  
  // Click on dropzone to select file
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });
}

function setupButtonEvents(selectBtn, uploadBtn, previewBtn, fileInput, fileType, card) {
  const dropzone = card.querySelector('.dropzone');
  
  // Select file button
  selectBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  // File selected event
  fileInput.addEventListener('change', () => {
    handleFileSelected(fileInput, dropzone, fileType, uploadBtn);
  });
  
  // Upload button
  uploadBtn.addEventListener('click', () => {
    if (fileInput.files.length > 0) {
      uploadFile(fileInput.files[0], fileType, card);
    } else {
      alert('Please select a file first');
    }
  });
  
  // Preview button
  previewBtn.addEventListener('click', () => {
    if (!previewBtn.disabled) {
      previewFile(fileType);
    }
  });
}

function handleFileSelected(fileInput, dropzone, fileType, uploadBtn) {
  const card = dropzone.closest('.card');
  const previewBtn = card.querySelector('button:nth-child(1)');
  
  // Default state - disable buttons
  const disableButtons = () => {
    setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
    setButtonState(previewBtn, BUTTON_STATES.DISABLED.PREVIEW);
  };
  
  if (fileInput.files.length === 0) {
    disableButtons();
    return;
  }
  
  const file = fileInput.files[0];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  // Validate file type
  if (!FILE_TYPES.VALID_EXTENSIONS.includes(fileExtension)) {
    alert('Invalid file type. Please upload PDF documents only.');
    fileInput.value = '';
    disableButtons();
    return;
  }
  
  // Update dropzone to show selected file
  dropzone.innerHTML = `
    <i class="fas fa-file-alt mb-1"></i>
    <div>${file.name}</div>
    <div class="small text-muted">${(file.size / 1024).toFixed(1)} KB</div>
  `;
  
  // Enable upload button when valid file is selected
  setButtonState(uploadBtn, BUTTON_STATES.ENABLED.UPLOAD);
  
  // Keep preview button disabled until file is actually uploaded
  setButtonState(previewBtn, BUTTON_STATES.DISABLED.PREVIEW);
}

function uploadFile(file, fileType, card) {
  // Prepare form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  
  // Get UI elements
  const statusBadge = card.querySelector('.status-badge');
  const uploadBtn = card.querySelector('button:nth-child(3)');
  
  // Show loading state
  statusBadge.className = 'badge bg-secondary status-badge';
  statusBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
  
  // Disable the upload button during upload
  setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
  
  // Handle upload errors
  const handleError = (message) => {
    console.error('Error:', message);
    statusBadge.className = 'badge bg-danger status-badge';
    statusBadge.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error';
    alert('Upload failed: ' + message);
    
    // Re-enable the upload button if upload fails
    setButtonState(uploadBtn, BUTTON_STATES.ENABLED.UPLOAD);
  };
  
  // Send the file to the server
  fetch('/upload-application-file', {
    method: 'POST',
    body: formData
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Reload application files to update UI with the new file
      loadApplicationFiles();
      
      // Show success message
      alert(data.message);
      
      // Keep the upload button disabled after successful upload
      setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
    } else {
      handleError(data.message);
    }
  })
  .catch(error => {
    handleError('Network error');
  });
}

function loadApplicationFiles() {
  // Reset all cards to "No File" state first
  resetAllCards();
  
  // Then load existing files
  fetch('/get-application-files')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.files) {
        // Update each file card with the file data
        data.files.forEach(file => {
          updateFileCard(file.name, file.id, file.status);
        });
        
        // Update progress line and status counts
        updateProgressAndStatusCounts();
      }
    })
    .catch(error => {
      console.error('Error loading files:', error);
    });
}

// Helper function to reset all document cards to their initial state
function resetAllCards() {
  DOM.getAll('.document-card').forEach(card => {
    // Reset status badge
    const statusBadge = card.querySelector('.status-badge');
    statusBadge.className = 'badge bg-secondary status-badge';
    statusBadge.innerHTML = '<i class="fas fa-question-circle"></i> No File';
    statusBadge.removeAttribute('data-file-id');
    statusBadge.removeAttribute('data-status');
    
    // Reset buttons
    const uploadBtn = card.querySelector('button:nth-child(3)');
    const previewBtn = card.querySelector('button:nth-child(1)');
    
    if (uploadBtn) setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
    if (previewBtn) setButtonState(previewBtn, BUTTON_STATES.DISABLED.PREVIEW);
    
    // Reset dropzone
    const dropzone = card.querySelector('.dropzone');
    if (dropzone) {
      dropzone.innerHTML = `
        <i class="fas fa-arrow-up mb-1"></i>
        Drag & drop or click to upload
      `;
    }
  });
}

function deleteAllFiles() {
  if (!confirm('Are you sure you want to delete all application files? This action cannot be undone.')) {
    return;
  }
  
  // Show loading modal
  showLoadingModal('Deleting all files...');
  
  // Call the delete endpoint
  fetch('/delete-all-application-files')
    .then(response => response.json())
    .then(data => {
      // Remove loading modal
      hideLoadingModal();
      
      if (data.success) {
        // Show success message
        alert(data.message);
        // Refresh the file list and update progress
        loadApplicationFiles();
      } else {
        // Show error
        alert('Error: ' + data.message);
      }
    })
    .catch(error => {
      // Remove loading modal and show error
      hideLoadingModal();
      console.error('Error:', error);
      alert('Error deleting files: Network error');
    });
}

// Helper function to show a loading modal
function showLoadingModal(message) {
  const loadingModal = document.createElement('div');
  loadingModal.className = 'global-modal show';
  loadingModal.id = 'loadingModal';
  loadingModal.innerHTML = `
    <div class="modal-content p-4 text-center" style="width: auto; max-width: 300px; margin: 0 auto; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
      <div class="d-flex justify-content-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(loadingModal);
}

// Helper function to hide the loading modal
function hideLoadingModal() {
  const modal = document.getElementById('loadingModal');
  if (modal) {
    modal.remove();
  }
}

function updateFileCard(fileType, fileId, status) {
  // Find the card for this file type
  const targetCard = Array.from(DOM.getAll('.document-card')).find(card => {
    const cardTitle = card.querySelector('.fw-semibold').textContent.trim();
    return cardTitle === fileType;
  });
  
  if (!targetCard) return;
  
  // Get UI elements
  const statusBadge = targetCard.querySelector('.status-badge');
  const uploadBtn = targetCard.querySelector('button:nth-child(3)');
  const previewBtn = targetCard.querySelector('button:nth-child(1)');
  const dropzone = targetCard.querySelector('.dropzone');
  
  // Update the status badge data attributes
  statusBadge.dataset.fileId = fileId;
  statusBadge.dataset.status = status; // Store status for counting
  
  // Set button states
  if (uploadBtn) setButtonState(uploadBtn, BUTTON_STATES.DISABLED.UPLOAD);
  if (previewBtn) setButtonState(previewBtn, BUTTON_STATES.ENABLED.PREVIEW);
  
  // Apply status badge configuration
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS['Pending'];
  statusBadge.className = config.className;
  statusBadge.innerHTML = config.html;
  
  // Update the dropzone to show that a file is uploaded
  if (dropzone) {
    dropzone.innerHTML = `
      <i class="fas fa-file-alt mb-1"></i>
      <div>File Uploaded</div>
      <div class="small text-muted">Click to replace</div>
    `;
  }
  
  // Update progress and status counts
  updateProgressAndStatusCounts();
}

// Function to update progress line and status counts
function updateProgressAndStatusCounts() {
  let totalFiles = 0;
  
  // Reset counts
  Object.keys(STATUS_TYPES).forEach(key => {
    STATUS_TYPES[key].count = 0;
  });
  
  // Count files by status
  DOM.getAll('.status-badge').forEach(badge => {
    // Only count badges that have a file ID (meaning a file is uploaded)
    if (!badge.dataset.fileId) return;
    
    totalFiles++;
    const status = badge.dataset.status || 'Pending';
    
    // Increment the appropriate counter
    if (STATUS_TYPES[status]) {
      STATUS_TYPES[status].count++;
    } else {
      STATUS_TYPES['Pending'].count++;
    }
  });
  
  // Generate status count HTML
  const statusCountsHTML = Object.entries(STATUS_TYPES).map(([status, config]) => {
    return `
      <div class="d-flex align-items-center gap-1">
        <i class="fas fa-${config.icon} text-${config.color}"></i>
        <span>${status}: ${config.count}</span>
      </div>
    `;
  }).join('');
  
  // Update status counts in the UI
  document.querySelector('.d-flex.justify-content-between.small.text-secondary').innerHTML = statusCountsHTML;
  
  // Calculate and update progress
  updateProgressBar(STATUS_TYPES['Verified'].count, totalFiles);
}

// Helper function to update progress bar
function updateProgressBar(verifiedCount, totalFiles) {
  // Calculate progress percentage
  const progressPercentage = totalFiles > 0 ? Math.round((verifiedCount / totalFiles) * 100) : 0;
  
  // Get progress bar element
  const progressBar = document.querySelector('.progress-bar');
  
  // Update progress bar width and aria attribute
  progressBar.style.width = `${progressPercentage}%`;
  progressBar.setAttribute('aria-valuenow', progressPercentage);
  
  // Update progress bar color based on progress
  if (progressPercentage === 100) {
    progressBar.className = 'progress-bar bg-success';
  } else if (progressPercentage > 0) {
    progressBar.className = 'progress-bar bg-primary';
  } else {
    progressBar.className = 'progress-bar bg-dark';
  }
}