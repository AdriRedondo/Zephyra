// SISTEMA DE ATAJOS DE TECLADO Y ACCESIBILIDAD
// Versión mejorada que guarda en la base de datos del usuario

// Atajos por defecto
const DEFAULT_SHORTCUTS = {
    'inicio': 'Alt+I',
    'vehiculos': 'Alt+V',
    'reservas': 'Alt+R',
    'login': 'Alt+L',
    'perfil': 'Alt+P',
    'admin': 'Alt+M',
    'logout': 'Alt+G',
    'accesibilidad': 'Alt+A',
    'ayuda': 'F1'
};

// Variable para preferencias actuales (se sincroniza con BD)
let preferenciasActuales = {
    fontSize: '100',
    theme: 'light',
    atajos: null
};

// Bandera para saber si el usuario está autenticado
let usuarioAutenticado = false;

// GESTIÓN DE PREFERENCIAS DE ACCESIBILIDAD
// ---------------------------------------------------

// Función para cargar preferencias desde la BD al iniciar
function cargarPreferenciasBD() {
    fetch('/api/accesibilidad/preferencias')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                usuarioAutenticado = true;
                const prefs = result.data;
                console.log('Preferencias cargadas desde BD:', prefs);

                // Guardar preferencias actuales
                preferenciasActuales = {
                    fontSize: prefs.fontSize || '100',
                    theme: prefs.theme || 'light',
                    atajos: prefs.atajos || null
                };

                // Aplicar las preferencias
                aplicarPreferencias(preferenciasActuales);
            } else if (result.success && !result.data) {
                // Usuario autenticado pero sin preferencias guardadas
                usuarioAutenticado = true;
                aplicarPreferenciasDefault();
            } else {
                // Usuario no autenticado
                usuarioAutenticado = false;
            }
        })
        .catch(err => {
            console.log('ℹNo hay sesión activa');
            usuarioAutenticado = false;
        });
}
// Aplicar preferencias
function aplicarPreferencias(prefs) {
    // Aplicar tamaño de fuente
    if (prefs.fontSize) {
        document.documentElement.style.fontSize = prefs.fontSize + "%";
        actualizarUIFontSize(prefs.fontSize);
    }

    // Aplicar tema
    if (prefs.theme) {
        if (prefs.theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
        actualizarUITheme(prefs.theme);
    }

    // Cargar atajos personalizados si existen
    if (prefs.atajos) {
        guardarAtajosEnMemoria(prefs.atajos);
    }
}

// Aplicar preferencias por defecto
function aplicarPreferenciasDefault() {
    preferenciasActuales = {
        fontSize: '100',
        theme: 'light',
        atajos: null
    };
    document.documentElement.style.fontSize = "100%";
    document.documentElement.removeAttribute("data-theme");
    actualizarUIFontSize('100');
    actualizarUITheme('light');
}

// Actualizar UI de tamaño de fuente
function actualizarUIFontSize(fontSize) {
    const fontSmBtn = document.getElementById('font-sm-btn');
    const fontNmBtn = document.getElementById('font-nm-btn');
    const fontLgBtn = document.getElementById('font-lg-btn');

    // Quitar disabled de todos
    if (fontSmBtn) fontSmBtn.disabled = false;
    if (fontNmBtn) fontNmBtn.disabled = false;
    if (fontLgBtn) fontLgBtn.disabled = false;

    // Quitar clase active de todos
    if (fontSmBtn) fontSmBtn.classList.remove('active');
    if (fontNmBtn) fontNmBtn.classList.remove('active');
    if (fontLgBtn) fontLgBtn.classList.remove('active');

    // Agregar disabled y active al botón seleccionado
    if (fontSize === '80') {
        if (fontSmBtn) {
            fontSmBtn.classList.add('active');
            fontSmBtn.disabled = true;
        }
    } else if (fontSize === '100') {
        if (fontNmBtn) {
            fontNmBtn.classList.add('active');
            fontNmBtn.disabled = true;
        }
    } else if (fontSize === '120') {
        if (fontLgBtn) {
            fontLgBtn.classList.add('active');
            fontLgBtn.disabled = true;
        }
    }
}

// Actualizar UI de tema
function actualizarUITheme(theme) {
    const lightBtn = document.getElementById("light-btn");
    const darkBtn = document.getElementById("dark-btn");

    if (lightBtn && darkBtn) {
        if (theme === 'dark') {
            darkBtn.disabled = true;
            lightBtn.disabled = false;
        } else {
            lightBtn.disabled = true;
            darkBtn.disabled = false;
        }
    }
}



// Cambiar tamaño de fuente
function cambiarFontSize(size) {
    document.documentElement.style.fontSize = size + "%";
    preferenciasActuales.fontSize = size;
    actualizarUIFontSize(size);
}

// Cambiar tema
function cambiarTema(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
    preferenciasActuales.theme = theme;
    actualizarUITheme(theme);
}

// Guardar preferencias en la BD (solo para usuarios autenticados)
function guardarPreferenciasPermanentes() {
    if (!usuarioAutenticado) {
        mostrarMensajeError('Debes iniciar sesión para guardar tus preferencias permanentemente');
        return;
    }

    // Obtener atajos actuales
    const atajosActuales = cargarAtajos();

    fetch('/api/accesibilidad/preferencias', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fontSize: preferenciasActuales.fontSize,
            theme: preferenciasActuales.theme,
            atajos: atajosActuales
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Preferencias guardadas en BD:', data);
                mostrarMensajeExito('Preferencias guardadas correctamente');
                preferenciasActuales.atajos = atajosActuales;
            } else {
                console.error('Error al guardar:', data);
                mostrarMensajeError(data.message || 'Error al guardar las preferencias');
            }
        })
        .catch(err => {
            console.error('Error en petición:', err);
            mostrarMensajeError('Error de conexión al guardar');
        });
}

