/* ==========================================
   MINDFOCUS - Lógica principal con Firebase
   ========================================== */

import {
    auth, db, signOut, onAuthStateChanged,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where
} from './firebase-config.js';

// ---- 5. AUTENTICACIÓN ----
let isRegistering = false;

async function registerWithEmail(email, password, name) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await result.user.updateProfile({ displayName: name });
        return result.user;
    } catch (e) {
        console.error('Error registro:', e);
        alert('Error al registrar: ' + (e.message || 'Verifica tus datos'));
        throw e;
    }
}

async function loginWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (e) {
        console.error('Error login:', e);
        alert('Error al iniciar sesión: ' + (e.message || 'Verifica tu email y contraseña'));
        throw e;
    }
}

async function logoutUser() {
    try {
        await signOut(auth);
    } catch (e) {
        console.error('Error logout:', e);
    }
}

function toggleAuthMode() {
    isRegistering = !isRegistering;
    const title = document.getElementById('authTitle');
    const submit = document.getElementById('authSubmit');
    const toggleText = document.getElementById('authToggleText');
    const toggleBtn = document.getElementById('authToggleBtn');
    const nameGroup = document.getElementById('nameGroup');
    if (title) title.textContent = isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión';
    if (submit) submit.textContent = isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión';
    if (toggleText) toggleText.textContent = isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?';
    if (toggleBtn) toggleBtn.textContent = isRegistering ? 'Iniciar Sesión' : 'Regístrate';
    if (nameGroup) nameGroup.style.display = isRegistering ? 'block' : 'none';
}

// ---- 1. SEGURIDAD ----
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function sanitizePresetName(name) {
    return escapeHtml(name).slice(0, 50);
}

// ---- 2. ESTADO GLOBAL ----
const appState = {
    tasks: [],
    currentTask: null,
    timerInterval: null,
    isTimerRunning: false,
    secondsLeft: 45 * 60,
    TOTAL_FOCUS: 45 * 60,
    isBreak: false,
    theme: 'light',
    currentUser: null,
    draggedBubble: null,
    presets: []
};

// ---- 2. REFERENCIAS AL DOM ----
const elements = {
    taskList: document.getElementById('taskList'),
    canvasArea: document.getElementById('canvasArea'),
    canvasPlaceholder: document.getElementById('canvasPlaceholder'),
    taskModal: document.getElementById('taskModal'),
    timerOverlay: document.getElementById('timerOverlay'),
    btnAddTask: document.getElementById('btnAddTask'),
    closeModal: document.getElementById('closeModal'),
    closeTimer: document.getElementById('closeTimer'),
    taskForm: document.getElementById('taskForm'),
    themeSwitch: document.getElementById('themeSwitch'),
    timerDisplay: {
        minutes: document.getElementById('timerMinutes'),
        seconds: document.getElementById('timerSeconds')
    },
    timerStatus: document.getElementById('timerStatus'),
    timerTaskName: document.getElementById('timerTaskName'),
    timerControls: {
        start: document.getElementById('btnStart'),
        pause: document.getElementById('btnPause'),
        reset: document.getElementById('btnReset')
    },
    authSection: document.getElementById('authSection'),
    btnLogin: document.getElementById('btnLogin'),
    profileContainer: document.getElementById('profileContainer'),
    profileAvatar: document.getElementById('profileAvatar'),
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    authModal: document.getElementById('authModal'),
    closeAuthModal: document.getElementById('closeAuthModal'),
    authForm: document.getElementById('authForm'),
    authTitle: document.getElementById('authTitle'),
    authEmail: document.getElementById('authEmail'),
    authPassword: document.getElementById('authPassword'),
    authName: document.getElementById('authName'),
    authSubmit: document.getElementById('authSubmit'),
    authToggleBtn: document.getElementById('authToggleBtn'),
    authToggleText: document.getElementById('authToggleText'),
    nameGroup: document.getElementById('nameGroup'),
    historyChart: document.getElementById('historyChart'),
    btnExport: document.getElementById('btnExport'),
    presetsList: document.getElementById('presetsList'),
    btnSavePreset: document.getElementById('btnSavePreset'),
    presetModal: document.getElementById('presetModal'),
    closePresetModal: document.getElementById('closePresetModal'),
    presetForm: document.getElementById('presetForm')
};

// ---- 3. AUXILIARES ----
function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getRandomPosition(sz) {
    const w = elements.canvasArea.clientWidth;
    const h = elements.canvasArea.clientHeight;
    const minY = 200;
    const padding = 20;
    return {
        x: Math.max(padding, Math.min(w - sz - padding, Math.random() * (w - sz - padding * 2) + padding)),
        y: Math.max(minY, Math.min(h - sz - padding, Math.random() * (h - sz - minY - padding) + minY))
    };
}

