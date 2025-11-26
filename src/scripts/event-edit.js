// Event Edit Script

// Initialize theme
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.remove('dark');
}

// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

// Initialize toast notifications using Toastify
let currentLoadingToast = null;
let cropper = null;
let currentImageFile = null;

const toast = {
  success: (message) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(to right, #10b981, #059669)",
      }
    }).showToast();
  },
  error: (message) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(to right, #ef4444, #dc2626)",
      }
    }).showToast();
  },
  loading: (message) => {
    currentLoadingToast = Toastify({
      text: message,
      duration: -1, // Don't auto-dismiss
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(to right, #3b82f6, #2563eb)",
      }
    });
    currentLoadingToast.showToast();
  },
  dismiss: () => {
    if (currentLoadingToast) {
      currentLoadingToast.hideToast();
      currentLoadingToast = null;
    }
  }
};

// State
let currentStep = 1;
const totalSteps = 4; // Changed from 5 to 4 (removed review step)
let eventData = {
  ticketTypes: []
};
let draftEventId = null;
let uploadedImageUrl = null;
let currentEventStatus = null;
let currentEventDate = null;

// Initialize
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }
  
  setupEventListeners();
  addInitialTicketType();
}

// Setup event listeners
function setupEventListeners() {
  // Tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
      const tabNumber = parseInt(button.dataset.tab);
      switchTab(tabNumber);
    });
  });
  
  // Save button
  document.getElementById('saveChangesBtn').addEventListener('click', () => saveChanges());
  
  // Archive and Delete buttons
  document.getElementById('archiveBtn').addEventListener('click', handleArchiveToggle);
  document.getElementById('deleteBtn').addEventListener('click', handleDelete);
  
  // Actions menu button
  const actionsMenuBtn = document.getElementById('actionsMenuBtn');
  const actionsPopover = document.getElementById('actionsPopover');
  if (actionsMenuBtn && actionsPopover) {
    actionsMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      actionsPopover.classList.toggle('hidden');
    });
    
    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
      if (!actionsMenuBtn.contains(e.target) && !actionsPopover.contains(e.target)) {
        actionsPopover.classList.add('hidden');
      }
    });
  }
  
  // Copy event URL
  const copyEventUrl = document.getElementById('copyEventUrl');
  if (copyEventUrl) {
    copyEventUrl.addEventListener('click', handleCopyEventUrl);
  }
  
  // Add ticket type button
  document.getElementById('addTicketType').addEventListener('click', addTicketType);
  
  // Image upload/URL toggle
  document.getElementById('uploadTab').addEventListener('click', () => toggleImageInput('upload'));
  document.getElementById('urlTab').addEventListener('click', () => toggleImageInput('url'));
  
  // Image file upload
  document.getElementById('imageFile').addEventListener('change', handleImageUpload);
  
  // Image URL preview
  document.getElementById('imageUrl').addEventListener('input', updateImagePreview);
  
  // Crop modal buttons
  document.getElementById('closeCropModal').addEventListener('click', closeCropModal);
  document.getElementById('cancelCrop').addEventListener('click', closeCropModal);
  document.getElementById('applyCrop').addEventListener('click', applyCrop);
}

// Toggle between upload and URL
function toggleImageInput(mode) {
  const uploadTab = document.getElementById('uploadTab');
  const urlTab = document.getElementById('urlTab');
  const uploadSection = document.getElementById('uploadSection');
  const urlSection = document.getElementById('urlSection');
  
  if (mode === 'upload') {
    uploadTab.className = 'px-6 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm transition-all';
    urlTab.className = 'px-6 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium text-sm transition-all';
    uploadSection.classList.remove('hidden');
    urlSection.classList.add('hidden');
    document.getElementById('imageUrl').removeAttribute('required');
  } else {
    urlTab.className = 'px-6 py-2.5 rounded-lg bg-black dark:bg-white text-white dark:text-black font-medium text-sm transition-all';
    uploadTab.className = 'px-6 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium text-sm transition-all';
    urlSection.classList.remove('hidden');
    uploadSection.classList.add('hidden');
    document.getElementById('imageUrl').setAttribute('required', 'required');
  }
}

// Handle image upload
async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file size (10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast.error('Image size must be less than 10MB');
    e.target.value = '';
    return;
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('Please upload an image file');
    e.target.value = '';
    return;
  }
  
  // Store file and show crop modal
  currentImageFile = file;
  showCropModal(file);
}

