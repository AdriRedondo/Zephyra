document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reservas-form");
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

        if (!/^[a-zA-Z]{3,}$/.test(nombre) || !/^(a-zA-Z0-9)+@+(a-zA-Z0-9)\.+{2,}/.test(correo())) {
            alert("Hay que poner un nombre y apellidos con minimo 3 caracteres.");
        }

    });


});