function clampPosition(pos, size) {
    const w = elements.canvasArea.clientWidth;
    const h = elements.canvasArea.clientHeight;
    const padding = 10;
    const minY = 180;
    return {
        x: Math.max(padding, Math.min(w - size - padding, pos.x)),
        y: Math.max(minY, Math.min(h - size - padding, pos.y))
    };
}

function renderBubbles() {
    const old = elements.canvasArea.querySelectorAll('.task-bubble, .svg-overlay, .day-bubble');
    old.forEach(el => el.remove());

    if (!appState.tasks || appState.tasks.length === 0) {
        if (elements.canvasPlaceholder) elements.canvasPlaceholder.style.display = 'block';
        return;
    }

    if (elements.canvasPlaceholder) elements.canvasPlaceholder.style.display = 'none';

    const rect = elements.canvasArea.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const cx = rect.width / 2;
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('svg-overlay');
    elements.canvasArea.appendChild(svg);

    const isMobile = window.innerWidth <= 768;
    const DAY_SIZE = isMobile ? 80 : 130;
    const dayCx = cx, dayCy = 60 + DAY_SIZE / 2;
    const fullDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const stats = getHistoryData().pop();
    const dayBubble = document.createElement('div');
    dayBubble.className = 'day-bubble';
    dayBubble.style.left = `${cx}px`;
    dayBubble.style.top = isMobile ? '20px' : '80px';
    dayBubble.innerHTML = `<div style="font-size:${isMobile ? '0.6rem' : '0.9rem'};font-weight:700;text-transform:capitalize">${fullDate}</div><div style="font-size:${isMobile ? '0.5rem' : '.7rem'};opacity:.9;margin-top:4px">${stats.sessions} ses · ${stats.minutes} min</div>`;
    elements.canvasArea.appendChild(dayBubble);

    const SIZE_INCREMENT = 1.06;
    const mobileMultiplier = isMobile ? 0.7 : 1;

    appState.tasks.forEach(task => {
        const mins = Math.floor((task.totalFocusTime || 0) / 60);
        const baseSize = Math.round((96 + Math.min(mins * 2, 120)) * SIZE_INCREMENT);
        const size = Math.round(baseSize * mobileMultiplier);
        const bubble = document.createElement('div');
        bubble.className = 'task-bubble';
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.backgroundColor = task.color;
        bubble.textContent = task.name;
        bubble.style.fontSize = isMobile ? '0.65rem' : '0.8rem';
        let pos = task.position;
        if (!pos) { pos = getRandomPosition(size); }
        pos = clampPosition(pos, size);
        task.position = pos;
        bubble.style.left = `${pos.x}px`;
        bubble.style.top = `${pos.y}px`;
        bubble.style.animationDelay = `${Math.random() * 2}s`;
        bubble.draggable = true;
        bubble.addEventListener('dragstart', e => { appState.draggedBubble = task; bubble.style.opacity = '0.5'; });
        bubble.addEventListener('dragend', e => { bubble.style.opacity = '1'; appState.draggedBubble = null; });
        const taskCx = pos.x + size / 2;
        const taskCy = pos.y + size / 2;
        const dx = taskCx - dayCx;
        const dy = taskCy - dayCy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const dayEdgeX = dayCx + (dx / dist) * (DAY_SIZE / 2);
        const dayEdgeY = dayCy + (dy / dist) * (DAY_SIZE / 2);
        const taskEdgeX = taskCx - (dx / dist) * (size / 2);
        const taskEdgeY = taskCy - (dy / dist) * (size / 2);
        const midX = (dayEdgeX + taskEdgeX) / 2;
        const midY = (dayEdgeY + taskEdgeY) / 2;
        const perpX = -dy / dist;
        const perpY = dx / dist;
        const curvature = Math.min(dist * 0.15, 40);
        const ctrlX = midX + perpX * curvature * (Math.random() > 0.5 ? 1 : -1);
        const ctrlY = midY + perpY * curvature * (Math.random() > 0.5 ? 1 : -1);
        const path = document.createElementNS(svgNS, 'path');
        path.setAttribute('d', `M ${dayEdgeX} ${dayEdgeY} Q ${ctrlX} ${ctrlY} ${taskEdgeX} ${taskEdgeY}`);
        path.setAttribute('stroke', task.color);
        svg.appendChild(path);
        bubble.addEventListener('click', (e) => { e.stopPropagation(); selectTask(task.id); });
        elements.canvasArea.appendChild(bubble);
    });

    elements.canvasArea.addEventListener('dragover', e => e.preventDefault());
    elements.canvasArea.addEventListener('drop', e => {
        e.preventDefault();
        if (appState.draggedBubble && appState.draggedBubble.position) {
            const dropRect = elements.canvasArea.getBoundingClientRect();
            const isMobile = window.innerWidth <= 768;
            const mobileMultiplier = isMobile ? 0.7 : 1;
            const dropSize = Math.round(Math.round((96 + Math.min(Math.floor((appState.draggedBubble.totalFocusTime || 0) / 60) * 2, 120)) * SIZE_INCREMENT) * mobileMultiplier);
            const rawPos = {
                x: e.clientX - dropRect.left - dropSize / 2,
                y: e.clientY - dropRect.top - dropSize / 2
            };
            appState.draggedBubble.position = clampPosition(rawPos, dropSize);
            renderBubbles();
        }
    });
}
function updateStats() {
    const todayStats = getHistoryData().pop() || { sessions: 0, minutes: 0 };
    const totalMin = Math.floor(appState.tasks.reduce((s, t) => s + (t.totalFocusTime || 0), 0) / 60);
    if (document.getElementById('sessionsToday')) document.getElementById('sessionsToday').textContent = todayStats.sessions;
    if (document.getElementById('minutesFocused')) document.getElementById('minutesFocused').textContent = totalMin;
    renderHistory();
}
function updateProgressCircle() {
    const container = document.querySelector('.timer-progress-circle');
    if (!container) return;
    const total = appState.isBreak ? 15 * 60 : appState.TOTAL_FOCUS;
    const progress = ((total - appState.secondsLeft) / total) * 100;
    const circle = container.querySelector('.progress-ring__circle');
    if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = circumference - (progress / 100) * circumference;
    }
}
function updateTimerDisplay() {
    elements.timerDisplay.minutes.textContent = formatTime(appState.secondsLeft).split(':')[0];
    elements.timerDisplay.seconds.textContent = formatTime(appState.secondsLeft).split(':')[1];
    updateProgressCircle();
}