// Show crop modal
function showCropModal(file) {
  const modal = document.getElementById('cropModal');
  const image = document.getElementById('cropImage');
  
  // Create object URL for the image
  const reader = new FileReader();
  reader.onload = (e) => {
    image.src = e.target.result;
    modal.classList.remove('hidden');
    
    // Initialize cropper
    if (cropper) {
      cropper.destroy();
    }
    
    cropper = new Cropper(image, {
      aspectRatio: 1200 / 630,
      viewMode: 1,
      autoCropArea: 1,
      responsive: true,
      background: false,
      guides: true,
      center: true,
      highlight: true,
      cropBoxResizable: true,
      cropBoxMovable: true,
      toggleDragModeOnDblclick: false,
    });
  };
  reader.readAsDataURL(file);
}

// Close crop modal
function closeCropModal() {
  const modal = document.getElementById('cropModal');
  modal.classList.add('hidden');
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  document.getElementById('imageFile').value = '';
}

// Apply crop and upload
async function applyCrop() {
  if (!cropper) return;
  
  try {
    toast.loading('Processing and uploading image...');
    
    // Get cropped canvas
    const canvas = cropper.getCroppedCanvas({
      width: 1200,
      height: 630,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    });
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      try {
        // Upload to Supabase Storage
        const { data: { user } } = await supabase.auth.getUser();
        const fileExt = currentImageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('events')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: 'image/jpeg'
          });
        
        if (error) {
          console.error('Upload error:', error);
          throw error;
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('events')
          .getPublicUrl(filePath);
        
        uploadedImageUrl = urlData.publicUrl;
        
        // Show preview
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImg');
        img.src = uploadedImageUrl;
        preview.classList.remove('hidden');
        
        // Close modal
        closeCropModal();
        
        toast.dismiss();
        toast.success('Image uploaded successfully!');
        
      } catch (error) {
        console.error('Error uploading image:', error);
        toast.dismiss();
        toast.error(`Failed to upload image: ${error.message || 'Please try again'}`);
      }
    }, 'image/jpeg', 0.95);
    
  } catch (error) {
    console.error('Error cropping image:', error);
    toast.dismiss();
    toast.error('Failed to process image. Please try again.');
  }
}

// Switch between tabs
function switchTab(tabNumber) {
  currentStep = tabNumber;
  
  // Hide all steps
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`step${i}`).classList.add('hidden');
  }
  
  // Show selected step
  document.getElementById(`step${tabNumber}`).classList.remove('hidden');
  
  // Update tab buttons
  document.querySelectorAll('.tab-button').forEach(button => {
    const btnTab = parseInt(button.dataset.tab);
    if (btnTab === tabNumber) {
      button.className = 'tab-button px-6 py-3 font-medium text-sm transition-colors border-b-2 border-black dark:border-white';
    } else {
      button.className = 'tab-button px-6 py-3 font-medium text-sm text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors border-b-2 border-transparent';
    }
  });
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Removed validateCurrentStep - not needed with tabs

// Save step data
function saveStepData() {
  switch (currentStep) {
    case 1:
      eventData.title = document.getElementById('title').value;
      eventData.description = document.getElementById('description').value;
      eventData.category = document.getElementById('category').value;
      break;
    case 2:
      const date = document.getElementById('eventDate').value;
      const time = document.getElementById('eventTime').value;
      if (date && time) {
        eventData.event_date = `${date}T${time}:00`;
      }
      eventData.location = document.getElementById('location').value;
      eventData.address = document.getElementById('address').value;
      break;
    case 3:
      // Use uploaded image URL or provided URL
      eventData.image_url = uploadedImageUrl || document.getElementById('imageUrl').value;
      break;
    case 4:
      // Ticket types are saved in real-time
      break;
  }
}

// Add initial ticket type
function addInitialTicketType() {
  addTicketType();
}

