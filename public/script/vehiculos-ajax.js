let vehiculosCache = [];

// Cache de elementos DOM
const elementos = {};

document.addEventListener('DOMContentLoaded', function () {

    //Cachear elementos una sola vez
    elementos.formulario = document.querySelector('.filtros form');
    elementos.selectMarca = document.querySelector('select[name="marca"]');
    elementos.selectModelo = document.querySelector('select[name="modelo"]');
    elementos.selectPlazas = document.querySelector('select[name="plazas"]');
    elementos.selectConcesionario = document.querySelector('select[name="concesionario"]');
    elementos.selectEstado = document.querySelector('select[name="estado"]');
    elementos.contenedor = document.querySelector('.row.row-cols-sm-1');

    // Verificar que existen los elementos
    if (!elementos.formulario || !elementos.contenedor) {
        console.error('No se encontraron los elementos necesarios');
        return;
    }

    // Prevenir el comportamiento por defecto del formulario
    elementos.formulario.addEventListener('submit', function (e) {
        e.preventDefault();
        aplicarFiltros();
    });

    // Escuchar cambios en los select para filtrar automáticamente
    [elementos.selectMarca, elementos.selectModelo, elementos.selectPlazas,
    elementos.selectConcesionario, elementos.selectEstado].forEach(select => {
        if (select) {
            select.addEventListener('change', function () {
                aplicarFiltros();
            });
        }
    });

    // CAMBIO 2: Cargar vehículos una sola vez al inicio
    cargarVehiculos();
});


//Carga los vehículos una sola vez del servidor

async function cargarVehiculos() {
    try {
        mostrarCargando();

        const response = await fetch('/api/vehiculos');

        // CAMBIO 4: Mejor manejo de errores
        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }

        vehiculosCache = await response.json();

        // Mostrar todos los vehículos inicialmente
        aplicarFiltros();

    } catch (error) {
        console.error('❌ Error al cargar vehículos:', error);

        // Mensaje más específico según el tipo de error
        if (error.message.includes('Failed to fetch')) {
            mostrarError('No se puede conectar con el servidor. Verifica tu conexión.');
        } else {
            mostrarError(`Error al cargar vehículos: ${error.message}`);
        }
    }
}


//Filtra los vehículos ya cargados en memoria
function aplicarFiltros() {
    const filtros = {
        marca: elementos.selectMarca.value,
        modelo: elementos.selectModelo.value,
        plazas: elementos.selectPlazas.value,
        concesionario: elementos.selectConcesionario.value,
        estado: elementos.selectEstado.value
    };

    const vehiculosFiltrados = vehiculosCache.filter(vehiculo => {
        // Filtro por marca
        if (filtros.marca && vehiculo.marca !== filtros.marca) {
            return false;
        }
        // Filtro por modelo
        if (filtros.modelo && vehiculo.modelo !== filtros.modelo) {
            return false;
        }
        // Filtro por plazas
        if (filtros.plazas && vehiculo.numero_plazas != filtros.plazas) {
            return false;
        }
        // Filtro por concesionario
        if (filtros.concesionario && vehiculo.nombre_concesionario !== filtros.concesionario) {
            return false;
        }
        // Filtro por estado
        if (filtros.estado && vehiculo.estado !== filtros.estado) {
            return false;
        }
        return true;
    });

    mostrarVehiculos(vehiculosFiltrados);
}

//Mostrar indicador de carga
function mostrarCargando() {
    elementos.contenedor.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3 text-muted">Buscando vehículos...</p>
        </div>
    `;
}

//Mostrar vehículos en el HTML
function mostrarVehiculos(vehiculos) {
    if (vehiculos.length === 0) {
        elementos.contenedor.innerHTML = `
            <div class="col-12">
                <div class="card text-center border-0 shadow-sm p-4">
                    <div class="card-body">
                        <h5 class="card-title">No hay vehículos disponibles</h5>
                        <p class="card-text">No se encontraron vehículos que coincidan con estos filtros.
                            <br>Intenta cambiando los criterios.
                        </p>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    let html = '';
    vehiculos.forEach(vehiculo => {
        html += crearTarjetaVehiculo(vehiculo);
    });

    elementos.contenedor.innerHTML = html;
}


function escaparHTML(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}


function crearTarjetaVehiculo(vehiculo) {
    const badgeColor = vehiculo.estado === 'disponible' ? 'success' :
        vehiculo.estado === 'reservado' ? 'warning' : 'secondary';

    return `
        <div class="col">
            <div class="card h-100">
                <img src="/es-vehiculos/imagen/${vehiculo.id_vehiculo}"
                    class="vehiculo-img card-img-top"
                    alt="${escaparHTML(vehiculo.marca)} ${escaparHTML(vehiculo.modelo)}"
                    onerror="this.src='/img/vehiculo-placeholder.jpg'">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">
                        ${escaparHTML(vehiculo.marca)} ${escaparHTML(vehiculo.modelo)}
                    </h5>
                    <p class="card-text">
                        <strong>Estado:</strong>
                        <span class="badge bg-${badgeColor}">${escaparHTML(vehiculo.estado)}</span>
                    </p>
                    <p class="card-text">
                        <strong>Matrícula:</strong> ${escaparHTML(vehiculo.matricula)}
                    </p>
                    <p class="card-text">
                        <strong>Color:</strong> ${escaparHTML(vehiculo.color)}
                    </p>
                    <div class="d-flex gap-2 mt-auto">
                        <a href="/es-vehiculos/${vehiculo.id_vehiculo}"
                            class="btn border-success w-100">
                            Detalles
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function mostrarError(mensaje) {
    elementos.contenedor.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <strong>Error:</strong> ${escaparHTML(mensaje)}
            </div>
        </div>
    `;
}