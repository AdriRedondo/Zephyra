// formulario-reservas.js

let vehiculosDisponibles = [];
let todosLosVehiculos = [];
let concesionarios = [];

['nombre', 'correo', 'inicio', 'fin', 'telefono'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', actualizarProgreso);
        el.addEventListener('change', actualizarProgreso);
    }
});

document.getElementById('terminos')?.addEventListener('change', actualizarProgreso);

function actualizarProgreso() {
    const campos = [
        { valido: () => /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(document.getElementById('nombre')?.value.trim()) },
        { valido: () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(document.getElementById('correo')?.value.trim()) },
        {
            valido: () => {
                const v = document.getElementById('inicio')?.value;
                return v && new Date(v) > new Date();
            }
        },
        {
            valido: () => {
                const inicio = document.getElementById('inicio')?.value;
                const fin = document.getElementById('fin')?.value;
                if (!inicio || !fin) return false;
                const fi = new Date(inicio), ff = new Date(fin);
                return ff > fi && (ff - fi) / (1000 * 60 * 60) >= 1;
            }
        },
        { valido: () => document.getElementById('vehiculo-id')?.value !== '' },
        { valido: () => /^[0-9]{9}$/.test(document.getElementById('telefono')?.value.trim()) },
        { valido: () => document.getElementById('terminos')?.checked }
    ];

    const camposValidos = campos.filter(c => c.valido()).length;
    const porcentaje = (camposValidos / campos.length) * 100;

    const barra = document.querySelector('.progress-bar');
    const texto = document.getElementById('porcentaje-text');

    if (barra) {
        barra.style.width = porcentaje + '%';
        barra.style.transition = 'width 0.4s ease';
        barra.classList.add('bg-success');
    }

    if (texto) texto.textContent = porcentaje.toFixed(1) + '%';
}

// Configurar fecha mínima (hoy)
document.addEventListener('DOMContentLoaded', () => {
    const ahora = new Date();
    const fechaMinima = ahora.toISOString().slice(0, 16);

    document.getElementById('inicio').min = fechaMinima;
    document.getElementById('fin').min = fechaMinima;

    // Eventos para validar fechas
    const inputInicio = document.getElementById('inicio');
    const inputFin = document.getElementById('fin');
    const inputNombre = document.getElementById('nombre');
    const inputCorreo = document.getElementById('correo');
    const inputTelefono = document.getElementById('telefono');

    inputInicio.addEventListener('change', validarYHabilitarBusqueda);
    inputFin.addEventListener('change', validarYHabilitarBusqueda);

    // Validación en tiempo real de datos del cliente
    if (inputNombre) inputNombre.addEventListener('input', validarNombreCliente);
    if (inputCorreo) inputCorreo.addEventListener('input', validarCorreoCliente);
    if (inputTelefono) inputTelefono.addEventListener('input', validarTelefonoCliente);

    // Cargar todos los vehículos y concesionarios
    cargarDatosIniciales();

    // Configurar modal para cargar vehículos disponibles
    const modal = document.getElementById('modalVehiculos');
    modal.addEventListener('show.bs.modal', cargarVehiculosDisponibles);

    // Configurar filtros
    document.getElementById('filtro-marca').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-modelo').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-plazas').addEventListener('change', aplicarFiltros);
    document.getElementById('filtro-concesionario').addEventListener('change', aplicarFiltros);

    // Reset form
    document.querySelector('button[type="reset"]').addEventListener('click', () => {
        document.getElementById('vehiculo-seleccionado').value = '';
        document.getElementById('vehiculo-id').value = '';
        deshabilitarBusquedaVehiculo();
    });
});

