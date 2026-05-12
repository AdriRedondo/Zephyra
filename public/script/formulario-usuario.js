document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registro-form-id");

    // Inputs
    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correo");
    const password = document.getElementById("contraseña");
    const telefono = document.getElementById("telefono");
    const concesionario = document.getElementById("concesionario");
    const rol = document.getElementById("rol");

    console.log("Formulario de usuario cargado correctamente");

    // Listeners para validación en tiempo real
    nombre.addEventListener("input", validarNombre);
    correo.addEventListener("input", validarCorreo);
    password.addEventListener("input", validarPassword);
    telefono.addEventListener("input", validarTelefono);
    concesionario.addEventListener("change", validarConcesionario);
    rol.addEventListener("change", validarRol);

    // Submit del formulario
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const esValidoNombre = validarNombre();
        const esValidoCorreo = validarCorreo();
        const esValidoPassword = validarPassword();
        const esValidoTelefono = validarTelefono();
        const esValidoConcesionario = validarConcesionario();
        const esValidoRol = validarRol();

        if (
            esValidoNombre &&
            esValidoCorreo &&
            esValidoPassword &&
            esValidoTelefono &&
            esValidoConcesionario &&
            esValidoRol
        ) {
            form.submit();
        } else {
            alert("Por favor corrige los campos marcados antes de enviar el formulario.");
        }
    });

    // Reset colores
    form.addEventListener("reset", () => {
        resetColors(nombre);
        resetColors(correo);
        resetColors(password);
        resetColors(telefono);
        resetColors(concesionario);
        resetColors(rol);
    });

    /* FUNCIONES REUTILIZABLES */
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
        const errorElement = document.getElementById(`${input.id}-error`);
        input.classList.remove("right-input", "wrong-input");
        if (errorElement) errorElement.textContent = "";
    }

    /* VALIDACIONES */

    // Nombre (solo letras, mínimo 3)
    function validarNombre() {
        const value = nombre.value.trim();
        const error = document.getElementById("nombre-error");

        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(value)) {
            colorearInputs(nombre, false);
            error.textContent = "Debe tener al menos 3 letras y solo caracteres alfabéticos.";
            return false;
        }
        colorearInputs(nombre, true);
        error.textContent = "";
        return true;
    }

    // Correo corporativo @zephyra.com
    function validarCorreo() {
        const value = correo.value.trim();
        const error = document.getElementById("correo-error");

        if (!/^[^\s@]+@zephyra\.com$/.test(value)) {
            colorearInputs(correo, false);
            error.textContent = "Debe ser un correo corporativo (@zephyra.com).";
            return false;
        }
        colorearInputs(correo, true);
        error.textContent = "";
        return true;
    }

    // Password segura: mínimo 8 caracteres, 1 mayúscula, 1 número
    function validarPassword() {
        const value = password.value.trim();
        const error = document.getElementById("contraseña-error");

        // En edición puede dejarse vacío
        if (!form.action.includes("user-register") && value === "") {
            resetColors(password);
            error.textContent = "";
            return true;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(value)) {
            colorearInputs(password, false);
            error.textContent = "Mínimo 8 caracteres, 1 mayúscula y 1 número.";
            return false;
        }
        colorearInputs(password, true);
        error.textContent = "";
        return true;
    }

    // Teléfono (opcional, 9 dígitos)
    function validarTelefono() {
        const value = telefono.value.trim();
        const error = document.getElementById("telefono-error");

        if (value === "") {
            resetColors(telefono);
            error.textContent = "";
            return true;
        }

        if (!/^[0-9]{9}$/.test(value)) {
            colorearInputs(telefono, false);
            error.textContent = "Debe tener exactamente 9 dígitos numéricos.";
            return false;
        }
        colorearInputs(telefono, true);
        error.textContent = "";
        return true;
    }

    // Concesionario (puede ser vacío)
    function validarConcesionario() {
        const value = concesionario.value;
        const error = document.getElementById("concesionario-error");

        if (value === "") {
            resetColors(concesionario);
            error.textContent = "";
            return true;
        }

        colorearInputs(concesionario, true);
        error.textContent = "";
        return true;
    }

    // Rol (puede ser vacío)
    function validarRol() {
        const value = rol.value;
        const error = document.getElementById("rol-error");

        if (value === "") {
            resetColors(rol);
            if (error) error.textContent = "";
            return true;
        }

        colorearInputs(rol, true);
        if (error) error.textContent = "";
        return true;
    }
});
