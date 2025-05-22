document.addEventListener('DOMContentLoaded', () => {
    // API Keys for ImageRouter with rotation capability
    const API_KEYS = [
        "Paste_Your_keys: https://ir.myqa.cc/api-keys"
    ];
    
    // Current API key index and failed key tracking
    let currentKeyIndex = loadFromLocalStorage('currentKeyIndex') || 0;
    let failedKeys = loadFromLocalStorage('failedKeys') || {};
    
    // DOM Elements - Main UI
    const promptInput = document.getElementById('prompt');
    const negativePromptInput = document.getElementById('negative-prompt');
    const modelSelect = document.getElementById('model');
    const qualitySelect = document.getElementById('quality');
    const generateBtn = document.getElementById('generate-btn');
    
    // DOM Elements - Display Sections
    const welcomeMessage = document.getElementById('welcome-message');
    const loadingElement = document.getElementById('loading');
    const errorElement = document.getElementById('error-message');
    const imageContainer = document.getElementById('image-container');
    const singleImageWrapper = document.getElementById('single-image-wrapper');
    const multiImageGrid = document.getElementById('multi-image-grid');
    const generatedImage = document.getElementById('generated-image');
    
    // DOM Elements - Image Info
    const usedPromptDisplay = document.getElementById('used-prompt');
    const usedModelDisplay = document.getElementById('used-model');
    const generationTimeDisplay = document.getElementById('generation-time');
    
    // DOM Elements - Buttons & Toggles
    const downloadBtn = document.getElementById('download-btn');
    const shareBtn = document.getElementById('share-btn');
    const favoriteBtn = document.getElementById('favorite-btn');
    const backToGridBtn = document.getElementById('back-to-grid-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const advancedToggle = document.getElementById('advanced-toggle');
    const advancedPanel = document.getElementById('advanced-panel');
    const historyToggle = document.getElementById('history-toggle');
    const historyList = document.getElementById('history-list');
    const historyItems = document.getElementById('history-items');
    const favoritesToggle = document.getElementById('favorites-toggle');
    const favoritesList = document.getElementById('favorites-list');
    const favoritesItems = document.getElementById('favorites-items');
    
    // DOM Elements - Image Options
    const imageCountRadios = document.querySelectorAll('input[name="image-count"]');
    
    // DOM Elements - Image Editing
    const editModeToggle = document.getElementById('edit-mode-toggle');
    const imageEditOptions = document.getElementById('image-edit-options');
    const uploadArea = document.getElementById('upload-area');
    const imageUpload = document.getElementById('image-upload');
    const maskUploadArea = document.getElementById('mask-upload-area');
    const maskUpload = document.getElementById('mask-upload');
    const uploadedImagesPreview = document.getElementById('uploaded-images-preview');
    const imageThumbnails = document.getElementById('image-thumbnails');
    const clearUploadsBtn = document.getElementById('clear-uploads');
    
    // State variables
    let generationHistory = loadFromLocalStorage('generationHistory') || [];
    let favorites = loadFromLocalStorage('favorites') || [];
    let isDarkMode = loadFromLocalStorage('darkMode') || false;
    let currentImageData = null;
    let currentImages = [];
    let selectedImage = 0;
    let isEditMode = false;
    let uploadedImages = [];
    let uploadedMask = null;
    
    // Initialize UI
    initUI();
    
    // Add event listeners
    generateBtn.addEventListener('click', function(e) {
        generateImage();
        
        // Close sidebar in mobile view when Generate/Edit button is clicked
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            
            // Remove active classes to close sidebar
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    downloadBtn.addEventListener('click', downloadCurrentImage);
    shareBtn.addEventListener('click', shareImage);
    favoriteBtn.addEventListener('click', toggleFavorite);
    backToGridBtn.addEventListener('click', backToGridView);
    themeToggle.addEventListener('click', toggleDarkMode);
    advancedToggle.addEventListener('click', () => togglePanel(advancedPanel));
    historyToggle.addEventListener('click', () => {
        togglePanel(historyList);
        renderHistoryItems();
    });
    favoritesToggle.addEventListener('click', () => {
        togglePanel(favoritesList);
        renderFavoriteItems();
    });
    editModeToggle.addEventListener('change', toggleEditMode);
    imageUpload.addEventListener('change', handleImageUpload);
    maskUpload.addEventListener('change', handleMaskUpload);
    clearUploadsBtn.addEventListener('click', clearUploads);
    
    // Fix select dropdowns on mobile
    function setupMobileSelectMenus() {
        // Fix for select dropdowns in mobile view
        const selectElements = document.querySelectorAll('select');
        
        selectElements.forEach(select => {
            // Ensure dropdowns work properly on mobile
            select.addEventListener('focus', function() {
                // Apply mobile-specific styles when dropdown is focused
                if (window.innerWidth <= 768) {
                    this.classList.add('select-active');
                }
            });
            
            select.addEventListener('blur', function() {
                this.classList.remove('select-active');
            });
            
            // Handle change event to ensure UI updates properly
            select.addEventListener('change', function() {
                // Force blur to close dropdown after selection on mobile
                if (window.innerWidth <= 768) {
                    this.blur();
                }
            });
        });
    }
    
    // Initialize UI elements and apply saved settings
    function initUI() {
        // Apply dark mode if saved
        if (isDarkMode) {
            document.body.classList.add('dark-theme');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
        
        // Setup mobile select menus
        setupMobileSelectMenus();
        
        // Load history and favorites if available
        if (generationHistory.length > 0) {
            updateHistoryDisplay();
        }
        
        if (favorites.length > 0) {
            updateFavoritesDisplay();
        }
        
        // Initialize edit mode if saved
        isEditMode = loadFromLocalStorage('isEditMode') || false;
        editModeToggle.checked = isEditMode;
        updateEditModeUI();
        
        // Setup drag and drop for image upload
        setupDragAndDrop();
        
        // Setup mobile navigation and sidebar
        setupMobileUI();
        
        // Fix for edit mode toggle button
        const toggleSwitchContainer = document.getElementById('toggle-switch-container');
        const toggleSlider = document.getElementById('toggle-slider');
        const editModeLabel = document.querySelector('.edit-mode-label');
        
        // Make the toggle switch and slider work properly
        if (toggleSwitchContainer) {
            toggleSwitchContainer.addEventListener('click', function(e) {
                // Prevent the event from reaching the label
                e.stopPropagation();
                
                // Toggle the checkbox state
                editModeToggle.checked = !editModeToggle.checked;
                toggleEditMode();
            });
        }
        
        if (toggleSlider) {
            toggleSlider.addEventListener('click', function(e) {
                // Prevent the event from reaching the container or label
                e.stopPropagation();
                
                // Toggle the checkbox state
                editModeToggle.checked = !editModeToggle.checked;
                toggleEditMode();
            });
        }
        
        // Make the "Edit Mode" label clickable
        if (editModeLabel) {
            editModeLabel.addEventListener('click', function(e) {
                // Only toggle if clicking directly on the label text (not on the tooltip)
                if (!e.target.classList.contains('tooltip')) {
                    e.preventDefault();
                    editModeToggle.checked = !editModeToggle.checked;
                    toggleEditMode();
                }
            });
        }
    }
    
    // Get the next available API key
    function getNextApiKey() {
        // Mark current key as failed for today
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        failedKeys[today] = failedKeys[today] || [];
        
        // Add current key to failed keys if not already there
        if (!failedKeys[today].includes(currentKeyIndex)) {
            failedKeys[today].push(currentKeyIndex);
        }
        
        // Find the next key that isn't failed today
        let startIndex = currentKeyIndex;
        let nextIndex = (currentKeyIndex + 1) % API_KEYS.length;
        
        while (nextIndex !== startIndex) {
            if (!failedKeys[today].includes(nextIndex)) {
                // Found a key that hasn't failed today
                currentKeyIndex = nextIndex;
                saveToLocalStorage('currentKeyIndex', currentKeyIndex);
                saveToLocalStorage('failedKeys', failedKeys);
                return API_KEYS[currentKeyIndex];
            }
            nextIndex = (nextIndex + 1) % API_KEYS.length;
        }
        
        // If all keys have failed today, reset to the first key
        return API_KEYS[currentKeyIndex]; // Just use the current key as a fallback
    }
    
    // Reset failed keys at the start of a new day
    function resetFailedKeysIfNewDay() {
        const today = new Date().toISOString().split('T')[0];
        const lastCheckDate = loadFromLocalStorage('lastCheckDate') || '';
        
        if (today !== lastCheckDate) {
            // It's a new day, reset the failed keys
            failedKeys = {};
            saveToLocalStorage('failedKeys', failedKeys);
            saveToLocalStorage('lastCheckDate', today);
        }
    }
    
    // Call reset check on startup
    resetFailedKeysIfNewDay();

    // Generate image(s) using the API
    async function generateImage() {
        // Get values from form elements
        const prompt = promptInput.value.trim();
        const negativePrompt = negativePromptInput ? negativePromptInput.value.trim() : '';
        const model = modelSelect.value;
        const quality = qualitySelect.value;
        const startTime = new Date();
        
        // Validate prompt
        if (!prompt) {
            showError('Please enter a prompt to generate or edit an image.');
            return;
        }
        
        // If we're in edit mode, validate that images are uploaded
        if (isEditMode && uploadedImages.length === 0) {
            showError('Please upload at least one image to edit.');
            return;
        }
        
        // Show loading indicator and hide other elements
        welcomeMessage.classList.add('hidden');
        loadingElement.classList.remove('hidden');
        errorElement.classList.add('hidden');
        imageContainer.classList.add('hidden');
        
        try {
            let allImagesData = [];
            
            if (isEditMode) {
                // Image editing flow
                allImagesData = await editImages(prompt, model, quality);
            } else {
                // Regular image generation flow
                // Get number of images to generate
                const imageCount = parseInt(getSelectedValue(imageCountRadios));
                console.log('Selected image count:', imageCount);
                
                // Make API calls for the requested number of images
                // Some APIs don't support 'n' parameter properly, so we'll make separate calls
                const apiCalls = [];
                
                // Define the API endpoint URL for image generation
                const apiUrl = 'https://ir-api.myqa.cc/v1/openai/images/generations';
                
                for (let i = 0; i < imageCount; i++) {
                    // Prepare request payload - request one image at a time
                    const requestData = {
                        prompt: prompt,
                        model: model,
                        quality: quality,
                        n: 1 // Always request 1 image per call
                    };
                    
                    // Add negative prompt if provided
                    if (negativePrompt) {
                        requestData.negative_prompt = negativePrompt;
                    }
                    
                    // Create a function that retries with a new API key if needed
                    const makeApiCallWithRetry = async () => {
                        // Get the current API key (or a new one if the current one failed)
                        const apiKey = API_KEYS[currentKeyIndex];
                        
                        // Request options
                        const options = {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(requestData)
                        };
                        
                        try {
                            const response = await fetch(apiUrl, options);
                            const data = await response.json();
                            
                            // Check for API limit errors
                            if (data.error && (
                                data.error.message.includes('limit') || 
                                data.error.message.includes('quota') ||
                                data.error.message.includes('exceeded')
                            )) {
                                console.log(`API key ${currentKeyIndex} has reached its limit. Trying next key...`);
                                const nextKey = getNextApiKey();
                                
                                // If we've tried all keys and they're all at the limit
                                if (nextKey === apiKey) {
                                    throw new Error('All API keys have reached their daily limits. Please try again tomorrow.');
                                }
                                
                                // Retry with the new key
                                return makeApiCallWithRetry();
                            }
                            
                            // Check for other errors
                            if (data.error) {
                                throw new Error(data.error.message || 'API error occurred');
                            }
                            
                            // Process successful response
                            if (data.data) {
                                // Extract the image data, ensure it's an array
                                const imagesData = Array.isArray(data.data) ? data.data : [data.data];
                                // Add to our collection
                                if (imagesData.length > 0) {
                                    return imagesData[0]; // Return the first (and likely only) image
                                }
                            }
                            
                            throw new Error(`Failed to generate image ${i+1}`);
                        } catch (error) {
                            // If this is a "daily limit" error and we've already tried to rotate keys
                            // or any other error occurs, propagate it up
                            throw error;
                        }
                    };
                    
                    // Add this call (with potential retries) to our array of promises
                    apiCalls.push(makeApiCallWithRetry());
                }
                
                // Wait for all API calls to complete
                const results = await Promise.allSettled(apiCalls);
                
                // Process results
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        allImagesData.push(result.value);
                    } else {
                        console.error(`Failed to generate image ${index+1}:`, result.reason);
                    }
                });
            }
            
            // Hide loading indicator
            loadingElement.classList.add('hidden');
            
            // Handle results
            if (allImagesData.length > 0) {
                console.log(`Successfully processed ${allImagesData.length} images`);
                
                // Store all generated images
                currentImages = allImagesData;
                
                // Calculate generation time
                const endTime = new Date();
                const generationTimeInSeconds = ((endTime - startTime) / 1000).toFixed(1);
                
                // Update image info
                usedPromptDisplay.textContent = prompt;
                usedModelDisplay.textContent = getModelDisplayName(model);
                generationTimeDisplay.textContent = `${generationTimeInSeconds}s`;
                
                // Display images based on count
                if (allImagesData.length === 1) {
                    displaySingleImage(allImagesData[0]);
                } else {
                    displayMultipleImages(allImagesData);
                }
                
                // Add to history
                addToHistory({
                    id: Date.now(),
                    prompt: prompt,
                    negativePrompt: negativePrompt,
                    model: model,
                    timestamp: new Date().toISOString(),
                    imageData: allImagesData,
                    isEdited: isEditMode,
                    isFavorite: false
                });
                
                // Show the image container
                imageContainer.classList.remove('hidden');
                
                // Reset favorite button state
                updateFavoriteButton(isFavorited(prompt, allImagesData[0]));
            } else {
                showError('Failed to process any images. Please try again.');
            }
        } catch (error) {
            loadingElement.classList.add('hidden');
            showError(`Error: ${error.message}`);
        }
    }
    
    // Display a single image
    function displaySingleImage(imageData) {
        // Set current image data for download/share operations
        currentImageData = imageData;
        
        // Show "Back to Grid" button only if we have multiple images
        if (currentImages.length > 1) {
            backToGridBtn.classList.remove('hidden');
        } else {
            backToGridBtn.classList.add('hidden');
        }
        
        // Hide multi-image grid and show single image wrapper
        multiImageGrid.classList.add('hidden');
        singleImageWrapper.classList.remove('hidden');
        
        // Update image display
        if (imageData.b64_json) {
            generatedImage.src = `data:image/png;base64,${imageData.b64_json}`;
        } else if (imageData.url) {
            generatedImage.src = imageData.url;
        }
    }
    
    // Go back to grid view from a single image
    function backToGridView() {
        if (currentImages.length <= 1) return;
        
        // Hide back button and single image
        backToGridBtn.classList.add('hidden');
        singleImageWrapper.classList.add('hidden');
        
        // Show multi image grid
        displayMultipleImages(currentImages);
    }
    
    // Display multiple images in a grid
    function displayMultipleImages(imagesData) {
        // Clear existing images
        multiImageGrid.innerHTML = '';
        
        // Show the multi-image grid and hide single image
        multiImageGrid.classList.remove('hidden');
        singleImageWrapper.classList.add('hidden');
        
        // Create image elements for each image
        imagesData.forEach((imageData, index) => {
            const imageWrapper = document.createElement('div');
            imageWrapper.className = 'grid-image-wrapper';
            
            const image = document.createElement('img');
            image.className = 'grid-image';
            
            if (imageData.b64_json) {
                image.src = `data:image/png;base64,${imageData.b64_json}`;
            } else if (imageData.url) {
                image.src = imageData.url;
            }
            
            // Image actions
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'grid-image-actions';
            
            // Download button
            const downloadButton = document.createElement('button');
            downloadButton.className = 'grid-action-btn';
            downloadButton.innerHTML = '<i class="fas fa-download"></i>';
            downloadButton.title = 'Download Image';
            downloadButton.addEventListener('click', (e) => {
                e.stopPropagation();
                downloadImage(imageData, index);
            });
            
            // Favorite button
            const favoriteButton = document.createElement('button');
            favoriteButton.className = 'grid-action-btn';
            favoriteButton.innerHTML = '<i class="far fa-heart"></i>';
            favoriteButton.title = 'Add to Favorites';
            favoriteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleImageFavorite(imageData, index, favoriteButton);
            });
            
            // If this image is already favorited, update the button
            if (isFavorited(promptInput.value.trim(), imageData)) {
                favoriteButton.innerHTML = '<i class="fas fa-heart"></i>';
                favoriteButton.style.color = 'var(--primary-color)';
            }
            
            actionsDiv.appendChild(downloadButton);
            actionsDiv.appendChild(favoriteButton);
            
            // Add click event to select this image
            imageWrapper.addEventListener('click', () => {
                displaySingleImage(imageData);
                selectedImage = index;
                updateFavoriteButton(isFavorited(promptInput.value.trim(), imageData));
            });
            
            imageWrapper.appendChild(image);
            imageWrapper.appendChild(actionsDiv);
            multiImageGrid.appendChild(imageWrapper);
        });
    }
    
    // Download the currently displayed image
    function downloadCurrentImage() {
        if (currentImages.length === 0) {
            showError('No image to download.');
            return;
        }
        
        downloadImage(currentImages[selectedImage], selectedImage);
    }
    
    // Download a specific image
    function downloadImage(imageData, index) {
        if (!imageData) {
            showError('No image to download.');
            return;
        }
        
        const a = document.createElement('a');
        
        // Check if the image is base64 or URL
        if (imageData.b64_json) {
            a.href = `data:image/png;base64,${imageData.b64_json}`;
        } else if (imageData.url) {
            // For URL images, we might need to use a proxy or fetch the image first
            // For simplicity, we'll just open the URL
            window.open(imageData.url, '_blank');
            return;
        } else {
            showError('Image data not available for download.');
            return;
        }
        
        // Create a filename with prompt preview and image index
        const promptPreview = promptInput.value.trim().substring(0, 20).replace(/[^\w\s]/gi, '');
        a.download = `ai-image-${promptPreview}-${index + 1}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    // Share image (copy link to clipboard or share base64)
    function shareImage() {
        if (currentImages.length === 0) {
            showError('No image to share.');
            return;
        }
        
        const imageData = currentImages[selectedImage];
        
        // If it's a URL, copy to clipboard
        if (imageData.url) {
            navigator.clipboard.writeText(imageData.url)
                .then(() => {
                    alert('Image URL copied to clipboard!');
                })
                .catch(err => {
                    showError('Failed to copy URL: ' + err);
                });
        } else {
            // For base64, we could implement a share service
            // For simplicity, just copy a message
            navigator.clipboard.writeText('I created an amazing AI image with the prompt: ' + promptInput.value)
                .then(() => {
                    alert('Description copied to clipboard!');
                })
                .catch(err => {
                    showError('Failed to copy: ' + err);
                });
        }
    }
    
    // Toggle favorite status for the selected image
    function toggleFavorite() {
        if (currentImages.length === 0) {
            return;
        }
        
        const imageData = currentImages[selectedImage];
        const prompt = promptInput.value.trim();
        
        // Check if this image is already in favorites
        const favoriteIndex = favorites.findIndex(fav => 
            (fav.prompt === prompt && isSameImage(fav.imageData, imageData))
        );
        
        if (favoriteIndex > -1) {
            // Remove from favorites
            favorites.splice(favoriteIndex, 1);
            updateFavoriteButton(false);
        } else {
            // Add to favorites
            favorites.push({
                id: Date.now(),
                prompt: prompt,
                timestamp: new Date().toISOString(),
                imageData: imageData
            });
            updateFavoriteButton(true);
        }
        
        // Save to local storage and update the display
        saveToLocalStorage('favorites', favorites);
        updateFavoritesDisplay();
    }
    
    // Toggle favorite for a specific image in the grid
    function toggleImageFavorite(imageData, index, button) {
        const prompt = promptInput.value.trim();
        
        // Check if this image is already in favorites
        const favoriteIndex = favorites.findIndex(fav => 
            (fav.prompt === prompt && isSameImage(fav.imageData, imageData))
        );
        
        if (favoriteIndex > -1) {
            // Remove from favorites
            favorites.splice(favoriteIndex, 1);
            button.innerHTML = '<i class="far fa-heart"></i>';
            button.style.color = '';
        } else {
            // Add to favorites
            favorites.push({
                id: Date.now(),
                prompt: prompt,
                timestamp: new Date().toISOString(),
                imageData: imageData
            });
            button.innerHTML = '<i class="fas fa-heart"></i>';
            button.style.color = 'var(--primary-color)';
        }
        
        // Save to local storage and update the display
        saveToLocalStorage('favorites', favorites);
        updateFavoritesDisplay();
        
        // If this is the currently selected image, update the main favorite button too
        if (index === selectedImage) {
            updateFavoriteButton(favoriteIndex === -1);
        }
    }
    
    // Check if an image is already in favorites
    function isFavorited(prompt, imageData) {
        return favorites.some(fav => 
            (fav.prompt === prompt && isSameImage(fav.imageData, imageData))
        );
    }
    
    // Compare two image data objects
    function isSameImage(img1, img2) {
        if (img1.b64_json && img2.b64_json) {
            return img1.b64_json === img2.b64_json;
        } else if (img1.url && img2.url) {
            return img1.url === img2.url;
        }
        return false;
    }
    
    // Toggle dark mode
    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('dark-theme', isDarkMode);
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        saveToLocalStorage('darkMode', isDarkMode);
    }
    
    // Toggle panel visibility (advanced options, history, favorites)
    function togglePanel(panel) {
        panel.classList.toggle('hidden');
    }
    
    // Toggle edit mode
    function toggleEditMode() {
        isEditMode = editModeToggle.checked;
        saveToLocalStorage('isEditMode', isEditMode);
        updateEditModeUI();
    }
    
    // Update UI based on edit mode status
    function updateEditModeUI() {
        if (isEditMode) {
            imageEditOptions.classList.remove('hidden');
            document.body.classList.add('edit-mode');
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Edit Image';
            
            // Update model selection to only allow compatible models
            updateModelSelectForEditing();
        } else {
            imageEditOptions.classList.add('hidden');
            document.body.classList.remove('edit-mode');
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Image';
            
            // Reset model selection to show all models
            resetModelSelect();
        }
    }
    
    // Update model select to only show models that support image editing
    function updateModelSelectForEditing() {
        // Currently only Gemini 2.0 supports editing
        const options = Array.from(modelSelect.options);
        options.forEach(option => {
            if (option.value !== 'google/gemini-2.0-flash-exp:free') {
                option.disabled = true;
                option.style.color = 'var(--text-secondary)';
            }
        });
        
        // Set Gemini as the selected model
        modelSelect.value = 'google/gemini-2.0-flash-exp:free';
    }
    
    // Reset model select to show all models
    function resetModelSelect() {
        const options = Array.from(modelSelect.options);
        options.forEach(option => {
            option.disabled = false;
            option.style.color = '';
        });
    }
    
    // Setup drag and drop
    function setupDragAndDrop() {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, preventDefaults, false);
            maskUploadArea.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });
        
        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, highlight, false);
            maskUploadArea.addEventListener(eventName, highlightMask, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, unhighlight, false);
            maskUploadArea.addEventListener(eventName, unhighlightMask, false);
        });
        
        // Handle dropped files
        uploadArea.addEventListener('drop', handleDrop, false);
        maskUploadArea.addEventListener('drop', handleMaskDrop, false);
        
        // Fix for the double file browser dialog issue:
        // Use onclick instead of addEventListener to ensure only one handler exists
        // Using function property instead of method guarantees no double handlers
        uploadArea.onclick = function() {
            imageUpload.click();
        };
        
        maskUploadArea.onclick = function() {
            maskUpload.click();
        };
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        uploadArea.classList.add('highlight');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }
    
    function highlightMask() {
        maskUploadArea.classList.add('highlight');
    }
    
    function unhighlightMask() {
        maskUploadArea.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handleMaskDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            maskUpload.files = files;
            handleMaskUpload();
        }
    }
    
    // Handle file upload from input field
    function handleImageUpload() {
        handleFiles(imageUpload.files);
    }
    
    // Process multiple file uploads
    function handleFiles(files) {
        if (!files.length) return;
        
        // Convert FileList to array and filter for images
        const fileArray = Array.from(files).filter(file => file.type.match('image.*'));
        
        // Limit to 16 images including already uploaded ones
        const remainingSlots = 16 - uploadedImages.length;
        const filesToAdd = fileArray.slice(0, remainingSlots);
        
        if (filesToAdd.length === 0) return;
        
        // Preview and add to uploaded images array
        filesToAdd.forEach(file => {
            previewImage(file);
            uploadedImages.push(file);
        });
        
        // Show the uploaded images container
        uploadedImagesPreview.classList.remove('hidden');
        
        // If we hit the limit, disable upload
        if (uploadedImages.length >= 16) {
            imageUpload.disabled = true;
            uploadArea.classList.add('upload-disabled');
            uploadArea.querySelector('p').textContent = 'Maximum 16 images reached';
        }
    }
    
    // Handle mask upload
    function handleMaskUpload() {
        if (!maskUpload.files.length) return;
        
        const file = maskUpload.files[0];
        if (!file.type.match('image.*')) return;
        
        uploadedMask = file;
        
        // Preview mask
        const reader = new FileReader();
        reader.onload = (e) => {
            // Remove any existing mask preview
            const existingPreview = maskUploadArea.querySelector('.mask-preview');
            if (existingPreview) existingPreview.remove();
            
            // Create preview element
            const preview = document.createElement('div');
            preview.className = 'mask-preview';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const removeBtn = document.createElement('div');
            removeBtn.className = 'remove-thumbnail';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', (evt) => {
                evt.stopPropagation();
                removeMask();
            });
            
            preview.appendChild(img);
            preview.appendChild(removeBtn);
            maskUploadArea.appendChild(preview);
            
            // Update mask upload area text
            const textEl = maskUploadArea.querySelector('p');
            textEl.textContent = 'Mask uploaded';
        };
        
        reader.readAsDataURL(file);
    }
    
    // Remove mask
    function removeMask() {
        uploadedMask = null;
        maskUpload.value = null;
        
        // Remove preview
        const maskPreview = maskUploadArea.querySelector('.mask-preview');
        if (maskPreview) maskPreview.remove();
        
        // Reset text
        const textEl = maskUploadArea.querySelector('p');
        textEl.textContent = 'Drag & drop mask or click to browse';
    }
    
    // Create image preview
    function previewImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('div');
            preview.className = 'image-thumbnail';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const removeBtn = document.createElement('div');
            removeBtn.className = 'remove-thumbnail';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', () => removeImage(file, preview));
            
            preview.appendChild(img);
            preview.appendChild(removeBtn);
            imageThumbnails.appendChild(preview);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Remove image from uploads
    function removeImage(file, preview) {
        // Remove from array
        const index = uploadedImages.indexOf(file);
        if (index > -1) {
            uploadedImages.splice(index, 1);
        }
        
        // Remove preview
        preview.remove();
        
        // Enable upload if we're under the limit now
        if (uploadedImages.length < 16) {
            imageUpload.disabled = false;
            uploadArea.classList.remove('upload-disabled');
            uploadArea.querySelector('p').textContent = 'Drag & drop images or click to browse';
        }
        
        // Hide container if no images
        if (uploadedImages.length === 0) {
            uploadedImagesPreview.classList.add('hidden');
        }
    }
    
    // Clear all uploads
    function clearUploads() {
        uploadedImages = [];
        uploadedMask = null;
        imageUpload.value = null;
        maskUpload.value = null;
        
        // Clear thumbnails
        imageThumbnails.innerHTML = '';
        uploadedImagesPreview.classList.add('hidden');
        
        // Remove mask preview
        const maskPreview = maskUploadArea.querySelector('.mask-preview');
        if (maskPreview) maskPreview.remove();
        
        // Reset mask text
        const maskTextEl = maskUploadArea.querySelector('p');
        maskTextEl.textContent = 'Drag & drop mask or click to browse';
        
        // Enable image upload
        imageUpload.disabled = false;
        uploadArea.classList.remove('upload-disabled');
        uploadArea.querySelector('p').textContent = 'Drag & drop images or click to browse';
    }
    
    // Function to edit images
    async function editImages(prompt, model, quality) {
        // API endpoint for image editing
        const url = 'https://ir-api.myqa.cc/v1/openai/images/edits';
        
        // Create FormData
        const formData = new FormData();
        formData.append('prompt', prompt);
        formData.append('model', model);
        formData.append('quality', quality);
        
        // Add image files
        uploadedImages.forEach(imageFile => {
            formData.append('image[]', imageFile);
        });
        
        // Add mask file if available
        if (uploadedMask) {
            formData.append('mask[]', uploadedMask);
        }
        
        // Function to make API call with retry
        const makeApiCallWithRetry = async () => {
            // Get the current API key
            const apiKey = API_KEYS[currentKeyIndex];
            
            // Request options
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                },
                body: formData
            };
            
            try {
                const response = await fetch(url, options);
                const data = await response.json();
                
                // Check for API limit errors
                if (data.error && (
                    data.error.message.includes('limit') || 
                    data.error.message.includes('quota') ||
                    data.error.message.includes('exceeded')
                )) {
                    console.log(`API key ${currentKeyIndex} has reached its limit. Trying next key...`);
                    const nextKey = getNextApiKey();
                    
                    // If we've tried all keys and they're all at the limit
                    if (nextKey === apiKey) {
                        throw new Error('All API keys have reached their daily limits. Please try again tomorrow.');
                    }
                    
                    // Retry with the new key
                    return makeApiCallWithRetry();
                }
                
                // Check for other errors
                if (data.error) {
                    throw new Error(data.error.message || 'API error occurred during image editing');
                }
                
                // Process successful response
                if (data.data) {
                    // Extract the image data, ensure it's an array
                    const imagesData = Array.isArray(data.data) ? data.data : [data.data];
                    return imagesData;
                }
                
                throw new Error('Failed to edit images');
            } catch (error) {
                throw error;
            }
        };
        
        return makeApiCallWithRetry();
    }
    
    // Add image to history
    function addToHistory(item) {
        // Add to beginning of array (newest first)
        generationHistory.unshift(item);
        
        // Limit history to 20 items
        if (generationHistory.length > 20) {
            generationHistory = generationHistory.slice(0, 20);
        }
        
        // Save to local storage
        saveToLocalStorage('generationHistory', generationHistory);
        
        // Update history display
        updateHistoryDisplay();
    }
    
    // Update history display
    function updateHistoryDisplay() {
        const noHistoryMessage = document.querySelector('.no-history');
        
        if (generationHistory.length > 0) {
            noHistoryMessage.classList.add('hidden');
        } else {
            noHistoryMessage.classList.remove('hidden');
        }
    }
    
    // Update favorites display
    function updateFavoritesDisplay() {
        const noFavoritesMessage = document.querySelector('.no-favorites');
        
        if (favorites.length > 0) {
            noFavoritesMessage.classList.add('hidden');
        } else {
            noFavoritesMessage.classList.remove('hidden');
        }
    }
    
    // Render favorite items in the favorites panel
    function renderFavoriteItems() {
        favoritesItems.innerHTML = '';
        
        if (favorites.length === 0) {
            return;
        }
        
        favorites.forEach(item => {
            const favoriteItem = document.createElement('div');
            favoriteItem.className = 'favorite-item';
            
            // Create thumbnail
            const thumbnail = document.createElement('img');
            thumbnail.className = 'favorite-item-img';
            
            if (item.imageData.b64_json) {
                thumbnail.src = `data:image/png;base64,${item.imageData.b64_json}`;
            } else if (item.imageData.url) {
                thumbnail.src = item.imageData.url;
            }
            
            // Create info section
            const info = document.createElement('div');
            info.className = 'favorite-item-info';
            
            const promptText = document.createElement('div');
            promptText.className = 'favorite-item-prompt';
            promptText.textContent = item.prompt;
            
            const dateText = document.createElement('div');
            dateText.className = 'favorite-item-date';
            
            // Format date
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            dateText.textContent = formattedDate;
            
            info.appendChild(promptText);
            info.appendChild(dateText);
            
            // Create remove button
            const removeBtn = document.createElement('div');
            removeBtn.className = 'favorite-remove';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFavorite(item.id);
            });
            
            favoriteItem.appendChild(thumbnail);
            favoriteItem.appendChild(info);
            favoriteItem.appendChild(removeBtn);
            
            // Add click event to load this favorite
            favoriteItem.addEventListener('click', () => {
                loadFavorite(item);
                
                // Close sidebar in mobile view when a favorite is clicked
                if (window.innerWidth <= 768) {
                    const sidebar = document.querySelector('.sidebar');
                    const sidebarOverlay = document.getElementById('sidebar-overlay');
                    
                    // Remove active classes to close sidebar
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
            
            favoritesItems.appendChild(favoriteItem);
        });
    }
    
    // Remove an item from favorites
    function removeFavorite(id) {
        favorites = favorites.filter(item => item.id !== id);
        saveToLocalStorage('favorites', favorites);
        renderFavoriteItems();
        updateFavoritesDisplay();
        
        // Update the favorite button state if this was the current image
        if (currentImageData) {
            updateFavoriteButton(isFavorited(promptInput.value.trim(), currentImageData));
        }
    }
    
    // Load a favorite image
    function loadFavorite(item) {
        // Fill form with the saved values
        promptInput.value = item.prompt;
        
        // Set to single image mode
        setSelectedValue(imageCountRadios, '1');
        
        // Display the image
        currentImages = [item.imageData];
        selectedImage = 0;
        displaySingleImage(item.imageData);
        
        // Update UI
        welcomeMessage.classList.add('hidden');
        loadingElement.classList.add('hidden');
        errorElement.classList.add('hidden');
        imageContainer.classList.remove('hidden');
        favoritesList.classList.add('hidden');
        
        // Update favorite button
        updateFavoriteButton(true);
    }
    
    // Render history items in the history panel
    function renderHistoryItems() {
        historyItems.innerHTML = '';
        
        // Show "No history" message if history is empty
        const noHistoryMessage = document.querySelector('.no-history');
        if (generationHistory.length === 0) {
            noHistoryMessage.classList.remove('hidden');
            return;
        } else {
            noHistoryMessage.classList.add('hidden');
        }
        
        generationHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.setAttribute('data-id', item.id);
            
            // Create thumbnail - use first image if multiple
            const thumbnail = document.createElement('img');
            thumbnail.className = 'history-item-img';
            
            if (item.imageData[0].b64_json) {
                thumbnail.src = `data:image/png;base64,${item.imageData[0].b64_json}`;
            } else if (item.imageData[0].url) {
                thumbnail.src = item.imageData[0].url;
            }
            
            // Create info section
            const info = document.createElement('div');
            info.className = 'history-item-info';
            
            const promptText = document.createElement('div');
            promptText.className = 'history-item-prompt';
            promptText.textContent = item.prompt;
            
            const details = document.createElement('div');
            details.className = 'history-item-details';
            
            // Format date
            const date = new Date(item.timestamp);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Show count of images and if it was an edit
            const imageCountText = item.imageData.length > 1 ? `${item.imageData.length} images • ` : '';
            const editedText = item.isEdited ? 'Edited • ' : '';
            
            details.textContent = `${editedText}${getModelDisplayName(item.model)} • ${imageCountText}${formattedDate}`;
            
            info.appendChild(promptText);
            info.appendChild(details);
            
            // Create remove button
            const removeBtn = document.createElement('div');
            removeBtn.className = 'history-remove';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromHistory(item.id);
            });
            
            historyItem.appendChild(thumbnail);
            historyItem.appendChild(info);
            historyItem.appendChild(removeBtn);
            
            // Add click event to reload this generation
            historyItem.addEventListener('click', () => loadFromHistory(item));
            
            historyItems.appendChild(historyItem);
        });
    }
    
    // Remove an item from history
    function removeFromHistory(id) {
        generationHistory = generationHistory.filter(item => item.id !== id);
        saveToLocalStorage('generationHistory', generationHistory);
        
        // Show "No history" message if history is now empty
        if (generationHistory.length === 0) {
            const noHistoryMessage = document.querySelector('.no-history');
            noHistoryMessage.classList.remove('hidden');
        }
        
        renderHistoryItems();
    }
    
    // Load a generation from history
    function loadFromHistory(item) {
        // Fill form with the saved values
        promptInput.value = item.prompt;
        if (negativePromptInput && item.negativePrompt) {
            negativePromptInput.value = item.negativePrompt;
        }
        modelSelect.value = item.model;
        
        // Set image count based on the number of images
        const count = item.imageData.length.toString();
        if (['1', '2', '4'].includes(count)) {
            setSelectedValue(imageCountRadios, count);
        } else {
            setSelectedValue(imageCountRadios, '1');
        }
        
        // Store all images
        currentImages = item.imageData;
        selectedImage = 0;
        
        // Display images based on count
        if (item.imageData.length === 1) {
            displaySingleImage(item.imageData[0]);
        } else {
            displayMultipleImages(item.imageData);
        }
        
        // Update UI
        welcomeMessage.classList.add('hidden');
        loadingElement.classList.add('hidden');
        errorElement.classList.add('hidden');
        imageContainer.classList.remove('hidden');
        historyList.classList.add('hidden');
        
        // Update favorite button for the first image
        updateFavoriteButton(isFavorited(item.prompt, item.imageData[0]));
        
        // Close sidebar in mobile view when a history item is clicked
        if (window.innerWidth <= 768) {
            const sidebar = document.querySelector('.sidebar');
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            
            // Remove active classes to close sidebar
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    // Update favorite button appearance
    function updateFavoriteButton(isFavorite) {
        favoriteBtn.innerHTML = isFavorite 
            ? '<i class="fas fa-heart"></i>' 
            : '<i class="far fa-heart"></i>';
        
        if (isFavorite) {
            favoriteBtn.classList.add('active');
        } else {
            favoriteBtn.classList.remove('active');
        }
    }
    
    // Get selected value from a set of radio buttons
    function getSelectedValue(radioButtons) {
        for (const radio of radioButtons) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return null;
    }
    
    // Set a specific radio button as selected
    function setSelectedValue(radioButtons, value) {
        for (const radio of radioButtons) {
            if (radio.value === value) {
                radio.checked = true;
                break;
            }
        }
    }
    
    // Get a user-friendly name for the model
    function getModelDisplayName(modelId) {
        const modelMap = {
            'stabilityai/sdxl-turbo:free': 'SDXL Turbo',
            'black-forest-labs/FLUX-1-schnell:free': 'FLUX-1',
            'google/gemini-2.0-flash-exp:free': 'Gemini 2.0'
        };
        
        return modelMap[modelId] || modelId;
    }
    
    // Show error message
    function showError(message) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    // Local storage helpers
    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to local storage:', error);
        }
    }
    
    function loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Failed to load from local storage:', error);
            return null;
        }
    }
    
    // Setup mobile navigation and sidebar
    function setupMobileUI() {
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const sidebarClose = document.getElementById('sidebar-close');
        
        // Mobile navigation buttons
        const navCreate = document.getElementById('nav-create');
        const navHistory = document.getElementById('nav-history');
        const navFavorites = document.getElementById('nav-favorites');
        const navSettings = document.getElementById('nav-settings');
        
        // Toggle sidebar visibility
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
                document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
            });
        }
        
        // Close sidebar when clicking the X button
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Close sidebar when clicking overlay
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Mobile navigation handlers
        if (navCreate) {
            navCreate.addEventListener('click', () => {
                // Open sidebar to create tab
                sidebar.classList.add('active');
                sidebarOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Close any open panels
                historyList.classList.add('hidden');
                favoritesList.classList.add('hidden');
                
                // Highlight current tab
                setActiveNavButton(navCreate);
            });
        }
        
        if (navHistory) {
            navHistory.addEventListener('click', () => {
                // Toggle history panel
                const isHidden = historyList.classList.contains('hidden');
                
                // Close other panels
                favoritesList.classList.add('hidden');
                advancedPanel.classList.add('hidden');
                
                // Show/hide history
                historyList.classList.toggle('hidden');
                
                if (isHidden) {
                    // If showing history, render its items
                    renderHistoryItems();
                    // Highlight current tab
                    setActiveNavButton(navHistory);
                    
                    // If on mobile, also show the sidebar
                    if (window.innerWidth <= 768) {
                        sidebar.classList.add('active');
                        sidebarOverlay.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                }
            });
        }
        
        if (navFavorites) {
            navFavorites.addEventListener('click', () => {
                // Toggle favorites panel
                const isHidden = favoritesList.classList.contains('hidden');
                
                // Close other panels
                historyList.classList.add('hidden');
                advancedPanel.classList.add('hidden');
                
                // Show/hide favorites
                favoritesList.classList.toggle('hidden');
                
                if (isHidden) {
                    // If showing favorites, render its items
                    renderFavoriteItems();
                    // Highlight current tab
                    setActiveNavButton(navFavorites);
                    
                    // If on mobile, also show the sidebar
                    if (window.innerWidth <= 768) {
                        sidebar.classList.add('active');
                        sidebarOverlay.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                }
            });
        }
        
        if (navSettings) {
            navSettings.addEventListener('click', () => {
                // Toggle advanced options panel
                const isHidden = advancedPanel.classList.contains('hidden');
                
                // Close other panels
                historyList.classList.add('hidden');
                favoritesList.classList.add('hidden');
                
                // Show/hide advanced options
                advancedPanel.classList.toggle('hidden');
                
                if (isHidden) {
                    // Highlight current tab
                    setActiveNavButton(navSettings);
                    
                    // If on mobile, also show the sidebar
                    if (window.innerWidth <= 768) {
                        sidebar.classList.add('active');
                        sidebarOverlay.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    }
                }
            });
        }
        
        // Adjust UI when resizing window
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                // On desktop, reset sidebar state
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Set the create button as active by default on mobile
        setActiveNavButton(navCreate);
    }
    
    // Set active mobile navigation button
    function setActiveNavButton(activeButton) {
        const navButtons = document.querySelectorAll('.mobile-nav-btn');
        navButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }
});