// Validar fechas y habilitar búsqueda de vehículo
function validarYHabilitarBusqueda() {
    const inicio = document.getElementById('inicio').value;
    const fin = document.getElementById('fin').value;
    const inputVehiculo = document.getElementById('vehiculo-seleccionado');
    const btnBuscar = document.getElementById('btn-buscar-vehiculo');
    const avisoFechas = document.getElementById('aviso-fechas');
    const errorInicio = document.getElementById('inicio-error');
    const errorFin = document.getElementById('fin-error');

    // Limpiar errores
    errorInicio.textContent = '';
    errorFin.textContent = '';

    if (!inicio || !fin) {
        deshabilitarBusquedaVehiculo();
        return;
    }

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const ahora = new Date();

    // Validar que inicio no sea en el pasado
    if (fechaInicio < ahora) {
        errorInicio.textContent = 'La fecha de inicio no puede ser en el pasado';
        deshabilitarBusquedaVehiculo();
        return;
    }

    // Validar que fin sea después de inicio
    if (fechaFin <= fechaInicio) {
        errorFin.textContent = 'La fecha de fin debe ser posterior a la de inicio';
        deshabilitarBusquedaVehiculo();
        return;
    }

    // Validar duración mínima (1 hora)
    const diferenciaHoras = (fechaFin - fechaInicio) / (1000 * 60 * 60);
    if (diferenciaHoras < 1) {
        errorFin.textContent = 'La reserva debe ser de al menos 1 hora';
        deshabilitarBusquedaVehiculo();
        return;
    }

    // Todo válido: habilitar búsqueda
    inputVehiculo.disabled = false;
    inputVehiculo.placeholder = 'Haz clic para seleccionar un vehículo';
    btnBuscar.disabled = false;
    avisoFechas.style.display = 'none';

    // Limpiar selección previa si cambió las fechas
    if (document.getElementById('vehiculo-id').value) {
        document.getElementById('vehiculo-seleccionado').value = '';
        document.getElementById('vehiculo-id').value = '';
    }
}

function deshabilitarBusquedaVehiculo() {
    const inputVehiculo = document.getElementById('vehiculo-seleccionado');
    const btnBuscar = document.getElementById('btn-buscar-vehiculo');
    const avisoFechas = document.getElementById('aviso-fechas');

    inputVehiculo.disabled = true;
    inputVehiculo.placeholder = 'Primero selecciona las fechas';
    btnBuscar.disabled = true;
    avisoFechas.style.display = 'block';
}

// Cargar datos iniciales (todos los vehículos y concesionarios)
function cargarDatosIniciales() {
    let vehiculosCargados = false;
    let concesionariosCargados = false;
    let errorVehiculos = null;
    let errorConcesionarios = null;

    // Cargar vehículos
    fetch('/api/vehiculos')
        .then(response => response.json())
        .then(data => {
            todosLosVehiculos = data;
            vehiculosCargados = true;
            verificarCargaCompleta();
        })
        .catch(error => {
            errorVehiculos = error;
            vehiculosCargados = true;
            verificarCargaCompleta();
        });
    /*
// Cargar concesionarios
fetch('/api/concesionarios')
    .then(response => response.json())
    .then(data => {
        concesionarios = data;
        concesionariosCargados = true;
        verificarCargaCompleta();
    })
    .catch(error => {
        errorConcesionarios = error;
        concesionariosCargados = true;
        verificarCargaCompleta();
    });
    */

    function verificarCargaCompleta() {
        if (vehiculosCargados && concesionariosCargados) {
            if (errorVehiculos || errorConcesionarios) {
                console.error('Error al cargar datos iniciales:', errorVehiculos || errorConcesionarios);
            }
        }
    }
}

