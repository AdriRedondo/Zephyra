document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registro-form-id");
    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correo");
    const contrasenia = document.getElementById("contraseña");
    console.log("Formulario de registro cargado correctamente");


    nombre.addEventListener("input", validarNombre);
    correo.addEventListener("input", validarCorreo);
    contrasenia.addEventListener("input", validarContrasenia);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const esValidoNombre = validarNombre();
        const esValidoCorreo = validarCorreo();
        const esValidoContrasenia = validarContrasenia();

        console.log("Nombre: ", nombre.value);
        console.log("Correo: ", correo.value);
        console.log("Contraseña: ", contrasenia.value);

        if (esValidoNombre && esValidoCorreo && esValidoContrasenia) {
            form.submit();

        } else {
            alert("Por favor, corrige los campos erróneos antes de enviar el formulario.");
        }
    });

    form.addEventListener("reset", (event) => {
        resetColors(nombre);
        resetColors(contrasenia);
    });

    // Colorear los inputs según estén mal o bien
    function colorearInputs(input, esCorrecto) {
        if (esCorrecto) {
            input.classList.add("right-input");
            input.classList.remove("wrong-input");
        }
        else {
            input.classList.add("wrong-input");
            input.classList.remove("right-input");
        }
    }

    function resetColors(input) {
        // Obtenemos el elemento de error asociado
        const errorElementId = `${input.id}-error`;
        const errorElement = document.getElementById(errorElementId);

        // Removemos las clases de color
        input.classList.remove("right-input");
        input.classList.remove("wrong-input");

        // Limpiamos el mensaje de error
        if (errorElement) {
            errorElement.textContent = "";
        }
    }

    // Validación nombre y apellidos 
    function validarNombre() {
        const nombreValue = nombre.value.trim();
        const errorElement = document.getElementById("nombre-error");

        if (nombreValue === "" || !/^[a-zA-Z\s]{3,}$/.test(nombreValue)) {
            colorearInputs(nombre, false);
            errorElement.textContent = "El nombre debe tener al menos 3 caracteres y contener solo letras y espacios";
            return false;
        }
        else {
            colorearInputs(nombre, true);
            errorElement.textContent = "";
            return true;

        }
    }

    // Validación Contraseña: Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un símbolo.
    function validarContrasenia() {
        const contraseniaValue = contrasenia.value;
        const errorElement = document.getElementById("contraseña-error");
        const regexContrasenia = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;


        if (contraseniaValue === "" || !regexContrasenia.test(contraseniaValue)) {
            colorearInputs(contrasenia, false);
            errorElement.textContent = "La contraseña debe tener mínimo 8 caracteres, y contener al menos una mayúscula, una minúscula, un número y un símbolo.";
            return false;
        }
        else {
            colorearInputs(contrasenia, true);
            errorElement.textContent = "";
            return true;
        }
    }
    //Validar formato de correo
    function validarCorreo() {

        const correoValue = correo.value.trim();
        const errorElement = document.getElementById("correo-error");

        if (correoValue === "" || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correoValue)) {
            colorearInputs(correo, false);
            errorElement.textContent = "Introduce un correo electrónico válido";
            return false;

        }
        else {
            colorearInputs(correo, true);
            errorElement.textContent = "";
            return true;
        }
    }
});