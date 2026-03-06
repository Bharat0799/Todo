// --- DOM ELEMENT SELECTION ---
document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskCategoryInput = document.getElementById('task-category');
    const taskList = document.getElementById('task-list');
    const searchBar = document.getElementById('search-bar');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const themeToggle = document.getElementById('theme-toggle');

    let tasks = (JSON.parse(localStorage.getItem('tasks')) || []).map(task => ({
        ...task,
        subtasks: task.subtasks || []
    }));
    let currentFilter = 'all';
    let searchTerm = '';
    let editTaskId = null;

    // --- CORE FUNCTIONS ---

    /**
     * Saves the current tasks array to localStorage.
     */
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    /**
     * Renders tasks to the DOM based on current filters and search term.
     */
    const renderTasks = () => {
        taskList.innerHTML = '';

        let filteredTasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesFilter = () => {
                switch (currentFilter) {
                    case 'pending':
                        return !task.completed;
                    case 'completed':
                        return task.completed;
                    case 'high-priority':
                        return task.priority === 'high';
                    case 'due-today':
                        const today = new Date().toISOString().slice(0, 10);
                        return task.dueDate === today;
                    case 'all':
                    default:
                        return true;
                }
            };
            return matchesSearch && matchesFilter();
        });

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<p class="no-tasks">No tasks found. Add one above!</p>';
        } else {
            filteredTasks.forEach(task => {
                const taskCard = document.createElement('li');
                taskCard.className = `task-card ${task.completed ? 'completed' : ''}`;
                taskCard.setAttribute('data-id', task.id);

                const priorityClass = `priority-${task.priority}`;

                taskCard.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <div class="task-card-content">
                        <p class="task-card-title">${task.title}</p>
                        <div class="task-card-meta">
                            <span>Due: ${task.dueDate || 'No date'}</span>
                            <span class="priority-badge ${priorityClass}">${task.priority}</span>
                            <span class="category-tag">${task.category}</span>
                        </div>
                        <ul class="subtask-list">
                            ${task.subtasks.map(subtask => `
                                <li class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subid="${subtask.id}">
                                    <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                                    <span>${subtask.title}</span>
                                    <button class="subtask-delete-btn">🗑️</button>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    <div class="task-card-actions">
                        <button class="task-action-btn add-subtask-btn">➕</button>
                        <button class="task-action-btn edit-btn">✏️</button>
                        <button class="task-action-btn delete-btn">🗑️</button>
                    </div>
                `;
                taskList.appendChild(taskCard);
            });
        }
        updateProgress();
    };

    /**
     * Updates the progress bar and text.
     */
    const updateProgress = () => {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        progressText.textContent = `${completedTasks} / ${totalTasks} tasks completed`;
        progressBar.style.width = `${percentage}%`;
    };

    /**
     * Shows a confetti animation.
     */
    const showConfetti = () => {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.animationDuration = `${Math.random() * 2 + 3}s`;
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            document.body.appendChild(confetti);
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    };
    
    // Add confetti styles
    const style = document.createElement('style');
    style.innerHTML = `
    .confetti {
        position: fixed;
        top: -10px;
        width: 10px;
        height: 10px;
        opacity: 0.8;
        pointer-events: none;
        animation: fall linear forwards;
    }
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }`;
    document.head.appendChild(style);

    // --- EVENT LISTENERS ---

    /**
     * Handle new task creation or task update.
     */
    taskForm.addEventListener('submit', e => {
        e.preventDefault();
        const title = taskTitleInput.value.trim();
        if (!title) return;

        if (editTaskId) {
            // Update existing task
            const task = tasks.find(t => t.id === editTaskId);
            task.title = title;
            task.dueDate = taskDueDateInput.value;
            task.priority = taskPriorityInput.value;
            task.category = taskCategoryInput.value;
            editTaskId = null;
        } else {
            // Create new task
            const newTask = {
                id: Date.now(),
                title: title,
                dueDate: taskDueDateInput.value,
                priority: taskPriorityInput.value,
                category: taskCategoryInput.value,
                completed: false,
                subtasks: [],
            };
            tasks.push(newTask);
        }

        taskForm.reset();
        taskForm.querySelector('button').textContent = 'Add Task';
        saveTasks();
        renderTasks();
    });

    /**
     * Handle task actions: complete, edit, delete.
     */
    taskList.addEventListener('click', e => {
        const card = e.target.closest('.task-card');
        if (!card) return;
        const taskId = Number(card.getAttribute('data-id'));

        // Complete task
        if (e.target.classList.contains('task-checkbox')) {
            const task = tasks.find(t => t.id === taskId);
            task.completed = e.target.checked;
        
            // If the main task is checked, complete all subtasks
            if (task.completed) {
                task.subtasks.forEach(sub => sub.completed = true);
                showConfetti();
            } else {
                // If the main task is unchecked, uncheck all subtasks
                task.subtasks.forEach(sub => sub.completed = false);
            }
        
            saveTasks();
            renderTasks();
        }

        // Complete subtask
        if (e.target.classList.contains('subtask-checkbox')) {
            const subtaskItem = e.target.closest('.subtask-item');
            const subtaskId = Number(subtaskItem.getAttribute('data-subid'));
            const task = tasks.find(t => t.id === taskId);
            const subtask = task.subtasks.find(st => st.id === subtaskId);
        
            subtask.completed = e.target.checked;
        
            // Check if all subtasks are completed
            const allSubtasksCompleted = task.subtasks.every(st => st.completed);
            if (allSubtasksCompleted) {
                task.completed = true;
                showConfetti();
            } else {
                task.completed = false;
            }
        
            saveTasks();
            renderTasks();
        }

        // Delete task
        if (e.target.classList.contains('delete-btn')) {
            card.classList.add('task-exit');
            setTimeout(() => {
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks();
                renderTasks();
            }, 300);
        }
        
        // Edit task
        if (e.target.classList.contains('edit-btn')) {
            const task = tasks.find(t => t.id === taskId);
            taskTitleInput.value = task.title;
            taskDueDateInput.value = task.dueDate;
            taskPriorityInput.value = task.priority;
            taskCategoryInput.value = task.category;
            editTaskId = taskId;
            taskForm.querySelector('button').textContent = 'Update Task';
            taskTitleInput.focus();
        }

        // Add subtask
        if (e.target.classList.contains('add-subtask-btn')) {
            const task = tasks.find(t => t.id === taskId);
            const subtaskTitle = prompt('Enter subtask:');
            if (subtaskTitle) {
                const newSubtask = {
                    id: Date.now(),
                    title: subtaskTitle,
                    completed: false,
                };
                task.subtasks.push(newSubtask);
                saveTasks();
                renderTasks();
            }
        }

        // Delete subtask
        if (e.target.classList.contains('subtask-delete-btn')) {
            const subtaskItem = e.target.closest('.subtask-item');
            const subtaskId = Number(subtaskItem.getAttribute('data-subid'));
            const task = tasks.find(t => t.id === taskId);
            task.subtasks = task.subtasks.filter(st => st.id !== subtaskId);
            saveTasks();
            renderTasks();
        }
    });

    /**
     * Handle live search filtering.
     */
    searchBar.addEventListener('input', e => {
        searchTerm = e.target.value;
        renderTasks();
    });

    /**
     * Handle filter button clicks.
     */
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    /**
     * Handle theme toggling and save preference.
     */
    themeToggle.addEventListener('change', () => {
        const theme = themeToggle.checked ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });


    // --- INITIALIZATION ---

    /**
     * Set initial theme from localStorage.
     */
    const loadTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'light';
    };

    /**
     * Initialize SortableJS for drag-and-drop.
     */
    new Sortable(taskList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
            const element = tasks.splice(evt.oldIndex, 1)[0];
            tasks.splice(evt.newIndex, 0, element);
            saveTasks();
        }
    });

    // Initial load
    loadTheme();
    renderTasks();
});
