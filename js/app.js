/* ==========================================
   MINDFOCUS - Lógica principal con Firebase + Mejoras
   ========================================== */

import {
    auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where
} from './firebase-config.js';

// ---- 1. ESTADO GLOBAL ----
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
    draggedBubble: null
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
    // Auth
    authSection: document.getElementById('authSection'),
    btnLogin: document.getElementById('btnLogin'),
    btnLogout: document.getElementById('btnLogout'),
    userInfo: document.getElementById('userInfo'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    // Auth modal
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
    btnGoogleLogin: document.getElementById('btnGoogleLogin'),
    // Nuevos elementos
    historyChart: document.getElementById('historyChart'),
    btnExport: document.getElementById('btnExport')
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
    return { x: Math.random() * (w - sz - 40) + 20, y: Math.random() * (h - sz - 40) + 20 };
}

// ---- 4. SONIDOS ----
function playClick() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(800, ctx.currentTime);
        g.gain.setValueAtTime(0.1, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.1);
    } catch (e) { console.warn('Click sound error', e); }
}
function playGong() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine'; o.frequency.setValueAtTime(150, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 2);
        g.gain.setValueAtTime(0.5, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 3);
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.connect(g2); g2.connect(ctx.destination);
        o2.type = 'triangle'; o2.frequency.setValueAtTime(200, ctx.currentTime);
        o2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 1.5);
        g2.gain.setValueAtTime(0.1, ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        o2.start(ctx.currentTime + 0.1); o2.stop(ctx.currentTime + 2.1);
    } catch (e) { console.warn('Gong sound error', e); }
}

// ---- 5. AUTENTICACIÓN ----
let isRegistering = false;
async function registerWithEmail(email, password, name) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await result.user.updateProfile({ displayName: name }).catch(() => null);
    return result.user;
}
async function loginWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}
async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        if (error.code !== 'auth/popup-closed-by-user') alert('Error: ' + error.message);
        throw error;
    }
}
async function logoutUser() { await signOut(auth); }
function toggleAuthMode() {
    isRegistering = !isRegistering;
    elements.authTitle.textContent = isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión';
    elements.authSubmit.textContent = isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión';
    elements.authToggleText.textContent = isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?';
    elements.authToggleBtn.textContent = isRegistering ? 'Iniciar Sesión' : 'Regístrate';
    elements.nameGroup.style.display = isRegistering ? 'block' : 'none';
}
function updateAuthUI(user) {
    if (user) {
        appState.currentUser = user;
        elements.btnLogin.classList.add('hidden');
        elements.userInfo.classList.remove('hidden');
        elements.userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
        elements.userName.textContent = user.displayName || user.email;
        elements.authModal.classList.remove('active');
    } else {
        appState.currentUser = null;
        elements.btnLogin.classList.remove('hidden');
        elements.userInfo.classList.add('hidden');
        elements.userAvatar.src = '';
        elements.userName.textContent = '';
        appState.tasks = []; renderTasks(); renderBubbles(); renderHistory();
    }
}

// ---- 6. FIRESTORE ----
function getTasksCollection() {
    return appState.currentUser ? collection(db, 'users', appState.currentUser.uid, 'tasks') : null;
}
async function loadTasksFromFirestore() {
    if (!appState.currentUser) return;
    try {
        const q = query(getTasksCollection(), where('userId', '==', appState.currentUser.uid));
        const snap = await getDocs(q);
        appState.tasks = [];
        snap.forEach(d => appState.tasks.push({ id: d.id, ...d.data() }));
        renderTasks(); renderBubbles(); renderHistory();
    } catch (e) { console.error('Load tasks error', e); }
}
async function saveTaskToFirestore(task) {
    if (!appState.currentUser) return;
    try {
        await addDoc(getTasksCollection(), { ...task, userId: appState.currentUser.uid, createdAt: new Date().toISOString() });
    } catch (e) { console.error('Save task error', e); }
}
async function updateTaskInFirestore(taskId, updates) {
    if (!appState.currentUser) return;
    try {
        await updateDoc(doc(db, 'users', appState.currentUser.uid, 'tasks', taskId), { ...updates, updatedAt: new Date().toISOString() });
    } catch (e) { console.error('Update task error', e); }
}

