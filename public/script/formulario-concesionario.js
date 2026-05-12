document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("dealer-form-id");
    const nombre = document.getElementById("dealer-nombre");
    const ciudad = document.getElementById("dealer-ciudad");
    const direccion = document.getElementById("dealer-direccion");
    const telefono = document.getElementById("dealer-telefono");

    console.log("Formulario de concesionario cargado correctamente");

    // Agregamos los listeners para validación en tiempo real
    nombre.addEventListener("input", validarNombre);
    ciudad.addEventListener("input", validarCiudad);
    direccion.addEventListener("input", validarDireccion);
    telefono.addEventListener("input", validarTelefono);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const esValidoNombre = validarNombre();
        const esValidoCiudad = validarCiudad();
        const esValidoDireccion = validarDireccion();
        const esValidoTelefono = validarTelefono();

        console.log("Nombre: ", nombre.value);
        console.log("Ciudad: ", ciudad.value);
        console.log("Dirección: ", direccion.value);
        console.log("Teléfono: ", telefono.value);

        if (esValidoNombre && esValidoCiudad && esValidoDireccion && esValidoTelefono) {
            form.submit();
        } else {
            alert("Por favor, corrige los campos erróneos antes de enviar el formulario.");
        }
    });

    form.addEventListener("reset", () => {
        resetColors(nombre);
        resetColors(ciudad);
        resetColors(direccion);
        resetColors(telefono);
    });

    // Colorear los inputs según estén mal o bien
    function colorearInputs(input, esCorrecto) {
        if (esCorrecto) {
            input.classList.add("right-input");
            input.classList.remove("wrong-input");
        } else {
            input.classList.add("wrong-input");
            input.classList.remove("right-input");
        }
    }

    function resetColors(input) {
        const errorElementId = `${input.id}-error`;
        const errorElement = document.getElementById(errorElementId);

        input.classList.remove("right-input");
        input.classList.remove("wrong-input");

        if (errorElement) {
            errorElement.textContent = "";
        }
    }

    // Validación nombre del concesionario
    function validarNombre() {
        const nombreValue = nombre.value.trim();
        const errorElement = document.getElementById("dealer-nombre-error");

        if (nombreValue === "" || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(nombreValue)) {
            colorearInputs(nombre, false);
            errorElement.textContent = "El nombre debe tener al menos 3 caracteres y contener solo letras y espacios";
            return false;
        } else {
            colorearInputs(nombre, true);
            errorElement.textContent = "";
            return true;
        }
    }

    // Validación ciudad
    function validarCiudad() {
        const ciudadValue = ciudad.value.trim();
        const errorElement = document.getElementById("dealer-ciudad-error");

        if (ciudadValue === "" || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(ciudadValue)) {
            colorearInputs(ciudad, false);
            errorElement.textContent = "La ciudad debe tener al menos 2 caracteres y contener solo letras y espacios";
            return false;
        } else {
            colorearInputs(ciudad, true);
            errorElement.textContent = "";
            return true;
        }
    }

    // Validación dirección
    function validarDireccion() {
        const direccionValue = direccion.value.trim();
        const errorElement = document.getElementById("dealer-direccion-error");

        if (direccionValue === "" || direccionValue.length < 5) {
            colorearInputs(direccion, false);
            errorElement.textContent = "La dirección debe tener al menos 5 caracteres";
            return false;
        } else {
            colorearInputs(direccion, true);
            errorElement.textContent = "";
            return true;
        }
    }

    // Validación teléfono (9 dígitos)
    function validarTelefono() {
        const telefonoValue = telefono.value.trim();
        const errorElement = document.getElementById("dealer-telefono-error");

        // El teléfono puede estar vacío 
        if (telefonoValue === "") {
            resetColors(telefono);
            errorElement.textContent = "";
            return true;
        }

        if (!/^[0-9]{9}$/.test(telefonoValue)) {
            colorearInputs(telefono, false);
            errorElement.textContent = "El teléfono debe contener exactamente 9 dígitos";
            return false;
        } else {
            colorearInputs(telefono, true);
            errorElement.textContent = "";
            return true;
        }
    }
});

// ── MAPA PICKER ──────────────────────────────────────────────
const inputCiudad = document.getElementById('dealer-ciudad');
const inputDireccion = document.getElementById('dealer-direccion');
const inputLat = document.getElementById('dealer-latitud');
const inputLng = document.getElementById('dealer-longitud');
const mapaInfo = document.getElementById('dealer-mapa-info');

// Inicializar Leaflet (centro en España por defecto)
const mapa = L.map('mapa-picker').setView([40.4168, -3.7038], 6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

let marcador = null;

// Si ya tenemos coordenadas (edición), poner marcador
const latInicial = parseFloat(inputLat.value);
const lngInicial = parseFloat(inputLng.value);
if (latInicial && lngInicial) {
    marcador = L.marker([latInicial, lngInicial]).addTo(mapa);
    mapa.setView([latInicial, lngInicial], 14);
}

// Clic en el mapa → colocar marcador y guardar coords
mapa.on('click', (e) => {
    const { lat, lng } = e.latlng;
    if (marcador) marcador.setLatLng([lat, lng]);
    else marcador = L.marker([lat, lng]).addTo(mapa);
    inputLat.value = lat.toFixed(7);
    inputLng.value = lng.toFixed(7);
    mapaInfo.textContent = `Coordenadas: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
});

// Geocodificar automáticamente al cambiar ciudad o dirección
let geocodeTimeout;
function geocodificar() {
    const q = `${inputDireccion.value}, ${inputCiudad.value}, España`;
    clearTimeout(geocodeTimeout);
    geocodeTimeout = setTimeout(() => {
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`)
            .then(r => r.json())
            .then(data => {
                if (data.length === 0) return;
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                if (marcador) marcador.setLatLng([lat, lng]);
                else marcador = L.marker([lat, lng]).addTo(mapa);
                mapa.setView([lat, lng], 15);
                inputLat.value = lat.toFixed(7);
                inputLng.value = lng.toFixed(7);
                mapaInfo.textContent = `Localizado: ${data[0].display_name.split(',').slice(0, 2).join(',')}`;
            });
    }, 800); // espera 800ms tras dejar de escribir
}

inputCiudad.addEventListener('input', geocodificar);
inputDireccion.addEventListener('input', geocodificar);