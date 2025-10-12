document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reservas-form-id");
    form.addEventListener("submit", (event) => {
        const nombre = document.getElementById("nombre").value;
        const correo = document.getElementById("correo").value;
        const vehiculo = document.getElementById("vehiculos-form").value;
        const inicio = document.getElementById("inicio").value;
        const fin = document.getElementById("fin").value;
        const telefono = document.getElementById("telefono").value;
        console.log("Nombre: ", nombre);
        console.log("Correo: ", correo);
        console.log("Vehículo: ", vehiculo);
        console.log("Inicio: ", inicio);
        console.log("Fin: ", fin);
        console.log("Teléfono: ", telefono);

        var hoy = new Date();
        var fecha_ini = new Date(inicio);
        var fecha_fin = new Date(fin);
        var es_correcto = true;

        // Validación nombre y apellidos
        if (!/^[a-zA-Z]{3,}$/.test(nombre)) {
            es_correcto = false;
            document.getElementById("nombre").classList.toggle("wrong-input");
        }
        else {
            document.getElementById("nombre").classList.toggle("right-input");
        }

        // Validación correo
        //else if (!/^(a-zA-Z0-9)+@+(a-zA-Z0-9)\.+{2,}/.test(correo)) {
        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) {
            es_correcto = false;
        }
        else {

        }

        // Validación fecha ini
        if (fecha_ini < hoy) {
            es_correcto = false;
        }
        else {

        }

        // Validación fecha fin
        if (fecha_fin < hoy) {

        }
        else {

        }

        // Validación fecha ini y fin
        if (fecha_ini >= fecha_ini) {
            es_correcto = false;
        }
        else {

        }

        if (!es_correcto) {
            //event.preventDefault();
        }


    });


});