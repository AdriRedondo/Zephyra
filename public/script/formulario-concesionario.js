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