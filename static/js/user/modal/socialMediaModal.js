// Current platform being edited
let currentPlatform = '';

function showSocialMediaModal() {
    const socialMediaModal = document.getElementById('socialMediaModal');
    if (socialMediaModal) {
        socialMediaModal.classList.add('show');
    }
    
    // Load existing social media links
    loadExistingSocialMediaLinks();
}

function loadExistingSocialMediaLinks() {
    // Get organization ID from the page
    const orgId = document.getElementById('organization-id').value;
    
    // Fetch existing social media links
    fetch(`/organization/get_social_media_by_organization_id?organization_id=${orgId}`)
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
                                <i class="fab fa-${link.platform} me-2"></i>
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
        platformLabel.innerHTML = `<i class="fab fa-${platform} me-2"></i>${capitalizedPlatform} URL`;
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
    
    // Save to database
    fetch('/organization/save_social_media', {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json',
         },
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
                        <i class="fab fa-${currentPlatform} me-2"></i>
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
    editingLinkId = linkId;
    const linkSection = document.getElementById(linkId);
    if (!linkSection) return;

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
        linkSection.innerHTML = originalLinkContent[linkId]; // Restore original content
        delete originalLinkContent[linkId]; // Clean up stored content
    }
    editingLinkId = '';
    resetModalState();
}

function saveEditSocialMediaLink(buttonElement) {
    const linkId = buttonElement.dataset.linkId;
    const editUrlInput = document.getElementById(`edit-platform-url-${linkId}`);
    if (!editUrlInput || !editUrlInput.value.trim()) {
        alert('Please enter a valid URL');
        return;
    }
    
    const newUrl = editUrlInput.value.trim();
    
    // Basic URL validation
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
        alert('Please enter a valid URL starting with http:// or https://');
        return;
    }
    
    // Get organization ID from the page
    const orgId = document.getElementById('organization-id').value;
    const platform = linkId.replace('-link', '');
    
    // Update in database
    fetch('/organization/update_social_media', {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json',
         },
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
    
    // Fetch the updated organization data
    fetch(`/organization/get_organization_header?organization_id=${orgId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to refresh organization header');
            }
            return response.json();
        })
        .then(data => {
            // Update the social media section in the organization header
            const orgSocialSection = document.querySelector('.org-social');
            
            if (data.social_media && data.social_media.length > 0) {
                // Create HTML for social media links
                let socialHtml = '<strong>Social Media:</strong><br>';
                data.social_media.forEach(sm => {
                    socialHtml += `${sm.platform}: ${sm.link}<br>`;
                });
                
                // If section exists, update it, otherwise create it
                if (orgSocialSection) {
                    orgSocialSection.innerHTML = socialHtml;
                } else {
                    // Create new section if it doesn't exist
                    const newSocialSection = document.createElement('p');
                    newSocialSection.className = 'org-social';
                    newSocialSection.innerHTML = socialHtml;
                    
                    // Find where to insert it (before the buttons div)
                    const buttonsDiv = document.querySelector('.organization-header .mt-3');
                    if (buttonsDiv) {
                        buttonsDiv.parentNode.insertBefore(newSocialSection, buttonsDiv);
                    }
                }
            } else if (orgSocialSection) {
                // Remove the section if no social media links
                orgSocialSection.remove();
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
    
    // Delete from database
    fetch('/organization/delete_social_media', {
         method: 'POST',
         headers: {
             'Content-Type': 'application/json',
         },
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