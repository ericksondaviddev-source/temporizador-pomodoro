/* ==========================================
   MINDFOCUS - Lógica principal con Firebase
   ========================================== */

// Importar configuracion de Firebase con soporte para email/password
import {
    auth,
    db,
    googleProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    query,
    where
} from './firebase-config.js';

// ---- 1. ESTADO GLOBAL DE LA APP ----
const appState = {
    tasks: [],
    currentTask: null,
    timerInterval: null,
    isTimerRunning: false,
    secondsLeft: 45 * 60,
    isBreak: false,
    theme: 'light',
    currentUser: null  // Usuario autenticado
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
    // Elementos de autenticación (login/registro)
    authSection: document.getElementById('authSection'),
    btnLogin: document.getElementById('btnLogin'),
    btnLogout: document.getElementById('btnLogout'),
    userInfo: document.getElementById('userInfo'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    // Modal de autenticación (login/registro)
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
};

// ---- 3. FUNCIONES AUXILIARES ----

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getRandomPosition(bubbleSize) {
    const canvasWidth = elements.canvasArea.clientWidth;
    const canvasHeight = elements.canvasArea.clientHeight;
    const x = Math.random() * (canvasWidth - bubbleSize - 20) + 10;
    const y = Math.random() * (canvasHeight - bubbleSize - 20) + 10;
    return { x, y };
}

// ---- 4. SONIDO (Web Audio API) ----

function playClick() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
        console.warn('No se pudo reproducir sonido de click:', e);
    }
}

function playGong() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 2);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 3);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 3);
        const reverbOsc = audioCtx.createOscillator();
        const reverbGain = audioCtx.createGain();
        reverbOsc.connect(reverbGain);
        reverbGain.connect(audioCtx.destination);
        reverbOsc.type = 'triangle';
        reverbOsc.frequency.setValueAtTime(200, audioCtx.currentTime);
        reverbOsc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5);
        reverbGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        reverbGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2);
        reverbOsc.start(audioCtx.currentTime + 0.1);
        reverbOsc.stop(audioCtx.currentTime + 2.1);
    } catch (e) {
        console.warn('No se pudo reproducir sonido de gong:', e);
    }
}

// ---- 5. FIREBASE: AUTENTICACION ----

let isRegistering = false; // Variable para saber si estamos en modo registro o login

async function registerWithEmail(email, password, name) {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        // Actualizar el perfil del usuario con el nombre
        await user.updateProfile({ displayName: name }).catch(() => null);
        console.log('Usuario registrado:', user.email);
        return user;
    } catch (error) {
        console.error('Error al registrar:', error);
        alert('Error al crear cuenta: ' + error.message);
        throw error;
    }
}

async function loginWithEmail(email, password) {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;
        console.log('Usuario autenticado (email):', user.email);
        return user;
    } catch (error) {
        console.error('Error de autenticación:', error);
        alert('Error al iniciar sesión: ' + error.message);
        throw error;
    }
}

async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        console.log('Usuario autenticado (Google):', user.displayName);
        return user;
    } catch (error) {
        console.error('Error de autenticación:', error);
        if (error.code !== 'auth/popup-closed-by-user') {
            alert('Error al iniciar sesión: ' + error.message);
        }
        throw error;
    }
}

