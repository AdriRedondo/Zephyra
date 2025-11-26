document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("reservas-form-id");
    const nombre = document.getElementById("nombre");
    const correo = document.getElementById("correo");
    const vehiculo = document.getElementById("vehiculo-seleccionado");
    const inicio = document.getElementById("inicio");
    //const fin = document.getElementById("fin");
    const telefono = document.getElementById("telefono");
    const progressBar = document.querySelector(".progress-bar");
    console.log("Formulario cargado correctamente");
    checkProgressBar();

    nombre.addEventListener("input", validarNombre);
    correo.addEventListener("input", validarCorreo);
    vehiculo.addEventListener("input", validarVehiculo);
    inicio.addEventListener("input", validarInicio);
    horas.addEventListener("input", validarHoras);
    //fin.addEventListener("input", validarFin);
    telefono.addEventListener("input", validarTelefono);

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const esValidoNombre = validarNombre();
        const esValidoCorreo = validarCorreo();
        const esValidoVehiculo = validarVehiculo();
        const esValidoInicio = validarInicio();
        const esValidoHoras = validarHoras();
        //const esValidoFin = validarFin();
        const esValidoTelefono = validarTelefono();

        console.log("Nombre: ", nombre.value);
        console.log("Correo: ", correo.value);
        console.log("Vehículo: ", vehiculo.value);
        console.log("Inicio: ", inicio.value);
        //console.log("Fin: ", fin.value);
        console.log("Teléfono: ", telefono.value);

        if (esValidoNombre && esValidoCorreo && esValidoInicio && esValidoHoras &&
            esValidoVehiculo && esValidoTelefono) {
            form.submit();

        } else {
            alert("Por favor, corrige los campos erróneos antes de enviar el formulario.");
        }
    });

    form.addEventListener("reset", (event) => {
        resetColors(nombre);
        resetColors(correo);
        resetColors(vehiculo);
        resetColors(inicio);
        resetColors(horas);
        resetColors(telefono);
        checkProgressBar();

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
        checkProgressBar();
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

    // Validación correo
    function validarVehiculo() {

        const vehiculoValue = vehiculo.value.trim();
        const vehiculoId = document.getElementById("vehiculo-id").value; // ⬅️ NUEVO
        const errorElement = document.getElementById("vehículo-error");
        console.log(vehiculoValue);

        if (vehiculoValue == "" || vehiculoId === "") {
            colorearInputs(vehiculo, false);
            errorElement.textContent = "Seleccione uno de los vehículos disponibles";
            return false;
        }
        else {
            colorearInputs(vehiculo, true);
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

    // Validación fecha ini
    function validarHoras() {
        const horasValue = horas.value;
        const errorElement = document.getElementById("horas-error");

        if (horasValue <= 0 && !Number.isInteger(horasValue)) {
            colorearInputs(horas, false);
            errorElement.textContent = "El numero de horas debe ser un nmero entero positivo";
            return false;
        } else {
            colorearInputs(horas, true);
            errorElement.textContent = "";
            return true;
        }
    }


    // Validación fecha fin
    /*function validarFin() {
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
        */

    // Validación del teléfono
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

    function validInput(input) {
        return input.classList.contains("right-input");
    }

    function checkProgressBar() {
        let correctInputs = 0;
        correctInputs += validInput(nombre);
        correctInputs += validInput(correo);
        correctInputs += validInput(vehiculo);
        correctInputs += validInput(inicio);
        correctInputs += validInput(horas);
        correctInputs += validInput(telefono);
        const porcentaje_text = document.getElementById('porcentaje-text');
        switch (correctInputs) {
            case 0:
                progressBar.style.width = "0%"
                porcentaje_text.textContent = '0.0%';
                break;
            case 1:
                progressBar.style.width = "16.7%";
                porcentaje_text.textContent = '16.7%';
                break;
            case 2:
                progressBar.style.width = "33.3%";
                porcentaje_text.textContent = '33.3%';
                break;
            case 3:
                progressBar.style.width = "50%";
                porcentaje_text.textContent = '50%';
                break;
            case 4:
                progressBar.style.width = "66.7%";
                porcentaje_text.textContent = '66.7%';
                break;
            case 5:
                progressBar.style.width = "83.3%";
                porcentaje_text.textContent = '83.3%';
                break;
            case 6:
                progressBar.style.width = "100%";
                porcentaje_text.textContent = '100%';
                break;
        }
    }

    function resetColors(input) {
        input.classList.remove("right-input");
        input.classList.remove("wrong-input");
    }
});

//Gestión del modal de selección de vehículo

let vehiculosData = [];
let vehiculosFiltrados = [];

document.getElementById('modalVehiculos').addEventListener('show.bs.modal', function () {
    if (vehiculosData.length === 0) {
        cargarVehiculos();
    }
});

// Función para cargar vehículos desde la API
async function cargarVehiculos() {
    try {
        const response = await fetch('/api/vehiculos');
        const data = await response.json();

        // Filtrar solo vehículos disponibles
        vehiculosData = data.filter(v => v.estado === 'disponible');
        vehiculosFiltrados = [...vehiculosData];

        inicializarFiltros();
        mostrarVehiculos();
    } catch (error) {
        console.error('Error al cargar vehículos:', error);
        document.getElementById('lista-vehiculos').innerHTML =
            '<div class="col-12"><p class="text-danger">Error al cargar los vehículos</p></div>';
    }
}

// Inicializar opciones de filtros
function inicializarFiltros() {
    const marcas = [...new Set(vehiculosData.map(v => v.marca))];
    const modelos = [...new Set(vehiculosData.map(v => v.modelo))];
    const plazas = [...new Set(vehiculosData.map(v => v.numero_plazas))].sort((a, b) => a - b);
    const concesionarios = [...new Set(vehiculosData.map(v => v.nombre_concesionario).filter(Boolean))].sort();

    llenarSelect('filtro-marca', marcas);
    llenarSelect('filtro-modelo', modelos);
    llenarSelect('filtro-plazas', plazas, ' plazas');
    llenarSelect('filtro-concesionario', concesionarios);

    // Event listeners para filtros
    ['filtro-marca', 'filtro-modelo', 'filtro-plazas', 'filtro-concesionario'].forEach(id => {
        document.getElementById(id).addEventListener('change', aplicarFiltros);
    });
}

// Llenar un select con opciones
function llenarSelect(id, opciones, sufijo = '') {
    const select = document.getElementById(id);
    const valorActual = select.value;

    select.innerHTML = '<option value="">Todos</option>';
    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion;
        option.textContent = opcion + sufijo;
        select.appendChild(option);
    });

    select.value = valorActual;
}

