const API_URL = 'http://127.0.0.1:8000/api/v1';

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboard = document.getElementById('dashboard');
const globalError = document.getElementById('global-error');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const createTaskForm = document.getElementById('create-task-form');
const updateProfileForm = document.getElementById('update-profile-form');
const taskList = document.getElementById('task-list');

const editTaskForm = document.getElementById('edit-task-form');
const taskEditorPanel = document.getElementById('task-editor-panel');

const logoutBtn = document.getElementById('logout-btn');
const adminBtn = document.getElementById('admin-btn');
const myTasksBtn = document.getElementById('my-tasks-btn');
const profileBtn = document.getElementById('profile-btn');

const dashboardTitle = document.getElementById('dashboard-title');
const taskCreatorPanel = document.getElementById('task-creator-panel');
const profileView = document.getElementById('profile-view');

// State
let token = localStorage.getItem('token') || null;
let currentUser = null;
let activeTasks = [];

// Initialization
function init() {
    if (token) {
        initializeUserAndDashboard();
    } else {
        showAuth();
    }
}

// UI State Toggles
function showAuth() {
    authView.style.display = 'block';
    dashboard.style.display = 'none';
    currentUser = null;
    clearError();
}

async function initializeUserAndDashboard() {
    try {
        currentUser = await apiFetch('/auth/me');
        authView.style.display = 'none';
        dashboard.style.display = 'block';
        clearError();
        
        // Hide profile panel by default
        profileView.style.display = 'none';
        
        if (currentUser.role === 'admin') {
            adminBtn.style.display = 'none'; // already in admin
            fetchAllTasksAdmin();
        } else {
            adminBtn.style.display = 'none'; // hide explicitly 
            showPersonalDashboard();
        }
    } catch(err) {
        if(err.message.includes("401")) {
            showError('Session expired. Please log in again.');
        } else {
            showError('Failed to load user profile: ' + err.message);
        }
        handleLogout();
    }
}

function showPersonalDashboard() {
    profileView.style.display = 'none';
    myTasksBtn.style.display = 'none';
    taskCreatorPanel.style.display = 'block';
    if(currentUser.role === 'admin') {
        adminBtn.style.display = 'block';
    }
    dashboardTitle.textContent = 'My Tasks (' + escapeHTML(currentUser.name) + ')';
    fetchTasks();
}

function showProfile() {
    profileView.style.display = profileView.style.display === 'none' ? 'block' : 'none';
    if(profileView.style.display === 'block'){
        document.getElementById('prof-name').value = currentUser.name;
        document.getElementById('prof-email').value = currentUser.email;
        document.getElementById('prof-password').value = '';
    }
}

function showError(msg) {
    globalError.textContent = msg;
    globalError.style.display = 'block';
    globalError.style.background = 'rgba(239, 68, 68, 0.1)';
    globalError.style.color = '#ef4444';
    globalError.style.borderColor = 'rgba(239, 68, 68, 0.2)';
    setTimeout(clearError, 5000);
}

function showSuccess(msg) {
    globalError.textContent = msg;
    globalError.style.display = 'block';
    globalError.style.background = 'rgba(34, 197, 94, 0.1)';
    globalError.style.color = '#22c55e';
    globalError.style.borderColor = 'rgba(34, 197, 94, 0.2)';
    setTimeout(clearError, 5000);
}

function clearError() {
    globalError.style.display = 'none';
}

// Core Fetch API
async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Accept': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
        response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    } catch (e) {
        throw new Error('Network error. Ensure the FastAPI server is running.');
    }
    
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch(e) {}
        
        throw new Error(errorData?.detail || `HTTP Error ${response.status}`);
    }
    
    if (response.status !== 204) {
        return await response.json();
    }
}

// Auth Handlers
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    try {
        const data = await apiFetch('/auth/login', {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        token = data.access_token;
        localStorage.setItem('token', token);
        loginForm.reset();
        await initializeUserAndDashboard();
    } catch (err) {
        showError('Login failed: ' + err.message);
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    const payload = { name, email, password };
    
    try {
        await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        registerForm.reset();
        showSuccess(`Account Created! You can now sign in.`);
    } catch (err) {
        showError('Registration failed: ' + err.message);
    }
});

// Profile Updater
updateProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('prof-name').value;
    const email = document.getElementById('prof-email').value;
    const password = document.getElementById('prof-password').value;
    
    const payload = {};
    if(name && name !== currentUser.name) payload.name = name;
    if(email && email !== currentUser.email) payload.email = email;
    if(password) payload.password = password;
    
    if(Object.keys(payload).length === 0) {
        showError("No changes made.");
        return;
    }
    
    try {
        const updatedUser = await apiFetch('/auth/me', {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        
        // Log user out if email or password changed so auth constraints remain airtight
        if (payload.password || payload.email !== currentUser.email) {
            showSuccess('Security details updated successfully. Please log in again.');
            handleLogout();
        } else {
            currentUser = updatedUser;
            showSuccess('Profile updated successfully.');
            showProfile(); // toggles it off
            // Redraw active dashboard title
            if(!dashboardTitle.textContent.includes('System')) showPersonalDashboard();
        }
    } catch (err) {
        showError('Profile update failed: ' + err.message);
    }
});

logoutBtn.addEventListener('click', handleLogout);

function handleLogout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    showAuth();
}

