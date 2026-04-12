// ==================== STATE ====================
// This object will hold all the app data in memory - as opposed to having to fetch ever single time we perform an action
// It's like Python variables but organized in one place
let state = {
    tasks: [],
    tags: [],
    editingTaskId: null,
    selectedTags: [],
    filters: {
        search: '',
        priority: null,
        tagId: null
    }
};


// ==================== DOM REFERENCES ====================
// Grab references to HTML elements that will be interacted with frequently
// document.getElementById is like Python's "find this thing by name"
// Store them in variables so there will be no need to search the page every time
const elements = {
    // Task lists (the Kanban columns)
    taskLists: document.querySelectorAll('.task-list'),

    // Counts displayed in column headers
    countTodo: document.getElementById('countTodo'),
    countInProgress: document.getElementById('countInProgress'),
    countDone: document.getElementById('countDone'),

    // Modal elements
    taskModal: document.getElementById('taskModal'),
    modalTitle: document.getElementById('modalTitle'),
    addTaskBtn: document.getElementById('addTaskBtn'),
    closeModal: document.getElementById('closeModal'),
    cancelTask: document.getElementById('cancelTask'),
    saveTask: document.getElementById('saveTask'),

    // Modal form fields
    taskTitle: document.getElementById('taskTitle'),
    taskDescription: document.getElementById('taskDescription'),
    taskPriority: document.getElementById('taskPriority'),
    taskStatus: document.getElementById('taskStatus'),
    taskDueDate: document.getElementById('taskDueDate'),
    tagSelector: document.getElementById('tagSelector'),

    // Detail slide-out panel
    detailOverlay: document.getElementById('detailOverlay'),
    detailPanel: document.getElementById('detailPanel'),
    closePanel: document.getElementById('closePanel'),
    editTaskBtn: document.getElementById('editTaskBtn'),
    deleteTaskBtn: document.getElementById('deleteTaskBtn'),
    detailTitle: document.getElementById('detailTitle'),
    detailStatus: document.getElementById('detailStatus'),
    detailPriority: document.getElementById('detailPriority'),
    detailDueDate: document.getElementById('detailDueDate'),
    detailDescription: document.getElementById('detailDescription'),
    detailTags: document.getElementById('detailTags'),
    detailCreated: document.getElementById('detailCreated'),

    // Toolbar
    searchInput: document.getElementById('searchInput'),
    filterPriority: document.getElementById('filterPriority'),
    filterTags: document.getElementById('filterTags')
};


// ==================== API FUNCTIONS ====================
// These functions will talk to the Flask backend
// They use fetch() which is JS's way of making HTTP requests
// Similar to Python's requests library but built into the browser

// Fetch all tasks from the backend and returns a 'Promise'
// A promise is JS's way of handling async operations
// Note to self: check bot lesson (project #3) for reference

async function fetchTasks() {
    try {
        // fetch() sends a GET request to the Flask route
        const response = await fetch('/api/tasks');

        // .json() converts the response body from JSON string to a JS object
        // Note to self: Same concept as json.load() in Python
        const tasks = await response.json();

        // Store results in state
        state.tasks = tasks;

        // Render the board with the new data
        renderBoard();
    } catch (error) {
        console.error('Failed to fetch tasks:', error);
    }
}


// Fetch all tags from the backend

async function fetchTags() {
    try {
        const response = await fetch('/api/tags');
        const tags = await response.json();
        state.tags = tags;
    } catch (error) {
        console.error('Failed to fetch tags:', error);
    }
}


// Create a new task or update an existing one
// @param {Object} taskData - the task fields to send

async function saveTask(taskData) {
    try {
        // If editing, need to use PUT to update. If creating a new task, need to use POST to create
        // Determine this with a true/false boolean check:
        //     when creating a new task, it will have no id -> null
        //     If editing a task, it will have an id
        //     null !== null -> false
        //     {id} !== null -> true
        //     When false, create a new task - when true, edit a task
        const isEditing = state.editingTaskId !== null;
        // New concept here - explanation:
        // This way of writing code is called 'ternary'
        // It's the same as the if/else I'm used to:
        // let url;
        // if (isEditing) {
        //     url = `/api/tasks/${state.editingTaskId}`;
        // } else {
        //     url = '/api/tasks';
        // }
        // The patter is: condition ? valueIfTrue : valueIfFalse
        // syntax: ? means 'if true' and : means 'else'
        // In python syntax, it's the same as:
        // url = f"/api/tasks/{task_id}" if is_editing else "/api/tasks"
        const url = isEditing ? `/api/tasks/${state.editingTaskId}` : '/api/tasks';
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            // Headers tell the server what format we're sending
            headers: {'Content-Type': 'application/json'},
            // body is the actual data - JSON.stringify converts JS objects to JSON string
            // Opposite of .json() above - similar to json.dumps() in Python
            body: JSON.stringify(taskData)
        });

        if (response.ok) {
            // Refresh the board with the updated data
            await fetchTasks();
            closeTaskModal();
        }
    } catch (error) {
        console.error('Failed to save task:', error);
    }
}