// ---- 11. TIMER ----
function startTimer() {
    if (appState.isTimerRunning) return;
    appState.isTimerRunning = true;
    elements.timerControls.start.textContent = 'En marcha...';
    elements.timerControls.start.disabled = true;
    appState.timerInterval = setInterval(() => {
        appState.secondsLeft--;
        updateTimerDisplay();
        if (appState.secondsLeft <= 0) timerFinished();
    }, 1000);
}
function pauseTimer() {
    if (!appState.isTimerRunning) return;
    clearInterval(appState.timerInterval);
    appState.isTimerRunning = false;
    elements.timerControls.start.textContent = 'Reanudar';
    elements.timerControls.start.disabled = false;
}
function resetTimer() {
    pauseTimer();
    appState.secondsLeft = appState.isBreak ? 15 * 60 : appState.TOTAL_FOCUS;
    elements.timerControls.start.textContent = 'Iniciar';
    elements.timerControls.start.disabled = false;
    updateTimerDisplay();
}
async function timerFinished() {
    pauseTimer();
    playGong();
    if (!appState.isBreak) {
        if (appState.currentTask) {
            appState.currentTask.totalFocusTime = (appState.currentTask.totalFocusTime || 0) + appState.TOTAL_FOCUS;
            appState.currentTask.sessionsCompleted = (appState.currentTask.sessionsCompleted || 0) + 1;
            if (appState.currentUser) await updateTaskInFirestore(appState.currentTask.id, { totalFocusTime: appState.currentTask.totalFocusTime, sessionsCompleted: appState.currentTask.sessionsCompleted });
            saveSessionToHistory(45);
            renderTasks(); renderBubbles(); updateStats();
        }
        appState.isBreak = true; appState.secondsLeft = 15 * 60;
        elements.timerStatus.textContent = 'MODO DESCANSO';
        elements.timerStatus.style.cssText = 'background-color:var(--accent-glow);color:var(--accent-color)';
        setTimeout(() => alert('¡Bloque de foco completado! Descansa 15 min.'), 100);
    } else {
        appState.isBreak = false; appState.secondsLeft = appState.TOTAL_FOCUS;
        elements.timerStatus.textContent = 'MODO FOCO';
        elements.timerStatus.style.cssText = 'background-color:var(--accent-glow);color:var(--accent-color)';
        setTimeout(() => alert('¡Descanso terminado! Listo para otro bloque.'), 100);
    }
    updateTimerDisplay();
    elements.timerControls.start.textContent = 'Iniciar';
    elements.timerControls.start.disabled = false;
}