// Add ticket type
function addTicketType() {
  const container = document.getElementById('ticketTypesContainer');
  const index = eventData.ticketTypes.length;
  
  const ticketDiv = document.createElement('div');
  ticketDiv.className = 'glass rounded-xl p-4 border border-neutral-200 dark:border-neutral-800';
  ticketDiv.dataset.index = index;
  
  ticketDiv.innerHTML = `
    <div class="flex items-start justify-between mb-4">
      <h4 class="font-semibold">Ticket Type ${index + 1}</h4>
      ${index > 0 ? `
        <button type="button" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm" onclick="removeTicketType(${index})">
          Remove
        </button>
      ` : ''}
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">Name *</label>
        <input 
          type="text" 
          data-ticket-field="name"
          data-ticket-index="${index}"
          required
          placeholder="e.g., General Admission"
          class="w-full px-4 py-2 rounded-lg glass border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Price ($) *</label>
        <input 
          type="number" 
          data-ticket-field="price"
          data-ticket-index="${index}"
          required
          min="0"
          step="0.01"
          placeholder="0.00"
          class="w-full px-4 py-2 rounded-lg glass border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Quantity *</label>
        <input 
          type="number" 
          data-ticket-field="quantity"
          data-ticket-index="${index}"
          required
          min="1"
          placeholder="100"
          class="w-full px-4 py-2 rounded-lg glass border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm"
        />
      </div>
      <div>
        <label class="block text-sm font-medium mb-2">Description</label>
        <input 
          type="text" 
          data-ticket-field="description"
          data-ticket-index="${index}"
          placeholder="Optional description"
          class="w-full px-4 py-2 rounded-lg glass border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm"
        />
      </div>
    </div>
  `;
  
  container.appendChild(ticketDiv);
  
  // Initialize ticket type object
  eventData.ticketTypes[index] = {
    name: '',
    price: 0,
    quantity: 0,
    description: ''
  };
  
  // Add event listeners for ticket fields
  ticketDiv.querySelectorAll('[data-ticket-field]').forEach(input => {
    input.addEventListener('input', (e) => {
      const field = e.target.dataset.ticketField;
      const idx = parseInt(e.target.dataset.ticketIndex);
      eventData.ticketTypes[idx][field] = e.target.value;
    });
  });
}

// Remove ticket type
window.removeTicketType = function(index) {
  const container = document.getElementById('ticketTypesContainer');
  const ticketDiv = container.querySelector(`[data-index="${index}"]`);
  if (ticketDiv) {
    ticketDiv.remove();
    eventData.ticketTypes.splice(index, 1);
    
    // Reindex remaining tickets
    container.querySelectorAll('[data-index]').forEach((div, newIndex) => {
      div.dataset.index = newIndex;
      div.querySelector('h4').textContent = `Ticket Type ${newIndex + 1}`;
      div.querySelectorAll('[data-ticket-index]').forEach(input => {
        input.dataset.ticketIndex = newIndex;
      });
    });
  }
};

// Update image preview
function updateImagePreview() {
  const url = document.getElementById('imageUrl').value;
  const preview = document.getElementById('imagePreview');
  const img = document.getElementById('previewImg');
  
  if (url) {
    img.src = url;
    preview.classList.remove('hidden');
    img.onerror = () => {
      preview.classList.add('hidden');
    };
  } else {
    preview.classList.add('hidden');
  }
}

