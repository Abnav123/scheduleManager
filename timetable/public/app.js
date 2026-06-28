document.addEventListener('DOMContentLoaded', () => {
  const loginScreen = document.getElementById('login-screen');
  const appContent = document.getElementById('app-content');
  const loginForm = document.getElementById('login-form');
  const passwordInput = document.getElementById('password-input');
  const loginError = document.getElementById('login-error');
  const lockButton = document.getElementById('lock-button');

  const datePicker = document.getElementById('date-picker');
  const activeCount = document.getElementById('active-count');
  const formattedDate = document.getElementById('formatted-date');
  const tasksContainer = document.getElementById('tasks-container');

  // Queries local Express server API endpoints relative to page origin
  const API_BASE_URL = window.location.origin;
  const AUTH_KEY = 'timetable_auth';

  // 1. Session Authentication Check
  const checkAuth = () => {
    const isAuth = sessionStorage.getItem(AUTH_KEY) === 'true';
    if (isAuth) {
      loginScreen.classList.add('hidden');
      appContent.classList.remove('hidden');
      document.body.style.alignItems = 'flex-start';
      initTimetable();
    } else {
      loginScreen.classList.remove('hidden');
      appContent.classList.add('hidden');
      document.body.style.alignItems = 'center';
    }
  };

  // 2. Handle Login Submission via secure backend endpoint
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const entered = passwordInput.value;
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: entered })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem(AUTH_KEY, 'true');
        loginError.textContent = '';
        passwordInput.value = '';
        checkAuth();
      } else {
        loginError.textContent = data.error || 'Invalid access code';
        passwordInput.value = '';
        passwordInput.focus();
      }
    } catch (err) {
      console.error('Login request failed:', err);
      loginError.textContent = 'Connection error. Please try again.';
    }
  });

  // 3. Handle Lock Button click
  lockButton.addEventListener('click', () => {
    sessionStorage.removeItem(AUTH_KEY);
    checkAuth();
  });

  // 4. Initialize Timetable
  const initTimetable = () => {
    const todayIST = getTodayISTString();
    datePicker.value = todayIST;
    loadTimetable(todayIST);
  };

  // 5. Get today's date in Asia/Kolkata (IST) timezone (YYYY-MM-DD)
  const getTodayISTString = () => {
    const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('en-CA', options);
    return formatter.format(new Date());
  };

  // 6. Format date for screen display (e.g. "Sunday, 28 Jun 2026")
  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // 7. Fetch task records from standalone backend DB
  const loadTimetable = async (dateStr) => {
    try {
      showLoadingState();
      formattedDate.textContent = formatDateDisplay(dateStr);

      const response = await fetch(`${API_BASE_URL}/api/tasks?date=${dateStr}`);
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const tasks = await response.json();
      
      // Sort tasks chronologically by start time
      tasks.sort((a, b) => a.startTime.localeCompare(b.startTime));

      renderTasks(tasks);
    } catch (error) {
      console.error('Fetch error:', error);
      showErrorState(error.message);
    }
  };

  // 8. Render tasks to view (displaying only Name, Start/End times, and Notes)
  const renderTasks = (tasks) => {
    tasksContainer.innerHTML = '';
    
    if (tasks.length === 0) {
      activeCount.textContent = '0 Tasks Scheduled';
      tasksContainer.innerHTML = `
        <div class="empty-state">
          <p>No tasks scheduled for this date</p>
        </div>
      `;
      return;
    }

    activeCount.textContent = `${tasks.length} Task${tasks.length === 1 ? '' : 's'} Mounted`;

    tasks.forEach((task, idx) => {
      const card = document.createElement('div');
      card.className = 'task-card';
      card.style.animationDelay = `${idx * 0.12}s`;

      // Header row with Name and Time slot
      const header = document.createElement('div');
      header.className = 'task-card-header';

      const title = document.createElement('h3');
      title.className = 'task-title';
      title.textContent = task.name;

      const time = document.createElement('span');
      time.className = 'task-time-badge';
      time.textContent = `${task.startTime} - ${task.endTime}`;

      header.appendChild(title);
      header.appendChild(time);
      card.appendChild(header);

      // Display notes if they exist
      if (task.notes && task.notes.trim() !== '') {
        const notes = document.createElement('p');
        notes.className = 'task-notes';
        notes.textContent = task.notes;
        card.appendChild(notes);
      }

      tasksContainer.appendChild(card);
    });
  };

  const showLoadingState = () => {
    tasksContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading schedule...</p>
      </div>
    `;
  };

  const showErrorState = (msg) => {
    activeCount.textContent = 'Error';
    tasksContainer.innerHTML = `
      <div class="error-state">
        <p>Failed to connect to database</p>
        <p style="font-size: 11px; font-weight: normal; margin-top: 5px; color: var(--text-secondary);">${msg}</p>
      </div>
    `;
  };

  // 9. Listen for manual date inputs
  datePicker.addEventListener('change', (e) => {
    if (e.target.value) {
      loadTimetable(e.target.value);
    }
  });

  // 10. Startup: Check authentication
  checkAuth();
});
