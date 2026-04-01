// Модель задачи
class Task {
    constructor(id, title, description, category, priority, deadline, completed = false) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.deadline = deadline;
        this.completed = completed;
        this.createdAt = new Date().toISOString();
    }
}

// Управление задачами
class TaskManager {
    constructor() {
        this.tasks = [];
        this.loadFromLocalStorage();
    }
    
    addTask(task) {
        this.tasks.push(task);
        this.saveToLocalStorage();
        return task;
    }
    
    updateTask(id, updatedData) {
        const index = this.tasks.findIndex(t => t.id == id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updatedData };
            this.saveToLocalStorage();
            return this.tasks[index];
        }
        return null;
    }
    
    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id != id);
        this.saveToLocalStorage();
    }
    
    toggleComplete(id) {
        const task = this.tasks.find(t => t.id == id);
        if (task) {
            task.completed = !task.completed;
            this.saveToLocalStorage();
            return task;
        }
        return null;
    }
    
    getTasks() {
        return this.tasks;
    }
    
    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const highPriority = this.tasks.filter(t => t.priority === 'high' && !t.completed).length;
        
        return { total, completed, pending, highPriority };
    }
    
    saveToLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    loadFromLocalStorage() {
        const saved = localStorage.getItem('tasks');
        if (saved) {
            this.tasks = JSON.parse(saved);
        }
    }
}

// Функция уведомлений
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${colors[type] || colors.success};
        color: white;
        border-radius: 8px;
        font-weight: bold;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Добавляем анимации для уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Инициализация
const taskManager = new TaskManager();

// DOM элементы
let currentEditId = null;

document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    updateStats();
    setupEventListeners();
    setupThemeToggle();
    showNotification('Добро пожаловать в Task Manager!', 'info');
});

function setupEventListeners() {
    document.getElementById('add-task-btn').addEventListener('click', openAddModal);
    document.querySelector('.close-btn').addEventListener('click', closeModal);
    document.getElementById('task-form').addEventListener('submit', handleTaskSubmit);
    document.getElementById('search-input').addEventListener('input', filterTasks);
    document.getElementById('category-filter').addEventListener('change', filterTasks);
    document.getElementById('priority-filter').addEventListener('change', filterTasks);
    window.addEventListener('click', (e) => {
        if (e.target === document.getElementById('task-modal')) closeModal();
    });
}

function openAddModal() {
    currentEditId = null;
    document.getElementById('modal-title').textContent = 'Добавить задачу';
    document.getElementById('task-form').reset();
    document.getElementById('task-modal').style.display = 'flex';
}

function openEditModal(taskId) {
    const task = taskManager.getTasks().find(t => t.id == taskId);
    if (!task) return;
    
    currentEditId = taskId;
    document.getElementById('modal-title').textContent = 'Редактировать задачу';
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-desc').value = task.description || '';
    document.getElementById('task-category').value = task.category;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-deadline').value = task.deadline || '';
    document.getElementById('task-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('task-modal').style.display = 'none';
    currentEditId = null;
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        category: document.getElementById('task-category').value,
        priority: document.getElementById('task-priority').value,
        deadline: document.getElementById('task-deadline').value
    };
    
    if (!taskData.title.trim()) {
        showNotification('Введите название задачи', 'error');
        return;
    }
    
    if (currentEditId) {
        taskManager.updateTask(currentEditId, taskData);
        showNotification('✅ Задача обновлена', 'success');
    } else {
        const newTask = new Task(
            Date.now(),
            taskData.title,
            taskData.description,
            taskData.category,
            taskData.priority,
            taskData.deadline
        );
        taskManager.addTask(newTask);
        showNotification('✅ Задача добавлена', 'success');
    }
    
    closeModal();
    renderTasks();
    updateStats();
}

function renderTasks() {
    const tasks = taskManager.getTasks();
    const container = document.getElementById('tasks-list');
    
    if (tasks.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">✨ Нет задач. Нажмите "Новая задача" чтобы добавить!</p>';
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="task-card">
            <div class="task-info">
                <div class="task-title ${task.completed ? 'completed' : ''}">
                    ${escapeHtml(task.title)}
                </div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span>📁 ${getCategoryName(task.category)}</span>
                    <span class="priority-${task.priority}">${getPriorityIcon(task.priority)} ${getPriorityName(task.priority)}</span>
                    ${task.deadline ? `<span>📅 ${task.deadline}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleComplete(${task.id})">
                    ${task.completed ? '↩️ Вернуть' : '✅ Выполнить'}
                </button>
                <button class="edit-btn" onclick="openEditModal(${task.id})">✏️</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function toggleComplete(id) {
    const task = taskManager.toggleComplete(id);
    if (task) {
        const message = task.completed ? '✅ Задача выполнена!' : '↩️ Задача возвращена в работу';
        showNotification(message, 'success');
    }
    renderTasks();
    updateStats();
}

function deleteTask(id) {
    if (confirm('Удалить задачу?')) {
        taskManager.deleteTask(id);
        renderTasks();
        updateStats();
        showNotification('🗑️ Задача удалена', 'info');
    }
}

function updateStats() {
    const stats = taskManager.getStats();
    const container = document.getElementById('stats-container');
    
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.total}</div>
            <div class="stat-label">Всего задач</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.completed}</div>
            <div class="stat-label">Выполнено</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.pending}</div>
            <div class="stat-label">В работе</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.highPriority}</div>
            <div class="stat-label">Высокий приоритет</div>
        </div>
    `;
}

function filterTasks() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const priorityFilter = document.getElementById('priority-filter').value;
    
    let filtered = taskManager.getTasks();
    
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(searchTerm) ||
            (t.description && t.description.toLowerCase().includes(searchTerm))
        );
    }
    
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    if (priorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    
    const container = document.getElementById('tasks-list');
    
    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: white; text-align: center; padding: 2rem;">🔍 Ничего не найдено</p>';
        return;
    }
    
    container.innerHTML = filtered.map(task => `
        <div class="task-card">
            <div class="task-info">
                <div class="task-title ${task.completed ? 'completed' : ''}">
                    ${escapeHtml(task.title)}
                </div>
                ${task.description ? `<div class="task-desc">${escapeHtml(task.description)}</div>` : ''}
                <div class="task-meta">
                    <span>📁 ${getCategoryName(task.category)}</span>
                    <span class="priority-${task.priority}">${getPriorityIcon(task.priority)} ${getPriorityName(task.priority)}</span>
                    ${task.deadline ? `<span>📅 ${task.deadline}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleComplete(${task.id})">
                    ${task.completed ? '↩️ Вернуть' : '✅ Выполнить'}
                </button>
                <button class="edit-btn" onclick="openEditModal(${task.id})">✏️</button>
                <button class="delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        themeBtn.textContent = '☀️';
    }
    
    themeBtn.onclick = () => {
        document.body.classList.toggle('dark');
        const isDark = document.body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeBtn.textContent = isDark ? '☀️' : '🌙';
        showNotification(isDark ? '🌙 Тёмная тема включена' : '☀️ Светлая тема включена', 'info');
    };
}

function getCategoryName(category) {
    const names = { work: 'Работа', personal: 'Личное', study: 'Учеба' };
    return names[category] || category;
}

function getPriorityName(priority) {
    const names = { high: 'Высокий', medium: 'Средний', low: 'Низкий' };
    return names[priority] || priority;
}

function getPriorityIcon(priority) {
    const icons = { high: '🔴', medium: '🟡', low: '🟢' };
    return icons[priority] || '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
