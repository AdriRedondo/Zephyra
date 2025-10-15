document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reservas-form-id");
    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correo");
    const vehiculo = document.getElementById("vehiculos-form");
    const inicio = document.getElementById("inicio");
    const fin = document.getElementById("fin");
    const telefono = document.getElementById("telefono");


    console.log("Formulario cargado correctamente");

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

    // Validación nombre y apellidos
    function validarNombre() {
        const nombreValue = nombre.value.trim();
        const errorElement = document.getElementById("nombre-error");

        if (nombreValue == "" || !/^[a-zA-Z\s]{3,}$/.test(nombreValue)) {
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

        if (correoValue == "" || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correoValue)) {
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

    // Validación fecha ini
    function validarInicio() {
        const inicioValue = inicio.value;
        const errorElement = document.getElementById("inicio-error");
        const hoy = new Date();
        const fechaInicio = new Date(inicioValue);

        if (inicioValue === "" || fechaInicio < hoy) {
            colorearInputs(inicio, false);
            errorElement.textContent = "La fecha de inicio debe ser posterior a la fecha actual";
            return false;
        } else {
            colorearInputs(inicio, true);
            errorElement.textContent = "";
            return true;
        }
    }


    // Validación fecha fin
    function validarFin() {
        const finValue = fin.value;
        const inicioValue = inicio.value;
        const errorElement = document.getElementById("fin-error");
        const hoy = new Date();
        const fechaFin = new Date(finValue);
        const fechaInicio = new Date(inicioValue);

        if (finValue === "" || fechaFin < hoy || fechaInicio >= fechaFin) {
            colorearInputs(fin, false);
            errorElement.textContent = "La fecha de fin debe ser posterior a la fecha de inicio y a la fecha actual";
            return false;
        } else {
            colorearInputs(fin, true);
            errorElement.textContent = "";
            return true;
        }
    }


    function validarTelefono() {
        const telefonoValue = telefono.value.trim();
        const errorElement = document.getElementById("telefono-error");

        if (telefonoValue === "" || !/^[0-9]{9}$/.test(telefonoValue)) {
            colorearInputs(telefono, false);
            errorElement.textContent = "El teléfono debe tener exactamente 9 dígitos";
            return false;
        } else {
            colorearInputs(telefono, true);
            errorElement.textContent = "";
            return true;
        }
    }


    nombre.addEventListener("input", validarNombre);
    correo.addEventListener("input", validarCorreo);
    inicio.addEventListener("input", validarInicio);
    fin.addEventListener("input", validarFin);
    telefono.addEventListener("input", validarTelefono);


    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const esValidoNombre = validarNombre();
        const esValidoCorreo = validarCorreo();
        const esValidoInicio = validarInicio();
        const esValidoFin = validarFin();
        const esValidoTelefono = validarTelefono();


        console.log("Nombre: ", nombre.value);
        console.log("Correo: ", correo.value);
        console.log("Vehículo: ", vehiculo.value);
        console.log("Inicio: ", inicio.value);
        console.log("Fin: ", fin.value);
        console.log("Teléfono: ", telefono.value);


        if (esValidoNombre && esValidoCorreo && esValidoInicio &&
            esValidoFin && esValidoTelefono) {
            alert("La reserva ha sido realizada con éxito.");

        } else {
            alert("Por favor, corrige los campos erróneos antes de enviar el formulario.");
        }
    });
});