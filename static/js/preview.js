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

// Helper function to create modal content
function createModalContent(fileType, modalContentClass, content) {
  return `
    <div class="${modalContentClass}">
      <div class="preview-header d-flex justify-content-between align-items-center p-3 bg-light border-bottom">
        <h5 class="m-0">${fileType}</h5>
        ${content.headerButtons || '<button type="button" class="btn-close" aria-label="Close"></button>'}
      </div>
      <div class="preview-body p-0 ${content.bodyClass || ''}">
        ${content.body}
      </div>
    </div>
  `;
}

// Helper function to create message content
function createMessageContent(icon, title, message, buttons) {
  return {
    bodyClass: 'd-flex flex-column align-items-center justify-content-center text-center p-4',
    body: `
      <div class="mb-4">
        <i class="fas ${icon}" style="font-size: 4rem;"></i>
      </div>
      <h4 class="mb-3">${title}</h4>
      <p class="mb-4">${message}</p>
      ${buttons}
    `
  };
}

// Helper function to add close button event listener
function addCloseButtonListener(modal) {
  const closeButton = modal.querySelector('.btn-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modal.classList.remove('show');
      // Remove the modal from DOM completely after animation completes
      setTimeout(() => {
        if (document.getElementById(modal.id)) {
          document.getElementById(modal.id).remove();
        }
      }, PREVIEW_MODAL.ANIMATION_DELAY_MS);
    });
  }
}

function previewFile(fileType) {
  // Find the card for this file type
  const cards = DOM.getAll('.document-card');
  let fileId = null;
  
  cards.forEach(card => {
    const cardTitle = card.querySelector('.fw-semibold').textContent.trim();
    if (cardTitle === fileType) {
      const statusBadge = card.querySelector('.status-badge');
      fileId = statusBadge.dataset.fileId;
    }
  });
  
  if (!fileId) {
    alert('No file uploaded yet');
    return;
  }
  
  // Show loading indicator
  showLoadingModal('Loading file preview...');
  
  // Check if sidebar is visible (not mobile view or not collapsed)
  const isSidebarVisible = window.innerWidth > 768 || 
                          !document.querySelector('.custom-sidebar')?.classList.contains('mobile-active');
  
  // Create preview modal
  const previewModal = document.createElement('div');
  previewModal.className = 'global-modal';
  previewModal.id = 'previewModal';
  
  // Adjust modal content class based on sidebar visibility
  const modalContentClass = isSidebarVisible ? 'modal-content p-0 preview-modal-content' : 
                                            'modal-content p-0 preview-modal-content ml-0';
  
  // Add timestamp to prevent caching issues
  const timestamp = new Date().getTime();
  const previewUrl = `/get-application-file/${fileId}?t=${timestamp}`;
  
  // First, check the file type by making a HEAD request
  fetch(previewUrl, { method: 'HEAD' })
    .then(response => {
      const contentType = response.headers.get('Content-Type');
      const isWordDocument = contentType && 
        PREVIEW_MODAL.CONTENT_TYPES.WORD.some(type => contentType.includes(type));
      
      if (isWordDocument) {
        // For Word documents, show a message and provide download option
        const content = createMessageContent(
          PREVIEW_MODAL.ICONS.WORD,
          'Word Document Preview',
          'Word documents cannot be previewed directly in the browser. You can download the file to view it.',
          `<a href="${previewUrl}&download=true" class="btn btn-primary" download>
            <i class="fas fa-download me-2"></i>Download Document
          </a>`
        );
        
        previewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
        document.body.appendChild(previewModal);
        
        // Hide loading modal and show preview modal
        hideLoadingModal();
        previewModal.classList.add('show');
        
        // Add event listener to close button
        addCloseButtonListener(previewModal);
      } else {
        // For PDFs and other previewable files, use iframe
        const headerButtons = `
          <div>
            <a href="${previewUrl}&download=true" class="btn btn-sm btn-outline-primary me-2" download>
              <i class="fas fa-download"></i> Download
            </a>
            <button type="button" class="btn-close" aria-label="Close"></button>
          </div>
        `;
        
        const content = {
          headerButtons,
          body: `<iframe id="previewFrame" class="preview-iframe" title="File Preview" width="100%" height="100%"></iframe>`
        };
        
        previewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
        document.body.appendChild(previewModal);
        
        // Add event listener to close button
        addCloseButtonListener(previewModal);
        
        // Set up the iframe
        const previewFrame = document.getElementById('previewFrame');
        
        // Handle iframe load event
        previewFrame.onload = function() {
          // Hide loading modal and show preview modal
          hideLoadingModal();
          previewModal.classList.add('show');
        };
        
        // Handle iframe error
        previewFrame.onerror = function() {
          hideLoadingModal();
          
          const content = createMessageContent(
            PREVIEW_MODAL.ICONS.ERROR,
            'Preview Error',
            'There was an error loading the file preview. The file may be corrupted or in an unsupported format.',
            `<a href="${previewUrl}&download=true" class="btn btn-primary" download>
              <i class="fas fa-download me-2"></i>Download File
            </a>`
          );
          
          previewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
          previewModal.classList.add('show');
          
          // Re-add event listener to close button
          addCloseButtonListener(previewModal);
        };
        
        // Set iframe source to load the file
        previewFrame.src = previewUrl;
        
        // Set a timeout in case the iframe fails to trigger onload/onerror
        setTimeout(() => {
          if (document.getElementById('loadingModal')) {
            hideLoadingModal();
            
            if (!previewModal.classList.contains('show')) {
              const content = createMessageContent(
                PREVIEW_MODAL.ICONS.TIMEOUT,
                'Preview Timeout',
                'The file preview is taking too long to load. You can try again or download the file.',
                `<div class="d-flex gap-3">
                  <button class="btn btn-outline-secondary" onclick="previewFile('${fileType}')">
                    <i class="fas fa-redo me-2"></i>Try Again
                  </button>
                  <a href="${previewUrl}&download=true" class="btn btn-primary" download>
                    <i class="fas fa-download me-2"></i>Download File
                  </a>
                </div>`
              );
              
              previewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
              previewModal.classList.add('show');
              
              // Re-add event listener to close button
              addCloseButtonListener(previewModal);
            }
          }
        }, PREVIEW_MODAL.TIMEOUT_MS);
      }
    })
    .catch(error => {
      // Handle fetch error
      hideLoadingModal();
      
      const content = createMessageContent(
        PREVIEW_MODAL.ICONS.WARNING,
        'Connection Error',
        'There was an error connecting to the server. Please check your internet connection and try again.',
        `<button class="btn btn-primary" onclick="previewFile('${fileType}')">
          <i class="fas fa-redo me-2"></i>Try Again
        </button>`
      );
      
      previewModal.innerHTML = createModalContent(fileType, modalContentClass, content);
      previewModal.classList.add('show');
      
      // Add event listener to close button
      addCloseButtonListener(previewModal);
    });
}