// Toggles
adminBtn.addEventListener('click', fetchAllTasksAdmin);
myTasksBtn.addEventListener('click', showPersonalDashboard);
profileBtn.addEventListener('click', showProfile);

// Tasks
createTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const payload = { title, description: desc || null, status: 'pending' };
    
    try {
        await apiFetch('/tasks/', {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        createTaskForm.reset();
        fetchTasks();
    } catch (err) {
        showError('Failed to create task: ' + err.message);
    }
});

async function fetchTasks() {
    try {
        const tasks = await apiFetch('/tasks/');
        activeTasks = tasks;
        renderTasks(tasks, false);
    } catch (err) {
        showError('Failed to load tasks: ' + err.message);
    }
}

async function fetchAllTasksAdmin() {
    try {
        const tasks = await apiFetch('/tasks/admin/all-tasks');
        profileView.style.display = 'none';
        dashboardTitle.textContent = 'System Tasks (Admin Mode)';
        taskCreatorPanel.style.display = 'none';
        adminBtn.style.display = 'none';
        myTasksBtn.style.display = 'block';
        showSuccess('Loaded all users tasks.');
        activeTasks = tasks;
        renderTasks(tasks, true);
    } catch (err) {
        showError('Access denied: ' + err.message);
    }
}

async function deleteTask(id) {
    if(!confirm("Delete this task permanently?")) return;
    try {
        await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
        if (dashboardTitle.textContent.includes('Admin')) {
            fetchAllTasksAdmin();
        } else {
            fetchTasks();
        }
    } catch (err) {
        showError('Failed to delete task: ' + err.message);
    }
}

function editTask(id) {
    const task = activeTasks.find(t => t.id === id);
    if (!task) return;
    
    taskCreatorPanel.style.display = 'none';
    taskEditorPanel.style.display = 'block';
    
    document.getElementById('edit-task-id').value = task.id;
    document.getElementById('edit-task-title').value = task.title;
    document.getElementById('edit-task-desc').value = task.description || '';
    document.getElementById('edit-task-status').value = task.status || 'pending';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeEditPanel() {
    taskEditorPanel.style.display = 'none';
    taskCreatorPanel.style.display = 'block';
    editTaskForm.reset();
}

editTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-task-title').value;
    const desc = document.getElementById('edit-task-desc').value;
    const status = document.getElementById('edit-task-status').value;
    
    const payload = { title, description: desc || null, status };
    
    try {
        await apiFetch(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
        });
        closeEditPanel();
        if (dashboardTitle.textContent.includes('Admin')) {
            fetchAllTasksAdmin();
        } else {
            fetchTasks();
        }
    } catch (err) {
        showError('Failed to update task: ' + err.message);
    }
});

function renderTasks(tasks, isAdminContext) {
    taskList.innerHTML = '';
    if (!tasks || tasks.length === 0) {
        taskList.innerHTML = '<p style="text-align:center; color: var(--text-muted); padding: 1rem 0;">No tasks found.</p>';
        return;
    }
    
    tasks.forEach(task => {
        const el = document.createElement('div');
        el.className = 'task-item';
        
        const safeTitle = escapeHTML(task.title);
        const safeDesc = escapeHTML(task.description || 'No description provided');
        
        let ownerData = '';
        if (isAdminContext && task.owner) {
            const ownerName = escapeHTML(task.owner.name);
            const ownerEmail = escapeHTML(task.owner.email);
            // This displays exactly what the user requested: Owner Name and Email
            ownerData = `<span class="admin-badge">Owner: ${ownerName} (${ownerEmail})</span>`;
        }
        
        let actionBtns = !isAdminContext ? `
            <div style="display:flex; gap:0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
                <button class="btn-outline" style="padding:0.4rem 0.6rem; font-size:0.85rem;" onclick="editTask(${task.id})">Edit</button>
                <button class="danger" style="padding:0.4rem 0.6rem; font-size:0.85rem;" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        ` : '';
        
        // Render badge for status
        let statusColor = task.status === 'completed' ? '#22c55e' : (task.status === 'in-progress' ? '#eab308' : '#64748b');
        let statusBadge = `<span style="font-size: 0.75rem; background: ${statusColor}; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block;">${task.status}</span>`;
        
        el.innerHTML = `
            <div class="task-info" style="width: 100%;">
                ${ownerData}
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <h3 style="margin-bottom: 0.5rem;">${safeTitle}</h3>
                    ${statusBadge}
                </div>
                <p style="margin-bottom: 0.5rem;">${safeDesc}</p>
                ${actionBtns}
            </div>
        `;
        taskList.appendChild(el);
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString().replace(/[&<>'"]/g, 
        t => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t])
    );
}

// Kickoff
init();