// Populate review
function populateReview() {
  const reviewContent = document.getElementById('reviewContent');
  const eventDate = new Date(eventData.event_date);
  
  reviewContent.innerHTML = `
    <div class="flex items-start gap-4">
      <img src="${eventData.image_url}" alt="${eventData.title}" class="w-24 h-24 rounded-lg object-cover" onerror="this.style.display='none'" />
      <div class="flex-1">
        <h4 class="font-semibold text-lg mb-2">${eventData.title}</h4>
        <p class="text-neutral-600 dark:text-neutral-400 text-sm mb-2">${eventData.description}</p>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-800">
      <div>
        <div class="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Date & Time</div>
        <div class="font-medium">${eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
      </div>
      <div>
        <div class="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Location</div>
        <div class="font-medium">${eventData.location}</div>
      </div>
      <div>
        <div class="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Category</div>
        <div class="font-medium capitalize">${eventData.category}</div>
      </div>
      <div>
        <div class="text-xs text-neutral-600 dark:text-neutral-400 mb-1">Ticket Types</div>
        <div class="font-medium">${eventData.ticketTypes.length} type(s)</div>
      </div>
    </div>
    <div class="pt-4 border-t border-neutral-200 dark:border-neutral-800">
      <div class="text-xs text-neutral-600 dark:text-neutral-400 mb-2">Tickets</div>
      <div class="space-y-2">
        ${eventData.ticketTypes.map(ticket => `
          <div class="flex items-center justify-between text-sm">
            <span>${ticket.name}</span>
            <span class="font-medium">$${parseFloat(ticket.price).toFixed(2)} × ${ticket.quantity}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Save changes (for edit mode)
async function saveChanges() {
  try {
    toast.loading('Saving changes...');
    
    // Save current step data
    saveStepData();
    
    // Update event
    const { error: eventError } = await supabase
      .from('events')
      .update({
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        event_date: eventData.event_date || document.getElementById('eventDate').value + 'T' + document.getElementById('eventTime').value + ':00',
        location: document.getElementById('location').value,
        address: document.getElementById('address').value || null,
        image_url: uploadedImageUrl || document.getElementById('imageUrl').value,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);
    
    if (eventError) throw eventError;
    
    // Update category if changed
    const newCategory = document.getElementById('category').value;
    if (newCategory) {
      // Delete old category mapping
      await supabase
        .from('event_category_mappings')
        .delete()
        .eq('event_id', eventId);
      
      // Add new category mapping
      const { data: category } = await supabase
        .from('event_categories')
        .select('id')
        .eq('name', newCategory)
        .single();
      
      if (category) {
        await supabase
          .from('event_category_mappings')
          .insert({
            event_id: eventId,
            category_id: category.id
          });
      }
    }
    
    toast.dismiss();
    toast.success('Changes saved successfully!');
    
  } catch (error) {
    console.error('Error saving changes:', error);
    toast.dismiss();
    toast.error('Failed to save changes. Please try again.');
  }
}

// Save draft (for create mode - keeping for compatibility)
async function saveDraft() {
  // In edit mode, just save changes
  if (eventId) {
    await saveChanges();
    return;
  }
  
  // Validate at least basic info is filled
  if (!document.getElementById('title').value) {
    toast.error('Please enter an event title before saving');
    return;
  }
  
  saveStepData();
  
  // Create a default date (tomorrow at noon) if not set
  let draftDate = eventData.event_date;
  if (!draftDate || draftDate.includes('T@')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    draftDate = tomorrow.toISOString();
  }
  
  // Prepare minimal event data for draft
  const draftData = {
    title: eventData.title || 'Untitled Event',
    description: eventData.description || '',
    event_date: draftDate,
    location: eventData.location || 'TBA',
    image_url: eventData.image_url || uploadedImageUrl || 'https://via.placeholder.com/1200x630',
    category: eventData.category || null,
    ticketTypes: eventData.ticketTypes || []
  };
  
  await createEvent('draft', draftData);
}

// Create event
async function createEvent(forcedStatus = null, customData = null) {
  try {
    toast.loading('Creating event...');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get publish status
    const status = forcedStatus || document.querySelector('input[name="publishStatus"]:checked').value;
    
    // Use custom data for draft or full event data
    const dataToSave = customData || eventData;
    
    // Create event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        organizer_id: user.id,
        title: dataToSave.title,
        description: dataToSave.description,
        event_date: dataToSave.event_date,
        location: dataToSave.location,
        image_url: dataToSave.image_url,
        status: status
      })
      .select()
      .single();
    
    if (eventError) throw eventError;
    
    // Create category mapping (only if category exists)
    if (dataToSave.category) {
      const { data: category } = await supabase
        .from('event_categories')
        .select('id')
        .eq('name', dataToSave.category)
        .single();
      
      if (category) {
        await supabase
          .from('event_category_mappings')
          .insert({
            event_id: event.id,
            category_id: category.id
          });
      }
    }
    
    // Create ticket types (only if they exist)
    if (dataToSave.ticketTypes && dataToSave.ticketTypes.length > 0) {
      const ticketPromises = dataToSave.ticketTypes.map(ticket => 
        supabase
          .from('ticket_types')
          .insert({
            event_id: event.id,
            name: ticket.name,
            description: ticket.description || null,
            price: parseFloat(ticket.price),
            quantity: parseInt(ticket.quantity),
            available: parseInt(ticket.quantity)
          })
      );
      
      await Promise.all(ticketPromises);
    }
    
    toast.dismiss();
    
    // Show success message
    if (forcedStatus === 'draft') {
      toast.success('Event saved as draft successfully!');
    } else {
      toast.success(`Event ${status === 'published' ? 'published' : 'saved'} successfully!`);
    }
    
    // Redirect to events page after a short delay
    setTimeout(() => {
      window.location.href = '/dashboard/organizer/events/';
    }, 1500);
    
  } catch (error) {
    console.error('Error creating event:', error);
    toast.dismiss();
    toast.error('Failed to create event. Please try again.');
  }
}

