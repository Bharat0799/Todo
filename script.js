document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selectors ---
    const addTaskForm = document.getElementById('add-task-form');
    const taskTitleInput = document.getElementById('task-title');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskPriorityInput = document.getElementById('task-priority');
    const taskList = document.getElementById('task-list');
    const searchBar = document.getElementById('search-bar');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const progressText = document.getElementById('progress-text');
    const progressBar = document.getElementById('progress-bar');
    const themeToggle = document.getElementById('theme-toggle');
    const confettiCanvas = document.getElementById('confetti-canvas');

    // --- State Management ---
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    const confetti = new ConfettiGenerator({ target: confettiCanvas, max: 80, size: 1, animate: true, props: ['circle', 'square', 'triangle', 'line'], clock: 25 });
    confetti.render();

    // --- Main Functions ---

    /**
     * Saves tasks to localStorage and re-renders the task list.
     */
    const saveAndRender = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderTasks();
        updateProgress();
    };

    /**
     * Renders tasks based on the current filter and search query.
     */
    const renderTasks = () => {
        const searchTerm = searchBar.value.toLowerCase();
        
        const filteredTasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm);
            const matchesFilter = 
                currentFilter === 'all' ||
                (currentFilter === 'completed' && task.completed) ||
                (currentFilter === 'pending' && !task.completed) ||
                (currentFilter === 'high' && task.priority === 'high');
            return matchesSearch && matchesFilter;
        });

        taskList.innerHTML = '';
        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<li class="task-item" style="justify-content: center; color: var(--text-secondary);">No tasks found.</li>';
        } else {
            filteredTasks.forEach(task => {
                const taskElement = createTaskElement(task);
                taskList.appendChild(taskElement);
            });
        }
    };

    /**
     * Creates an HTML element for a single task.
     * @param {object} task - The task object.
     * @returns {HTMLElement} The list item element for the task.
     */
    const createTaskElement = (task) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.dataset.id = task.id;

        const isDueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();

        li.innerHTML = `
            <input type="checkbox" class="complete-checkbox" ${task.completed ? 'checked' : ''}>
            <div class="task-details">
                <p class="task-title">${task.title}</p>
                <div class="task-meta">
                    <span class="priority-label ${task.priority}">${task.priority}</span>
                    ${task.dueDate ? `<span class="due-date">${task.dueDate} ${isDueToday ? '<i class="fa-solid fa-triangle-exclamation"></i>' : ''}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        return li;
    };

    /**
     * Updates the progress bar and summary text.
     */
    const updateProgress = () => {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        progressText.textContent = `${completedTasks} / ${totalTasks} tasks completed`;
        progressBar.style.width = `${progressPercentage}%`;
    };

    /**
     * Handles adding a new task.
     * @param {Event} e - The form submission event.
     */
    const addTask = (e) => {
        e.preventDefault();
        const title = taskTitleInput.value.trim();
        if (!title) return;

        const newTask = {
            id: Date.now(),
            title,
            dueDate: taskDueDateInput.value,
            priority: taskPriorityInput.value,
            completed: false
        };

        tasks.unshift(newTask); // Add to the beginning
        addTaskForm.reset();
        taskPriorityInput.value = 'medium'; // Reset priority to default
        
        saveAndRender();

        // Add fade-in animation
        const newTaskElement = taskList.querySelector(`[data-id="${newTask.id}"]`);
        if (newTaskElement) {
            newTaskElement.classList.add('adding');
            newTaskElement.addEventListener('animationend', () => {
                newTaskElement.classList.remove('adding');
            });
        }
    };

    /**
     * Handles clicks on the task list (edit, delete, complete).
     * @param {Event} e - The click event.
     */
    const handleTaskClick = (e) => {
        const target = e.target;
        const taskItem = target.closest('.task-item');
        if (!taskItem) return;
        
        const taskId = Number(taskItem.dataset.id);

        if (target.classList.contains('delete-btn') || target.closest('.delete-btn')) {
            deleteTask(taskId, taskItem);
        } else if (target.classList.contains('edit-btn') || target.closest('.edit-btn')) {
            editTask(taskId, taskItem);
        } else if (target.classList.contains('complete-checkbox')) {
            toggleComplete(taskId, target.checked);
        }
    };

    /**
     * Deletes a task after a confirmation.
     * @param {number} id - The ID of the task to delete.
     * @param {HTMLElement} taskElement - The HTML element of the task.
     */
    const deleteTask = (id, taskElement) => {
        taskElement.classList.add('removing');
        taskElement.addEventListener('animationend', () => {
            tasks = tasks.filter(task => task.id !== id);
            saveAndRender();
        });
    };

    /**
     * Toggles the completion status of a task.
     * @param {number} id - The ID of the task.
     * @param {boolean} isCompleted - The new completion status.
     */
    const toggleComplete = (id, isCompleted) => {
        const task = tasks.find(task => task.id === id);
        if (task) {
            task.completed = isCompleted;
            if (isCompleted) {
                confetti.render();
                setTimeout(() => confetti.clear(), 3000);
            }
            saveAndRender();
        }
    };

    /**
     * Enables editing mode for a task.
     * @param {number} id - The ID of the task to edit.
     * @param {HTMLElement} taskElement - The task's HTML element.
     */
    const editTask = (id, taskElement) => {
        const task = tasks.find(task => task.id === id);
        const taskTitleElement = taskElement.querySelector('.task-title');
        const currentTitle = task.title;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentTitle;
        input.className = 'task-title-edit';
        
        taskTitleElement.replaceWith(input);
        input.focus();

        const saveEdit = () => {
            const newTitle = input.value.trim();
            if (newTitle) {
                task.title = newTitle;
                saveAndRender();
            } else {
                input.replaceWith(taskTitleElement); // Restore original if empty
            }
        };

        input.addEventListener('blur', saveEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
        });
    };
    
    /**
     * Toggles between dark and light themes.
     */
    const toggleTheme = () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        themeToggle.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    };

    /**
     * Loads the saved theme from localStorage.
     */
    const loadTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    };


    // --- Event Listeners ---
    addTaskForm.addEventListener('submit', addTask);
    taskList.addEventListener('click', handleTaskClick);
    searchBar.addEventListener('input', renderTasks);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilter = btn.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTasks();
        });
    });

    themeToggle.addEventListener('click', toggleTheme);

    // --- Initial Load ---
    loadTheme();
    saveAndRender(); 
});