async function logoutUser() {
    try {
        await signOut(auth);
        console.log('Usuario cerró sesión');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

function toggleAuthMode() {
    isRegistering = !isRegistering;
    if (isRegistering) {
        elements.authTitle.textContent = 'Crear Cuenta';
        elements.authSubmit.textContent = 'Crear Cuenta';
        elements.authToggleText.textContent = '¿Ya tienes cuenta?';
        elements.authToggleBtn.textContent = 'Iniciar Sesión';
        elements.nameGroup.style.display = 'block';
    } else {
        elements.authTitle.textContent = 'Iniciar Sesión';
        elements.authSubmit.textContent = 'Iniciar Sesión';
        elements.authToggleText.textContent = '¿No tienes cuenta?';
        elements.authToggleBtn.textContent = 'Regístrate';
        elements.nameGroup.style.display = 'none';
    }
}

function updateAuthUI(user) {
    if (user) {
        appState.currentUser = user;
        elements.btnLogin.classList.add('hidden');
        elements.userInfo.classList.remove('hidden');
        elements.userAvatar.src = user.photoURL || 'https://via.placeholder.com/32';
        elements.userName.textContent = user.displayName || user.email;
        // Cerrar modal de auth si está abierto
        elements.authModal.classList.remove('active');
    } else {
        appState.currentUser = null;
        elements.btnLogin.classList.remove('hidden');
        elements.userInfo.classList.add('hidden');
        elements.userAvatar.src = '';
        elements.userName.textContent = '';
        appState.tasks = [];
        renderTasks();
        renderBubbles();
    }
}

// ---- 6. FIREBASE: BASE DE DATOS (FIRESTORE) ----

// Obtener referencia a la colección de tareas del usuario actual
function getTasksCollection() {
    if (!appState.currentUser) return null;
    return collection(db, 'users', appState.currentUser.uid, 'tasks');
}

// Cargar tareas desde Firestore
async function loadTasksFromFirestore() {
    if (!appState.currentUser) return;
    try {
        const tasksRef = getTasksCollection();
        const q = query(tasksRef, where('userId', '==', appState.currentUser.uid));
        const querySnapshot = await getDocs(q);
        appState.tasks = [];
        querySnapshot.forEach((doc) => {
            const task = { id: doc.id, ...doc.data() };
            appState.tasks.push(task);
        });
        renderTasks();
        renderBubbles();
        console.log('Tareas cargadas desde Firestore:', appState.tasks.length);
    } catch (error) {
        console.error('Error al cargar tareas:', error);
    }
}

// Guardar tarea en Firestore
async function saveTaskToFirestore(task) {
    if (!appState.currentUser) {
        return task.id;
    }
    try {
        const tasksRef = getTasksCollection();
        await addDoc(tasksRef, {
            ...task,
            userId: appState.currentUser.uid,
            createdAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error al guardar tarea:', error);
        return task.id;
    }
}

// Actualizar tarea en Firestore
async function updateTaskInFirestore(taskId, updates) {
    if (!appState.currentUser) return;
    try {
        const taskRef = doc(db, 'users', appState.currentUser.uid, 'tasks', taskId);
        await updateDoc(taskRef, {
            ...updates,
            updatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
    }
}

// ---- 7. FUNCIONES DE RENDERIZADO ----

function renderTasks() {
    elements.taskList.innerHTML = '';
    if (appState.tasks.length === 0) {
        elements.taskList.innerHTML = '<p class="no-tasks" style="text-align:center; padding:1rem; color: var(--text-secondary);">No hay tareas aún. ¡Agrega una!</p>';
        return;
    }
    appState.tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.style.borderLeftColor = task.color;
        const totalMinutes = Math.floor(task.totalFocusTime / 60);
        taskCard.innerHTML = `
            <h4>${task.name}</h4>
            <p>${task.notes || 'Sin notas'}</p>
            <small style="color: ${task.color}; font-weight: 600;">
                ${totalMinutes} min acumulados
            </small>
        `;
        taskCard.addEventListener('click', () => selectTask(task.id));
        elements.taskList.appendChild(taskCard);
    });
}

function renderBubbles() {
    const oldBubbles = elements.canvasArea.querySelectorAll('.task-bubble');
    oldBubbles.forEach(bubble => bubble.remove());
    if (appState.tasks.length === 0) {
        elements.canvasPlaceholder.style.display = 'block';
        return;
    }
    elements.canvasPlaceholder.style.display = 'none';
    appState.tasks.forEach(task => {
        const totalMinutes = Math.floor(task.totalFocusTime / 60);
        const baseSize = 80;
        const sizeIncrement = Math.min(totalMinutes * 2, 120);
        const bubbleSize = baseSize + sizeIncrement;
        const bubble = document.createElement('div');
        bubble.className = 'task-bubble';
        bubble.style.width = `${bubbleSize}px`;
        bubble.style.height = `${bubbleSize}px`;
        bubble.style.backgroundColor = task.color;
        bubble.textContent = task.name;
        const pos = task.position || getRandomPosition(bubbleSize);
        bubble.style.left = `${pos.x}px`;
        bubble.style.top = `${pos.y}px`;
        if (!task.position) {
            task.position = pos;
        }
        bubble.style.animationDelay = `${Math.random() * 2}s`;
        bubble.addEventListener('click', (e) => {
            e.stopPropagation();
            selectTask(task.id);
        });
        elements.canvasArea.appendChild(bubble);
    });
}

// ---- 8. LOGICA DE TAREAS Y SELECCION ----

async function addTask(name, color, notes) {
    const newTask = {
        id: generateId(),
        name: name,
        color: color,
        notes: notes,
        totalFocusTime: 0,
        sessionsCompleted: 0,
        position: null
    };
    appState.tasks.push(newTask);
    playClick();
    if (appState.currentUser) {
        await saveTaskToFirestore(newTask);
    }
    renderTasks();
    renderBubbles();
}

function selectTask(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    playClick();
    if (appState.isTimerRunning) {
        pauseTimer();
    }
    appState.currentTask = task;
    appState.isBreak = false;
    appState.secondsLeft = 45 * 60;
    elements.timerTaskName.textContent = task.name;
    elements.timerStatus.textContent = 'MODO FOCO';
    elements.timerStatus.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
    elements.timerStatus.style.color = '#4CAF50';
    updateTimerDisplay();
    elements.timerOverlay.classList.add('active');
    console.log(`Tarea seleccionada: ${task.name}`);
}

// ---- 9. LOGICA DEL TEMPORIZADOR ----

function updateTimerDisplay() {
    elements.timerDisplay.minutes.textContent = formatTime(appState.secondsLeft).split(':')[0];
    elements.timerDisplay.seconds.textContent = formatTime(appState.secondsLeft).split(':')[1];
}

function startTimer() {
    if (appState.isTimerRunning) return;
    appState.isTimerRunning = true;
    elements.timerControls.start.textContent = 'En marcha...';
    elements.timerControls.start.disabled = true;
    appState.timerInterval = setInterval(() => {
        appState.secondsLeft--;
        updateTimerDisplay();
        if (appState.secondsLeft <= 0) {
            timerFinished();
        }
    }, 1000);
    console.log('Temporizador iniciado');
}

function pauseTimer() {
    if (!appState.isTimerRunning) return;
    clearInterval(appState.timerInterval);
    appState.isTimerRunning = false;
    elements.timerControls.start.textContent = 'Reanudar';
    elements.timerControls.start.disabled = false;
    console.log('Temporizador pausado');
}

function resetTimer() {
    pauseTimer();
    if (appState.isBreak) {
        appState.secondsLeft = 15 * 60;
        elements.timerStatus.textContent = 'MODO DESCANSO';
    } else {
        appState.secondsLeft = 45 * 60;
        elements.timerStatus.textContent = 'MODO FOCO';
    }
    elements.timerControls.start.textContent = 'Iniciar';
    elements.timerControls.start.disabled = false;
    updateTimerDisplay();
    console.log('Temporizador reiniciado');
}

async function timerFinished() {
    pauseTimer();
    playGong();
    if (!appState.isBreak) {
        console.log('¡Bloque de foco completado!');
        if (appState.currentTask) {
            appState.currentTask.totalFocusTime += (45 * 60);
            appState.currentTask.sessionsCompleted++;
            if (appState.currentUser) {
                await updateTaskInFirestore(appState.currentTask.id, {
                    totalFocusTime: appState.currentTask.totalFocusTime,
                    sessionsCompleted: appState.currentTask.sessionsCompleted
                });
            }
            renderTasks();
            renderBubbles();
        }
        appState.isBreak = true;
        appState.secondsLeft = 15 * 60;
        elements.timerStatus.textContent = 'MODO DESCANSO';
        elements.timerStatus.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';
        elements.timerStatus.style.color = '#2196F3';
        setTimeout(() => {
            alert('¡Bloque de foco completado! Toma un descanso de 15 minutos.');
        }, 100);
    } else {
        console.log('Descanso terminado');
        appState.isBreak = false;
        appState.secondsLeft = 45 * 60;
        elements.timerStatus.textContent = 'MODO FOCO';
        elements.timerStatus.style.backgroundColor = 'rgba(76, 175, 80, 0.1)';
        elements.timerStatus.style.color = '#4CAF50';
        setTimeout(() => {
            alert('¡Descanso terminado! Listo para otro bloque de foco.');
        }, 100);
    }
    updateTimerDisplay();
    elements.timerControls.start.textContent = 'Iniciar';
    elements.timerControls.start.disabled = false;
}

// ---- 10. CAMBIO DE TEMA ----

function toggleTheme() {
    const body = document.body;
    const isDark = body.classList.toggle('dark-theme');
    localStorage.setItem('mindfocus-theme', isDark ? 'dark' : 'light');
    const icon = elements.themeSwitch.querySelector('.theme-icon');
    icon.textContent = isDark ? '☀️' : '🌙';
    console.log(`Tema cambiado a: ${isDark ? 'oscuro' : 'claro'}`);
}

// ---- 11. EVENT LISTENERS ----

document.addEventListener('DOMContentLoaded', () => {
    console.log('MindFocus App Iniciada');
    
    const savedTheme = localStorage.getItem('mindfocus-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        elements.themeSwitch.querySelector('.theme-icon').textContent = '☀️';
    }
    
    // Observador de estado de autenticacion
    onAuthStateChanged(auth, (user) => {
        updateAuthUI(user);
        if (user) {
            loadTasksFromFirestore();
        }
    });
    
    // Login/Registro por email y password
    elements.btnLogin.addEventListener('click', () => {
        playClick();
        isRegistering = false;
        toggleAuthMode(); // Resetear a modo login
        elements.authModal.classList.add('active');
    });
    
    elements.closeAuthModal.addEventListener('click', () => {
        elements.authModal.classList.remove('active');
        elements.authForm.reset();
    });
    
    elements.authToggleBtn.addEventListener('click', () => {
        playClick();
        toggleAuthMode();
    });
    
    elements.authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = elements.authEmail.value;
        const password = elements.authPassword.value;
        
        if (isRegistering) {
            const name = elements.authName.value;
            registerWithEmail(email, password, name).then(() => {
                elements.authModal.classList.remove('active');
                elements.authForm.reset();
            });
        } else {
            loginWithEmail(email, password).then(() => {
                elements.authModal.classList.remove('active');
                elements.authForm.reset();
            });
        }
    });
    
    // Login con Google
    elements.btnGoogleLogin.addEventListener('click', () => {
        playClick();
        loginWithGoogle().then(() => {
            elements.authModal.classList.remove('active');
        });
    });
    
    // Logout
    elements.btnLogout.addEventListener('click', async () => {
        playClick();
        await logoutUser();
    });
    
    // Agregar tarea
    elements.btnAddTask.addEventListener('click', () => {
        elements.taskModal.classList.add('active');
    });
    
    // Cerrar modal de agregar tarea
    elements.closeModal.addEventListener('click', () => {
        elements.taskModal.classList.remove('active');
        elements.taskForm.reset();
    });
    
    // Cerrar modal del temporizador
    elements.closeTimer.addEventListener('click', () => {
        elements.timerOverlay.classList.remove('active');
        pauseTimer();
    });
    
    // Enviar formulario de nueva tarea
    elements.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('taskName').value;
        const color = document.getElementById('taskColor').value;
        const notes = document.getElementById('taskNotes').value;
        addTask(name, color, notes);
        elements.taskModal.classList.remove('active');
        elements.taskForm.reset();
    });
    
    // Cambiar tema
    elements.themeSwitch.addEventListener('click', toggleTheme);
    
    // Controles del temporizador
    elements.timerControls.start.addEventListener('click', () => {
        playClick();
        startTimer();
    });
    
    elements.timerControls.pause.addEventListener('click', () => {
        playClick();
        pauseTimer();
    });
    
    elements.timerControls.reset.addEventListener('click', () => {
        playClick();
        resetTimer();
    });
    
    // Cerrar modales al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) {
            elements.taskModal.classList.remove('active');
        }
        if (e.target === elements.timerOverlay) {
            elements.timerOverlay.classList.remove('active');
            pauseTimer();
        }
        if (e.target === elements.authModal) {
            elements.authModal.classList.remove('active');
        }
    });
    
    renderTasks();
});