// Show skeleton loading
function showSkeleton() {
  const skeleton = document.getElementById('loadingSkeleton');
  const form = document.getElementById('eventForm');
  
  if (skeleton) skeleton.classList.remove('hidden');
  if (form) form.classList.add('hidden');
}

// Hide skeleton loading
function hideSkeleton() {
  const skeleton = document.getElementById('loadingSkeleton');
  const form = document.getElementById('eventForm');
  
  if (skeleton) skeleton.classList.add('hidden');
  if (form) form.classList.remove('hidden');
}

// Removed makeStepsClickable - using tabs now

// Custom confirmation modal
function showConfirmModal({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning', requireInput = null, onConfirm, onCancel }) {
  const modal = document.getElementById('confirmModal');
  const backdrop = document.getElementById('confirmModalBackdrop');
  const titleEl = document.getElementById('confirmModalTitle');
  const messageEl = document.getElementById('confirmModalMessage');
  const iconEl = document.getElementById('confirmModalIcon');
  const confirmBtn = document.getElementById('confirmModalConfirm');
  const cancelBtn = document.getElementById('confirmModalCancel');
  const inputContainer = document.getElementById('confirmModalInputContainer');
  const input = document.getElementById('confirmModalInput');
  const inputLabel = document.getElementById('confirmModalInputLabel');
  
  // Set content
  titleEl.textContent = title;
  messageEl.textContent = message;
  confirmBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText;
  
  // Set icon and colors based on type
  if (type === 'danger') {
    iconEl.className = 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-950';
    iconEl.innerHTML = '<svg class="w-6 h-6 text-red-600 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
    confirmBtn.className = 'flex-1 px-6 py-3 rounded-full bg-red-600 dark:bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 transition-colors font-medium';
  } else if (type === 'warning') {
    iconEl.className = 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-yellow-100 dark:bg-yellow-950';
    iconEl.innerHTML = '<svg class="w-6 h-6 text-yellow-600 dark:text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
    confirmBtn.className = 'flex-1 px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium';
  } else {
    iconEl.className = 'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-950';
    iconEl.innerHTML = '<svg class="w-6 h-6 text-blue-600 dark:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
    confirmBtn.className = 'flex-1 px-6 py-3 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-medium';
  }
  
  // Handle input requirement
  if (requireInput) {
    inputContainer.classList.remove('hidden');
    inputLabel.textContent = requireInput;
    input.value = '';
    input.focus();
    
    // Enable/disable confirm button based on input
    const checkInput = () => {
      confirmBtn.disabled = input.value !== requireInput;
      confirmBtn.style.opacity = input.value !== requireInput ? '0.5' : '1';
      confirmBtn.style.cursor = input.value !== requireInput ? 'not-allowed' : 'pointer';
    };
    input.addEventListener('input', checkInput);
    checkInput();
  } else {
    inputContainer.classList.add('hidden');
    confirmBtn.disabled = false;
    confirmBtn.style.opacity = '1';
    confirmBtn.style.cursor = 'pointer';
  }
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Handle confirm
  const handleConfirm = () => {
    if (requireInput && input.value !== requireInput) {
      return;
    }
    modal.classList.add('hidden');
    if (onConfirm) onConfirm();
  };
  
  // Handle cancel
  const handleCancel = () => {
    modal.classList.add('hidden');
    if (onCancel) onCancel();
  };
  
  // Set up event listeners
  confirmBtn.onclick = handleConfirm;
  cancelBtn.onclick = handleCancel;
  backdrop.onclick = handleCancel;
  
  // Handle Enter key
  if (requireInput) {
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && input.value === requireInput) {
        handleConfirm();
      }
    };
  }
}

