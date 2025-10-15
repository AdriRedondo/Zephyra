document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reservas-form-id");
    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correo");
    const vehiculo = document.getElementById("vehiculos-form");
    const inicio = document.getElementById("inicio");
    const fin = document.getElementById("fin");
    const telefono = document.getElementById("telefono");
    const terminos = document.getElementById("terminos");

    console.log("Formulario cargado correctamente");

    // Validación nombre y apellidos
    function validarNombre() {
        const nombreValue = nombre.value.trim();
        const errorElement = document.getElementById("nombre-error");

        if (nombreValue == "" || !/^[a-zA-Z\s]{3,}$/.test(nombreValue)) {

            nombre.classList.add("wrong-input");
            nombre.classList.remove("right-input");
            errorElement.textContent = "El nombre debe tener al menos 3 caracteres y contener solo letras y espacios";
            return false;
        }
        else {
            nombre.classList.add("right-input");
            nombre.classList.remove("wrong-input");
            errorElement.textContent = "";
            return true;

        }
    }

    // Validación correo
    function validarCorreo() {

        const correoValue = correo.value.trim();
        const errorElement = document.getElementById("correo-error");

        if (correoValue == "" || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correoValue)) {

            correo.classList.add("wrong-input");
            correo.classList.remove("right-input");
            errorElement.textContent = "Introduce un correo electrónico válido";
            return false;

        }
        else {
            correo.classList.add("right-input");
            correo.classList.remove("wrong-input");
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
            inicio.classList.add("wrong-input");
            inicio.classList.remove("right-input");
            errorElement.textContent = "La fecha de inicio debe ser posterior a la fecha actual";
            return false;
        } else {
            inicio.classList.add("right-input");
            inicio.classList.remove("wrong-input");
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
            fin.classList.add("wrong-input");
            fin.classList.remove("right-input");
            errorElement.textContent = "La fecha de fin debe ser posterior a la fecha de inicio y a la fecha actual";
            return false;
        } else {
            fin.classList.add("right-input");
            fin.classList.remove("wrong-input");
            errorElement.textContent = "";
            return true;
        }
    }


    function validarTelefono() {
        const telefonoValue = telefono.value.trim();
        const errorElement = document.getElementById("telefono-error");

        if (telefonoValue === "" || !/^[0-9]{9}$/.test(telefonoValue)) {
            telefono.classList.add("wrong-input");
            telefono.classList.remove("right-input");
            errorElement.textContent = "El teléfono debe tener exactamente 9 dígitos";
            return false;
        } else {
            telefono.classList.add("right-input");
            telefono.classList.remove("wrong-input");
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
        const esValidoTerminos = validarTerminos();

        console.log("Nombre: ", nombre.value);
        console.log("Correo: ", correo.value);
        console.log("Vehículo: ", vehiculo.value);
        console.log("Inicio: ", inicio.value);
        console.log("Fin: ", fin.value);
        console.log("Teléfono: ", telefono.value);


        if (esValidoNombre && esValidoCorreo && esValidoInicio &&
            esValidoFin && esValidoTelefono && esValidoTerminos) {
            alert("La reserva ha sido realizada con éxito.");

        } else {
            alert("Por favor, corrige los campos erróneos antes de enviar el formulario.");
        }
    });
});