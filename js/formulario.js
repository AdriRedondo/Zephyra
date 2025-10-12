document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reservas-form-id");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
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
        if (nombre == "" || !/^[a-zA-Z\s]{3,}$/.test(nombre)) {
            es_correcto = false;
            document.getElementById("nombre").classList.add("wrong-input");
            document.getElementById("nombre").classList.remove("right-input");

        }
        else {
            document.getElementById("nombre").classList.add("right-input");
            document.getElementById("nombre").classList.remove("wrong-input");

        }

        // Validación correo
        //else if (!/^(a-zA-Z0-9)+@+(a-zA-Z0-9)\.+{2,}/.test(correo)) {
        if (correo == "" || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(correo)) {
            es_correcto = false;
            document.getElementById("correo").classList.add("wrong-input");
            document.getElementById("correo").classList.remove("right-input");

        }
        else {
            document.getElementById("correo").classList.add("right-input");
            document.getElementById("correo").classList.remove("wrong-input");

        }

        // Validación fecha ini
        if (inicio == "" || fecha_ini < hoy) {
            es_correcto = false;
            document.getElementById("inicio").classList.add("wrong-input");
            document.getElementById("inicio").classList.remove("right-input");

        }
        else {
            document.getElementById("inicio").classList.add("right-input");
            document.getElementById("inicio").classList.remove("wrong-input");

        }

        // Validación fecha fin
        if (fin == "" || fecha_fin < hoy || fecha_ini >= fecha_fin) {
            es_correcto = false;
            document.getElementById("fin").classList.add("wrong-input");
            document.getElementById("fin").classList.remove("right-input");
        }
        else {
            document.getElementById("fin").classList.add("right-input");
            document.getElementById("fin").classList.remove("wrong-input");
        }

        if (telefono == "" || !/^[0-9]{9}$/.test(telefono)) {
            es_correcto = false;
            document.getElementById("telefono").classList.add("wrong-input");
            document.getElementById("telefono").classList.remove("right-input");
        }
        else {
            document.getElementById("telefono").classList.add("right-input");
            document.getElementById("telefono").classList.remove("wrong-input");
        }

        if (es_correcto) {
            form.submit()
            alert("La reserva ha sido realizada con exito.")
        }
        else {
            alert("Campos erróneos.")
        }
    });
});