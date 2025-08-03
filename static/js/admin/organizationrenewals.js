/**
 * Admin Organization Renewals Module
 * Handles file management for admin renewal interface
 * Now unified with the application page approach
 */

// Simple approach - just like the working application page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Renewals page loaded, setting up event listeners...');
  
  // Set up preview button listeners
  setupPreviewButtons();
  
  // Set up status update button listeners  
  setupStatusButtons();
  
  // Set up modal close handlers
  setupModalHandlers();
  
  // Set up feedback form
  setupFeedbackForm();
  
  // Set up modal close events
  setupModalCloseEvents();
  
  // Set up status update form
  setupStatusUpdateForm();
  
  // Set up edit feedback form
  setupEditFeedbackForm();
});

function setupPreviewButtons() {
  const previewButtons = document.querySelectorAll('.admin-preview-btn');
  console.log('Found preview buttons:', previewButtons.length);
  
  previewButtons.forEach((button, index) => {
    console.log(`Preview button ${index}:`, {
      appFileId: button.dataset.appFileId,
      fileName: button.dataset.fileName,
      allDatasets: button.dataset
    });
    
    button.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Preview button clicked!', this.dataset);
      
      const appFileId = this.dataset.appFileId;
      const fileName = this.dataset.fileName || this.dataset.filename || 'Unknown File';
      
      console.log('Calling previewFile with:', { appFileId, fileName });
      previewFile(appFileId, fileName);
    });
  });
}

function setupStatusButtons() {
   const statusButtons = document.querySelectorAll('.btn-update'); 
   console.log('Found status buttons:', statusButtons.length); 
   
   statusButtons.forEach(button => { 
     button.addEventListener('click', function(e) { 
       e.preventDefault(); 
       console.log('Status button clicked!', this.dataset); 
       
       const appFileId = this.dataset.appFileId; 
       const currentStatus = this.dataset.currentStatus; 
       const fileName = this.dataset.fileName || this.dataset.filename || 'Unknown File'; 
       const submissionDate = this.dataset.submissionDate; 
       
       openStatusModal(appFileId, currentStatus, fileName, submissionDate); 
     }); 
   }); 
 }

