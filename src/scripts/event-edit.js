// Event Creation Wizard Script

// Initialize theme
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else if (localStorage.getItem('theme') === 'light') {
  document.documentElement.classList.remove('dark');
}

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
const totalSteps = 5;
let eventData = {
  ticketTypes: []
};
let draftEventId = null;
let uploadedImageUrl = null;

// Get event ID from URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

// Initialize
async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = '/login/';
    return;
  }
  
  if (!eventId) {
    toast.error('No event ID provided');
    setTimeout(() => window.location.href = '/dashboard/organizer/events/', 2000);
    return;
  }
  
  setupEventListeners();
  await loadEventData();
}

// Setup event listeners
function setupEventListeners() {
  // Navigation buttons
  document.getElementById('nextBtn').addEventListener('click', handleNext);
  document.getElementById('prevBtn').addEventListener('click', handlePrev);
  document.getElementById('saveDraftBtn').addEventListener('click', () => saveDraft());
  
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

// Handle next button
async function handleNext() {
  if (!validateCurrentStep()) {
    return;
  }
  
  // Save current step data
  saveStepData();
  
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepDisplay();
    
    // If moving to review step, populate review
    if (currentStep === 5) {
      populateReview();
    }
  } else {
    // Final step - create event
    await createEvent();
  }
}

// Handle previous button
function handlePrev() {
  if (currentStep > 1) {
    currentStep--;
    updateStepDisplay();
  }
}

