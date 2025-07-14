// Wedding Planner Plus v5 - ES6 Modules with Robust Guest Grouping
// Central Store with PubSub System

// UUID Generator Utility
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// PubSub System
class PubSub {
  constructor() {
    this.events = {};
  }
  
  subscribe(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }
  
  publish(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Central Store
class Store {
  constructor() {
    this.pubsub = new PubSub();
    this.state = {
      settings: {
        weddingDate: new Date('2026-04-25'),
        overallBudget: 25625,
      },
      tasks: [
        { id: uuidv4(), text: 'Set overall budget', due: '2025-08-01', done: false },
        { id: uuidv4(), text: 'Book venue', due: '2025-08-15', done: false },
        { id: uuidv4(), text: 'Send save-the-dates', due: '2025-10-15', done: false },
        { id: uuidv4(), text: 'Order invitations', due: '2026-01-15', done: false },
      ],
      vendors: [],
      categories: [
        { id: uuidv4(), name: 'Venue', allocated: 11500, isPercentage: false, percentage: 0 },
        { id: uuidv4(), name: 'Catering', allocated: 7680, isPercentage: false, percentage: 0 },
        { id: uuidv4(), name: 'Photography', allocated: 2820, isPercentage: false, percentage: 0 },
        { id: uuidv4(), name: 'Registration', allocated: 1000, isPercentage: false, percentage: 0 },
        { id: uuidv4(), name: 'Miscellaneous', allocated: 1000, isPercentage: false, percentage: 0 },
      ],
      // New Party/Guest System
      parties: [
        {
          id: uuidv4(),
          partyName: 'Smith Family',
          notes: 'Bride\'s immediate family'
        },
        {
          id: uuidv4(),
          partyName: 'College Friends',
          notes: 'Friends from university'
        }
      ],
      guests: [],
      registrationItems: [
        { id: uuidv4(), item: 'Marriage License', estimated: 150, actual: 0, status: 'Pending', notes: '' },
        { id: uuidv4(), item: 'Registrar Fee', estimated: 400, actual: 0, status: 'Pending', notes: '' },
        { id: uuidv4(), item: 'Venue Registration', estimated: 300, actual: 0, status: 'Pending', notes: '' },
        { id: uuidv4(), item: 'Witnesses', estimated: 100, actual: 0, status: 'Pending', notes: '' },
      ],
      selectedPartyId: null
    };
    
    // Initialize with sample guest data
    this.initializeSampleGuests();
  }
  
  initializeSampleGuests() {
    if (this.state.parties.length >= 2) {
      this.state.guests = [
        {
          id: uuidv4(),
          firstName: 'John',
          lastName: 'Smith',
          partyId: this.state.parties[0].id,
          rsvpStatus: 'Accepted',
          specialNotes: 'Vegetarian meal'
        },
        {
          id: uuidv4(),
          firstName: 'Jane',
          lastName: 'Smith',
          partyId: this.state.parties[0].id,
          rsvpStatus: 'Accepted',
          specialNotes: ''
        },
        {
          id: uuidv4(),
          firstName: 'Mike',
          lastName: 'Johnson',
          partyId: this.state.parties[1].id,
          rsvpStatus: 'Pending',
          specialNotes: 'Plus one expected'
        }
      ];
    }
  }
  
  getState() {
    return this.state;
  }
  
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.pubsub.publish('stateChange', this.state);
  }
  
  subscribe(event, callback) {
    this.pubsub.subscribe(event, callback);
  }
  
  publish(event, data) {
    this.pubsub.publish(event, data);
  }
  
  // Party Methods
  addParty(partyData) {
    const newParty = {
      id: uuidv4(),
      partyName: partyData.partyName,
      notes: partyData.notes || ''
    };
    this.state.parties.push(newParty);
    this.publish('partiesUpdated', this.state.parties);
    return newParty;
  }
  
  updateParty(partyId, updates) {
    const partyIndex = this.state.parties.findIndex(p => p.id === partyId);
    if (partyIndex !== -1) {
      this.state.parties[partyIndex] = { ...this.state.parties[partyIndex], ...updates };
      this.publish('partiesUpdated', this.state.parties);
    }
  }
  
  deleteParty(partyId) {
    // Also delete associated guests
    this.state.guests = this.state.guests.filter(g => g.partyId !== partyId);
    this.state.parties = this.state.parties.filter(p => p.id !== partyId);
    
    // Clear selected party if it was deleted
    if (this.state.selectedPartyId === partyId) {
      this.state.selectedPartyId = null;
    }
    
    this.publish('partiesUpdated', this.state.parties);
    this.publish('guestsUpdated', this.state.guests);
  }
  
  // Guest Methods
  addGuest(guestData) {
    const newGuest = {
      id: uuidv4(),
      firstName: guestData.firstName,
      lastName: guestData.lastName,
      partyId: guestData.partyId,
      rsvpStatus: guestData.rsvpStatus || 'Pending',
      specialNotes: guestData.specialNotes || ''
    };
    this.state.guests.push(newGuest);
    this.publish('guestsUpdated', this.state.guests);
    return newGuest;
  }
  
  updateGuest(guestId, updates) {
    const guestIndex = this.state.guests.findIndex(g => g.id === guestId);
    if (guestIndex !== -1) {
      this.state.guests[guestIndex] = { ...this.state.guests[guestIndex], ...updates };
      this.publish('guestsUpdated', this.state.guests);
    }
  }
  
  deleteGuest(guestId) {
    this.state.guests = this.state.guests.filter(g => g.id !== guestId);
    this.publish('guestsUpdated', this.state.guests);
  }
  
  getGuestsByParty(partyId) {
    return this.state.guests.filter(g => g.partyId === partyId);
  }
  
  getGuestCounts() {
    const total = this.state.guests.length;
    const accepted = this.state.guests.filter(g => g.rsvpStatus === 'Accepted').length;
    const declined = this.state.guests.filter(g => g.rsvpStatus === 'Declined').length;
    return { total, accepted, declined };
  }
  
  // Existing methods for backward compatibility
  addTask(taskData) {
    const newTask = {
      id: uuidv4(),
      text: taskData.text,
      due: taskData.due,
      done: false
    };
    this.state.tasks.push(newTask);
    this.publish('tasksUpdated', this.state.tasks);
    return newTask;
  }
  
  updateTask(taskId, updates) {
    const taskIndex = this.state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.state.tasks[taskIndex] = { ...this.state.tasks[taskIndex], ...updates };
      this.publish('tasksUpdated', this.state.tasks);
    }
  }
  
