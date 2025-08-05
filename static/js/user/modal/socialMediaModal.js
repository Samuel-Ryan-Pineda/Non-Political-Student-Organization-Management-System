// Current platform being edited
let currentPlatform = '';

function showSocialMediaModal() {
    const socialMediaModal = document.getElementById('socialMediaModal');
    if (socialMediaModal) {
        socialMediaModal.classList.add('show');
    }
    
    document.body.classList.add('modal-open'); // Add this line
    
    // Load existing social media links
    loadExistingSocialMediaLinks();
}

function loadExistingSocialMediaLinks() {
    // Get organization ID from the page
    const orgId = document.getElementById('organization-id').value;
    
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
    
    // Fetch existing social media links
    fetch(`/organization/get_social_media_by_organization_id?organization_id=${orgId}`, {
      headers: headers,
      credentials: 'same-origin'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load social media links');
            }
            return response.json();
        })
        .then(responseData => {
            const existingLinks = document.getElementById('existing-social-links');
            
            if (existingLinks) {
                // Clear existing content
                existingLinks.innerHTML = '';
                
                // Ensure we have an array (handle case where response is object or empty)
                const socialMediaLinks = Array.isArray(responseData.social_media) ? responseData.social_media : [];
                
                // Add each link to the display area
                socialMediaLinks.forEach(link => {
                    const inputId = `${link.platform}-link`;
                    
                    const linkSection = document.createElement('div');
                    linkSection.id = inputId; // Add this line to set the ID
                    linkSection.className = 'mb-3 p-3 border rounded bg-white';
                    linkSection.innerHTML = `
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <div>
                                <i class="fab fa-${link.platform === 'messenger' ? 'facebook-messenger' : link.platform} me-2"></i>
                                <span class="fw-semibold">${link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}</span>
                            </div>
                            <button class="btn text-primary" style="font-size: 0.75rem; background: none; border: none;" onclick="showEditSocialMediaForm('${inputId}')">
                                Edit
                            </button>
                        </div>
                        <div class="d-flex align-items-center">
                            <a href="${link.link}" target="_blank" class="text-truncate" style="max-width: 200px;">${link.link}</a>
                        </div>
                    `;
                    existingLinks.appendChild(linkSection);
                });
            }
        })
        .catch(error => {
            console.error('Error loading social media links:', error);
        });
}


function hideSocialMediaModal() {
    const socialMediaModal = document.getElementById('socialMediaModal');
    if (socialMediaModal) {
        socialMediaModal.classList.remove('show');
    }
    
    document.body.classList.remove('modal-open'); // Add this line
    
    // If there's an active edit form, cancel it first
    if (editingLinkId) {
        const previousLinkSection = document.getElementById(editingLinkId);
        if (previousLinkSection && originalLinkContent[editingLinkId]) {
            // Restore original content
            previousLinkSection.innerHTML = originalLinkContent[editingLinkId];
            previousLinkSection.classList.remove('section-highlighted');
            delete originalLinkContent[editingLinkId];
        }
        editingLinkId = '';
    }
    
    // Reset all UI elements
    resetModalState();
}

function resetModalState() {
    // Hide social media options if visible
    const options = document.getElementById('social-media-options');
    if (options) {
        options.style.display = 'none';
    }
    
    // Hide form if visible
    const form = document.getElementById('social-media-form');
    if (form) {
        form.style.display = 'none';
    }
    
    // Show add button
    const addButton = document.getElementById('add-social-media-btn');
    if (addButton) {
        addButton.style.display = 'block';
    }
    
    // Reset form fields
    const urlInput = document.getElementById('platform-url');
    if (urlInput) {
        urlInput.value = '';
    }
    
    // Reset current platform
    currentPlatform = '';
}

function showSocialMediaOptions() {
    // Show platform selection options
    const options = document.getElementById('social-media-options');
    if (options) {
        options.style.display = 'block';
    }
    
    // Hide the add button while showing options
    const addButton = document.getElementById('add-social-media-btn');
    if (addButton) {
        addButton.style.display = 'none';
    }
}

