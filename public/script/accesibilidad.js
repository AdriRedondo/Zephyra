
// SISTEMA DE ATAJOS DE TECLADO CONFIGURABLES


// Atajos por defecto
const DEFAULT_SHORTCUTS = {
    'inicio': 'Alt+I',
    'vehiculos': 'Alt+V',
    'reservas': 'Alt+R',
    'contacto': 'Alt+C',
    'login': 'Alt+L',
    'perfil': 'Alt+P',
    'admin': 'Alt+M',
    'logout': 'Alt+G',
    'accesibilidad': 'Alt+A',
    'buscar': 'Ctrl+K',
    'ayuda': 'F1'
};

// Cargar atajos personalizados o usar defaults
function cargarAtajos() {
    const saved = localStorage.getItem('keyboardShortcuts');
    return saved ? JSON.parse(saved) : { ...DEFAULT_SHORTCUTS };
}

// Guardar atajos personalizados
function guardarAtajos(shortcuts) {
    localStorage.setItem('keyboardShortcuts', JSON.stringify(shortcuts));
    console.log('Atajos guardados:', shortcuts);
}

// Función para guardar preferencias en sesión
function guardarPreferencias(tipo, valor) {
    fetch('/api/accesibilidad/preferencias', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [tipo]: valor })
    })
        .then(response => response.json())
        .then(data => {
            console.log('Preferencias guardadas:', data);
            localStorage.setItem(tipo, valor);
        })
        .catch(err => {
            console.error('Error al guardar preferencias:', err);
            localStorage.setItem(tipo, valor);
        });
}

// Función para cargar preferencias al iniciar
function cargarPreferencias() {
    fetch('/api/accesibilidad/preferencias')
        .then(response => response.json())
        .then(result => {
            if (result.success && result.data) {
                const prefs = result.data;

                // Aplicar fontSize
                if (prefs.fontSize) {
                    document.documentElement.style.fontSize = prefs.fontSize + "%";
                    localStorage.setItem("fontSize", prefs.fontSize);
                }

                // Aplicar theme
                if (prefs.theme) {
                    if (prefs.theme === "dark") {
                        document.documentElement.setAttribute("data-theme", "dark");
                        if (darkBtn) darkBtn.disabled = true;
                        if (lightBtn) lightBtn.disabled = false;
                    }
                    localStorage.setItem("theme", prefs.theme);
                }
            }
        })
        .catch(err => {
            console.error('Error al cargar preferencias:', err);
        });
}

document.getElementById("font-sm-btn").addEventListener("click", () => {
    document.documentElement.style.fontSize = "80%";
    guardarPreferencias("fontSize", "80");
});

document.getElementById("font-nm-btn").addEventListener("click", () => {
    document.documentElement.style.fontSize = "100%";
    guardarPreferencias("fontSize", "100");
});

document.getElementById("font-lg-btn").addEventListener("click", () => {
    document.documentElement.style.fontSize = "120%";
    guardarPreferencias("fontSize", "120");
});

const html = document.documentElement;
const lightBtn = document.getElementById("light-btn");
const darkBtn = document.getElementById("dark-btn");

// Cargar preferencia guardada al inicio
cargarPreferencias();

// Activar modo claro
lightBtn.addEventListener("click", () => {
    html.removeAttribute("data-theme");
    guardarPreferencias("theme", "light");
    lightBtn.disabled = true;
    darkBtn.disabled = false;
});

// Activar modo oscuro
darkBtn.addEventListener("click", () => {
    html.setAttribute("data-theme", "dark");
    guardarPreferencias("theme", "dark");
    darkBtn.disabled = true;
    lightBtn.disabled = false;
});


// MANEJADOR DE ATAJOS DE TECLADO