// Aplicar filtros
function aplicarFiltros() {
    const marca = document.getElementById('filtro-marca').value.toLowerCase();
    const modelo = document.getElementById('filtro-modelo').value.toLowerCase();
    const plazas = document.getElementById('filtro-plazas').value;
    const concesionario = document.getElementById('filtro-concesionario').value.toLowerCase();

    vehiculosFiltrados = vehiculosData.filter(v => {
        return (!marca || v.marca.toLowerCase() === marca) &&
            (!modelo || v.modelo.toLowerCase() === modelo) &&
            (!plazas || v.numero_plazas === parseInt(plazas)) &&
            (!concesionario || v.nombre_concesionario?.toLowerCase() === concesionario);
    });

    mostrarVehiculos();
}

// Mostrar vehículos en el modal
function mostrarVehiculos() {
    const listaVehiculos = document.getElementById('lista-vehiculos');
    const sinVehiculos = document.getElementById('sin-vehiculos');

    if (vehiculosFiltrados.length === 0) {
        listaVehiculos.style.display = 'none';
        sinVehiculos.style.display = 'block';
        return;
    }

    listaVehiculos.style.display = 'flex';
    sinVehiculos.style.display = 'none';

    listaVehiculos.innerHTML = vehiculosFiltrados.map(v => `
        <div class="col">
            <div class="card h-100 vehiculo-card" style="cursor: pointer;" 
                 onclick="seleccionarVehiculo(${v.id_vehiculo}, '${v.marca}', '${v.modelo}')">
                <img src="/es-vehiculos/imagen/${v.id_vehiculo}" 
                     class="card-img-top" 
                     alt="${v.marca} ${v.modelo}"
                     style="height: 200px; object-fit: cover;">
                <div class="card-body">
                    <h6 class="card-title">${v.marca} ${v.modelo}</h6>
                    <p class="card-text small mb-1">
                        <i class="bi bi-people-fill"></i> ${v.numero_plazas} plazas
                    </p>
                    <p class="card-text small mb-1">
                        <i class="bi bi-pin-map-fill"></i> ${v.nombre_concesionario}
                    </p>
                    <p class="card-text small">
                    <i class="bi bi-palette"></i> ${v.color}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Seleccionar vehículo
function seleccionarVehiculo(id, marca, modelo) {
    const vehiculoSeleccionado = document.getElementById('vehiculo-seleccionado');
    const vehiculoId = document.getElementById('vehiculo-id');

    vehiculoId.value = id;
    vehiculoSeleccionado.value = `${marca} ${modelo}`;

    vehiculoSeleccionado.dispatchEvent(new Event('input'));

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalVehiculos'));
    modal.hide();
}