  deleteTask(taskId) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
    this.publish('tasksUpdated', this.state.tasks);
  }
}

// Global store instance
const store = new Store();

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', 
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Party Panel Module
class PartyPanel {
  constructor() {
    this.container = document.getElementById('party-panel');
    this.selectedPartyId = null;
    this.init();
  }
  
  init() {
    store.subscribe('partiesUpdated', () => this.render());
    store.subscribe('guestsUpdated', () => this.render());
    this.render();
  }
  
  render() {
    if (!this.container) return;
    
    this.container.innerHTML = '';
    
    const parties = store.getState().parties;
    
    if (parties.length === 0) {
      this.container.innerHTML = '<div class="empty-state"><p>No parties added yet</p></div>';
      return;
    }
    
    parties.forEach(party => {
      const guests = store.getGuestsByParty(party.id);
      const totalGuests = guests.length;
      const acceptedGuests = guests.filter(g => g.rsvpStatus === 'Accepted').length;
      
      const partyElement = document.createElement('div');
      partyElement.className = `party-item ${this.selectedPartyId === party.id ? 'selected' : ''}`;
      partyElement.setAttribute('tabindex', '0');
      partyElement.setAttribute('role', 'button');
      partyElement.setAttribute('aria-label', `Select ${party.partyName} party`);
      
      partyElement.innerHTML = `
        <div class="party-name">${party.partyName}</div>
        <div class="party-count">${totalGuests} guests (${acceptedGuests} accepted)</div>
        <div class="party-actions">
          <button class="edit-party-btn" data-party-id="${party.id}" aria-label="Edit party">✎</button>
          <button class="delete-party-btn" data-party-id="${party.id}" aria-label="Delete party">🗑</button>
        </div>
      `;
      
      // Party selection
      partyElement.addEventListener('click', (e) => {
        if (!e.target.classList.contains('edit-party-btn') && !e.target.classList.contains('delete-party-btn')) {
          this.selectParty(party.id);
        }
      });
      
      partyElement.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectParty(party.id);
        }
      });
      