// Normalizar combinación de teclas
function normalizarCombinacion(event) {
    const keys = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.altKey) keys.push('Alt');
    if (event.shiftKey) keys.push('Shift');

    // Agregar la tecla principal
    if (event.key && !['Control', 'Alt', 'Shift'].includes(event.key)) {
        // Manejar teclas especiales
        if (event.key.startsWith('F') && event.key.length <= 3) {
            // Teclas de función F1-F12
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

// Mapeo de acciones a URLs/funciones
const ACTIONS_MAP = {
    'inicio': () => window.location.href = '/es-inicio',
    'vehiculos': () => window.location.href = '/es-vehiculos',
    'reservas': () => window.location.href = '/es-reservas',
    'contacto': () => window.location.href = '/es-contacto',
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
    'buscar': () => {
        const searchInput = document.querySelector('input[type="search"], input[name="buscar"]');
        if (searchInput) searchInput.focus();
    },
    'ayuda': () => {
        mostrarAyudaAtajos();
    }
};

// Manejador global de eventos de teclado
document.addEventListener('keydown', (event) => {
    const combinacion = normalizarCombinacion(event);
    const shortcuts = cargarAtajos();

    // Buscar si la combinación coincide con algún atajo
    for (const [action, shortcut] of Object.entries(shortcuts)) {
        if (combinacion === shortcut) {
            event.preventDefault();
            const actionFn = ACTIONS_MAP[action];
            if (actionFn) {
                actionFn();
            }
            break;
        }
    }
});

// Mostrar panel de ayuda de atajos
function mostrarAyudaAtajos() {
    const shortcuts = cargarAtajos();
    let html = '<div class="shortcuts-help"><h3>Atajos de Teclado</h3><table class="table table-sm"><thead><tr><th>Acción</th><th>Atajo</th></tr></thead><tbody>';

    const labels = {
        'inicio': 'Ir a Inicio',
        'vehiculos': 'Ir a Vehículos',
        'reservas': 'Ir a Reservas',
        'contacto': 'Ir a Contacto',
        'login': 'Iniciar Sesión',
        'perfil': 'Ver Perfil',
        'admin': 'Panel Admin',
        'logout': 'Cerrar Sesión',
        'accesibilidad': 'Accesibilidad',
        'buscar': 'Buscar',
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
    const overlay = document.getElementById('shortcuts-overlay');
    if (overlay) overlay.remove();
}

// ============================================
// CONFIGURADOR DE ATAJOS PERSONALIZADO
// ============================================

function mostrarConfiguradorAtajos() {
    // Cerrar el modal de accesibilidad si está abierto
    const modal = document.getElementById('accessModal');
    if (modal) {
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
        }
    }

    const shortcuts = cargarAtajos();
    const labels = {
        'inicio': 'Ir a Inicio',
        'vehiculos': 'Ir a Vehículos',
        'reservas': 'Ir a Reservas',
        'contacto': 'Ir a Contacto',
        'login': 'Iniciar Sesión',
        'perfil': 'Ver Perfil',
        'admin': 'Panel Admin',
        'logout': 'Cerrar Sesión',
        'accesibilidad': 'Accesibilidad',
        'buscar': 'Buscar',
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
                <input
                    type="text"
                    class="form-control shortcut-input"
                    data-action="${action}"
                    data-original="${shortcut}"
                    value="${shortcut}"
                    placeholder="Haz clic y presiona teclas..."
                >
            </div>
        `;
    }

    html += '</div>';
    html += '<div class="mt-3 d-flex gap-2">';
    html += '<button class="btn border-secondary flex-fill" onclick="restaurarAtajosDefecto()">Restaurar atajos</button>';
    html += '<button class="btn border-secondary" onclick="cerrarConfiguradorAtajos()">Cancelar</button>';
    html += '<button class="btn border-success flex-fill" onclick="guardarAtajosConfig()">Guardar</button>';
    html += '</div>';
    html += '</div>';

    const overlay = document.createElement('div');
    overlay.id = 'shortcuts-config-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    // Agregar listeners a los inputs
    const inputs = overlay.querySelectorAll('.shortcut-input');
    inputs.forEach(input => {
        // Cuando se presiona una tecla, capturar la combinación
        input.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const combinacion = normalizarCombinacion(e);
            if (combinacion && combinacion !== '') {
                input.value = combinacion;
                input.dataset.newShortcut = combinacion;
                input.style.backgroundColor = '#d4edda'; // Verde claro para indicar cambio
                console.log(`Nuevo atajo para ${input.dataset.action}: ${combinacion}`);
            }
        });

        // Al hacer clic, seleccionar todo el texto para facilitar reemplazo
        input.addEventListener('click', (e) => {
            e.target.select();
        });

        // Al recibir foco, solo seleccionar el texto (no limpiar)
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

    // Mostrar confirmación
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#198754;color:white;padding:1rem 2rem;border-radius:5px;z-index:10000;';
    msg.textContent = 'Atajos guardados correctamente';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}

function restaurarAtajosDefecto() {
    if (confirm('¿Restaurar atajos a valores por defecto?')) {
        guardarAtajos(DEFAULT_SHORTCUTS);
        cerrarConfiguradorAtajos();

        const msg = document.createElement('div');
        msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#198754;color:white;padding:1rem 2rem;border-radius:5px;z-index:10000;';
        msg.textContent = 'Atajos restaurados a valores por defecto';
        document.body.appendChild(msg);
        setTimeout(() => msg.remove(), 2000);
    }
}

function cerrarConfiguradorAtajos() {
    const overlay = document.getElementById('shortcuts-config-overlay');
    if (overlay) overlay.remove();
}

// ============================================
// ORDEN DE TABULACIÓN MEJORADO
// ============================================

// Mejorar orden de tabulación en formularios
function mejorarOrdenTabulacion() {
    // Obtener todos los elementos interactivos
    const elementos = document.querySelectorAll('a, button, input, select, textarea, [tabindex]');

    // Elementos con tabindex explícito se ordenan primero
    const conTabindex = Array.from(elementos).filter(el => {
        const ti = parseInt(el.getAttribute('tabindex'));
        return !isNaN(ti) && ti >= 0;
    }).sort((a, b) => {
        return parseInt(a.getAttribute('tabindex')) - parseInt(b.getAttribute('tabindex'));
    });

    // Elementos sin tabindex mantienen orden DOM
    const sinTabindex = Array.from(elementos).filter(el => {
        const ti = el.getAttribute('tabindex');
        return ti === null || ti === '';
    });

    console.log(`Orden de tabulación: ${conTabindex.length} elementos con tabindex, ${sinTabindex.length} en orden DOM`);
}

// Inyectar estilos para el panel de ayuda
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

        .shortcuts-help table {
            margin-bottom: 1.5rem;
            color: inherit;
        }

        .shortcuts-help table th,
        .shortcuts-help table td {
            color: inherit;
            padding: 0.5rem;
        }

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

        .shortcuts-help button {
            width: 100%;
        }

        /* Indicador visual de foco mejorado */
        *:focus {
            outline: 3px solid #198754;
            outline-offset: 2px;
        }

        [data-theme="dark"] *:focus {
            outline-color: #4CAF50;
        }

        /* Estilos para el configurador de atajos */
        .shortcuts-config {
            max-width: 700px;
            max-height: 90vh;
        }

        .shortcuts-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
            max-height: 60vh;
            overflow-y: auto;
            padding: 0.5rem;
        }

        .shortcut-item {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .shortcut-item label {
            font-weight: 500;
            margin: 0;
        }

        .shortcut-input {
            cursor: pointer;
        }

        .shortcut-input:focus {
            background-color: #ffffcc;
            border-color: #198754;
        }

        [data-theme="dark"] .shortcut-input:focus {
            background-color: #3a3a00;
        }

        @media (min-width: 768px) {
            .shortcuts-grid {
                grid-template-columns: 1fr 1fr;
            }
        }
    `;
    document.head.appendChild(style);
}

// Ejecutar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    mejorarOrdenTabulacion();
    inyectarEstilosAyuda();
    console.log('Sistema de atajos de teclado activado');
    console.log('Presiona F1 para ver la lista de atajos');
});