// ---- 7. HISTORIAL Y EXPORT ----
function getHistoryData() {
    const raw = JSON.parse(localStorage.getItem('mindfocus-history') || '{}');
    const today = new Date();
    const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    const arr = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const data = raw[key] || { sessions: 0, minutes: 0 };
        arr.push({ day: days[d.getDay()], ...data });
    }
    return arr;
}
function saveSessionToHistory(minutes) {
    const raw = JSON.parse(localStorage.getItem('mindfocus-history') || '{}');
    const key = new Date().toISOString().split('T')[0];
    if (!raw[key]) raw[key] = { sessions: 0, minutes: 0 };
    raw[key].sessions += 1; raw[key].minutes += minutes;
    localStorage.setItem('mindfocus-history', JSON.stringify(raw));
    renderHistory();
}
function renderHistory() {
    if (!elements.historyChart) return;
    const data = getHistoryData();
    const max = Math.max(...data.map(d => d.sessions), 1);
    elements.historyChart.innerHTML = data.map((d, i) => {
        const height = (d.sessions / max) * 100;
        return `<div class="history-bar" style="--h:${height}%" title="${d.day}: ${d.sessions} sesiones, ${d.minutes} min"><div class="bar" style="height:${height}%"></div><span>${d.day}</span></div>`;
    }).join('');
}
function exportData(format) {
    if (!appState.currentUser) { alert('Inicia sesión para exportar datos'); return; }
    const history = getHistoryData();
    const todayStats = history[history.length - 1];
    const totalSessions = appState.tasks.reduce((s, t) => s + (t.sessionsCompleted || 0), 0);
    const totalMinutes = Math.floor(appState.tasks.reduce((s, t) => s + (t.totalFocusTime || 0), 0) / 60);
    if (format === 'csv') {
        let csv = 'Tarea,Color,Notas,Sesiones,Minutos_Foco\n';
        appState.tasks.forEach(t => csv += `"${t.name}","${t.color}","${t.notes || ''}",${t.sessionsCompleted || 0},${Math.floor((t.totalFocusTime || 0) / 60)}\n`);
        csv += `\nTotal,Sesiones,Minutos\n,,${totalSessions},${totalMinutes}\n`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'mindfocus-tareas.csv'; a.click(); URL.revokeObjectURL(url);
    } else if (format === 'md') {
        let md = `# MindFocus Reporte - ${new Date().toLocaleDateString('es-ES')}\n\n## Tareas\n\n| Tarea | Color | Sesiones | Minutos |\n|-------|-------|----------|--------|\n`;
        appState.tasks.forEach(t => md += `| ${t.name} | ${t.color} | ${t.sessionsCompleted || 0} | ${Math.floor((t.totalFocusTime || 0) / 60)} |\n`);
        md += `\n**Total Sesiones:** ${totalSessions}\n**Total Minutos:** ${totalMinutes}\n`;
        md += `\n## Historial Semanal\n\n| Día | Sesiones | Minutos |\n|-----|----------|--------|\n`;
        history.forEach(h => md += `| ${h.day} | ${h.sessions} | ${h.minutes} |\n`);
        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'mindfocus-reporte.md'; a.click(); URL.revokeObjectURL(url);
    }
}

