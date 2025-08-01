/**
 * File Preview Module
 * Handles file preview functionality for both user and admin interfaces
 */

window.FilePreview = window.FilePreview || (function() {
  // Constants for preview modal settings
  const PREVIEW_MODAL = {
    TIMEOUT_MS: 30000, // 30 seconds timeout for loading files
    ANIMATION_DELAY_MS: 300, // Animation delay for modal transitions
    ICONS: {
      LOADING: 'fa-spinner fa-spin',
      ERROR: 'fa-exclamation-triangle',
      DOWNLOAD: 'fa-download',
      FILE: 'fa-file-alt'
    },
    CONTENT_TYPES: {
      PDF: 'application/pdf',
      WORD: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      IMAGE: 'image/'
    }
  };

  // Helper functions for modal management
  function createModalContent(content) {
    const modalContent = document.createElement('div');
    modalContent.className = 'preview-modal-content';
    modalContent.innerHTML = content;
    return modalContent;
  }

  function createMessageContent(icon, title, message, showDownloadButton = false, fileId = null) {
    return `
      <div class="preview-message-container">
        <div class="preview-message-icon">
          <i class="fas ${icon} fa-3x"></i>
        </div>
        <div class="preview-message-title">${title}</div>
        <div class="preview-message-text">${message}</div>
        ${showDownloadButton ? `
          <div class="preview-message-actions">
            <button class="btn btn-preview" onclick="FilePreview.downloadFile(${fileId})">
              <i class="fas ${PREVIEW_MODAL.ICONS.DOWNLOAD}"></i> Download File
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function addCloseButtonListener(modalElement) {
    const closeButton = modalElement.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        closePreviewModal();
      });
    }
  }

  function ensureModalInDOM() {
    let previewModal = document.getElementById('previewModal');
    
    if (!previewModal) {
      previewModal = document.createElement('div');
      previewModal.className = 'global-modal';
      previewModal.id = 'previewModal';
      previewModal.setAttribute('aria-labelledby', 'previewModalTitle');
      previewModal.setAttribute('aria-modal', 'true');
      previewModal.setAttribute('role', 'dialog');
      
      document.body.appendChild(previewModal);
    }
    
    return previewModal;
  }

  // Core preview function
  function previewFile(fileId, fileName = 'File', getFileUrl) {
    if (!fileId) {
      console.error('File ID is required for preview');
      return;
    }
    
    // Store current file info for potential download
    const currentFileInfo = {
      id: fileId,
      name: fileName
    };
    
    // Ensure the modal exists in the DOM
    const previewModal = ensureModalInDOM();
    
    // Create modal content with loading indicator
    const modalContent = createModalContent(`
      <div class="preview-header">
        <h3>Preview: ${fileName}</h3>
        <div class="header-buttons">
          <button class="btn btn-preview" onclick="FilePreview.downloadFile(${fileId})">
            <i class="fas ${PREVIEW_MODAL.ICONS.DOWNLOAD}"></i> Download
          </button>
          <button class="close-button" aria-label="Close preview">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="preview-body">
        <div class="preview-loading">
          <i class="fas ${PREVIEW_MODAL.ICONS.LOADING} fa-3x"></i>
          <p>Loading preview...</p>
        </div>
      </div>
    `);
    
    // Add close button listener
    addCloseButtonListener(modalContent);
    
    // Clear previous content and add new content
    previewModal.innerHTML = '';
    previewModal.appendChild(modalContent);
    
    // Show the modal
    previewModal.classList.add('show');
    document.body.classList.add('modal-open');
    
    // Set timeout for loading
    const timeoutId = setTimeout(() => {
      const previewBody = modalContent.querySelector('.preview-body');
      if (previewBody) {
        previewBody.innerHTML = createMessageContent(
          PREVIEW_MODAL.ICONS.ERROR,
          'Preview Timeout',
          'The file preview is taking too long to load. Please try again or download the file instead.',
          true,
          fileId
        );
      }
    }, PREVIEW_MODAL.TIMEOUT_MS);
    
    // Create iframe for file preview
    const iframe = document.createElement('iframe');
    iframe.className = 'preview-iframe';
    iframe.loading = 'lazy'; // Add lazy loading for better performance
    iframe.onload = function() {
      clearTimeout(timeoutId);
      const previewLoading = modalContent.querySelector('.preview-loading');
      if (previewLoading) {
        previewLoading.style.display = 'none';
      }
    };
    
    iframe.onerror = function() {
      clearTimeout(timeoutId);
      const previewBody = modalContent.querySelector('.preview-body');
      if (previewBody) {
        previewBody.innerHTML = createMessageContent(
          PREVIEW_MODAL.ICONS.ERROR,
          'Preview Error',
          'There was an error loading the file preview. Please try again or download the file instead.',
          true,
          fileId
        );
      }
    };
    
    // Special handling for Word documents which can't be previewed directly
    if (fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc')) {
      clearTimeout(timeoutId);
      const previewBody = modalContent.querySelector('.preview-body');
      if (previewBody) {
        previewBody.innerHTML = createMessageContent(
          PREVIEW_MODAL.ICONS.FILE,
          'Microsoft Word Document',
          'Word documents cannot be previewed directly. Please download the file to view it.',
          true,
          fileId
        );
      }
    } else {
      // Set iframe source to file URL
      iframe.src = getFileUrl(fileId);
      
      // Add iframe to modal after loading indicator
      const previewBody = modalContent.querySelector('.preview-body');
      if (previewBody) {
        previewBody.appendChild(iframe);
      }
    }
    
    return currentFileInfo;
  }

  function closePreviewModal() {
    const previewModal = document.getElementById('previewModal');
    if (previewModal) {
      previewModal.classList.remove('show');
      document.body.classList.remove('modal-open');
      
      // Remove modal content after animation completes
      setTimeout(() => {
        previewModal.innerHTML = '';
      }, PREVIEW_MODAL.ANIMATION_DELAY_MS);
    }
  }

  // Public API
  return {
    previewFile: previewFile,
    closePreviewModal: closePreviewModal,
    PREVIEW_MODAL: PREVIEW_MODAL,
    createMessageContent: createMessageContent,
    ensureModalInDOM: ensureModalInDOM,
    downloadFile: function(fileId) {
      // Get CSRF token from meta tag
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                       document.querySelector('[name="csrf_token"]')?.value;
      
      // Determine if we're in admin or user context based on URL
      const isAdminContext = window.location.pathname.includes('/admin/');
      
      // Create a download link with CSRF token
      const downloadLink = document.createElement('a');
      let url;
      
      if (isAdminContext) {
        // Use admin download URL
        url = new URL(`/admin/download-application-file`, window.location.origin);
        url.searchParams.append('file_id', fileId);
      } else {
        // Use user download URL with download=true parameter
        url = new URL(`/organization/get-application-file/${fileId}`, window.location.origin);
        url.searchParams.append('download', 'true');
      }
      
      // Add CSRF token as a query parameter if available
      if (csrfToken) {
        url.searchParams.append('csrf_token', csrfToken);
      }
      
      downloadLink.href = url.toString();
      downloadLink.download = ''; // Let the server determine the filename
      downloadLink.style.display = 'none';
      
      // Add the link to the document and click it
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Remove the link from the document
      document.body.removeChild(downloadLink);
    }
  };
})();