// Update step display
function updateStepDisplay() {
  // Hide all steps
  for (let i = 1; i <= totalSteps; i++) {
    document.getElementById(`step${i}`).classList.add('hidden');
  }
  
  // Show current step
  document.getElementById(`step${currentStep}`).classList.remove('hidden');
  
  // Update progress indicators
  document.querySelectorAll('[data-step]').forEach((el, index) => {
    const stepNum = index + 1;
    const circle = el.querySelector('.step-circle');
    const line = el.querySelector('.step-line');
    const lineBefore = el.querySelector('.step-line-before');
    
    if (stepNum < currentStep) {
      // Completed steps
      circle.className = 'w-10 h-10 rounded-full bg-green-600 dark:bg-green-500 text-white flex items-center justify-center font-bold text-sm step-circle shrink-0';
      if (line) line.className = 'flex-1 h-1 bg-green-600 dark:bg-green-500 ml-2 step-line';
      if (lineBefore) lineBefore.className = 'flex-1 h-1 bg-green-600 dark:bg-green-500 mr-2 step-line-before';
    } else if (stepNum === currentStep) {
      // Current step
      circle.className = 'w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-sm step-circle shrink-0';
      if (line) line.className = 'flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 ml-2 step-line';
      if (lineBefore) lineBefore.className = 'flex-1 h-1 bg-green-600 dark:bg-green-500 mr-2 step-line-before';
    } else {
      // Future steps
      circle.className = 'w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center font-bold text-sm step-circle shrink-0';
      if (line) line.className = 'flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 ml-2 step-line';
      if (lineBefore) lineBefore.className = 'flex-1 h-1 bg-neutral-200 dark:bg-neutral-800 mr-2 step-line-before';
    }
  });
  
  // Update step labels
  for (let i = 1; i <= totalSteps; i++) {
    const label = document.getElementById(`label${i}`);
    if (label) {
      if (i === currentStep) {
        label.className = 'text-xs font-medium mt-2 text-center';
      } else if (i < currentStep) {
        label.className = 'text-xs font-medium text-green-600 dark:text-green-400 mt-2 text-center';
      } else {
        label.className = 'text-xs font-medium text-neutral-400 mt-2 text-center';
      }
    }
  }
  
  // Update buttons
  document.getElementById('prevBtn').disabled = currentStep === 1;
  const nextBtnText = document.getElementById('nextBtnText') || document.getElementById('nextBtn');
  nextBtnText.textContent = currentStep === totalSteps ? (eventId ? 'Update Event' : 'Create Event') : 'Next';
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate current step
function validateCurrentStep() {
  // Special validation for step 3 (image) - check first before other validations
  if (currentStep === 3) {
    const uploadSection = document.getElementById('uploadSection');
    const urlSection = document.getElementById('urlSection');
    
    if (!uploadSection.classList.contains('hidden')) {
      // Upload mode - check if image was uploaded
      if (!uploadedImageUrl) {
        toast.error('Please upload a cover image');
        return false;
      }
    } else {
      // URL mode - check if URL is provided
      const imageUrl = document.getElementById('imageUrl').value;
      if (!imageUrl) {
        toast.error('Please provide an image URL');
        return false;
      }
    }
    return true; // Image validation passed
  }
  
  const step = document.getElementById(`step${currentStep}`);
  const inputs = step.querySelectorAll('input[required], textarea[required], select[required]');
  
  let isValid = true;
  inputs.forEach(input => {
    if (!input.value.trim()) {
      isValid = false;
      input.classList.add('border-red-500');
    } else {
      input.classList.remove('border-red-500');
    }
  });
  
  // Special validation for step 4 (tickets)
  if (currentStep === 4) {
    if (eventData.ticketTypes.length === 0) {
      toast.error('Please add at least one ticket type');
      return false;
    }
  }
  
  return isValid;
}

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

// Save draft
async function saveDraft() {
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

// Create or update event
async function createEvent(forcedStatus = null, customData = null) {
  try {
    toast.loading(eventId ? 'Updating event...' : 'Creating event...');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get publish status
    const status = forcedStatus || document.querySelector('input[name="publishStatus"]:checked').value;
    
    // Use custom data for draft or full event data
    const dataToSave = customData || eventData;
    
    let event;
    
    if (eventId) {
      // Update existing event
      const { data, error: eventError } = await supabase
        .from('events')
        .update({
          title: dataToSave.title,
          description: dataToSave.description,
          event_date: dataToSave.event_date,
          location: dataToSave.location,
          image_url: dataToSave.image_url,
          status: status
        })
        .eq('id', eventId)
        .select()
        .single();
      
      if (eventError) throw eventError;
      event = data;
      
      // Delete existing ticket types
      await supabase
        .from('ticket_types')
        .delete()
        .eq('event_id', eventId);
        
    } else {
      // Create new event
      const { data, error: eventError } = await supabase
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
      event = data;
    }
    
    if (!event) throw new Error('Failed to save event');
    
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
    if (eventId) {
      toast.success('Event updated successfully!');
    } else if (forcedStatus === 'draft') {
      toast.success('Event saved as draft successfully!');
    } else {
      toast.success(`Event ${status === 'published' ? 'published' : 'saved'} successfully!');
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

// Load existing event data
async function loadEventData() {
  try {
    toast.loading('Loading event...');
    
    const { data: event, error } = await supabase
      .from('events')
      .select(`
        *,
        ticket_types (*),
        event_category_mappings (
          event_categories (name)
        )
      `)
      .eq('id', eventId)
      .single();
    
    if (error) throw error;
    
    // Populate form fields
    document.getElementById('title').value = event.title || '';
    document.getElementById('description').value = event.description || '';
    
    // Get category name
    const categoryName = event.event_category_mappings?.[0]?.event_categories?.name || '';
    document.getElementById('category').value = categoryName;
    
    // Parse date and time
    if (event.event_date) {
      const eventDate = new Date(event.event_date);
      document.getElementById('eventDate').value = eventDate.toISOString().split('T')[0];
      document.getElementById('eventTime').value = eventDate.toTimeString().slice(0, 5);
    }
    
    document.getElementById('location').value = event.location || '';
    document.getElementById('address').value = event.address || '';
    
    // Set image
    if (event.image_url) {
      document.getElementById('imageUrl').value = event.image_url;
      uploadedImageUrl = event.image_url;
      const preview = document.getElementById('imagePreview');
      const img = document.getElementById('previewImg');
      img.src = event.image_url;
      preview.classList.remove('hidden');
    }
    
    // Load ticket types
    if (event.ticket_types && event.ticket_types.length > 0) {
      event.ticket_types.forEach((ticket, index) => {
        if (index === 0) {
          // Update first ticket type
          const firstTicket = document.querySelector('[data-ticket-index="0"]');
          if (firstTicket) {
            document.querySelector('[data-ticket-field="name"][data-ticket-index="0"]').value = ticket.name;
            document.querySelector('[data-ticket-field="price"][data-ticket-index="0"]').value = ticket.price;
            document.querySelector('[data-ticket-field="quantity"][data-ticket-index="0"]').value = ticket.quantity;
            document.querySelector('[data-ticket-field="description"][data-ticket-index="0"]').value = ticket.description || '';
            
            eventData.ticketTypes[0] = {
              id: ticket.id,
              name: ticket.name,
              price: ticket.price,
              quantity: ticket.quantity,
              description: ticket.description || ''
            };
          }
        } else {
          // Add additional ticket types
          addTicketType();
          const newIndex = eventData.ticketTypes.length - 1;
          document.querySelector(`[data-ticket-field="name"][data-ticket-index="${newIndex}"]`).value = ticket.name;
          document.querySelector(`[data-ticket-field="price"][data-ticket-index="${newIndex}"]`).value = ticket.price;
          document.querySelector(`[data-ticket-field="quantity"][data-ticket-index="${newIndex}"]`).value = ticket.quantity;
          document.querySelector(`[data-ticket-field="description"][data-ticket-index="${newIndex}"]`).value = ticket.description || '';
          
          eventData.ticketTypes[newIndex] = {
            id: ticket.id,
            name: ticket.name,
            price: ticket.price,
            quantity: ticket.quantity,
            description: ticket.description || ''
          };
        }
      });
    } else {
      addInitialTicketType();
    }
    
    toast.dismiss();
    toast.success('Event loaded successfully!');
    
  } catch (error) {
    console.error('Error loading event:', error);
    toast.dismiss();
    toast.error('Failed to load event');
    setTimeout(() => window.location.href = '/dashboard/organizer/events/', 2000);
  }
}

// Initialize on page load
init();
