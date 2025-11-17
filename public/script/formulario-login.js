document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form-id");
    const correo = document.getElementById("correo");
    const contraseña = document.getElementById("contraseña");
    console.log("Formulario de login cargado correctamente");

    // Asigna los listeners de validación en tiempo real
    correo.addEventListener("input", validarCorreo);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const esValidoCorreo = validarCorreo();

        console.log("Correo: ", correo.value);
        console.log("Contraseña: ", contraseña.value);

        if (esValidoCorreo) {
            form.submit();
        } else {
            alert("Por favor, corrige los campos erróneos antes de enviar el formulario.");
        }

    });

    form.addEventListener("reset", (event) => {
        resetColors(correo);
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

});