// ---- 8. RENDERIZADO ----
function renderTasks() {
    elements.taskList.innerHTML = '';
    if (!appState.tasks.length) {
        elements.taskList.innerHTML = '<p class="no-tasks" style="text-align:center;padding:1rem;color:var(--text-secondary)">No hay tareas. ¡Agrega una!</p>';
        return;
    }
    appState.tasks.forEach(task => {
        const card = document.createElement('div'); card.className = 'task-card'; card.style.borderLeftColor = task.color;
        const mins = Math.floor((task.totalFocusTime || 0) / 60);
        card.innerHTML = `<h4>${task.name}</h4><p>${task.notes || 'Sin notas'}</p><small style="color:${task.color};font-weight:600">${mins} min</small>`;
        card.addEventListener('click', () => selectTask(task.id));
        elements.taskList.appendChild(card);
    });
}
function renderBubbles() {
    const old = elements.canvasArea.querySelectorAll('.task-bubble, .svg-overlay, .day-bubble');
    old.forEach(el => el.remove());
    if (!appState.tasks.length) { elements.canvasPlaceholder.style.display = 'block'; return; }
    elements.canvasPlaceholder.style.display = 'none';
    const rect = elements.canvasArea.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    // SVG overlay
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.classList.add('svg-overlay');
    elements.canvasArea.appendChild(svg);
    // Burbuja del día
    const today = new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
    const stats = getHistoryData().pop();
    const dayBubble = document.createElement('div'); dayBubble.className = 'day-bubble';
    dayBubble.style.left = `${cx - 60}px`; dayBubble.style.top = `${cy - 60}px`;
    dayBubble.innerHTML = `<div style="font-size:1.1rem">${today}</div><div style="font-size:.75rem;opacity:.9">${stats.sessions} ses · ${stats.minutes} min</div>`;
    elements.canvasArea.appendChild(dayBubble);
    // Burbujas de tareas
    appState.tasks.forEach(task => {
        const mins = Math.floor((task.totalFocusTime || 0) / 60);
        const size = 96 + Math.min(mins * 2, 120);
        const bubble = document.createElement('div');
        bubble.className = 'task-bubble';
        bubble.style.width = `${size}px`; bubble.style.height = `${size}px`; bubble.style.backgroundColor = task.color;
        bubble.textContent = task.name;
        let pos = task.position;
        if (!pos) { pos = getRandomPosition(size); task.position = pos; }
        bubble.style.left = `${pos.x}px`; bubble.style.top = `${pos.y}px`;
        bubble.style.animationDelay = `${Math.random() * 2}s`;
        bubble.draggable = true;
        // Drag & drop
        bubble.addEventListener('dragstart', e => { appState.draggedBubble = task; bubble.style.opacity = '0.5'; });
        bubble.addEventListener('dragend', e => { bubble.style.opacity = '1'; appState.draggedBubble = null; });
        // Linea SVG
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', cx); line.setAttribute('y1', cy);
        line.setAttribute('x2', pos.x + size / 2); line.setAttribute('y2', pos.y + size / 2);
        svg.appendChild(line);
        // Click
        bubble.addEventListener('click', (e) => { e.stopPropagation(); selectTask(task.id); });
        elements.canvasArea.appendChild(bubble);
    });
    // Canvas drop zone
    elements.canvasArea.addEventListener('dragover', e => e.preventDefault());
    elements.canvasArea.addEventListener('drop', e => {
        e.preventDefault();
        if (appState.draggedBubble && appState.draggedBubble.position) {
            const rect = elements.canvasArea.getBoundingClientRect();
            appState.draggedBubble.position = {
                x: e.clientX - rect.left - 48,
                y: e.clientY - rect.top - 48
            };
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
    // Timer SVG circular
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

// ---- 9. TIMER ----
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
        elements.timerStatus.style.cssText = 'background-color:rgba(0,176,255,0.1);color:#00B0FF';
        setTimeout(() => alert('¡Bloque de foco completado! Descansa 15 min.'), 100);
    } else {
        appState.isBreak = false; appState.secondsLeft = appState.TOTAL_FOCUS;
        elements.timerStatus.textContent = 'MODO FOCO';
        elements.timerStatus.style.cssText = 'background-color:rgba(0,176,255,0.1);color:#00B0FF';
        setTimeout(() => alert('¡Descanso terminado! Listo para otro bloque.'), 100);
    }
    updateTimerDisplay();
    elements.timerControls.start.textContent = 'Iniciar';
    elements.timerControls.start.disabled = false;
}

// ---- 10. EVENT LISTENERS ----
function selectTask(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    playClick();
    if (appState.isTimerRunning) pauseTimer();
    appState.currentTask = task; appState.isBreak = false; appState.secondsLeft = appState.TOTAL_FOCUS;
    elements.timerTaskName.textContent = task.name;
    elements.timerStatus.textContent = 'MODO FOCO';
    elements.timerStatus.style.cssText = 'background-color:rgba(0,176,255,0.1);color:#00B0FF';
    updateTimerDisplay();
    elements.timerOverlay.classList.add('active');
}
async function addTask(name, color, notes) {
    const nt = { id: generateId(), name, color, notes, totalFocusTime: 0, sessionsCompleted: 0, position: null };
    appState.tasks.push(nt); playClick();
    if (appState.currentUser) await saveTaskToFirestore(nt);
    renderTasks(); renderBubbles(); updateStats();
}

// Tema
toggleTheme
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('mindfocus-theme', isDark ? 'dark' : 'light');
    const icon = elements.themeSwitch.querySelector('.theme-icon');
    icon.textContent = isDark ? '☀️' : '🌙';
}

// ---- 11. INIT ----
document.addEventListener('DOMContentLoaded', () => {
    console.log('MindFocus App Iniciada 🚀');
    const saved = localStorage.getItem('mindfocus-theme');
    if (saved === 'dark') { document.body.classList.add('dark-theme'); elements.themeSwitch.querySelector('.theme-icon').textContent = '☀️'; }

    onAuthStateChanged(auth, (user) => { updateAuthUI(user); if (user) loadTasksFromFirestore(); });

    // Auth
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
    elements.btnGoogleLogin.addEventListener('click', () => { playClick(); loginWithGoogle().then(() => elements.authModal.classList.remove('active')); });
    elements.btnLogout.addEventListener('click', async () => { playClick(); await logoutUser(); });

    // Tareas
    elements.btnAddTask.addEventListener('click', () => elements.taskModal.classList.add('active'));
    elements.closeModal.addEventListener('click', () => { elements.taskModal.classList.remove('active'); elements.taskForm.reset(); });
    elements.closeTimer.addEventListener('click', () => { elements.timerOverlay.classList.remove('active'); pauseTimer(); });
    elements.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(document.getElementById('taskName').value, document.getElementById('taskColor').value, document.getElementById('taskNotes').value);
        elements.taskModal.classList.remove('active'); elements.taskForm.reset();
    });
    elements.themeSwitch.addEventListener('click', toggleTheme);

    // Timer
    elements.timerControls.start.addEventListener('click', () => { playClick(); startTimer(); });
    elements.timerControls.pause.addEventListener('click', () => { playClick(); pauseTimer(); });
    elements.timerControls.reset.addEventListener('click', () => { playClick(); resetTimer(); });

    // Export
    if (elements.btnExport) {
        elements.btnExport.addEventListener('click', () => {
            const fmt = confirm('¿Exportar como CSV? (Cancelar = Markdown)') ? 'csv' : 'md';
            exportData(fmt);
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) elements.taskModal.classList.remove('active');
        if (e.target === elements.timerOverlay) { elements.timerOverlay.classList.remove('active'); pauseTimer(); }
        if (e.target === elements.authModal) elements.authModal.classList.remove('active');
    });

    renderTasks(); renderBubbles(); renderHistory(); updateStats();
});