// Delete a task by ID
// @param {number} taskId - the task to delete

async function deleteTask(taskId) {
    try {
        const response = await fetch(`/api/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await fetchTasks();
            closeDetailPanel();
        }
    } catch (error) {
        console.error('Failed to delete task:', error);
    }
}


// Send updated positions after drag-and-drop reorder
// @param {Array} tasks - array of {id, status, position} objects

async function reorderTasks(tasks) {
    try {
        await fetch('/api/tasks/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json'},
            body: JSON.stringify({ tasks: tasks })
        });
    } catch (error) {
        console.error('Failed to reorder tasks:', error);
    }
}


// ==================== RENDER FUNCTIONS ====================
// The following builds the HTML strings and injects them into the page

// Main render function - filters tasks and distributes them to columns

function renderBoard() {
    // Get filtered tasks based on current filter state
    const filtered = getFilteredTasks();

    // Split tasks into their respective columns by status
    // Arrow functions in JS - t => t.status === 'To Do'
    // This is equivalent to Python lambda.
    // filter(lambda t: t.status == 'To Do', tasks) is the same as tasks.filter(t => t.status === 'To Do')
    const todo = filtered.filter(t => t.status === 'To Do');
    const inProgress = filtered.filter(t => t.status === 'In Progress');
    const done = filtered.filter(t => t.status === 'Done');

    // Call the renderColumn()s
    renderColumn('To Do', todo);
    renderColumn('In Progress', inProgress);
    renderColumn('Done', done);

    // Render each column
    elements.countTodo.textContent = todo.length;
    elements.countInProgress.textContent = inProgress.length;
    elements.countDone.textContent = done.length;
}


// Filter tasks based on search text, priority, and tag filters
// Returns a new array - doesn't modify the original

function getFilteredTasks() {
    return state.tasks.filter(task => {
        // Search filter - check if title or description contains the search text
        // toLowerCase() makes it case-insensitive
        if (state.filters.search) {
            const searchLower = state.filters.search.toLowerCase();
            const titleMatch = task.title.toLowerCase().includes(searchLower);
            const descMatch = task.description && task.description.toLowerCase().includes(searchLower);
            if (!titleMatch && !descMatch) return false;
        }

        // Priority filter - only show tasks matching selected priority
        if (state.filters.priority) {
            if (task.priority !== state.filters.priority) return false;
        }

        // Tag filter - only show tasks that have the selected tag
        // .some() returns true if ANY item in the array passes the check, like Python's any()
        if (state.filters.tagId) {
            const hasTag = task.tags.some(tag => tag.id === state.filters.tagId);
            if (!hasTag) return false;
        }

        // Task passed all filters
        return true;
    });
}


// Render a single column's task cards
// @param {string} status - the column status ('To Do', 'In Progress', 'Done')
// @param {Array} tasks - tasks to render in this column

function renderColumn(status, tasks) {
    // Find the task-list element that matches this status
    const column = document.querySelector(`.task-list[data-status="${status}"]`);

    // If no tasks, show empty state
    if (tasks.length === 0) {
        column.innerHTML = `
            <div class="empty-column">
                <p>No tasks</p>
            </div>
        `;
        return;
    }

    // Build HTML for each task card and join them together
    // .map() is like Python's list comprehension - transforms each item in an array like Python list comprehension
    // .join('') joins array items into one string same as Python's ''.join(list)
    column.innerHTML = tasks.map(task => createTaskCardHTML(task)).join('');

    // After injecting the HTML, attach click listeners to each card
    // querySelectorAll finds all cards inside this column
    column.querySelectorAll('.task-card').forEach(card => {
        card.addEventListener('click', () => {
            // card.dataset.id reads the data-id attribute we set in the HTML
            const taskId = parseInt(card.dataset.id);
            openDetailPanel(taskId);
        });
    });
}


// Build the HTML string for a single task card
// @parm {Object} task - task data from the API
// @returns {string} HTML string

function createTaskCardHTML(task) {
    // Format the due date for display
    const dueDateHTML = task.due_date ? formatDueDate(task.due_date) : '';

    // Build tag pills HTML
    const tagsHTML = task.tags.map(tag =>
        `<span class="task-tag" style="background: ${tag.color}20; color: ${tag.color};">${tag.name}</span>`
    ).join('');

    // Return the complete card HTML
    // data-id stores the task ID so I can reference it later
    return `
        <div class="task-card priority-${task.priority.toLowerCase()}" data-id="${task.id}">
            <div class="task-card-title">${task.title}</div>
            <div class="task-card-meta">
                <span class="task-card-priority ${task.priority.toLowerCase()}">${task.priority}</span>
                ${dueDateHTML}
            </div>
            ${tagsHTML ? `<div class="task-card-tags">${tagsHTML}</div>` : ''}
        </div>
    `;
}


// Format a date string into a readable display with overdue detection
// @param {string} dateStr - ISO date string (YYYY-MM-DD)
// @returns {string} HTML string for the due date display

function formatDueDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if the task is overdue
    const isOverdue = date < today;
    const overdueClass = isOverdue ? ' overdue' : '';

    // Format: "Apr 11" style
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `
        <span class="task-card-due${overdueClass}">
            <i class="ph ph-calendar-blank"></i>
            ${formatted}
        </span>
    `;
}


// ==================== MODAL FUNCTIONS ====================

// Open the modal for creating a new task

function openCreateModal() {
    // Reset form fields
    elements.taskTitle.value = '';
    elements.taskDescription.value = '';
    elements.taskPriority.value = 'Medium';
    elements.taskStatus.value = 'To Do';
    elements.taskDueDate.value = '';

    // Clear editing state - creating, not editing
    state.editingTaskId = null;
    state.selectedTags = [];

    // Update modal title and button text
    elements.modalTitle.textContent = 'New Task';
    elements.saveTask.textContent = 'Create Task';

    // Render tag options in the modal
    renderTagSelector();

    // Show the modal by adding the 'active' class
    // classList.add() and classList.remove() is how things can be shown/hidden
    // Connects directly to what is in CSS e.g., .modal-overlay { display: none } and overlay.active { display: flex }
    // Adding active class triggers the CSS to make it visible. Removing it hides it.
    // No show/hide logic - just using CSS classes being toggled basically.
    elements.taskModal.classList.add('active');

    // Auto-focus the title field so user can start typing immediately
    elements.taskTitle.focus();
}


// Open the modal pre-filled with existing task data for editing
// @param {number} taskId - ID of the task to edit

function openEditModal(taskId) {
    // Find the task in the state
    // .find() returns the first item that matches like .filter but gives one items instead of an array
    // Python equivalent:
    // task = next((t for t in tasks if t.id == task_id), None)
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Fill form fields with existing data
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description || '';
    elements.taskPriority.value = task.priority;
    elements.taskStatus.value = task.status;
    elements.taskDueDate.value = task.due_date || '';

    // Set editing state so saveTask knows to use PUT instead of POST
    state.editingTaskId = taskId;
    state.selectedTags = task.tags.map(tag => tag.id);

    // Update modal title and button text
    elements.modalTitle.textContent = 'Edit Task';
    elements.saveTask.textContent = 'Save Changes';

    // Render tag options with current tags pre-selected
    renderTagSelector();

    // Show the modal
    elements.taskModal.classList.add('active');
}


// Close the modal and reset state

function closeTaskModal() {
    elements.taskModal.classList.remove('active');
    state.editingTaskId = null;
    state.selectedTags = [];
}


// Render clickable tag options inside the modal form

function renderTagSelector() {
    // Build a clickable pill for each tag
    elements.tagSelector.innerHTML = state.tags.map(tag => {
        // Check if this tag is already selected
        const isSelected = state.selectedTags.includes(tag.id);
        return `
            <span class="tag-option ${isSelected ? 'selected' : ''}"
                  data-id="${tag.id}"
                  style="background: ${tag.color}20; color: ${tag.color};">
                ${tag.name}
            </span>
        `;
    }).join('');

    // Attach click listeners to each tag pill
    elements.tagSelector.querySelectorAll('.tag-option').forEach(option => {
        option.addEventListener('click', () => {
            const tagId = parseInt(option.dataset.id);
            toggleTagSelection(tagId);
        });
    });
}



// Toggle a tag's selected state in the modal
// @param {number} tagId - ID of the tag to toggle

function toggleTagSelection(tagId) {
    // If already selected, remove it. If not, add it.
    const index = state.selectedTags.indexOf(tagId);
    if (index > -1) {
        // splice removes 1 item at the given index
        // .splice(index, num) removes an item from an array starting at a specific position - <num> specifies how many
        // similar to Python's list.pop(index) except having to specify the numbers of items to be removed
        state.selectedTags.splice(index, 1);
    } else {
        state.selectedTags.push(tagId);
    }

    // Re-render to update visual state
    renderTagSelector();
}


// Collect form data and send it to the API

function handleSaveTask() {
    // Validate - title is required
    // .trim() is like Python's .strip()
    const title = elements.taskTitle.value.trim();
    if (!title) {
        elements.taskTitle.style.borderColor = 'var(--priority-high)';
        return;
    }

    // Build the data object to send
    const taskData = {
        title: title,
        description: elements.taskDescription.value.trim(),
        priority: elements.taskPriority.value,
        status: elements.taskStatus.value,
        due_date: elements.taskDueDate.value || null,
        tag_ids: state.selectedTags
    };

    // saveTask handles both create and update based on editingTaskId
    saveTask(taskData);
}


// ==================== DETAIL PANEL FUNCTIONS ====================


// Open the slide-out panel showing task details
// @param {number} taskId - ID of the task to display

function openDetailPanel(taskId) {
    // .find() returns the first item that matches - like Python's next() with a generator
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Store which task we're viewing for edit/delete actions
    state.viewingTaskId = taskId;

    // Populate all the detail fields
    elements.detailTitle.textContent = task.title;
    elements.detailStatus.textContent = task.status;
    elements.detailPriority.textContent = task.priority;
    elements.detailDescription.textContent = task.description || 'No description';

    // Format the due date or show a dash
    elements.detailDueDate.textContent = task.due_date
        ? new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        })
        : '—';

    // Format created date
    elements.detailCreated.textContent = task.created_at
        ? new Date(task.created_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        })
        : '—';

    // Render tags in the detail panel
    elements.detailTags.innerHTML = task.tags.length > 0
        ? task.tags.map(tag =>
            `<span class="task-tag" style="background: ${tag.color}20; color: ${tag.color};">${tag.name}</span>`
        ).join('')
        : '<span class="detail-value">No tags</span>';

    // Apply priority color to the priority text
    elements.detailPriority.className = `detail-value priority-text-${task.priority.toLowerCase()}`;

    // Show the panel
    elements.detailOverlay.classList.add('active');
}


// Close the detail panel

function closeDetailPanel() {
    elements.detailOverlay.classList.remove('active');
    state.viewingTaskId = null;
}


// ==================== DRAG AND DROP ====================
// SortableJS handles the complex drag-and-drop interactions
// I just configure it and tell it what to do when a card moves

// Initialize drag-and-drop on all three Kanban columns

function initSortable() {
    // Loop through each .task-list column and make it sortable
    elements.taskLists.forEach(list => {
        new Sortable(list, {
            // 'shared' group name means cards can move between all columns
            group: 'tasks',

            // CSS class applied to the ghost element while dragging
            ghostClass: 'sortable-ghost',

            // CSS class applied to the card being dragged
            dragClass: 'dragging',

            // Animation speed in milliseconds for card movement
            animation: 200,

            // Delay before drag starts (prevents accidental drags when clicking)
            delay: 50,

            // Only allow dragging by the card itself
            draggable: '.task-card',

            // Called when a card is dropped in any column
            onEnd: function (evt) {
                // evt.to is the column the card was dropped into
                // evt.to.dataset.status reads the data-status attribute ('To Do', 'In Progress', 'Done')
                const newStatus = evt.to.dataset.status;

                // Build an array of all cards in the target column with their new positions
                // evt.to.children gives us all card elements in the column
                const updates = [];
                Array.from(evt.to.children).forEach((card, index) => {
                    // Skip empty state divs
                    if (!card.classList.contains('task-card')) return;

                    updates.push({
                        id: parseInt(card.dataset.id),
                        status: newStatus,
                        position: index
                    });
                });

                // Also update positions in the source column if it's different
                if (evt.from !== evt.to) {
                    const oldStatus = evt.from.dataset.status;
                    Array.from(evt.from.children).forEach((card, index) => {
                        if (!card.classList.contains('task-card')) return;

                        updates.push({
                            id: parseInt(card.dataset.id),
                            status: oldStatus,
                            position: index
                        });
                    });
                }

                // Send the updates to the backend
                reorderTasks(updates);

                // Update local state to match what just happened visually
                updates.forEach(update => {
                    const task = state.tasks.find(t => t.id === update.id);
                    if (task) {
                        task.status = update.status;
                        task.position = update.position;
                    }
                });

                // Re-render to update column counts
                renderBoard();
            }
        });
    });
}


// ==================== EVENT LISTENERS ====================
// Wire up all the buttons and interactions
// This is like Tkinter's .bind() or command= on buttons

// Open create modal when "New Task" button is clicked
elements.addTaskBtn.addEventListener('click', openCreateModal);

// Close modal with X button or Cancel button
elements.closeModal.addEventListener('click', closeTaskModal);
elements.cancelTask.addEventListener('click', closeTaskModal);

// Close modal when clicking the dark overlay behind it
elements.taskModal.addEventListener('click', (e) => {
    // (e) becomes the event object. Whenever an event fires, JS passes an event object to the function
    // It contains info about what happened. e.target is the element that was clicked - e.key is which key was pressed
    // e.target.value is the current value of an input field
    // If they clicked the overlay itself (not the modal box), close it
    if (e.target === elements.taskModal) closeTaskModal();
});

// Save task when clicking Create/Save button
elements.saveTask.addEventListener('click', handleSaveTask);

// Close detail panel
elements.closePanel.addEventListener('click', closeDetailPanel);
elements.detailOverlay.addEventListener('click', (e) => {
    if (e.target === elements.detailOverlay) closeDetailPanel();
});

// Edit button in detail panel - close panel, open edit modal
elements.editTaskBtn.addEventListener('click', () => {
    const taskId = state.viewingTaskId;
    closeDetailPanel();
    openEditModal(taskId);
});

// Delete button in detail panel
elements.deleteTaskBtn.addEventListener('click', () => {
    const taskId = state.viewingTaskId;
    // confirm() is a neat built-in browser dialog that shows OK/Cancel and returns true/false
    // Use it as a means to confirm so nothing gets deleted accidentally
    if (confirm("Are you sure you want to delete this task?")) {
        deleteTask(taskId);
    }
});

// Search input - filter as user types
elements.searchInput.addEventListener('input', (e) => {
    // e.target.value is the current text in the input field
    state.filters.search = e.target.value;
    renderBoard();
});

// Priority filter button - cycles through: All -> High -> Medium -> Low -> All
elements.filterPriority.addEventListener('click', () => {
    const priorities = [null, 'High', 'Medium', 'Low'];
    // Find current position in the cycle
    const currentIndex = priorities.indexOf(state.filters.priority);
    // Move to next, wrap around to 0 if at the end
    // % operator is the same as Python's % operator. Same concept to wrap around to 0 when the end is reached
    const nextIndex = (currentIndex + 1) % priorities.length;
    state.filters.priority = priorities[nextIndex];

    // Update button text to show current filter
    const label = state.filters.priority || 'Priority';
    elements.filterPriority.innerHTML = `<i class="ph ph-funnel"></i> ${label}`;

    // Toggle active styling
    elements.filterPriority.classList.toggle('active', state.filters.priority !== null);

    renderBoard();
});

// Tag filter button - cycles through all available tags
elements.filterTags.addEventListener('click', () => {
    // Build cycle: null (all) -> tag1 -> tag2 -> ... -> null
    // ... is the spread operator in JS. It unpacks an array into individual items like Python's * unpacking
    const tagIds = [null, ...state.tags.map(t => t.id)];
    const currentIndex = tagIds.indexOf(state.filters.tagId);
    const nextIndex = (currentIndex + 1) % tagIds.length;
    state.filters.tagId = tagIds[nextIndex];

    // Find the tag name for display
    const activeTag = state.tags.find(t => t.id === state.filters.tagId);
    const label = activeTag ? activeTag.name : 'Tags';
    elements.filterTags.innerHTML = `<i class="ph ph-tag"></i> ${label}`;

    elements.filterTags.classList.toggle('active', state.filters.tagId !== null);

    renderBoard();
});

// Keyboard shortcut - press Escape to close modal or panel
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (elements.taskModal.classList.contains('active')) {
            closeTaskModal();
        } else if (elements.detailOverlay.classList.contains('active')) {
            closeDetailPanel();
        }
    }
});


// ==================== INITIALIZATION ====================
// This runs when the page first loads - kicks everything off

async function init() {
    // Fetch tags first since tasks reference them
    await fetchTags();
    // Then fetch tasks and render the board
    await fetchTasks();
    // Initialize drag & drop after the board is rendered
    initSortable();
}


// Start the app
init();