// Restaurar preferencias por defecto
function restaurarPreferenciasDefault() {
    if (!confirm('¿Restaurar todas las preferencias a valores por defecto?')) {
        return;
    }

    if (usuarioAutenticado) {
        // Eliminar de BD
        fetch('/api/accesibilidad/preferencias', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log('Preferencias eliminadas de BD');
                aplicarPreferenciasDefault();
                // Restaurar atajos también
                guardarAtajos(DEFAULT_SHORTCUTS);
                mostrarMensajeExito('Preferencias restauradas a valores por defecto');
            })
            .catch(err => {
                console.error('Error al eliminar preferencias:', err);
                aplicarPreferenciasDefault();
                mostrarMensajeError('Error al restaurar preferencias');
            });
    } else {
        // Usuario no autenticado, limpiar localStorage
        localStorage.removeItem('fontSize');
        localStorage.removeItem('theme');
        aplicarPreferenciasDefault();
        guardarAtajos(DEFAULT_SHORTCUTS);
        mostrarMensajeExito('Preferencias restauradas localmente');
    }
}

// Mensajes de éxito y error
function mostrarMensajeExito(texto) {
    const msg = document.createElement('div');
    msg.className = 'alert alert-success alert-dismissible fade show';
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;min-width:300px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    msg.innerHTML = `
        <i class="bi bi-check-circle-fill me-2"></i>${texto}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
}

function mostrarMensajeError(texto) {
    const msg = document.createElement('div');
    msg.className = 'alert alert-danger alert-dismissible fade show';
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:10000;min-width:300px;box-shadow:0 4px 12px rgba(0,0,0,0.15);';
    msg.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill me-2"></i>${texto}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
}

// GESTIÓN DE ATAJOS DE TECLADO
//------------------------------------------

// Cargar atajos personalizados o usar defaults
function cargarAtajos() {
    // Si hay atajos en las preferencias actuales, usarlos
    if (preferenciasActuales.atajos) {
        return preferenciasActuales.atajos;
    }

    // Si no, buscar en localStorage
    const saved = localStorage.getItem('keyboardShortcuts');
    return saved ? JSON.parse(saved) : { ...DEFAULT_SHORTCUTS };
}

// Guardar atajos en localStorage (temporal)
function guardarAtajos(shortcuts) {
    //localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcuts));
    console.log('Atajos guardados en localStorage:', shortcuts);
}

// Guardar atajos en memoria
function guardarAtajosEnMemoria(shortcuts) {
    preferenciasActuales.atajos = shortcuts;
    //localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcuts));
}

// EVENT LISTENERS
// -------------------------------------------------
document.getElementById("font-sm-btn")?.addEventListener("click", () => {
    cambiarFontSize("80");
});

document.getElementById("font-nm-btn")?.addEventListener("click", () => {
    cambiarFontSize("100");
});

document.getElementById("font-lg-btn")?.addEventListener("click", () => {
    cambiarFontSize("120");
});

document.getElementById("light-btn")?.addEventListener("click", () => {
    cambiarTema("light");
});

document.getElementById("dark-btn")?.addEventListener("click", () => {
    cambiarTema("dark");
});

// MANEJADOR DE ATAJOS DE TECLADO
// ------------------------------------------
function normalizarCombinacion(event) {
    const keys = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');

    if (event.key && !['Control', 'Alt', 'Shift'].includes(event.key)) {
        if (event.key.startsWith('F') && event.key.length <= 3) {
            keys.push(event.key.toUpperCase());
        } else if (event.key === ' ') {
            keys.push('SPACE');
        } else if (event.key === 'Escape') {
            keys.push('ESC');
        } else if (event.key === 'Enter') {
            keys.push('ENTER');
        } else {
            keys.push(event.key.toUpperCase());
        }
    }

    return keys.join('+');
}

const ACTIONS_MAP = {
    'inicio': () => window.location.href = '/es-inicio',
    'vehiculos': () => window.location.href = '/es-vehiculos',
    'reservas': () => window.location.href = '/es-reservas',
    'login': () => window.location.href = '/es-login',
    'perfil': () => window.location.href = '/es-perfil',
    'admin': () => window.location.href = '/es-admin',
    'logout': () => window.location.href = '/es-logout',
    'accesibilidad': () => {
        const modal = document.getElementById('accessModal');
        if (modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        }
    },
    'ayuda': () => mostrarAyudaAtajos()
};

document.addEventListener('keydown', (event) => {
    const combinacion = normalizarCombinacion(event);
    const shortcuts = cargarAtajos();

    for (const [action, shortcut] of Object.entries(shortcuts)) {
        if (combinacion === shortcut) {
            event.preventDefault();
            const actionFn = ACTIONS_MAP[action];
            if (actionFn) actionFn();
            break;
        }
    }
});

// ============================================
// FUNCIONES DE AYUDA Y CONFIGURACIÓN
// ============================================

function mostrarAyudaAtajos() {
    const shortcuts = cargarAtajos();
    let html = '<div class="shortcuts-help"><h3>Atajos de Teclado</h3><table class="table table-sm"><thead><tr><th>Acción</th><th>Atajo</th></tr></thead><tbody>';

    const labels = {
        'inicio': 'Ir a Inicio',
        'vehiculos': 'Ir a Vehículos',
        'reservas': 'Ir a Reservas',
        'login': 'Iniciar Sesión',
        'perfil': 'Ver Perfil',
        'admin': 'Panel Admin',
        'logout': 'Cerrar Sesión',
        'accesibilidad': 'Accesibilidad',
        'ayuda': 'Esta Ayuda'
    };

    for (const [action, shortcut] of Object.entries(shortcuts)) {
        html += `<tr><td>${labels[action] || action}</td><td><kbd>${shortcut}</kbd></td></tr>`;
    }

    html += '</tbody></table><button class="btn border-secondary" onclick="cerrarAyudaAtajos()">Cerrar</button></div>';

    const overlay = document.createElement('div');
    overlay.id = 'shortcuts-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarAyudaAtajos();
    });
}

function cerrarAyudaAtajos() {
    document.getElementById('shortcuts-overlay')?.remove();
}

function mostrarConfiguradorAtajos() {
    const modal = document.getElementById('accessModal');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) bsModal.hide();
    }

    const shortcuts = cargarAtajos();
    const labels = {
        'inicio': 'Ir a Inicio',
        'vehiculos': 'Ir a Vehículos',
        'reservas': 'Ir a Reservas',
        'login': 'Iniciar Sesión',
        'perfil': 'Ver Perfil',
        'admin': 'Panel Admin',
        'logout': 'Cerrar Sesión',
        'accesibilidad': 'Accesibilidad',
        'ayuda': 'Ayuda de Atajos'
    };

    let html = '<div class="shortcuts-help shortcuts-config">';
    html += '<h3>Configurar Atajos de Teclado</h3>';
    html += '<p class="text-muted small">Haz clic en un campo y presiona la combinación de teclas deseada</p>';
    html += '<div class="shortcuts-grid">';

    for (const [action, shortcut] of Object.entries(shortcuts)) {
        html += `
            <div class="shortcut-item">
                <label>${labels[action] || action}</label>
                <input type="text" class="form-control shortcut-input" 
                    data-action="${action}" value="${shortcut}"
                    placeholder="Haz clic y presiona teclas...">
            </div>
        `;
    }

    html += '</div>';
    html += '<div class="mt-3 d-flex gap-2">';
    html += '<button class="btn border-secondary flex-fill" onclick="restaurarAtajosDefecto()">Restaurar atajos</button>';
    html += '<button class="btn border-secondary" onclick="cerrarConfiguradorAtajos()">Cancelar</button>';
    html += '<button class="btn border-success flex-fill" onclick="guardarAtajosConfig()">Guardar</button>';
    html += '</div></div>';

    const overlay = document.createElement('div');
    overlay.id = 'shortcuts-config-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    const inputs = overlay.querySelectorAll('.shortcut-input');
    inputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const combinacion = normalizarCombinacion(e);
            if (combinacion) {
                input.value = combinacion;
                input.dataset.newShortcut = combinacion;
                input.style.backgroundColor = '#d4edda';
            }
        });
        input.addEventListener('click', (e) => e.target.select());
        input.addEventListener('focus', (e) => {
            e.target.select();
            e.target.placeholder = 'Presiona la combinación de teclas...';
        });
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrarConfiguradorAtajos();
    });
}

function guardarAtajosConfig() {
    const inputs = document.querySelectorAll('.shortcut-input');
    const newShortcuts = {};

    inputs.forEach(input => {
        const action = input.dataset.action;
        const shortcut = input.dataset.newShortcut || input.value;
        newShortcuts[action] = shortcut;
    });

    guardarAtajos(newShortcuts);
    cerrarConfiguradorAtajos();
    mostrarMensajeExito('Atajos guardados. Usa "Guardar preferencias" para hacerlo permanente.');
}

function restaurarAtajosDefecto() {
    if (confirm('¿Restaurar atajos a valores por defecto?')) {
        guardarAtajos(DEFAULT_SHORTCUTS);
        cerrarConfiguradorAtajos();
        mostrarMensajeExito('Atajos restaurados a valores por defecto');
    }
}

function cerrarConfiguradorAtajos() {
    document.getElementById('shortcuts-config-overlay')?.remove();
}

// Inyectar estilos
function inyectarEstilosAyuda() {
    const style = document.createElement('style');
    style.textContent = `
        .shortcuts-help {
            background: white;
            color: #333;
            padding: 2rem;
            border-radius: 10px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        [data-theme="dark"] .shortcuts-help {
            background: #2d2d2d;
            color: #f0f0f0;
        }
        .shortcuts-help h3 {
            margin-bottom: 1.5rem;
            color: #198754;
        }
        .shortcuts-help table { margin-bottom: 1.5rem; color: inherit; }
        .shortcuts-help table th, .shortcuts-help table td { color: inherit; padding: 0.5rem; }
        .shortcuts-help kbd {
            background: #f4f4f4;
            border: 1px solid #ccc;
            border-radius: 3px;
            padding: 2px 8px;
            font-family: monospace;
            font-size: 0.9em;
            color: #333;
        }
        [data-theme="dark"] .shortcuts-help kbd {
            background: #444;
            border-color: #666;
            color: #f0f0f0;
        }
        .shortcuts-help button { width: 100%; }
        *:focus {
            outline: 3px solid #198754;
            outline-offset: 2px;
        }
        [data-theme="dark"] *:focus { outline-color: #4CAF50; }
        .shortcuts-config { max-width: 700px; max-height: 90vh; }
        .shortcuts-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
            max-height: 60vh;
            overflow-y: auto;
            padding: 0.5rem;
        }
        .shortcut-item { display: flex; flex-direction: column; gap: 0.5rem; }
        .shortcut-item label { font-weight: 500; margin: 0; }
        .shortcut-input { cursor: pointer; }
        .shortcut-input:focus {
            background-color: #ffffcc;
            border-color: #198754;
        }
        [data-theme="dark"] .shortcut-input:focus { background-color: #3a3a00; }
        @media (min-width: 768px) {
            .shortcuts-grid { grid-template-columns: 1fr 1fr; }
        }
    `;
    document.head.appendChild(style);
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    inyectarEstilosAyuda();
    cargarPreferenciasBD();
});