function addSocialLink(platform) {
    // Hide options after selection
    const options = document.getElementById('social-media-options');
    if (options) {
        options.style.display = 'none';
    }
    
    // If there's an active edit form, cancel it first
    if (editingLinkId) {
        const previousLinkSection = document.getElementById(editingLinkId);
        if (previousLinkSection && originalLinkContent[editingLinkId]) {
            // Restore original content
            previousLinkSection.innerHTML = originalLinkContent[editingLinkId];
            delete originalLinkContent[editingLinkId];
        }
        editingLinkId = '';
    }
    
    // Remove highlight from any existing sections
    document.querySelectorAll('#existing-social-links > div').forEach(section => {
        section.classList.remove('section-highlighted');
    });
    
    // Check if this platform already exists
    const existingLink = document.getElementById(`${platform}-link`);
    if (existingLink) {
        alert(`You already added a ${platform} link`);
        resetModalState();
        return;
    }
    
    // Set current platform being edited
    currentPlatform = platform;
    
    // Update form label to show which platform is being added
    const platformLabel = document.getElementById('platform-label');
    if (platformLabel) {
        const capitalizedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
        platformLabel.innerHTML = `<i class="fab fa-${platform === 'messenger' ? 'facebook-messenger' : platform} me-2"></i>${capitalizedPlatform} URL`;
    }
    
    // Show the form
    const form = document.getElementById('social-media-form');
    if (form) {
        form.style.display = 'block';
    }
}

function cancelSocialMediaForm() {
    resetModalState();
}

// Global variable to store currently editing link
let editingLinkId = '';

function saveSocialMediaLink() {
    // Get URL value
    const urlInput = document.getElementById('platform-url');
    if (!urlInput || !urlInput.value.trim()) {
        alert('Please enter a valid URL');
        return;
    }
    
    const url = urlInput.value.trim();
    
    // Basic URL validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }
    
    // Get organization ID from the page
    const orgId = document.getElementById('organization-id').value;
    
    // Get CSRF token from meta tag or input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        alert('Failed to save social media link: CSRF token not found');
        return;
    }
    
    // Save to database
    fetch('/organization/save_social_media', {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json',
             'X-CSRFToken': csrfToken,
             'X-Requested-With': 'XMLHttpRequest'
         },
         credentials: 'same-origin', // Include cookies for CSRF token
         body: JSON.stringify({
             organization_id: orgId,
             platform: currentPlatform,
             link: url
         })
     })
     .then(response => {
         if (!response.ok) {
             throw new Error('Failed to save social media link');
         }
         return response.json(); // Assuming a JSON response, even if empty
     })
     .then(() => {
        // Create and add the link to the display area
        const existingLinks = document.getElementById('existing-social-links');
        if (existingLinks) {
            const inputId = `${currentPlatform}-link`;
            
            const linkSection = document.createElement('div');
            linkSection.id = inputId; // Add ID to the section
            linkSection.className = 'mb-3 p-3 border rounded bg-white';
            linkSection.innerHTML = `
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div>
                        <i class="fab fa-${currentPlatform === 'messenger' ? 'facebook-messenger' : currentPlatform} me-2"></i>
                        <span class="fw-semibold">${currentPlatform.charAt(0).toUpperCase() + currentPlatform.slice(1)}</span>
                    </div>
                    <button class="btn text-primary" style="font-size: 0.75rem; background: none; border: none;" onclick="showEditSocialMediaForm('${inputId}')">
                        Edit
                    </button>
                </div>
                <div class="d-flex align-items-center">
                    <a href="${url}" target="_blank" class="text-truncate" style="max-width: 200px;">${url}</a>
                </div>
            `;
            existingLinks.appendChild(linkSection);
        }
        
        // Refresh the organization header to show the updated social media links
        refreshOrganizationHeader();
        
        // Reset the form and show the add button again
        resetModalState();
     })
     .catch(error => {
         console.error('Error saving social media link:', error);
         alert('Failed to save social media link');
     });
}


let originalLinkContent = {}; // Store original content for each link