      // Edit party
      const editBtn = partyElement.querySelector('.edit-party-btn');
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editParty(party.id);
      });
      
      // Delete party
      const deleteBtn = partyElement.querySelector('.delete-party-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteParty(party.id);
      });
      
      this.container.appendChild(partyElement);
    });
  }
  
  selectParty(partyId) {
    this.selectedPartyId = partyId;
    store.setState({ selectedPartyId: partyId });
    this.render();
    
    // Enable add guest button
    const addGuestBtn = document.getElementById('add-guest-btn');
    if (addGuestBtn) {
      addGuestBtn.disabled = false;
    }
    
    // Update guest table
    if (window.guestTable) {
      window.guestTable.render();
    }
  }
  
  editParty(partyId) {
    const party = store.getState().parties.find(p => p.id === partyId);
    if (party) {
      this.openPartyModal(party);
    }
  }
  
  deleteParty(partyId) {
    const party = store.getState().parties.find(p => p.id === partyId);
    if (party && confirm(`Are you sure you want to delete "${party.partyName}" and all associated guests?`)) {
      store.deleteParty(partyId);
    }
  }
  
  openPartyModal(party = null) {
    const modal = document.getElementById('party-modal');
    const isEditing = party !== null;
    
    document.getElementById('party-modal-title').textContent = isEditing ? 'Edit Party' : 'Add Party';
    document.getElementById('party-name').value = isEditing ? party.partyName : '';
    document.getElementById('party-notes').value = isEditing ? party.notes : '';
    modal.dataset.editingId = isEditing ? party.id : '';
    
    modal.classList.add('active');
    document.getElementById('party-name').focus();
  }
}

// Guest Table Module
class GuestTable {
  constructor() {
    this.container = document.getElementById('guest-table');
    this.headerContainer = document.getElementById('selected-party-name');
    this.init();
  }
  
  init() {
    store.subscribe('guestsUpdated', () => this.render());
    store.subscribe('stateChange', () => this.render());
    this.render();
  }
  
