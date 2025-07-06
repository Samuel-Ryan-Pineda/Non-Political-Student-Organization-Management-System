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
    
    // Show the first tab by default
    showTab('sent');
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
    
    // Set up reply button
    setupReplyButton();
    
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
  function setupReplyButton() {
    const replyButton = document.getElementById('reply-button');
    if (replyButton) {
      replyButton.addEventListener('click', function() {
        // Get feedback ID from the button's data attribute
        const feedbackId = this.dataset.feedbackId;
        
        // In a real application, you would send this data to the server
        console.log('Reply to feedback ID:', feedbackId);
        
        // Show success message
        alert('Reply functionality would be implemented here.');
        
        // Close modal
        closeFeedbackDetailModal();
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
    if (statusForm) {
      statusForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const fileId = document.getElementById('file_id').value;
        const status = document.getElementById('status').value;
        
        // Show loading modal
        DOMUtils.showLoadingModal('Updating status...');
        
        // Prepare data for submission
        const formData = new FormData();
        formData.append('file_id', fileId);
        formData.append('status', status);
        
        // Send the status update to the server
        fetch('/update-file-status', {
          // Adding Content-Type header to ensure proper parsing
          method: 'POST',
          body: formData
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
            // Show error message
            alert('Error: ' + data.message);
          }
        })
        .catch(error => {
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

  // Function to show tab content
  function showTab(tabId) {
    // Hide all tab content
    document.querySelectorAll('.feedback-tab-content').forEach(function(tab) {
      tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.feedback-tab').forEach(function(tab) {
      tab.classList.remove('active');
    });
    
    // Show the selected tab content
    const tabContent = document.getElementById(tabId + '-tab');
    if (tabContent) {
      tabContent.classList.add('active');
    }
    
    // Add active class to the clicked tab
    document.querySelectorAll('.feedback-tab').forEach(function(tab) {
      if (tab.textContent.toLowerCase().includes(tabId)) {
        tab.classList.add('active');
      }
    });
  }

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

  // Function to open the feedback detail modal
  function openFeedbackDetail(feedbackId, type) {
    const feedbackDetailModal = document.getElementById('feedbackDetailModal');
    if (!feedbackDetailModal) return;
    
    // In a real application, you would fetch the feedback details from the server
    // For now, we'll use sample data
    let feedbackData;
    
    if (type === 'sent') {
      feedbackData = {
        subject: 'Sample Sent Feedback',
        message: 'This is a sample feedback message that was sent to the organization.',
        date: '2023-01-15',
        reply: 'This is a sample reply from the organization.',
        hasReply: true
      };
    } else {
      feedbackData = {
        subject: 'Sample Received Feedback',
        message: 'This is a sample feedback message that was received from the organization.',
        date: '2023-01-10',
        reply: '',
        hasReply: false
      };
    }
    
    // Update the modal content
    const subjectElement = feedbackDetailModal.querySelector('.feedback-subject');
    const messageElement = feedbackDetailModal.querySelector('.feedback-message');
    const dateElement = feedbackDetailModal.querySelector('.feedback-date');
    const replyElement = feedbackDetailModal.querySelector('.feedback-reply');
    const replyButton = document.getElementById('reply-button');
    
    if (subjectElement) subjectElement.textContent = feedbackData.subject;
    if (messageElement) messageElement.textContent = feedbackData.message;
    if (dateElement) dateElement.textContent = feedbackData.date;
    
    // Handle reply section
    if (replyElement) {
      if (feedbackData.hasReply) {
        replyElement.textContent = feedbackData.reply;
        replyElement.parentElement.style.display = 'block';
      } else {
        replyElement.parentElement.style.display = 'none';
      }
    }
    
    // Handle reply button
    if (replyButton) {
      if (type === 'received' && !feedbackData.hasReply) {
        replyButton.style.display = 'block';
        replyButton.dataset.feedbackId = feedbackId;
      } else {
        replyButton.style.display = 'none';
      }
    }
    
    // Show the modal
    feedbackDetailModal.classList.add('show');
    document.body.classList.add('modal-open');
  }

  // Function to close the feedback detail modal
  function closeFeedbackDetailModal() {
    const feedbackDetailModal = document.getElementById('feedbackDetailModal');
    if (feedbackDetailModal) {
      feedbackDetailModal.classList.remove('show');
      document.body.classList.remove('modal-open');
    }
  }

  // Expose public functions
  window.showTab = showTab;
  window.previewFile = previewFile;
  window.downloadFile = downloadFile;
  window.downloadCurrentFile = downloadCurrentFile;
  window.openFilePreviewModal = openFilePreviewModal;
  window.closeFilePreviewModal = closeFilePreviewModal;
  window.openStatusModal = openStatusModal;
  window.closeStatusModal = closeStatusModal;
  window.openFeedbackModal = openFeedbackModal;
  window.closeFeedbackModal = closeFeedbackModal;
  window.openFeedbackDetail = openFeedbackDetail;
  window.closeFeedbackDetailModal = closeFeedbackDetailModal;
})();