// Cargar vehículos disponibles según las fechas
function cargarVehiculosDisponibles() {
    const inicio = document.getElementById('inicio').value;
    const fin = document.getElementById('fin').value;

    if (!inicio || !fin) {
        return;
    }

    // Mostrar loading
    document.getElementById('loading-vehiculos').style.display = 'block';
    document.getElementById('lista-vehiculos').innerHTML = '';
    document.getElementById('sin-vehiculos').style.display = 'none';

    // Actualizar texto de fechas en el modal
    actualizarTextoFechasModal(inicio, fin);

    // Llamar al endpoint que verifica disponibilidad
    const url = `/api/vehiculos/disponibles?inicio=${encodeURIComponent(inicio)}&fin=${encodeURIComponent(fin)}`;
    console.log('Llamando a URL:', url);

    fetch(url)
        .then(response => {
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Error response body:', text);
                    throw new Error(`Error ${response.status}: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Vehículos recibidos:', data);
            vehiculosDisponibles = data;

            // Ocultar loading
            document.getElementById('loading-vehiculos').style.display = 'none';

            if (vehiculosDisponibles.length === 0) {
                document.getElementById('sin-vehiculos').style.display = 'block';
                return;
            }

            // Poblar filtros
            poblarFiltros(vehiculosDisponibles);

            // Mostrar vehículos
            mostrarVehiculos(vehiculosDisponibles);
        })
        .catch(error => {
            console.error('Error completo:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);

            document.getElementById('loading-vehiculos').style.display = 'none';
            document.getElementById('sin-vehiculos').style.display = 'block';
            document.getElementById('sin-vehiculos').innerHTML = `
                <i class="bi bi-exclamation-triangle" style="font-size: 3rem; color: #dc3545;"></i>
                <p class="text-danger mt-3">Error al cargar vehículos: ${error.message}</p>
                <p class="text-muted small">Revisa la consola para más detalles</p>
            `;
        });
}

function actualizarTextoFechasModal(inicio, fin) {
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    const opciones = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    const textoInicio = fechaInicio.toLocaleDateString('es-ES', opciones);
    const textoFin = fechaFin.toLocaleDateString('es-ES', opciones);

    const duracion = calcularDuracion(fechaInicio, fechaFin);

    document.getElementById('rango-fechas-texto').innerHTML = `
        <strong>Desde:</strong> ${textoInicio}<br>
        <strong>Hasta:</strong> ${textoFin}<br>
        <strong>Duración:</strong> ${duracion}
    `;
}

function calcularDuracion(inicio, fin) {
    const diff = fin - inicio;
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) {
        return `${dias} día${dias > 1 ? 's' : ''} y ${horas} hora${horas !== 1 ? 's' : ''}`;
    } else {
        return `${horas} hora${horas !== 1 ? 's' : ''}`;
    }
}

function poblarFiltros(vehiculos) {
    const marcas = new Set();
    const modelos = new Set();
    const plazas = new Set();
    const concesionariosMap = new Map();

    vehiculos.forEach(v => {
        marcas.add(v.marca);
        modelos.add(v.modelo);
        plazas.add(v.numero_plazas);

        // Usar los datos del concesionario que vienen del backend
        if (v.id_concesionario && v.concesionario_nombre) {
            const clave = `${v.concesionario_nombre} - ${v.concesionario_ciudad || ''}`;
            concesionariosMap.set(v.id_concesionario, clave);
        }
    });

    // Poblar marca
    const selectMarca = document.getElementById('filtro-marca');
    selectMarca.innerHTML = '<option value="">Todas</option>';
    [...marcas].sort().forEach(marca => {
        selectMarca.innerHTML += `<option value="${marca}">${marca}</option>`;
    });

    // Poblar modelo
    const selectModelo = document.getElementById('filtro-modelo');
    selectModelo.innerHTML = '<option value="">Todos</option>';
    [...modelos].sort().forEach(modelo => {
        selectModelo.innerHTML += `<option value="${modelo}">${modelo}</option>`;
    });

    // Poblar plazas
    const selectPlazas = document.getElementById('filtro-plazas');
    selectPlazas.innerHTML = '<option value="">Todas</option>';
    [...plazas].sort((a, b) => a - b).forEach(plaza => {
        selectPlazas.innerHTML += `<option value="${plaza}">${plaza} plazas</option>`;
    });

    // Poblar concesionarios usando los datos que vienen del backend
    const selectConcesionario = document.getElementById('filtro-concesionario');
    selectConcesionario.innerHTML = '<option value="">Todos</option>';

    // Ordenar por nombre de concesionario
    const concesionariosArray = Array.from(concesionariosMap.entries())
        .sort((a, b) => a[1].localeCompare(b[1]));

    concesionariosArray.forEach(([id, nombre]) => {
        selectConcesionario.innerHTML += `<option value="${id}">${nombre}</option>`;
    });
}

function aplicarFiltros() {
    const marca = document.getElementById('filtro-marca').value;
    const modelo = document.getElementById('filtro-modelo').value;
    const plazas = document.getElementById('filtro-plazas').value;
    const concesionario = document.getElementById('filtro-concesionario').value;

    const vehiculosFiltrados = vehiculosDisponibles.filter(v => {
        return (!marca || v.marca === marca) &&
            (!modelo || v.modelo === modelo) &&
            (!plazas || v.numero_plazas == plazas) &&
            (!concesionario || v.id_concesionario == concesionario);
    });

    mostrarVehiculos(vehiculosFiltrados);
}

function mostrarVehiculos(vehiculos) {
    const contenedor = document.getElementById('lista-vehiculos');
    const sinVehiculos = document.getElementById('sin-vehiculos');

    if (vehiculos.length === 0) {
        contenedor.innerHTML = '';
        sinVehiculos.style.display = 'block';
        return;
    }

    sinVehiculos.style.display = 'none';
    contenedor.innerHTML = vehiculos.map(v => {
        const concesionario = concesionarios.find(c => c.id_concesionario === v.id_concesionario);
        const nombreConcesionario = concesionario ? concesionario.nombre : 'No disponible';

        // Si el vehículo ya trae el nombre del concesionario del backend, usarlo
        const nombreFinal = v.concesionario_nombre || nombreConcesionario;

        const imagenSrc = v.imagen
            ? `data:image/jpeg;base64,${v.imagen}`
            : '/images/default-car.jpg';

        return `
            <div class="col">
                <div class="card h-100 vehiculo-card" onclick="seleccionarVehiculo(${v.id_vehiculo}, '${v.marca}', '${v.modelo}', '${v.matricula}')">
                    <img src="${imagenSrc}" class="card-img-top" alt="${v.marca} ${v.modelo}">
                    <div class="card-body">
                        <h5 class="card-title">${v.marca} ${v.modelo}</h5>
                        <p class="card-text">
                            <strong>Matrícula:</strong> ${v.matricula}<br>
                            <strong>Año:</strong> ${v.anyo_matriculacion}<br>
                            <strong>Plazas:</strong> ${v.numero_plazas}<br>
                            <strong>Autonomía:</strong> ${v.autonomia_km} km<br>
                            <strong>Color:</strong> ${v.color}<br>
                            <strong>Concesionario:</strong> ${nombreFinal}
                        </p>
                        <span class="badge bg-success">Disponible</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function seleccionarVehiculo(id, marca, modelo, matricula) {
    document.getElementById('vehiculo-id').value = id;
    document.getElementById('vehiculo-seleccionado').value = `${marca} ${modelo} (${matricula})`;

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalVehiculos'));
    modal.hide();
}

// VALIDACIONES EN TIEMPO REAL PARA DATOS DEL CLIENTE

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
    const errorElementId = `${input.id}-error`;
    const errorElement = document.getElementById(errorElementId);

    input.classList.remove("right-input");
    input.classList.remove("wrong-input");

    if (errorElement) {
        errorElement.textContent = "";
    }
}

// Validación nombre del cliente
function validarNombreCliente() {
    const nombre = document.getElementById('nombre');
    if (!nombre) return true;

    const nombreValue = nombre.value.trim();
    const errorElement = document.getElementById('nombre-error');

    if (nombreValue === "" || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(nombreValue)) {
        colorearInputs(nombre, false);
        if (errorElement) {
            errorElement.textContent = "El nombre debe tener al menos 3 caracteres y contener solo letras";
        }
        return false;
    } else {
        colorearInputs(nombre, true);
        if (errorElement) {
            errorElement.textContent = "";
        }
        return true;
    }
}

// Validación correo del cliente
function validarCorreoCliente() {
    const correo = document.getElementById('correo');
    if (!correo) return true;

    const correoValue = correo.value.trim();
    const errorElement = document.getElementById('correo-error');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correoValue === "" || !emailRegex.test(correoValue)) {
        colorearInputs(correo, false);
        if (errorElement) {
            errorElement.textContent = "Debes introducir un correo electrónico válido";
        }
        return false;
    } else {
        colorearInputs(correo, true);
        if (errorElement) {
            errorElement.textContent = "";
        }
        return true;
    }
}

// Validación teléfono del cliente
function validarTelefonoCliente() {
    const telefono = document.getElementById('telefono');
    if (!telefono) return true;

    const telefonoValue = telefono.value.trim();
    const errorElement = document.getElementById('telefono-error');

    if (telefonoValue === "" || !/^[0-9]{9}$/.test(telefonoValue)) {
        colorearInputs(telefono, false);
        if (errorElement) {
            errorElement.textContent = "El teléfono debe contener exactamente 9 dígitos";
        }
        return false;
    } else {
        colorearInputs(telefono, true);
        if (errorElement) {
            errorElement.textContent = "";
        }
        return true;
    }
}