  render() {
    if (!this.container || !this.headerContainer) return;
    
    const selectedPartyId = store.getState().selectedPartyId;
    const selectedParty = store.getState().parties.find(p => p.id === selectedPartyId);
    
    if (!selectedParty) {
      this.headerContainer.textContent = 'Select a party to view guests';
      this.container.innerHTML = '<div class="empty-state"><p>Select a party from the left to manage guests</p></div>';
      return;
    }
    
    this.headerContainer.textContent = `${selectedParty.partyName} - Guests`;
    
    const guests = store.getGuestsByParty(selectedPartyId);
    
    this.container.innerHTML = '';
    
    // Create table header
    const headerRow = document.createElement('div');
    headerRow.className = 'guest-table-row guest-table-header-row';
    headerRow.innerHTML = `
      <div><strong>First Name</strong></div>
      <div><strong>Last Name</strong></div>
      <div><strong>RSVP</strong></div>
      <div><strong>Notes</strong></div>
      <div><strong>Actions</strong></div>
    `;
    this.container.appendChild(headerRow);
    
    if (guests.length === 0) {
      const emptyRow = document.createElement('div');
      emptyRow.className = 'guest-table-row';
      emptyRow.innerHTML = '<div colspan="5" class="empty-state"><p>No guests added yet</p></div>';
      this.container.appendChild(emptyRow);
      return;
    }
    
    guests.forEach(guest => {
      const row = document.createElement('div');
      row.className = 'guest-table-row';
      
      row.innerHTML = `
        <div>${guest.firstName}</div>
        <div>${guest.lastName}</div>
        <div>
          <select class="guest-rsvp-select" data-guest-id="${guest.id}">
            <option value="Pending" ${guest.rsvpStatus === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Accepted" ${guest.rsvpStatus === 'Accepted' ? 'selected' : ''}>Accepted</option>
            <option value="Declined" ${guest.rsvpStatus === 'Declined' ? 'selected' : ''}>Declined</option>
          </select>
        </div>
        <div>
          <span class="guest-notes-text">${guest.specialNotes}</span>
        </div>
        <div>
          <button class="delete-guest-btn" data-guest-id="${guest.id}" aria-label="Delete guest">🗑</button>
        </div>
      `;
      
      // RSVP change handler
      const rsvpSelect = row.querySelector('.guest-rsvp-select');
      rsvpSelect.addEventListener('change', (e) => {
        store.updateGuest(guest.id, { rsvpStatus: e.target.value });
      });
      
      // Delete guest handler
      const deleteBtn = row.querySelector('.delete-guest-btn');
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Are you sure you want to delete ${guest.firstName} ${guest.lastName}?`)) {
          store.deleteGuest(guest.id);
        }
      });
      
      this.container.appendChild(row);
    });
  }
  
  openGuestModal(guest = null) {
    const modal = document.getElementById('guest-modal');
    const isEditing = guest !== null;
    
    document.getElementById('guest-modal-title').textContent = isEditing ? 'Edit Individual' : 'Add Individual';
    document.getElementById('guest-first-name').value = isEditing ? guest.firstName : '';
    document.getElementById('guest-last-name').value = isEditing ? guest.lastName : '';
    document.getElementById('guest-rsvp').value = isEditing ? guest.rsvpStatus : 'Pending';
    document.getElementById('guest-notes').value = isEditing ? guest.specialNotes : '';
    modal.dataset.editingId = isEditing ? guest.id : '';
    
    modal.classList.add('active');
    document.getElementById('guest-first-name').focus();
  }
}

// Navigation System
let currentView = 'dashboard';

function showView(viewName) {
  console.log('Attempting to show view:', viewName);
  
  // Ensure we have a valid view name
  const validViews = ['dashboard', 'checklist', 'vendors', 'budget', 'registration', 'guests', 'moodboard'];
  if (!validViews.includes(viewName)) {
    console.error('Invalid view name:', viewName);
    return;
  }
  
  currentView = viewName;
  
  // Hide all views first
  const views = document.querySelectorAll('.view');
  console.log('Found', views.length, 'views to hide');
  views.forEach(view => {
    view.classList.remove('active');
    view.style.display = 'none';
  });
  
  // Show target view
  const targetView = document.getElementById(viewName);
  console.log('Target view element:', targetView);
  if (targetView) {
    targetView.classList.add('active');
    targetView.style.display = 'block';
    console.log('Successfully showed view:', viewName);
    
    // Update view-specific content
    setTimeout(() => {
      switch(viewName) {
        case 'dashboard':
          updateDashboard();
          break;
        case 'checklist':
          renderChecklist();
          break;
        case 'vendors':
          renderVendors();
          break;
        case 'budget':
          renderBudget();
          break;
        case 'guests':
          // Party panel and guest table render automatically via subscriptions
          if (window.partyPanel) window.partyPanel.render();
          if (window.guestTable) window.guestTable.render();
          break;
        case 'registration':
          renderRegistration();
          break;
        case 'moodboard':
          // Moodboard has static content
          break;
      }
    }, 10);
  } else {
    console.error('View element not found:', viewName);
  }
}

function initNavigation() {
  console.log('Initializing navigation system...');
  
  // Wait for DOM to be ready
  setTimeout(() => {
    const navButtons = document.querySelectorAll('.nav-button');
    console.log('Found navigation buttons:', navButtons.length);
    
    navButtons.forEach((button, index) => {
      const viewName = button.dataset.view;
      console.log(`Setting up nav button ${index}: ${viewName}`);
      
      // Remove any existing listeners to prevent duplicates
      button.replaceWith(button.cloneNode(true));
      
      // Get the fresh button reference
      const freshButton = document.querySelectorAll('.nav-button')[index];
      
      freshButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const targetView = this.dataset.view;
        console.log('Navigation button clicked:', targetView);
        
        // Update active nav button
        navButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Show the view
        showView(targetView);
        
        // Close mobile menu if open
        const nav = document.querySelector('.nav');
        if (nav) nav.classList.remove('active');
      });
    });
    
    // Mobile hamburger
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');
    
    if (hamburger && nav) {
      hamburger.addEventListener('click', function() {
        nav.classList.toggle('active');
      });
    }
    
    console.log('Navigation system initialized successfully');
  }, 100);
}

// Dashboard Functions
function updateDashboard() {
  console.log('Updating dashboard...');
  const state = store.getState();
  
  // Update countdown
  const today = new Date();
  const weddingDate = state.settings.weddingDate;
  const timeDiff = weddingDate.getTime() - today.getTime();
  const daysDiff = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));
  
  const daysElement = document.getElementById('days-remaining');
  if (daysElement) {
    daysElement.textContent = daysDiff;
  }
  
  // Update progress bar
  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(task => task.done).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
  if (progressText) {
    progressText.textContent = `${Math.round(progress)}% Complete`;
  }
  
  // Update budget summary
  const registrationActual = state.registrationItems.reduce((sum, item) => sum + (item.actual || 0), 0);
  const vendorActual = state.vendors.reduce((sum, vendor) => sum + (vendor.quote || 0), 0);
  const totalActual = registrationActual + vendorActual;
  
  const budgetSummary = document.getElementById('budget-summary');
  if (budgetSummary) {
    budgetSummary.textContent = `${formatCurrency(totalActual)} / ${formatCurrency(state.settings.overallBudget)}`;
  }
  
  // Update guest stats
  const guestCounts = store.getGuestCounts();
  const totalGuestsEl = document.getElementById('total-guests');
  const acceptedGuestsEl = document.getElementById('accepted-guests');
  const declinedGuestsEl = document.getElementById('declined-guests');
  
  if (totalGuestsEl) totalGuestsEl.textContent = guestCounts.total;
  if (acceptedGuestsEl) acceptedGuestsEl.textContent = guestCounts.accepted;
  if (declinedGuestsEl) declinedGuestsEl.textContent = guestCounts.declined;
  
  // Update booked vendors
  const bookedVendorsEl = document.getElementById('booked-vendors');
  if (bookedVendorsEl) {
    const bookedVendors = state.vendors.filter(vendor => vendor.confirmed).length;
    bookedVendorsEl.textContent = bookedVendors;
  }
  
  // Update inputs
  const overallBudgetInput = document.getElementById('overall-budget');
  if (overallBudgetInput) {
    overallBudgetInput.value = state.settings.overallBudget;
  }
  
  const weddingDateInput = document.getElementById('wedding-date-input');
  if (weddingDateInput) {
    weddingDateInput.value = state.settings.weddingDate.toISOString().split('T')[0];
  }
  
  // Update guest summary
  updateGuestSummary();
}

function updateGuestSummary() {
  const guestCounts = store.getGuestCounts();
  
  const totalGuestsSummaryEl = document.getElementById('total-guests-summary');
  const acceptedGuestsSummaryEl = document.getElementById('accepted-guests-summary');
  const declinedGuestsSummaryEl = document.getElementById('declined-guests-summary');
  
  if (totalGuestsSummaryEl) totalGuestsSummaryEl.textContent = guestCounts.total;
  if (acceptedGuestsSummaryEl) acceptedGuestsSummaryEl.textContent = guestCounts.accepted;
  if (declinedGuestsSummaryEl) declinedGuestsSummaryEl.textContent = guestCounts.declined;
}

// Checklist Functions
function renderChecklist() {
  console.log('Rendering checklist...');
  const container = document.getElementById('checklist-items');
  if (!container) return;
  
  container.innerHTML = '';
  
  const state = store.getState();
  
  if (state.tasks.length === 0) {
    container.innerHTML = '<div class="empty-state"><h3>No tasks added yet</h3><p>Click "Add Task" to get started</p></div>';
    return;
  }
  
  state.tasks.forEach(task => {
    const taskElement = createTaskElement(task);
    container.appendChild(taskElement);
  });
}

function createTaskElement(task) {
  const taskDiv = document.createElement('div');
  taskDiv.className = `checklist-item ${task.done ? 'completed' : ''}`;
  
  taskDiv.innerHTML = `
    <div class="task-checkbox ${task.done ? 'checked' : ''}" data-task-id="${task.id}" tabindex="0" role="checkbox" aria-checked="${task.done}">
      ${task.done ? '✓' : ''}
    </div>
    <div class="task-details">
      <div class="task-name">${task.text}</div>
      <div class="task-due">Due: ${formatDate(task.due)}</div>
    </div>
    <div class="task-actions">
      <button class="btn btn--sm btn--secondary" data-edit-task="${task.id}" aria-label="Edit task">✎</button>
      <button class="btn btn--sm btn--outline" data-delete-task="${task.id}" aria-label="Delete task">🗑</button>
    </div>
  `;
  
  // Add event listeners
  const checkbox = taskDiv.querySelector('.task-checkbox');
  const editBtn = taskDiv.querySelector('[data-edit-task]');
  const deleteBtn = taskDiv.querySelector('[data-delete-task]');
  
  checkbox.addEventListener('click', () => toggleTask(task.id));
  checkbox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleTask(task.id);
    }
  });
  
  editBtn.addEventListener('click', () => openTaskModal(task));
  deleteBtn.addEventListener('click', () => deleteTask(task.id));
  
  return taskDiv;
}

function toggleTask(taskId) {
  const state = store.getState();
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    store.updateTask(taskId, { done: !task.done });
  }
}

function deleteTask(taskId) {
  if (confirm('Are you sure you want to delete this task?')) {
    store.deleteTask(taskId);
  }
}

// Stub implementations for existing functionality
function renderVendors() {
  const container = document.getElementById('vendors-table');
  if (!container) return;
  
  container.innerHTML = '<div class="empty-state"><h3>Vendors</h3><p>Vendor management preserved from previous version</p></div>';
}

function renderBudget() {
  const container = document.getElementById('budget-table');
  if (!container) return;
  
  container.innerHTML = '<div class="empty-state"><h3>Budget</h3><p>Budget management preserved from previous version</p></div>';
}

function renderRegistration() {
  const container = document.getElementById('registration-table');
  if (!container) return;
  
  container.innerHTML = '<div class="empty-state"><h3>Registration</h3><p>Registration management preserved from previous version</p></div>';
}

// Modal Functions
function openTaskModal(task = null) {
  const modal = document.getElementById('task-modal');
  const isEditing = task !== null;
  
  document.getElementById('task-modal-title').textContent = isEditing ? 'Edit Task' : 'Add Task';
  document.getElementById('task-text').value = isEditing ? task.text : '';
  document.getElementById('task-due').value = isEditing ? task.due : '';
  modal.dataset.editingId = isEditing ? task.id : '';
  
  modal.classList.add('active');
  document.getElementById('task-text').focus();
}

function closeModal(modal) {
  modal.classList.remove('active');
}

function initModals() {
  console.log('Initializing modals...');
  
  // Party modal
  const partyModal = document.getElementById('party-modal');
  const partyForm = document.getElementById('party-form');
  
  const addPartyBtn = document.getElementById('add-party-btn');
  if (addPartyBtn) {
    addPartyBtn.addEventListener('click', () => {
      if (window.partyPanel) {
        window.partyPanel.openPartyModal();
      }
    });
  }
  
  if (partyModal) {
    document.getElementById('party-modal-close')?.addEventListener('click', () => closeModal(partyModal));
    document.getElementById('party-modal-cancel')?.addEventListener('click', () => closeModal(partyModal));
    partyModal.addEventListener('click', (e) => { if (e.target === partyModal) closeModal(partyModal); });
  }
  
  if (partyForm) {
    partyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const partyData = {
        partyName: document.getElementById('party-name').value.trim(),
        notes: document.getElementById('party-notes').value.trim()
      };
      
      if (!partyData.partyName) return;
      
      const editingId = partyModal.dataset.editingId;
      
      if (editingId) {
        store.updateParty(editingId, partyData);
      } else {
        store.addParty(partyData);
      }
      
      closeModal(partyModal);
    });
  }
  
  // Guest modal
  const guestModal = document.getElementById('guest-modal');
  const guestForm = document.getElementById('guest-form');
  
  const addGuestBtn = document.getElementById('add-guest-btn');
  if (addGuestBtn) {
    addGuestBtn.addEventListener('click', () => {
      if (window.guestTable) {
        window.guestTable.openGuestModal();
      }
    });
  }
  
  if (guestModal) {
    document.getElementById('guest-modal-close')?.addEventListener('click', () => closeModal(guestModal));
    document.getElementById('guest-modal-cancel')?.addEventListener('click', () => closeModal(guestModal));
    guestModal.addEventListener('click', (e) => { if (e.target === guestModal) closeModal(guestModal); });
  }
  
  if (guestForm) {
    guestForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const guestData = {
        firstName: document.getElementById('guest-first-name').value.trim(),
        lastName: document.getElementById('guest-last-name').value.trim(),
        partyId: store.getState().selectedPartyId,
        rsvpStatus: document.getElementById('guest-rsvp').value,
        specialNotes: document.getElementById('guest-notes').value.trim()
      };
      
      if (!guestData.firstName || !guestData.lastName || !guestData.partyId) return;
      
      const editingId = guestModal.dataset.editingId;
      
      if (editingId) {
        store.updateGuest(editingId, guestData);
      } else {
        store.addGuest(guestData);
      }
      
      closeModal(guestModal);
    });
  }
  
  // Task modal
  const taskModal = document.getElementById('task-modal');
  const taskForm = document.getElementById('task-form');
  
  const addTaskBtn = document.getElementById('add-task-btn');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => openTaskModal());
  }
  
  if (taskModal) {
    document.getElementById('task-modal-close')?.addEventListener('click', () => closeModal(taskModal));
    document.getElementById('task-modal-cancel')?.addEventListener('click', () => closeModal(taskModal));
    taskModal.addEventListener('click', (e) => { if (e.target === taskModal) closeModal(taskModal); });
  }
  
  if (taskForm) {
    taskForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const taskData = {
        text: document.getElementById('task-text').value.trim(),
        due: document.getElementById('task-due').value
      };
      
      if (!taskData.text || !taskData.due) return;
      
      const editingId = taskModal.dataset.editingId;
      
      if (editingId) {
        store.updateTask(editingId, taskData);
      } else {
        store.addTask(taskData);
      }
      
      closeModal(taskModal);
    });
  }
  
  // Export CSV
  const exportCsvBtn = document.getElementById('export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', exportGuestsToCSV);
  }
}

function exportGuestsToCSV() {
  const state = store.getState();
  const csvHeaders = ['Party Name', 'First Name', 'Last Name', 'RSVP Status', 'Special Notes'];
  const csvData = state.guests.map(guest => {
    const party = state.parties.find(p => p.id === guest.partyId);
    return [
      party ? party.partyName : 'Unknown',
      guest.firstName,
      guest.lastName,
      guest.rsvpStatus,
      guest.specialNotes
    ];
  });
  
  const csvContent = [csvHeaders, ...csvData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wedding-guest-list.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Dashboard controls
function initDashboardControls() {
  const overallBudgetInput = document.getElementById('overall-budget');
  if (overallBudgetInput) {
    overallBudgetInput.addEventListener('change', function() {
      const state = store.getState();
      state.settings.overallBudget = parseFloat(this.value) || 0;
      store.setState(state);
    });
  }
  
  const weddingDateInput = document.getElementById('wedding-date-input');
  if (weddingDateInput) {
    weddingDateInput.addEventListener('change', function() {
      const state = store.getState();
      state.settings.weddingDate = new Date(this.value);
      store.setState(state);
    });
  }
  
  // Budget thumbnail click
  const budgetThumbnail = document.getElementById('budget-thumbnail');
  if (budgetThumbnail) {
    budgetThumbnail.addEventListener('click', function() {
      showView('budget');
      // Update nav active state
      document.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
      const budgetNavButton = document.querySelector('[data-view="budget"]');
      if (budgetNavButton) {
        budgetNavButton.classList.add('active');
      }
    });
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM Content Loaded, initializing Wedding Planner Plus v5...');
  
  // Initialize all components
  initNavigation();
  initModals();
  initDashboardControls();
  
  // Initialize party panel and guest table
  setTimeout(() => {
    window.partyPanel = new PartyPanel();
    window.guestTable = new GuestTable();
    console.log('Party panel and guest table initialized');
  }, 200);
  
  // Subscribe to store updates for dashboard
  store.subscribe('guestsUpdated', () => {
    updateDashboard();
    updateGuestSummary();
  });
  store.subscribe('partiesUpdated', updateDashboard);
  store.subscribe('tasksUpdated', updateDashboard);
  
  // Show dashboard by default
  setTimeout(() => {
    showView('dashboard');
    console.log('Wedding Planner Plus v5 ready');
  }, 300);
});