function showEditSocialMediaForm(linkId) {
    // If there's already an active edit form for another link, cancel it first
    if (editingLinkId && editingLinkId !== linkId) {
        const previousLinkSection = document.getElementById(editingLinkId);
        if (previousLinkSection && originalLinkContent[editingLinkId]) {
            // Restore original content
            previousLinkSection.innerHTML = originalLinkContent[editingLinkId];
            previousLinkSection.classList.remove('section-highlighted');
            delete originalLinkContent[editingLinkId];
        }
    }
    
    editingLinkId = linkId;
    const linkSection = document.getElementById(linkId);
    if (!linkSection) return;
    
    // Add highlight to the section being edited
    linkSection.classList.add('section-highlighted');
    
    // Remove highlight from other sections
    document.querySelectorAll('#existing-social-links > div').forEach(section => {
        if (section.id !== linkId) {
            section.classList.remove('section-highlighted');
        }
    });

    // Store original content before replacing
    originalLinkContent[linkId] = linkSection.innerHTML;

    // Get current URL and platform
    const currentUrl = linkSection.querySelector('a').href;
    const platform = linkId.replace('-link', '');

    // Construct the inline edit form HTML
    linkSection.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
            <label class="form-label mb-0" style="font-size: 0.75rem;">
                <i class="fab fa-${platform} me-2"></i>${platform.charAt(0).toUpperCase() + platform.slice(1)} URL
            </label>
            <div>
                <button class="btn btn-success me-2" style="font-size: 0.75rem;" onclick="saveEditSocialMediaLink(this)" data-link-id="${linkId}">Save</button>
                <button class="btn btn-secondary" style="font-size: 0.75rem;" onclick="cancelEditSocialMediaLink(this)" data-link-id="${linkId}">Cancel</button>
            </div>
        </div>
        <input type="url" id="edit-platform-url-${linkId}" class="form-control" style="font-size: 0.75rem;" placeholder="Enter URL" value="${currentUrl}">
    `;

    // Hide other forms/options
    document.getElementById('social-media-options').style.display = 'none';
    document.getElementById('social-media-form').style.display = 'none';

}

function cancelEditSocialMediaLink(buttonElement) {
    const linkId = buttonElement.dataset.linkId;
    const linkSection = document.getElementById(linkId);
    if (linkSection && originalLinkContent[linkId]) {
        // Remove highlight
        linkSection.classList.remove('section-highlighted');
        
        linkSection.innerHTML = originalLinkContent[linkId]; // Restore original content
        delete originalLinkContent[linkId]; // Clean up stored content
    }
    editingLinkId = '';
    resetModalState();
}

function saveEditSocialMediaLink(buttonElement) {
    const linkId = buttonElement.dataset.linkId;
    const linkSection = document.getElementById(linkId);
    const editUrlInput = document.getElementById(`edit-platform-url-${linkId}`);
    if (!editUrlInput || !editUrlInput.value.trim()) {
        alert('Please enter a valid URL');
        return;
    }
    
    // Remove highlight
    if (linkSection) {
        linkSection.classList.remove('section-highlighted');
    }
    
    // Reset the editing link ID
    editingLinkId = '';
    
    const newUrl = editUrlInput.value.trim();
    
    // Basic URL validation
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }
    
    // Get organization ID from the page
    const orgId = document.getElementById('organization-id').value;
    const platform = linkId.replace('-link', '');
    
    // Get CSRF token from meta tag or input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        alert('Failed to update social media link: CSRF token not found');
        return;
    }
    
    // Update in database
    fetch('/organization/update_social_media', {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json',
             'X-CSRFToken': csrfToken,
             'X-Requested-With': 'XMLHttpRequest'
         },
         credentials: 'same-origin', // Include cookies for CSRF token
         body: JSON.stringify({
             organization_id: orgId,
             platform: platform,
             link: newUrl
         })
     })
     .then(response => {
         if (!response.ok) {
             throw new Error('Failed to update social media link');
         }
         return response.json(); // Assuming a JSON response, even if empty
     })
     .then(() => {
        // Update the link in UI
        const linkSection = document.getElementById(linkId);
        if (linkSection) {
            // Restore original content and update the link
            linkSection.innerHTML = originalLinkContent[linkId];
            const linkElement = linkSection.querySelector('a');
            if (linkElement) {
                linkElement.href = newUrl;
                linkElement.textContent = newUrl;
            }
            delete originalLinkContent[linkId]; // Clean up stored content
        }
        
        // Refresh the organization header to show the updated social media links
        refreshOrganizationHeader();
        
        // Hide edit form and reset modal state
        resetModalState();
     })
     .catch(error => {
         console.error('Error updating social media link:', error);
         alert('Failed to update social media link');
     });
}


// Function to refresh the organization header section with updated social media links
function refreshOrganizationHeader() {
    // Get organization ID from the page
    const orgId = document.getElementById('organization-id').value;
    
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
    
    // Fetch the updated organization data
    fetch(`/organization/get_social_media_by_organization_id?organization_id=${orgId}`, {
      headers: headers,
      credentials: 'same-origin'
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to refresh organization header');
            }
            return response.json();
        })
        .then(responseData => {
            // Update the social media section in the organization header
            const socialMediaContainer = document.querySelector('.org-social .d-flex');
            if (socialMediaContainer) {
                // Clear existing social media icons
                socialMediaContainer.innerHTML = '';
                
                // Ensure we have an array (handle case where response is object or empty)
                const socialMediaLinks = Array.isArray(responseData.social_media) ? responseData.social_media : [];
                
                // Add each social media icon to the header
                socialMediaLinks.forEach(sm => {
                    const iconElement = document.createElement('a');
                    iconElement.href = sm.link;
                    iconElement.target = '_blank';
                    iconElement.title = sm.platform;
                    
                    let iconClass = 'fas fa-link';
                    if (sm.platform.toLowerCase() === 'facebook') {
                        iconClass = 'fab fa-facebook';
                    } else if (sm.platform.toLowerCase() === 'twitter') {
                        iconClass = 'fab fa-twitter';
                    } else if (sm.platform.toLowerCase() === 'instagram') {
                        iconClass = 'fab fa-instagram';
                    } else if (sm.platform.toLowerCase() === 'messenger') {
                        iconClass = 'fab fa-facebook-messenger';
                    }
                    
                    iconElement.innerHTML = `<i class="${iconClass}" style="font-size: 1.5rem; color: #fff;"></i>`;
                    socialMediaContainer.appendChild(iconElement);
                });
            }
        })
        .catch(error => {
            console.error('Error refreshing organization header:', error);
        });
}

function removeSocialLink(linkId) {
    if (!confirm('Are you sure you want to remove this social media link?')) {
        return;
    }
    
    // Get platform from linkId (format is 'platform-link')
    const platform = linkId.replace('-link', '');
    
    // Get organization ID from the page
    const orgId = document.getElementById('organization-id').value;
    
    // Get CSRF token from meta tag or input
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content || 
                     document.querySelector('[name="csrf_token"]')?.value;
    
    if (!csrfToken) {
        console.error('CSRF token not found');
        alert('Failed to delete social media link: CSRF token not found');
        return;
    }
    
    // Delete from database
    fetch('/organization/delete_social_media', {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json',
             'X-CSRFToken': csrfToken,
             'X-Requested-With': 'XMLHttpRequest'
         },
         credentials: 'same-origin', // Include cookies for CSRF token
         body: JSON.stringify({
             organization_id: orgId,
             platform: platform
         })
     })
     .then(response => {
         if (!response.ok) {
             throw new Error('Failed to delete social media link');
         }
         return response.json(); // Assuming a JSON response, even if empty
     })
     .then(() => {
        // Remove from UI
        const linkSection = document.getElementById(linkId);
        if (linkSection) {
            linkSection.remove();
        }
        
        // Refresh the organization header to show the updated social media links
        refreshOrganizationHeader();
     })
     .catch(error => {
         console.error('Error deleting social media link:', error);
         alert('Failed to delete social media link');
     });
}