function setupModalHandlers() {
  // Close modals when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('global-modal')) {
      if (e.target.id === 'filePreviewModal') {
        closeFilePreviewModal();
      } else if (e.target.id === 'statusUpdateModal') {
        closeStatusModal();
      } else if (e.target.id === 'feedbackModal') {
        closeFeedbackModal();
      } else if (e.target.id === 'feedbackDetailModal') {
        closeFeedbackDetailModal();
      }
    }
  });
}

  // Function to set up feedback form submission
  function setupFeedbackForm() {
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const subject = document.getElementById('feedback-subject')?.value || document.getElementById('subject')?.value;
        const message = document.getElementById('feedback-message')?.value || document.getElementById('message')?.value;
        const fileId = document.getElementById('feedback-file-id')?.value;
        
        // Validate form
        if (!subject || !message) {
          alert('Please fill in all required fields.');
          return;
        }
        
        // Show loading modal if DOMUtils is available
        if (window.DOMUtils) {
          DOMUtils.showLoadingModal('Sending feedback...');
        }
        
        // Prepare data for submission
        const formData = new FormData();
        formData.append('subject', subject);
        formData.append('message', message);
        if (fileId) {
          formData.append('file_id', fileId);
        }
        
        // Send the feedback to the server
        fetch('/admin/send-feedback', {
          method: 'POST',
          body: formData
        })
        .then(response => response.json())
        .then(data => {
          // Hide loading modal
          if (window.DOMUtils) {
            DOMUtils.hideLoadingModal();
          }
          
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
          if (window.DOMUtils) {
            DOMUtils.hideLoadingModal();
          }
          alert('Error sending feedback: Network error');
        });
      });
    }
  }

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
      
      // Feedback detail modal
      const feedbackDetailModal = document.getElementById('feedbackDetailModal');
      if (feedbackDetailModal && e.target === feedbackDetailModal) {
        closeFeedbackDetailModal();
      }
    });
  }

  // Function to set up status update form
  function setupStatusUpdateForm() {
    const statusForm = document.getElementById('status-update-form');
    const statusSelect = document.getElementById('status') || document.getElementById('new-status');
    const feedbackField = document.getElementById('feedback-field');
    
    // Add event listener to show/hide feedback field based on status selection
    if (statusSelect) {
      statusSelect.addEventListener('change', function() {
        const selectedStatus = this.value;
        if (selectedStatus === 'Needs Revision' || selectedStatus === 'Rejected') {
          if (feedbackField) {
            feedbackField.style.display = 'block';
            const feedbackTextarea = document.getElementById('status-feedback') || document.getElementById('feedback-message');
            if (feedbackTextarea) {
              feedbackTextarea.setAttribute('required', 'required');
            }
          }
        } else {
          if (feedbackField) {
            feedbackField.style.display = 'none';
            const feedbackTextarea = document.getElementById('status-feedback') || document.getElementById('feedback-message');
            if (feedbackTextarea) {
              feedbackTextarea.removeAttribute('required');
            }
          }
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
        
        // Get form data - handle different field name variations
        const fileId = document.getElementById('file_id')?.value || document.getElementById('status-app-file-id')?.value;
        const status = document.getElementById('status')?.value || document.getElementById('new-status')?.value;
        const feedback = document.getElementById('status-feedback')?.value || document.getElementById('feedback-message')?.value;
        
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
        if (window.DOMUtils) {
          DOMUtils.showLoadingModal('Updating status...');
        }
        
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
        
        // Determine the correct endpoint (try renewal-specific first, then general)
        const endpoints = [
          `/admin/update_renewal_file_status/${fileId}`,
          '/update-file-status'
        ];
        
        // Send the status update to the server using the renewal-specific endpoint
        fetch(`/admin/update_renewal_file_status/${fileId}`, {
          method: 'POST',
          body: JSON.stringify({ 
            status: status, 
            feedback_message: feedback 
          }),
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          credentials: 'same-origin'
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          // Hide loading modal
          if (window.DOMUtils) {
            DOMUtils.hideLoadingModal();
          }
          
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
          if (window.DOMUtils) {
            DOMUtils.hideLoadingModal();
          }
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

// Preview function - exactly like the application page
function previewFile(fileId, fileName) {
  console.log('previewFile called with:', { fileId, fileName });
  
  // Check if FilePreview module is available
  if (window.FilePreview) {
    console.log('Using FilePreview module');
    window.FilePreview.previewFile(fileId, fileName, function(id) {
      return `/admin/get-application-file?file_id=${id}`;
    });
  } else {
    console.error('FilePreview module not available!');
    alert('File preview is not available. Please check if the preview module is loaded.');
  }
}

function closeFilePreviewModal() {
  console.log('Closing file preview modal');
  if (window.FilePreview) {
    window.FilePreview.closePreviewModal();
  } else {
    const modal = document.getElementById('filePreviewModal');
    if (modal) {
      modal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }
}

function downloadCurrentFile() {
  console.log('Download current file');
  const modalDownloadBtn = document.getElementById('modal-download-btn');
  const appFileId = modalDownloadBtn?.getAttribute('data-file-id');
  
  if (appFileId) {
    if (window.FilePreview) {
      window.FilePreview.downloadFile(appFileId);
    } else {
      window.location.href = `/admin/download-application-file?file_id=${appFileId}`;
    }
  }
}

function openStatusModal(appFileId, currentStatus, fileName, submissionDate) {
  console.log('Opening status modal:', { appFileId, currentStatus, fileName, submissionDate });
  
  const statusModal = document.getElementById('statusUpdateModal');
  if (!statusModal) {
    console.error('Status modal not found!');
    return;
  }
  
  // Set form values
  const fileIdInput = document.getElementById('status-app-file-id') || document.getElementById('file_id');
  const statusSelect = document.getElementById('new-status') || document.getElementById('status');
  const fileNameEl = document.getElementById('status-file-name');
  const submissionDateEl = document.getElementById('status-submission-date');
  const currentStatusEl = document.getElementById('status-current-status');
  
  if (fileIdInput) fileIdInput.value = appFileId;
  if (statusSelect) statusSelect.value = currentStatus;
  if (fileNameEl) fileNameEl.textContent = fileName;
  if (submissionDateEl) submissionDateEl.textContent = submissionDate;
  if (currentStatusEl) currentStatusEl.textContent = currentStatus;
  
  statusModal.classList.add('show');
  document.body.classList.add('modal-open');
}

function closeStatusModal() {
  const statusModal = document.getElementById('statusUpdateModal');
  if (statusModal) {
    statusModal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

function openFeedbackModal(fileId, fileName) {
  const feedbackModal = document.getElementById('feedbackModal');
  if (feedbackModal) {
    feedbackModal.classList.add('show');
    document.body.classList.add('modal-open');
  }
}

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
    if (window.DOMUtils) {
      DOMUtils.showLoadingModal('Loading feedback details...');
    }
    
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
        if (window.DOMUtils) {
          DOMUtils.hideLoadingModal();
        }
        
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
        if (window.DOMUtils) {
          DOMUtils.hideLoadingModal();
        }
        
        console.error('Error fetching feedback details:', error);
        if (window.DOMUtils) {
          DOMUtils.showNotification('Error loading feedback details. Please try again.', 'error');
        } else {
          alert('Error loading feedback details. Please try again.');
        }
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
        if (window.DOMUtils) {
          DOMUtils.showLoadingModal('Updating feedback...');
        }
        
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
          if (window.DOMUtils) {
            DOMUtils.hideLoadingModal();
          }
          
          if (data.success) {
            // Close modal
            closeEditFeedbackModal();
            
            // Update the specific feedback card instead of reloading the page
            updateFeedbackCard(feedbackId, subject, message);
            
            // Show success notification
            if (window.DOMUtils) {
              DOMUtils.showNotification('Feedback updated successfully', 'success');
            } else {
              alert('Feedback updated successfully');
            }
          } else {
            // Re-enable submit button on error
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = 'Update Feedback';
            }
            if (window.DOMUtils) {
              DOMUtils.showNotification('Error: ' + data.message, 'error');
            } else {
              alert('Error: ' + data.message);
            }
          }
        })
        .catch(error => {
          // Hide loading modal
          if (window.DOMUtils) {
            DOMUtils.hideLoadingModal();
          }
          
          // Re-enable submit button on error
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Update Feedback';
          }
          if (window.DOMUtils) {
            DOMUtils.showNotification('Error updating feedback: Network error', 'error');
          } else {
            alert('Error updating feedback: Network error');
          }
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

  // Feedback tab functionality
  function showTab(tabId) {
    const tabs = document.querySelectorAll('.feedback-tab');
    const contents = document.querySelectorAll('.feedback-tab-content');

    tabs.forEach(tab => tab.classList.remove('active'));
    contents.forEach(content => content.classList.remove('active'));

    const targetTab = document.querySelector(`.feedback-tab[onclick="showTab('${tabId}')"]`);
    const targetContent = document.getElementById(`${tabId}-tab`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetContent) targetContent.classList.add('active');
  }

  // Function to open feedback detail modal
  function openFeedbackDetail(type, feedbackId) {
    const feedbackDetailModal = document.getElementById('feedbackDetailModal');
    if (!feedbackDetailModal) return;
    
    // Show loading if DOMUtils is available
    if (window.DOMUtils) {
      DOMUtils.showLoadingModal('Loading feedback details...');
    }
    
    // Fetch feedback details from the server
    fetch(`/admin/get_feedback_details/${feedbackId}`)
        .then(response => response.json())
        .then(data => {
          if (window.DOMUtils) {
            DOMUtils.hideLoadingModal();
          }
          
          if (data.success) {
            const feedback = data.feedback;
            
            // Update modal content
            const elements = {
              title: document.getElementById('feedback-detail-title'),
              badge: document.getElementById('feedback-detail-badge'),
              date: document.getElementById('feedback-detail-date'),
              file: document.getElementById('feedback-detail-file'),
              subject: document.getElementById('feedback-detail-subject'),
              message: document.getElementById('feedback-detail-message')
            };
            
            if (elements.title) elements.title.textContent = feedback.title;
            if (elements.badge) {
              elements.badge.textContent = type === 'sent' ? 'Sent' : 'Received';
              elements.badge.className = `feedback-badge ${type === 'sent' ? 'sent' : 'received'}`;
            }
            if (elements.date) elements.date.textContent = new Date(feedback.created_date).toLocaleString();
            if (elements.file) elements.file.textContent = feedback.file_name;
            if (elements.subject) elements.subject.textContent = feedback.title;
            if (elements.message) elements.message.textContent = feedback.message;
            
            feedbackDetailModal.classList.add('show');
            document.body.classList.add('modal-open');
          } else {
            alert('Error fetching feedback details: ' + data.message);
          }
        })
        .catch(error => {
          if (window.DOMUtils) {
            DOMUtils.hideLoadingModal();
          }
          console.error('Error:', error);
          alert('An error occurred while fetching feedback details.');
        });
  }

function closeFeedbackDetailModal() {
  const feedbackDetailModal = document.getElementById('feedbackDetailModal');
  if (feedbackDetailModal) {
    feedbackDetailModal.classList.remove('show');
    document.body.classList.remove('modal-open');
  }
}

// Feedback tab functionality
function showTab(tabId) {
  console.log('Showing tab:', tabId);
  const tabs = document.querySelectorAll('.feedback-tab');
  const contents = document.querySelectorAll('.feedback-tab-content');

  tabs.forEach(tab => tab.classList.remove('active'));
  contents.forEach(content => content.classList.remove('active'));

  const targetTab = document.querySelector(`.feedback-tab[onclick="showTab('${tabId}')"]`);
  const targetContent = document.getElementById(`${tabId}-tab`);
  
  if (targetTab) targetTab.classList.add('active');
  if (targetContent) targetContent.classList.add('active');
}

// Function to open feedback detail modal
function openFeedbackDetail(type, feedbackId) {
  console.log('Opening feedback detail:', { type, feedbackId });
  // Implementation would go here based on your backend
}

// Expose functions globally
window.previewFile = previewFile;
window.closeFilePreviewModal = closeFilePreviewModal;
window.downloadCurrentFile = downloadCurrentFile;
window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.openFeedbackModal = openFeedbackModal;
window.closeFeedbackModal = closeFeedbackModal;
window.closeFeedbackDetailModal = closeFeedbackDetailModal;
window.showTab = showTab;
window.openFeedbackDetail = openFeedbackDetail;

console.log('Renewals JS loaded and functions exposed to window');