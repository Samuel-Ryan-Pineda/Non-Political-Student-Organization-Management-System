/**
 * Admin New Organization Files Module
 * Handles file management for admin interface
 */

(function() {
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    initializeTooltips();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up edit feedback form functionality
    setupEditFeedbackForm();
  });

  // Function to initialize tooltips
  function initializeTooltips() {
    // Initialize Bootstrap tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Function to set up event listeners
  function setupEventListeners() {
    // Set up feedback form submission
    setupFeedbackForm();
    
    // Set up modal close events
    setupModalCloseEvents();
    
    // Set up status update form
    setupStatusUpdateForm();
  }

  // Function to set up feedback form submission
  function setupFeedbackForm() {
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const subject = document.getElementById('feedback-subject').value;
        const message = document.getElementById('feedback-message').value;
        const fileId = document.getElementById('feedback-file-id').value;
        
        // Validate form
        if (!subject || !message) {
          alert('Please fill in all required fields.');
          return;
        }
        
        // Show loading modal
        DOMUtils.showLoadingModal('Sending feedback...');
        
        // Prepare data for submission
        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('message', message);
        formData.append('file_id', fileId);
        
        // Send the feedback to the server
        fetch('/admin/send-feedback', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          // Hide loading modal
          DOMUtils.hideLoadingModal();
          
          if (data.success) {
            // Show success message
            alert('Feedback sent successfully!');
            
            // Reset form and close modal
            feedbackForm.reset();
            closeFeedbackModal();
            
            // Refresh feedback history
            refreshFeedbackHistory();
          } else {
            // Show error message
            alert('Error: ' + data.message);
          }
        })
        .catch(error => {
          // Hide loading modal and show error
          DOMUtils.hideLoadingModal();
          alert('Error sending feedback: Network error');
        });
      });
    }
  }

  // Function to set up reply button


  // Function to set up modal close events
  function setupModalCloseEvents() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
      // File preview modal
      const filePreviewModal = document.getElementById('filePreviewModal');
      if (filePreviewModal && e.target === filePreviewModal) {
        closeFilePreviewModal();
      }
      
      // Status update modal
      const statusModal = document.getElementById('statusUpdateModal');
      if (statusModal && e.target === statusModal) {
        closeStatusModal();
      }
      
      // Feedback modal
      const feedbackModal = document.getElementById('feedbackModal');
      if (feedbackModal && e.target === feedbackModal) {
        closeFeedbackModal();
      }
      
      // Edit feedback modal
      const editFeedbackModal = document.getElementById('editFeedbackModal');
      if (editFeedbackModal && e.target === editFeedbackModal) {
        closeEditFeedbackModal();
      }
    });
  }

  // Function to set up status update form
  function setupStatusUpdateForm() {
    const statusForm = document.getElementById('status-update-form');
    const statusSelect = document.getElementById('status');
    const feedbackField = document.getElementById('feedback-field');
    
    // Add event listener to show/hide feedback field based on status selection
    if (statusSelect) {
      statusSelect.addEventListener('change', function() {
        const selectedStatus = this.value;
        if (selectedStatus === 'Needs Revision' || selectedStatus === 'Rejected') {
          feedbackField.style.display = 'block';
          document.getElementById('status-feedback').setAttribute('required', 'required');
        } else {
          feedbackField.style.display = 'none';
          document.getElementById('status-feedback').removeAttribute('required');
        }
      });
    }
    
    if (statusForm) {
      statusForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Prevent multiple submissions by disabling the submit button
        const submitButton = statusForm.querySelector('button[type="submit"]');
        if (submitButton && submitButton.disabled) {
          return; // Already submitting
        }
        
        // Get form data
        const fileId = document.getElementById('file_id').value;
        const status = document.getElementById('status').value;
        const feedback = document.getElementById('status-feedback').value;
        
        // Validate form
        if ((status === 'Needs Revision' || status === 'Rejected') && !feedback) {
          alert('Please provide feedback for why this file needs revision or is being rejected.');
          return;
        }
        
        // Disable submit button to prevent duplicate submissions
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Updating...';
        }
        
        // Show loading modal
        DOMUtils.showLoadingModal('Updating status...');
        
        // Prepare data for submission
        const formData = new FormData();
        formData.append('file_id', fileId);
        formData.append('status', status);
        if (feedback) {
          formData.append('feedback', feedback);
        }
        
        // Get CSRF token from meta tag or input
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                         document.querySelector('[name="csrf_token"]')?.value;
        
        // Send the status update to the server
        fetch('/update-file-status', {
          method: 'POST',
          body: formData,
          headers: {
            'X-CSRFToken': csrfToken
          },
          credentials: 'same-origin' // Include cookies for CSRF token
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {

          // Hide loading modal
          DOMUtils.hideLoadingModal();
          
          if (data.success) {
            // Reset form and close modal
            statusForm.reset();
            closeStatusModal();
            
            // Refresh the page to show updated status
            window.location.reload();
          } else {
            // Re-enable submit button on error
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = 'Update Status';
            }
            // Show error message
            alert('Error: ' + data.message);
          }
        })
        .catch(error => {
          // Re-enable submit button on error
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Update Status';
          }
          // Hide loading modal and show error
          DOMUtils.hideLoadingModal();
          alert('Error updating status: Network error');
          console.error('Error updating status:', error);
        });
      });
    }
  }

  // Function to refresh feedback history
  function refreshFeedbackHistory() {
    // In a real application, you would fetch the latest feedback from the server
    console.log('Refreshing feedback history...');
    
    // For now, just show a message
    alert('Feedback history would be refreshed here.');
  }

  // Function to show tab content - removed as we no longer have multiple tabs

  // Function to preview a file
  function previewFile(fileId, fileName) {
    // Use the FilePreview module to preview the file
    FilePreview.previewFile(fileId, fileName, function(fileId) {
      return `/admin/get-application-file?file_id=${fileId}`;
    });
  }

  // Function to download a file
  function downloadFile(fileId) {
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = `/admin/download-application-file?file_id=${fileId}`;
    downloadLink.download = 'application_file';
    downloadLink.style.display = 'none';
    
    // Add the link to the document and click it
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Remove the link from the document
    document.body.removeChild(downloadLink);
  }

  // Function to download the current file in the preview modal
  function downloadCurrentFile() {
    const fileId = document.getElementById('current-file-id').value;
    if (fileId) {
      downloadFile(fileId);
    }
  }

  // Function to open the file preview modal
  function openFilePreviewModal() {
    const filePreviewModal = document.getElementById('filePreviewModal');
    if (filePreviewModal) {
      filePreviewModal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  // Function to close the file preview modal
  function closeFilePreviewModal() {
    const filePreviewModal = document.getElementById('filePreviewModal');
    if (filePreviewModal) {
      filePreviewModal.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      // Clear the iframe src to stop any loading or playing content
      const previewIframe = filePreviewModal.querySelector('.preview-iframe');
      if (previewIframe) {
        previewIframe.src = '';
      }
    }
  }

  // Function to open the status update modal
  function openStatusModal(fileId, status, fileName, submissionDate) {
    const statusModal = document.getElementById('statusUpdateModal');
    const statusFileId = document.getElementById('file_id');
    const statusSelect = document.getElementById('status');
    const fileNameElement = document.getElementById('status-file-name');
    const submissionDateElement = document.getElementById('status-submission-date');
    const feedbackField = document.getElementById('feedback-field');
    
    if (statusModal && statusFileId) {
      // Set the file ID
      statusFileId.value = fileId;
      
      // Set the current status in the dropdown if available
      if (statusSelect && status) {
        for (let i = 0; i < statusSelect.options.length; i++) {
          if (statusSelect.options[i].value === status) {
            statusSelect.selectedIndex = i;
            break;
          }
        }
        
        // Check if feedback field should be shown based on selected status
        const selectedStatus = statusSelect.value;
        if (selectedStatus === 'Needs Revision' || selectedStatus === 'Rejected') {
          feedbackField.style.display = 'block';
          document.getElementById('status-feedback').setAttribute('required', 'required');
        } else {
          feedbackField.style.display = 'none';
          document.getElementById('status-feedback').removeAttribute('required');
        }
      }
      
      // Set the file name if available
      if (fileNameElement && fileName) {
        fileNameElement.textContent = fileName;
      }
      
      // Set the submission date if available
      if (submissionDateElement && submissionDate) {
        submissionDateElement.textContent = submissionDate;
      }
      
      // Show the modal
      statusModal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  // Function to close the status update modal
  function closeStatusModal() {
    const statusModal = document.getElementById('statusUpdateModal');
    if (statusModal) {
      statusModal.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      // Reset the form
      const statusForm = document.getElementById('status-update-form');
      if (statusForm) {
        statusForm.reset();
        
        // Re-enable submit button in case it was disabled
        const submitButton = statusForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Update Status';
        }
      }
      
      // Hide the feedback field and remove required attribute
      const feedbackField = document.getElementById('feedback-field');
      if (feedbackField) {
        feedbackField.style.display = 'none';
        const feedbackTextarea = document.getElementById('status-feedback');
        if (feedbackTextarea) {
          feedbackTextarea.removeAttribute('required');
          feedbackTextarea.value = '';
        }
      }
    }
  }

  // Function to open the feedback modal
  function openFeedbackModal(fileId, fileName) {
    const feedbackModal = document.getElementById('feedbackModal');
    const feedbackFileId = document.getElementById('feedback-file-id');
    const feedbackFileName = document.getElementById('feedback-file-name');
    
    if (feedbackModal && feedbackFileId && feedbackFileName) {
      // Set the file ID and name
      feedbackFileId.value = fileId;
      feedbackFileName.textContent = fileName;
      
      // Show the modal
      feedbackModal.classList.add('show');
      document.body.classList.add('modal-open');
    }
  }

  // Function to close the feedback modal
  function closeFeedbackModal() {
    const feedbackModal = document.getElementById('feedbackModal');
    if (feedbackModal) {
      feedbackModal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }

  // Function to open the edit feedback modal
  function editFeedback(feedbackId) {
    const editFeedbackModal = document.getElementById('editFeedbackModal');
    if (!editFeedbackModal) return;
    
    // Show loading modal
    DOMUtils.showLoadingModal('Loading feedback details...');
    
    // Fetch feedback details from the server
    fetch(`/get-feedback-detail/${feedbackId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch feedback details');
        }
        return response.json();
      })
      .then(feedbackData => {
        // Hide loading modal
        DOMUtils.hideLoadingModal();
        
        // Update the form fields
        const feedbackIdInput = document.getElementById('edit-feedback-id');
        const subjectInput = document.getElementById('edit-feedback-subject');
        const messageInput = document.getElementById('edit-feedback-message');
        const fileNameElement = document.getElementById('edit-feedback-file-name');
        const dateElement = document.getElementById('edit-feedback-date');
        
        if (feedbackIdInput) feedbackIdInput.value = feedbackId;
        if (subjectInput) subjectInput.value = feedbackData.subject;
        if (messageInput) messageInput.value = feedbackData.message;
        if (fileNameElement) fileNameElement.textContent = feedbackData.file_name;
        
        // Format and display the date if available
        if (dateElement && feedbackData.date && feedbackData.date !== 'Not available') {
          dateElement.textContent = feedbackData.date; // Server already formats the date
        } else if (dateElement) {
          dateElement.textContent = 'Date not available';
        }
        
        // Show the modal
        editFeedbackModal.classList.add('show');
        document.body.classList.add('modal-open');
      })
      .catch(error => {
        // Hide loading modal
        DOMUtils.hideLoadingModal();
        
        console.error('Error fetching feedback details:', error);
        DOMUtils.showNotification('Error loading feedback details. Please try again.', 'error');
      });
  }

  // Function to close the edit feedback modal
  function closeEditFeedbackModal() {
    const editFeedbackModal = document.getElementById('editFeedbackModal');
    if (editFeedbackModal) {
      editFeedbackModal.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      // Reset the form
      const editForm = document.getElementById('edit-feedback-form');
      if (editForm) {
        editForm.reset();
        
        // Reset the submit button state
        const submitButton = editForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Update Feedback';
        }
      }
    }
  }

  // Function to handle edit feedback form submission
  function setupEditFeedbackForm() {
    const editForm = document.getElementById('edit-feedback-form');
    if (editForm) {
      editForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const feedbackId = document.getElementById('edit-feedback-id').value;
        const subject = document.getElementById('edit-feedback-subject').value;
        const message = document.getElementById('edit-feedback-message').value;
        
        // Show loading state
        const submitButton = editForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Updating...';
        }
        
        // Show loading modal
        DOMUtils.showLoadingModal('Updating feedback...');
        
        // Prepare data for submission
        const formData = new FormData();
        formData.append('feedback_id', feedbackId);
        formData.append('subject', subject);
        formData.append('message', message);
        
        // Get CSRF token from meta tag or input
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                         document.querySelector('[name="csrf_token"]')?.value;
        
        // Send the update to the server
        fetch('/update-feedback', {
          method: 'POST',
          body: formData,
          headers: {
            'X-CSRFToken': csrfToken
          },
          credentials: 'same-origin' // Include cookies for CSRF token
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Hide loading modal
          DOMUtils.hideLoadingModal();
          
          if (data.success) {
            // Close modal
            closeEditFeedbackModal();
            
            // Update the specific feedback card instead of reloading the page
            updateFeedbackCard(feedbackId, subject, message);
            
            // Show success notification
            DOMUtils.showNotification('Feedback updated successfully', 'success');
          } else {
            // Re-enable submit button on error
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = 'Update Feedback';
            }
            DOMUtils.showNotification('Error: ' + data.message, 'error');
          }
        })
        .catch(error => {
          // Hide loading modal
          DOMUtils.hideLoadingModal();
          
          // Re-enable submit button on error
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Update Feedback';
          }
          DOMUtils.showNotification('Error updating feedback: Network error', 'error');
          console.error('Error updating feedback:', error);
        });
      });
    }
  }
  
  // Function to update a specific feedback card without page reload
  function updateFeedbackCard(feedbackId, subject, message) {
    // Find the feedback card with the matching feedback ID
    const feedbackCards = document.querySelectorAll('.feedback-card.sent');
    
    for (const card of feedbackCards) {
      // Find the edit button which contains the feedback ID
      const editButton = card.querySelector('.btn-view-feedback');
      if (editButton && editButton.getAttribute('onclick') === `editFeedback(${feedbackId})`) {
        // Update the card content
        const titleElement = card.querySelector('.feedback-card-title');
        const messageElement = card.querySelector('.feedback-card-body p');
        
        if (titleElement) titleElement.textContent = subject;
        if (messageElement) messageElement.textContent = message;
        
        // Update the date to current time
        const dateElement = card.querySelector('.feedback-card-date');
        if (dateElement) {
          const now = new Date();
          const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true };
          dateElement.textContent = now.toLocaleDateString('en-US', options);
        }
        
        // Add a highlight effect to show the card was updated
        card.style.transition = 'background-color 0.5s';
        card.style.backgroundColor = '#f0f9ff';
        setTimeout(() => {
          card.style.backgroundColor = '';
        }, 1500);
        
        break;
      }
    }
  }

  // Expose public functions
  window.previewFile = previewFile;
  window.downloadFile = downloadFile;
  window.downloadCurrentFile = downloadCurrentFile;
  window.openFilePreviewModal = openFilePreviewModal;
  window.closeFilePreviewModal = closeFilePreviewModal;
  window.openStatusModal = openStatusModal;
  window.closeStatusModal = closeStatusModal;
  window.openFeedbackModal = openFeedbackModal;
  window.closeFeedbackModal = closeFeedbackModal;
  window.editFeedback = editFeedback;
  window.closeEditFeedbackModal = closeEditFeedbackModal;
})();