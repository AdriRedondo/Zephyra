document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contacto-form-id");
    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correo"); // Corregido: usando el id 'correo'
    const mensaje = document.getElementById("mensaje");
    console.log("Formulario de contacto cargado correctamente");

    // Asigna los listeners de validación en tiempo real
    nombre.addEventListener("input", validarNombre);
    correo.addEventListener("input", validarCorreo);
    mensaje.addEventListener("input", validarMensaje);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const esValidoNombre = validarNombre();
        const esValidoCorreo = validarCorreo();
        const esValidoMensaje = validarMensaje();

        console.log("Nombre: ", nombre.value);
        console.log("Correo: ", correo.value);
        console.log("Mensaje: ", mensaje.value);

        if (esValidoNombre && esValidoCorreo && esValidoMensaje) {
            alert("Mensaje enviado con éxito.");
            // Aquí iría la lógica para enviar los datos al servidor.
        } else {
            alert("Por favor, corrige los campos erróneos antes de enviar el formulario.");
        }
    });

    form.addEventListener("reset", (event) => {
        resetColors(nombre);
        resetColors(correo);
        resetColors(mensaje);
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
        
        const errorElementId = `${input.id}-error`;
        const errorId = input.id === 'correo' ? 'correo-error' : errorElementId;
        const errorElement = document.getElementById(errorId);
        
        
        input.classList.remove("right-input");
        input.classList.remove("wrong-input");

       
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

    // Validación correo
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

    // Validación Mensaje: Mínimo 10 caracteres.
    function validarMensaje() {
        const mensajeValue = mensaje.value.trim();
        const errorElement = document.getElementById("mensaje-error");

        if (mensajeValue === "" || mensajeValue.length < 10) {
            colorearInputs(mensaje, false);
            errorElement.textContent = "El mensaje debe tener al menos 10 caracteres.";
            return false;
        }
        else {
            colorearInputs(mensaje, true);
            errorElement.textContent = "";
            return true;
        }
    }
});