// ---- 12. EVENT LISTENERS ----
function selectTask(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    playClick();
    if (appState.isTimerRunning) pauseTimer();
    appState.currentTask = task; appState.isBreak = false; appState.secondsLeft = appState.TOTAL_FOCUS;
    elements.timerTaskName.textContent = task.name;
    elements.timerStatus.textContent = 'MODO FOCO';
    elements.timerStatus.style.cssText = 'background-color:var(--accent-glow);color:var(--accent-color)';
    updateTimerDisplay();
    elements.timerOverlay.classList.add('active');
}
async function addTask(name, color, notes) {
    name = name.trim().slice(0, 60);
    notes = notes.trim().slice(0, 500);
    if (!name) return;
    const nt = { id: generateId(), name, color, notes, totalFocusTime: 0, sessionsCompleted: 0, position: null };
    appState.tasks.push(nt); playClick();
    if (appState.currentUser) {
        try {
            await saveTaskToFirestore(nt);
        } catch (e) { console.error('Error guardando tarea:', e); }
    }
    renderTasks(); renderBubbles(); updateStats();
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('mindfocus-theme', isLight ? 'light' : 'dark');
    const icon = elements.themeSwitch.querySelector('.theme-icon');
    icon.textContent = isLight ? '🌙' : '☀️';
}

// ---- 13. INIT ----
document.addEventListener('DOMContentLoaded', () => {
    console.log('MindFocus App Iniciada 🚀');
    const saved = localStorage.getItem('mindfocus-theme');
    if (saved === 'light') { document.body.classList.add('light-theme'); elements.themeSwitch.querySelector('.theme-icon').textContent = '☀️'; }
    else { elements.themeSwitch.querySelector('.theme-icon').textContent = '🌙'; }

    onAuthStateChanged(auth, (user) => { updateAuthUI(user); if (user) loadTasksFromFirestore(); });

    elements.btnLogin.addEventListener('click', () => { playClick(); isRegistering = false; toggleAuthMode(); elements.authModal.classList.add('active'); });
    elements.closeAuthModal.addEventListener('click', () => { elements.authModal.classList.remove('active'); elements.authForm.reset(); });
    elements.authToggleBtn.addEventListener('click', () => { playClick(); toggleAuthMode(); });
    elements.authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = elements.authEmail.value, password = elements.authPassword.value;
        if (isRegistering) {
            registerWithEmail(email, password, elements.authName.value).then(() => { elements.authModal.classList.remove('active'); elements.authForm.reset(); });
        } else {
            loginWithEmail(email, password).then(() => { elements.authModal.classList.remove('active'); elements.authForm.reset(); });
        }
    });

    elements.btnAddTask.addEventListener('click', () => elements.taskModal.classList.add('active'));

    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => { playClick(); await logoutUser(); });
    }

    elements.closeModal.addEventListener('click', () => { elements.taskModal.classList.remove('active'); elements.taskForm.reset(); });
    elements.closeTimer.addEventListener('click', () => { elements.timerOverlay.classList.remove('active'); pauseTimer(); });
    elements.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(document.getElementById('taskName').value, document.getElementById('taskColor').value, document.getElementById('taskNotes').value);
        elements.taskModal.classList.remove('active'); elements.taskForm.reset();
    });
    elements.themeSwitch.addEventListener('click', toggleTheme);

    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }

    elements.timerControls.start.addEventListener('click', () => { playClick(); startTimer(); });
    elements.timerControls.pause.addEventListener('click', () => { playClick(); pauseTimer(); });
    elements.timerControls.reset.addEventListener('click', () => { playClick(); resetTimer(); });

    if (elements.btnExport) {
        elements.btnExport.addEventListener('click', () => {
            const fmt = confirm('¿Exportar como CSV? (Cancelar = Markdown)') ? 'csv' : 'md';
            exportData(fmt);
        });
    }

    // Presets
    if (elements.btnSavePreset) {
        elements.btnSavePreset.addEventListener('click', () => {
            if (!appState.tasks.length) { alert('Agrega tareas primero'); return; }
            elements.presetModal.classList.add('active');
        });
    }
    elements.closePresetModal.addEventListener('click', () => { elements.presetModal.classList.remove('active'); elements.presetForm.reset(); });
    elements.presetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('presetName').value.trim();
        if (!name) return;
        savePreset(name);
        elements.presetModal.classList.remove('active');
        elements.presetForm.reset();
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) elements.taskModal.classList.remove('active');
        if (e.target === elements.timerOverlay) { elements.timerOverlay.classList.remove('active'); pauseTimer(); }
        if (e.target === elements.authModal) elements.authModal.classList.remove('active');
        if (e.target === elements.presetModal) elements.presetModal.classList.remove('active');
    });

    loadPresets();
    renderTasks(); renderHistory(); updateStats();
});

// Funciones globales para onclick inline
window.loadPreset = loadPreset;
window.deletePreset = deletePreset;
window.deleteTask = deleteTask;
window.toggleSidebar = toggleSidebar;