/**
 * User Renewal Module
 * Handles UI interactions for the renewal page with file upload functionality
 */

(function() {
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements
    initializeUI();
    // Load renewal files
    loadRenewalFiles();
    // Load feedback
    loadRenewalFeedback();
  });

  // Function to initialize UI elements
  function initializeUI() {
    setupDropzoneEvents();
    setupButtonEvents();
    setupFeedbackEvents();
  }

  // Function to set up dropzone events
  function setupDropzoneEvents() {
    // Get all dropzones
    const dropzones = document.querySelectorAll('.dropzone');
    
    dropzones.forEach(dropzone => {
      // Get the parent card
      const card = dropzone.closest('.document-card');
      if (!card) return;
      
      // Get the file input
      const fileInput = card.querySelector('input[type="file"]');
      if (!fileInput) return;
      
      // Get the file type from the card title
      const fileType = card.querySelector('.small.fw-semibold').textContent.trim();
      
      // Update the dropzone text to match application page
      dropzone.innerHTML = `
        <i class="fas fa-cloud-upload-alt mb-1"></i>
        <div class="text-center">Drag & Drop or Click to Upload<br>
        PDF files only</div>
      `;
      
      // Set up click event on dropzone
      dropzone.addEventListener('click', function() {
        fileInput.click();
      });
      
      // Set up file input change event
      fileInput.addEventListener('change', function(e) {
        handleFileSelected(this, card);
      });
      
      // Add click event to handle selecting the same file again
      fileInput.addEventListener('click', function() {
        // Store the current value to detect if the same file is selected again
        this.dataset.previousValue = this.value;
        // Clear the value to ensure change event fires even if same file is selected
        if (this.value) {
          this.value = '';
        }
      });
      
      // Set up drag and drop events
      dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
      
      dropzone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
      
      dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
        
        if (e.dataTransfer.files.length > 0) {
          fileInput.files = e.dataTransfer.files;
          fileInput.dispatchEvent(new Event('change'));
        }
      });
    });
  }
  
  // Helper function to format file size
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Function to handle file selection
  function handleFileSelected(input, card) {
    if (!input.files.length) return;
    
    const file = input.files[0];
    const fileType = card.querySelector('.small.fw-semibold').textContent.trim();
    
    // Validate file type - only allow PDF files
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (fileExtension !== '.pdf' || file.type !== 'application/pdf') {
      alert('Invalid file type. Please upload a PDF file only.');
      input.value = '';
      return;
    }
    
    // Update dropzone to show selected file
    const dropzone = card.querySelector('.dropzone');
    if (dropzone) {
      dropzone.innerHTML = `
        <i class="fas fa-file-pdf mb-1"></i>
        <div>${file.name}</div>
        <div class="small text-muted">${formatFileSize(file.size)}</div>
      `;
      
      dropzone.classList.add('selected');
    }
    
    // Enable upload button
    const uploadBtn = card.querySelector('button:nth-child(3)');
    if (uploadBtn) {
      uploadBtn.classList.remove('btn-outline-secondary');
      uploadBtn.classList.add('btn-primary');
    }
  }

  // Function to upload a file
  function uploadFile(file, fileType, card) {
    // Show loading modal
    const loadingModal = document.getElementById('loadingModal');
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.textContent = 'Uploading file...';
    loadingModal.style.display = 'flex';
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    
    fetch('/renewal/upload-renewal-file', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      loadingModal.style.display = 'none';
      
      if (data.success) {
        // Update the card status
        updateCardStatus(card, 'Pending', 'bg-primary', 'fa-clock');
        // Reload all files to update the progress
        loadRenewalFiles();
      } else {
        // Show error message
        alert(data.message || 'Error uploading file');
        // Reset the dropzone
        const dropzone = card.querySelector('.dropzone');
        dropzone.innerHTML = `
          <i class="fas fa-cloud-upload-alt mb-1"></i>
          <div class="text-center">Drag & Drop or Click to Upload<br>
          PDF files only</div>
        `;
        dropzone.classList.remove('selected');
      }
    })
    .catch(error => {
      loadingModal.style.display = 'none';
      console.error('Error:', error);
      alert('An error occurred while uploading the file');
      // Reset the dropzone
      const dropzone = card.querySelector('.dropzone');
      dropzone.innerHTML = `
        <i class="fas fa-cloud-upload-alt mb-1"></i>
        <div class="text-center">Drag & Drop or Click to Upload<br>
        PDF files only</div>
      `;
      dropzone.classList.remove('selected');
    });
  }

  // Function to set up button events
  function setupButtonEvents() {
    // Get all document cards
    const cards = document.querySelectorAll('.document-card');
    
    cards.forEach(card => {
      // Get the file input
      const fileInput = card.querySelector('input[type="file"]');
      if (!fileInput) return;
      
      // Get buttons
      const selectBtn = card.querySelector('button:nth-child(2)');
      const uploadBtn = card.querySelector('button:nth-child(3)');
      const previewBtn = card.querySelector('button:nth-child(1)');
      
      // Get the file type from the card title
      const fileType = card.querySelector('.small.fw-semibold').textContent.trim();
      
      // Set up select button click event with fix for same file selection
      if (selectBtn) {
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
            uploadFile(fileInput.files[0], fileType, card);
          } else {
            alert('Please select a file first');
          }
        });
      }
      
      // Set up preview button click event
      if (previewBtn) {
        previewBtn.addEventListener('click', function() {
          // Get the file ID from the data attribute
          const fileId = card.dataset.fileId;
          if (fileId) {
            previewFile(fileId);
          } else {
            alert('No file available for preview');
          }
        });
      }
    });
  }
  
  // Function to preview a file
  function previewFile(fileId) {
    // Show loading modal
    const loadingModal = document.getElementById('loadingModal');
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.textContent = 'Loading preview...';
    loadingModal.style.display = 'flex';
    
    // Open the file in a new tab
    const previewUrl = `/renewal/get-renewal-file/${fileId}`;
    window.open(previewUrl, '_blank');
    
    // Hide loading modal
    loadingModal.style.display = 'none';
  }

  // Function to set up feedback events
  function setupFeedbackEvents() {
    // Get all feedback toggle buttons
    const feedbackToggles = document.querySelectorAll('.inline-feedback-toggle');
    
    feedbackToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const card = toggle.closest('.document-card');
        const feedbackContainer = card.querySelector('.inline-feedback-container');
        
        if (feedbackContainer) {
          // Toggle visibility
          if (feedbackContainer.style.display === 'block') {
            feedbackContainer.style.display = 'none';
            toggle.setAttribute('aria-expanded', 'false');
          } else {
            feedbackContainer.style.display = 'block';
            toggle.setAttribute('aria-expanded', 'true');
            
            // Get the file ID from the card
            const fileId = card.dataset.fileId;
            if (fileId) {
              // Load feedback for this file
              loadFileFeedback(fileId, feedbackContainer);
            }
          }
        }
      });
    });
    
    // Set up close buttons for feedback containers
    document.querySelectorAll('.inline-feedback-close button').forEach(button => {
      button.addEventListener('click', function() {
        const feedbackContainer = button.closest('.inline-feedback-container');
        if (feedbackContainer) {
          feedbackContainer.style.display = 'none';
          const toggle = feedbackContainer.previousElementSibling;
          if (toggle && toggle.classList.contains('inline-feedback-toggle')) {
            toggle.setAttribute('aria-expanded', 'false');
          }
        }
      });
    });
  }

  function loadRenewalFiles() {

    // Show loading modal
    const loadingModal = document.getElementById('loadingModal');
    const loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.textContent = 'Loading files...';
    loadingModal.style.display = 'flex';
    
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    // Prepare headers for fetch request
    const headers = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    fetch('/renewal/get-renewal-files', {
      headers: headers,
      credentials: 'same-origin'
    })
      .then(response => response.json())
      .then(data => {
        loadingModal.style.display = 'none';
        
        if (data.success) {
          updateFileCards(data.files);
          updateProgressBar(data.files);
        } else {
          console.error('Error loading files:', data.message);
        }
      })
      .catch(error => {
        loadingModal.style.display = 'none';
        console.error('Error:', error);
      });
  }
  
  // Function to load renewal feedback
  function loadRenewalFeedback() {
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    // Prepare headers for fetch request
    const headers = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    fetch('/renewal/get-renewal-feedback', {
      headers: headers,
      credentials: 'same-origin'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          updateFeedbackSection(data.feedbacks);
        } else {
          console.error('Error loading feedback:', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
  
  // Function to load feedback for a specific file
  function loadFileFeedback(fileId, container) {
    // Get all feedback for this file from the feedback section
    // Get CSRF token from meta tag
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    // Prepare headers for fetch request
    const headers = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
    
    fetch('/renewal/get-renewal-feedback', {
      headers: headers,
      credentials: 'same-origin'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const fileFeedback = data.feedbacks.filter(feedback => feedback.file_id === parseInt(fileId));
          
          if (fileFeedback.length > 0) {
            // Display the most recent feedback
            const feedback = fileFeedback[0];
            const feedbackTitle = container.querySelector('.inline-feedback-title');
            const feedbackDate = container.querySelector('.inline-feedback-date');
            const feedbackBody = container.querySelector('.inline-feedback-body');
            
            if (feedbackTitle) feedbackTitle.textContent = feedback.subject;
            if (feedbackDate) feedbackDate.textContent = feedback.date_sent;
            if (feedbackBody) feedbackBody.textContent = feedback.message;
          } else {
            // No feedback for this file
            const feedbackBody = container.querySelector('.inline-feedback-body');
            if (feedbackBody) feedbackBody.textContent = 'No feedback available for this file.';
          }
        } else {
          console.error('Error loading feedback:', data.message);
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }
  
  // Function to update file cards based on loaded files
  function updateFileCards(files) {
    // Get all document cards
    const cards = document.querySelectorAll('.document-card');
    
    cards.forEach(card => {
      // Get the file type from the card title
      const fileType = card.querySelector('.small.fw-semibold').textContent.trim();
      
      // Find the matching file
      const file = files.find(f => f.name === fileType);
      
      if (file) {
        // Update the card with file information
        card.dataset.fileId = file.id;
        
        // Update status badge
        updateCardStatus(card, file.status, getStatusClass(file.status), getStatusIcon(file.status));
        
        // Update dropzone content
        const dropzone = card.querySelector('.dropzone');
        if (dropzone) {
          dropzone.innerHTML = `
            <i class="fas fa-file-pdf mb-1"></i>
            ${fileType} (Uploaded on ${file.submission_date})
          `;
        }
      }
    });
  }
  
  // Function to update the progress bar
  function updateProgressBar(files) {
    if (!files || files.length === 0) return;
    
    // Count files by status
    const statusCounts = {
      'Verified': 0,
      'Pending': 0,
      'Needs Revision': 0,
      'Rejected': 0
    };
    
    files.forEach(file => {
      if (statusCounts.hasOwnProperty(file.status)) {
        statusCounts[file.status]++;
      }
    });
    
    // Update the status counts in the UI
    document.querySelector('.progress-bar').style.width = `${(statusCounts['Verified'] / files.length) * 100}%`;
    
    // Update the status text
    const statusTexts = document.querySelectorAll('.d-flex.justify-content-between.small.text-secondary span');
    if (statusTexts.length >= 4) {
      statusTexts[0].textContent = `Verified: ${statusCounts['Verified']}`;
      statusTexts[1].textContent = `Pending: ${statusCounts['Pending']}`;
      statusTexts[2].textContent = `Needs Revision: ${statusCounts['Needs Revision']}`;
      statusTexts[3].textContent = `Rejected: ${statusCounts['Rejected']}`;
    }
    
    // Update application progress section
    const progressSection = document.querySelector('.status-incomplete');
    if (progressSection) {
      // Update status text
      const statusText = progressSection.querySelector('.small.text-secondary.mb-1');
      if (statusText) {
        if (files.length > 0) {
          statusText.textContent = `${files.length} files uploaded`;
        } else {
          statusText.textContent = 'No files uploaded yet';
        }
      }
      
      // Update status badge
      const statusBadge = progressSection.querySelector('.badge');
      if (statusBadge) {
        if (statusCounts['Verified'] === files.length && files.length > 0) {
          statusBadge.className = 'badge bg-success';
          statusBadge.textContent = 'Verified';
        } else if (statusCounts['Pending'] > 0) {
          statusBadge.className = 'badge bg-primary';
          statusBadge.textContent = 'Pending';
        } else if (statusCounts['Needs Revision'] > 0) {
          statusBadge.className = 'badge bg-warning';
          statusBadge.textContent = 'Needs Revision';
        } else if (files.length > 0) {
          statusBadge.className = 'badge bg-secondary';
          statusBadge.textContent = 'Incomplete';
        } else {
          statusBadge.className = 'badge bg-secondary';
          statusBadge.textContent = 'No Data';
        }
      }
    }
  }
  
  // Function to update the feedback section
  function updateFeedbackSection(feedbacks) {
    const receivedTab = document.getElementById('received-tab');
    const receivedCount = document.getElementById('received-feedback-count');
    
    if (receivedTab && receivedCount) {
      // Update the count
      receivedCount.textContent = feedbacks.length;
      
      // Clear existing content
      receivedTab.innerHTML = '';
      
      if (feedbacks.length > 0) {
        // Sort feedbacks by date (newest first)
        feedbacks.sort((a, b) => new Date(b.date_sent) - new Date(a.date_sent));
        
        // Add feedback cards
        feedbacks.forEach(feedback => {
          const feedbackCard = document.createElement('div');
          feedbackCard.className = `feedback-card ${feedback.is_read ? '' : 'unread'}`;
          feedbackCard.innerHTML = `
            <div class="feedback-card-header">
              <div class="feedback-card-title">${feedback.subject}</div>
              <div class="feedback-card-date">${feedback.date_sent}</div>
            </div>
            <div class="feedback-card-body">${feedback.message}</div>
            <div class="feedback-card-file">
              <i class="fas fa-file-pdf"></i> ${feedback.file_name}
            </div>
          `;
          receivedTab.appendChild(feedbackCard);
        });
      } else {
        // No feedback available
        receivedTab.innerHTML = `
          <div class="text-center p-4">
            <p class="text-muted">No feedback available.</p>
          </div>
        `;
      }
    }
  }
  
  // Function to update card status
  function updateCardStatus(card, status, statusClass, statusIcon) {
    const statusBadge = card.querySelector('.badge');
    if (statusBadge) {
      statusBadge.className = `badge ${statusClass} status-badge`;
      statusBadge.innerHTML = `<i class="fas ${statusIcon}"></i> ${status}`;
    }
  }
  
  // Helper function to get status class
  function getStatusClass(status) {
    switch (status) {
      case 'Verified': return 'bg-success';
      case 'Pending': return 'bg-primary';
      case 'Needs Revision': return 'bg-warning';
      case 'Rejected': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
  
  // Helper function to get status icon
  function getStatusIcon(status) {
    switch (status) {
      case 'Verified': return 'fa-check-circle';
      case 'Pending': return 'fa-clock';
      case 'Needs Revision': return 'fa-exclamation-circle';
      case 'Rejected': return 'fa-times-circle';
      default: return 'fa-question-circle';
    }
  }
})();