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