// Handle archive/reactivate toggle
async function handleArchiveToggle() {
  const isArchived = currentEventStatus === 'archived';
  const newStatus = isArchived ? 'published' : 'archived';
  const actionText = isArchived ? 'reactivate' : 'archive';
  
  showConfirmModal({
    title: `${isArchived ? 'Reactivate' : 'Archive'} Event`,
    message: `Are you sure you want to ${actionText} this event? ${isArchived ? 'It will become visible to the public again.' : 'It will be hidden from the public but not deleted.'}`,
    confirmText: isArchived ? 'Reactivate' : 'Archive',
    type: 'warning',
    onConfirm: async () => {
      try {
        toast.loading(`${isArchived ? 'Reactivating' : 'Archiving'} event...`);
        
        const { error } = await supabase
          .from('events')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', eventId);
        
        if (error) throw error;
        
        currentEventStatus = newStatus;
        updateArchiveButton();
        
        toast.dismiss();
        toast.success(`Event ${isArchived ? 'reactivated' : 'archived'} successfully!`);
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard/organizer/events/';
        }, 1500);
        
      } catch (error) {
        console.error('Error toggling archive status:', error);
        toast.dismiss();
        toast.error(`Failed to ${actionText} event. Please try again.`);
      }
    }
  });
}

// Update archive button based on status
function updateArchiveButton() {
  const archiveBtn = document.getElementById('archiveBtn');
  const archiveBtnText = document.getElementById('archiveBtnText');
  const deleteBtn = document.getElementById('deleteBtn');
  
  if (currentEventStatus === 'archived') {
    archiveBtnText.textContent = 'Reactivate Event';
    archiveBtn.classList.remove('hidden');
  } else if (currentEventStatus === 'published' || currentEventStatus === 'draft') {
    archiveBtnText.textContent = 'Archive Event';
    archiveBtn.classList.remove('hidden');
  }
  
  // Always show delete button
  deleteBtn.classList.remove('hidden');
}

// Handle delete event
async function handleDelete() {
  showConfirmModal({
    title: 'Delete Event',
    message: 'This action cannot be undone. All associated tickets, orders, and data will be permanently removed.',
    confirmText: 'Delete',
    type: 'danger',
    requireInput: 'DELETE',
    onConfirm: async () => {
      try {
        toast.loading('Deleting event...');
        
        // Delete event (cascade will handle related records)
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', eventId);
        
        if (error) throw error;
        
        toast.dismiss();
        toast.success('Event deleted successfully!');
        
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/dashboard/organizer/events/';
        }, 1500);
        
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.dismiss();
        toast.error('Failed to delete event. Please try again.');
      }
    }
  });
}

// Check if event is live
function checkIfLive() {
  if (currentEventStatus !== 'published' || !currentEventDate) {
    return false;
  }
  
  const now = new Date();
  const eventDate = new Date(currentEventDate);
  const eventEndTime = new Date(eventDate.getTime() + (4 * 60 * 60 * 1000)); // Assume 4 hour duration
  
  // Event is live if it's between start time and end time
  return now >= eventDate && now <= eventEndTime;
}

// Update live indicator
function updateLiveIndicator() {
  const liveIndicator = document.getElementById('liveIndicator');
  
  if (checkIfLive()) {
    liveIndicator.classList.remove('hidden');
  } else {
    liveIndicator.classList.add('hidden');
  }
}

// Update live event banner
function updateLiveEventBanner(event) {
  const banner = document.getElementById('liveEventBanner');
  const mainContent = document.getElementById('mainContent');
  const link = document.getElementById('viewLiveEventLink');
  const shareOptions = document.getElementById('shareOptions');
  const openEventPage = document.getElementById('openEventPage');
  
  // Set menu links
  const eventStatsLink = document.getElementById('eventStatsLink');
  const scanTicketsLink = document.getElementById('scanTicketsLink');
  const inviteGuestsLink = document.getElementById('inviteGuestsLink');
  
  if (eventStatsLink) {
    eventStatsLink.href = `/dashboard/organizer/events/analytics/?id=${eventId}`;
  }
  if (scanTicketsLink) {
    scanTicketsLink.href = `/dashboard/organizer/scan/?event=${eventId}`;
  }
  if (inviteGuestsLink) {
    inviteGuestsLink.href = `/dashboard/organizer/events/invite/?id=${eventId}`;
  }
  
  if (currentEventStatus === 'published') {
    // Generate event slug from title and ID
    const slug = event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const eventSlug = `${slug}-${eventId}`;
    const eventUrl = `${window.location.origin}/events/?event=${eventSlug}`;
    
    // Set link href
    link.href = eventUrl;
    if (openEventPage) {
      openEventPage.href = eventUrl;
    }
    
    // Show share options in menu
    if (shareOptions) {
      shareOptions.classList.remove('hidden');
    }
    
    // Show banner and adjust main content padding
    banner.classList.remove('hidden');
    mainContent.style.paddingTop = '5rem'; // Add padding to account for banner
  } else {
    // Hide share options
    if (shareOptions) {
      shareOptions.classList.add('hidden');
    }
    
    // Hide banner and remove padding
    banner.classList.add('hidden');
    mainContent.style.paddingTop = '0';
  }
}

