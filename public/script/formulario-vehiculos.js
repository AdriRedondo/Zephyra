document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("vehicle-form-id");
    const matricula = document.getElementById("matricula");
    const marca = document.getElementById("marca");
    const modelo = document.getElementById("modelo");
    const anyo = document.getElementById("anyo_matriculacion");
    const plazas = document.getElementById("numero_plazas");
    const autonomia = document.getElementById("autonomia_km");
    const color = document.getElementById("color");
    const concesionario = document.getElementById("concesionario");
    const estado = document.getElementById("estado");
    const imagen = document.getElementById("imagen");

    console.log("Formulario de vehículo cargado correctamente");

    // Listeners para validación en tiempo real
    matricula.addEventListener("input", validarMatricula);
    marca.addEventListener("input", validarMarca);
    modelo.addEventListener("input", validarModelo);
    anyo.addEventListener("input", validarAnyo);
    plazas.addEventListener("input", validarPlazas);
    autonomia.addEventListener("input", validarAutonomia);
    color.addEventListener("input", validarColor);
    concesionario.addEventListener("change", validarConcesionario);
    estado.addEventListener("change", validarEstado);
    imagen.addEventListener("change", validarImagen);

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const esValidoMatricula = validarMatricula();
        const esValidoMarca = validarMarca();
        const esValidoModelo = validarModelo();
        const esValidoAnyo = validarAnyo();
        const esValidoPlazas = validarPlazas();
        const esValidoAutonomia = validarAutonomia();
        const esValidoColor = validarColor();
        const esValidoConcesionario = validarConcesionario();
        const esValidoEstado = validarEstado();
        const esValidoImagen = validarImagen();

        if (esValidoMatricula && esValidoMarca && esValidoModelo && esValidoAnyo &&
            esValidoPlazas && esValidoAutonomia && esValidoColor && esValidoConcesionario &&
            esValidoEstado && esValidoImagen) {
            form.submit();
        } else {
            alert("Por favor, corrige los campos erróneos antes de enviar el formulario.");
        }
    });

    form.addEventListener("reset", () => {
        resetColors(matricula);
        resetColors(marca);
        resetColors(modelo);
        resetColors(anyo);
        resetColors(plazas);
        resetColors(autonomia);
        resetColors(color);
        resetColors(concesionario);
        resetColors(estado);
        resetColors(imagen);
    });

    // Funciones auxiliares
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

    // Validación matrícula (formato español: 1234ABC o 1234-ABC)
    function validarMatricula() {
        const value = matricula.value.trim().toUpperCase();
        const errorElement = document.getElementById("matricula-error");

        // Formato español: 4 dígitos + 3 letras, opcionalmente con guión
        if (!/^\d{4}-?[A-Z]{3}$/.test(value)) {
            colorearInputs(matricula, false);
            errorElement.textContent = "Formato inválido. Debe ser: 1234ABC o 1234-ABC";
            return false;
        }

        colorearInputs(matricula, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación marca (solo letras, mínimo 2 caracteres)
    function validarMarca() {
        const value = marca.value.trim();
        const errorElement = document.getElementById("marca-error");

        if (value === "" || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/.test(value)) {
            colorearInputs(marca, false);
            errorElement.textContent = "Debe tener al menos 2 caracteres y solo letras";
            return false;
        }

        colorearInputs(marca, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación modelo (alfanumérico, mínimo 1 carácter)
    function validarModelo() {
        const value = modelo.value.trim();
        const errorElement = document.getElementById("modelo-error");

        if (value === "" || value.length < 1) {
            colorearInputs(modelo, false);
            errorElement.textContent = "El modelo es obligatorio";
            return false;
        }

        colorearInputs(modelo, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación año de matriculación
    function validarAnyo() {
        const value = parseInt(anyo.value);
        const errorElement = document.getElementById("anyoMatri-error");
        const currentYear = new Date().getFullYear();

        if (isNaN(value) || value < 1900 || value > currentYear + 1) {
            colorearInputs(anyo, false);
            errorElement.textContent = `Debe estar entre 1900 y ${currentYear + 1}`;
            return false;
        }

        colorearInputs(anyo, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación número de plazas (1-9)
    function validarPlazas() {
        const value = parseInt(plazas.value);
        const errorElement = document.getElementById("numPlazas-error");

        if (isNaN(value) || value < 1 || value > 9) {
            colorearInputs(plazas, false);
            errorElement.textContent = "Debe ser un número entre 1 y 9";
            return false;
        }

        colorearInputs(plazas, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación autonomía (km positivos)
    function validarAutonomia() {
        const value = parseInt(autonomia.value);
        const errorElement = document.getElementById("autonomia-error");

        if (isNaN(value) || value < 1) {
            colorearInputs(autonomia, false);
            errorElement.textContent = "Debe ser un número positivo";
            return false;
        }

        colorearInputs(autonomia, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación color (solo letras, mínimo 3 caracteres)
    function validarColor() {
        const value = color.value.trim();
        const errorElement = document.getElementById("color-error");

        if (value === "" || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(value)) {
            colorearInputs(color, false);
            errorElement.textContent = "Debe tener al menos 3 caracteres y solo letras";
            return false;
        }

        colorearInputs(color, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación concesionario (debe seleccionar uno)
    function validarConcesionario() {
        const value = concesionario.value;
        const errorElement = document.getElementById("concesionario-error");

        if (value === "" || value === "Sin asignar") {
            colorearInputs(concesionario, false);
            errorElement.textContent = "Debes seleccionar un concesionario";
            return false;
        }

        colorearInputs(concesionario, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación estado (siempre válido, pero verificamos)
    function validarEstado() {
        const value = estado.value;
        const errorElement = document.getElementById("estado-error");

        if (value === "") {
            colorearInputs(estado, false);
            errorElement.textContent = "Debes seleccionar un estado";
            return false;
        }

        colorearInputs(estado, true);
        errorElement.textContent = "";
        return true;
    }

    // Validación imagen (solo en modo crear, formato y tamaño)
    function validarImagen() {
        const errorElement = document.getElementById("imagen-error");
        const esEdicion = form.action.includes("/editar");

        // Si es edición y no hay archivo, es válido
        if (esEdicion && imagen.files.length === 0) {
            resetColors(imagen);
            errorElement.textContent = "";
            return true;
        }

        // Si es creación y no hay archivo, es inválido
        if (!esEdicion && imagen.files.length === 0) {
            colorearInputs(imagen, false);
            errorElement.textContent = "Debes seleccionar una imagen";
            return false;
        }

        // Si hay archivo, validar formato y tamaño
        if (imagen.files.length > 0) {
            const file = imagen.files[0];
            const formatosValidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const maxSize = 5 * 1024 * 1024; // 5MB

            if (!formatosValidos.includes(file.type)) {
                colorearInputs(imagen, false);
                errorElement.textContent = "Formato no válido. Usa JPG, PNG o WEBP";
                return false;
            }

            if (file.size > maxSize) {
                colorearInputs(imagen, false);
                errorElement.textContent = "La imagen no debe superar los 5MB";
                return false;
            }
        }

        colorearInputs(imagen, true);
        errorElement.textContent = "";
        return true;
    }
});