// Handle copy event URL
async function handleCopyEventUrl() {
  try {
    const event = await getCurrentEvent();
    if (!event) return;
    
    const slug = event.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const eventSlug = `${slug}-${eventId}`;
    const eventUrl = `${window.location.origin}/events/?event=${eventSlug}`;
    
    await navigator.clipboard.writeText(eventUrl);
    toast.success('Event URL copied to clipboard!');
    
    // Hide popover after copy
    document.getElementById('actionsPopover').classList.add('hidden');
  } catch (error) {
    console.error('Error copying URL:', error);
    toast.error('Failed to copy URL');
  }
}

// Get current event data
async function getCurrentEvent() {
  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
    
    if (error) throw error;
    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

// Load existing event data
async function loadEventData() {
  try {
    showSkeleton();
    
    const { data: event, error } = await supabase
      .from('events')
      .select(`*, ticket_types (*), event_category_mappings (event_categories (name))`)
      .eq('id', eventId)
      .single();
    
    if (error) throw error;
    
    // Store event status and date
    currentEventStatus = event.status;
    currentEventDate = event.event_date;
    
    // Update UI based on status
    updateArchiveButton();
    updateLiveIndicator();
    updateLiveEventBanner(event);
    
    hideSkeleton();
    
    document.getElementById('title').value = event.title || '';
    document.getElementById('description').value = event.description || '';
    
    // Set category - convert to lowercase to match dropdown values
    const categoryName = event.event_category_mappings?.[0]?.event_categories?.name;
    console.log('Category from DB:', categoryName);
    if (categoryName) {
      const categoryValue = categoryName.toLowerCase();
      console.log('Setting category to:', categoryValue);
      document.getElementById('category').value = categoryValue;
      
      // Double-check it was set
      setTimeout(() => {
        const currentValue = document.getElementById('category').value;
        console.log('Category value after set:', currentValue);
        if (!currentValue && categoryName) {
          document.getElementById('category').value = categoryValue;
        }
      }, 100);
    }
    
    if (event.event_date) {
      const d = new Date(event.event_date);
      document.getElementById('eventDate').value = d.toISOString().split('T')[0];
      document.getElementById('eventTime').value = d.toTimeString().slice(0, 5);
    }
    
    document.getElementById('location').value = event.location || '';
    document.getElementById('address').value = event.address || '';
    
    if (event.image_url) {
      document.getElementById('imageUrl').value = event.image_url;
      uploadedImageUrl = event.image_url;
      document.getElementById('previewImg').src = event.image_url;
      document.getElementById('imagePreview').classList.remove('hidden');
    }
    
    const container = document.getElementById('ticketTypesContainer');
    container.innerHTML = '';
    eventData.ticketTypes = [];
    
    if (event.ticket_types?.length > 0) {
      event.ticket_types.forEach(t => {
        addTicketType();
        const i = eventData.ticketTypes.length - 1;
        setTimeout(() => {
          document.querySelector(`[data-ticket-field="name"][data-ticket-index="${i}"]`).value = t.name;
          document.querySelector(`[data-ticket-field="price"][data-ticket-index="${i}"]`).value = t.price;
          document.querySelector(`[data-ticket-field="quantity"][data-ticket-index="${i}"]`).value = t.quantity;
          document.querySelector(`[data-ticket-field="description"][data-ticket-index="${i}"]`).value = t.description || '';
          eventData.ticketTypes[i] = { id: t.id, name: t.name, price: t.price, quantity: t.quantity, description: t.description || '' };
        }, 50);
      });
    } else {
      addTicketType();
    }
    
    // Initialize first tab
    switchTab(1);
    
  } catch (error) {
    console.error('Error:', error);
    hideSkeleton();
    toast.error('Failed to load event');
    setTimeout(() => window.location.href = '/dashboard/organizer/events/', 2000);
  }
}

// Initialize on page load
(async () => {
  await init();
  if (eventId) await loadEventData();
})();
