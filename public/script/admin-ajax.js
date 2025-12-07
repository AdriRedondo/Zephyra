// ============================================
// SISTEMA DE ELIMINACIÓN CON AJAX - PANEL ADMIN
// Usando método HTTP DELETE correctamente
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    inicializarEliminacionAjax();
    inicializarCancelacionReservas();
});

function inicializarEliminacionAjax() {
    // Interceptar todos los formularios de eliminación
    const formsEliminar = document.querySelectorAll('form[action*="/eliminar"], form[action*="/delete"]');

    formsEliminar.forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Determinar el tipo de entidad (vehículo, usuario, concesionario)
            const action = form.getAttribute('action');
            let tipoEntidad = '';
            let idEntidad = '';

            if (action.includes('/es-vehiculos/') || action.includes('/en-vehicles/')) {
                tipoEntidad = 'vehiculo';
                idEntidad = extraerIdDeURL(action, 'vehiculos');
            } else if (action.includes('/es-users/') || action.includes('/en-users/')) {
                tipoEntidad = 'usuario';
                idEntidad = extraerIdDeURL(action, 'usuarios');
            } else if (action.includes('/es-dealer/') || action.includes('/en-dealer/')) {
                tipoEntidad = 'concesionario';
                idEntidad = extraerIdDeURL(action, 'concesionarios');
            }

            if (tipoEntidad && idEntidad) {
                eliminarEntidadAjax(tipoEntidad, idEntidad, form);
            }
        });
    });
}

// Extraer ID de la URL del formulario
function extraerIdDeURL(url, tipo) {
    const regex = /\/(\d+)\/eliminar/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Realizar eliminación mediante AJAX usando método DELETE
function eliminarEntidadAjax(tipo, id, form) {
    // Mostrar spinner en el botón de eliminar del formulario
    const btnEliminar = form.querySelector('button[type="submit"]');

    // Construir URL según el tipo de entidad
    // Usamos rutas RESTful limpias
    let url = '';
    const idioma = form.querySelector('input[name="idioma"]')?.value || 'español';

    if (tipo === 'vehiculo') {
        url = idioma === 'english'
            ? `/api/vehiculos/${id}`
            : `/api/vehiculos/${id}`;
    } else if (tipo === 'usuario') {
        url = `/api/usuarios/${id}`;
    } else if (tipo === 'concesionario') {
        url = `/api/concesionarios/${id}`;
    }

    // Realizar petición AJAX con método DELETE
    fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    })
        .then(response => {
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.message || `Error ${response.status}`);
                }).catch(err => {
                    // Si el error ya tiene mensaje, usarlo; si no, crear uno genérico
                    if (err instanceof Error && err.message !== '') {
                        throw err;
                    }
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                });
            }
            return response.json();
        })
        .then(data => {
            // Eliminación exitosa
            console.log(`${tipo} eliminado correctamente:`, data);

            // Mostrar modal de éxito
            const mensajes = {
                vehiculo: 'Vehículo eliminado correctamente',
                usuario: 'Usuario eliminado correctamente',
                concesionario: 'Concesionario eliminado correctamente'
            };

            mostrarModalExito(mensajes[tipo]);

            // Eliminar fila de la tabla con animación
            const fila = btnEliminar.closest('tr');
            if (fila) {
                fila.style.transition = 'all 0.3s ease';
                fila.style.backgroundColor = '#d4edda';
                fila.style.opacity = '0.5';

                setTimeout(() => {
                    fila.remove();
                    verificarTablaVacia(tipo);
                }, 300);
            }
        })
        .catch(error => {
            console.error('Error al eliminar:', error);
            mostrarModalError(error.message || "No se puede eliminar");

        });
}

function mostrarModalExito(mensaje) {
    const modalHTML = `
        <div class="modal fade" id="exitoModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-check-circle-fill me-2"></i>Éxito
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body">
                        <div class="alert alert-success m-0">
                            <i class="bi bi-check-lg me-2"></i>
                            ${mensaje}
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn border-success" data-bs-dismiss="modal">
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Si ya existe un modal previo, eliminarlo
    const oldModal = document.getElementById('exitoModal');
    if (oldModal) {
        const bs = bootstrap.Modal.getInstance(oldModal);
        if (bs) bs.dispose();
        oldModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('exitoModal'));
    modal.show();

    // Auto cerrar después de 2 segundos
    setTimeout(() => {
        modal.hide();
    }, 2000);
}

function mostrarModalError(mensaje) {
    const modalHTML = `
        <div class="modal fade" id="errorModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-x-circle-fill me-2"></i>Error
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body">
                        <div class="alert alert-danger m-0">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            ${mensaje}
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn border-secondary" data-bs-dismiss="modal">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Si ya existe un modal previo, eliminarlo
    const oldModal = document.getElementById('errorModal');
    if (oldModal) {
        const bs = bootstrap.Modal.getInstance(oldModal);
        if (bs) bs.dispose();
        oldModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    modal.show();
}


// Verificar si la tabla quedó vacía
function verificarTablaVacia(tipo) {
    const secciones = {
        vehiculo: '#gestor-vehiculos',
        usuario: '#gestor-usuarios-id',
        concesionario: '#gestor-concesionarios-id'
    };

    const seccion = document.querySelector(secciones[tipo]);
    if (!seccion) return;

    const tbody = seccion.querySelector('tbody');
    if (tbody && tbody.children.length === 0) {
        const tabla = seccion.querySelector('.table-responsive');
        if (tabla) {
            const mensajes = {
                vehiculo: 'No hay vehículos registrados',
                usuario: 'No hay usuarios registrados',
                concesionario: 'No hay concesionarios registrados'
            };

            tabla.innerHTML = `
                <div class="alert alert-info" role="alert">
                    <i class="bi bi-info-circle me-2"></i>
                    ${mensajes[tipo]}
                </div>
            `;
        }
    }
}

// ============================================
// SISTEMA DE CANCELACIÓN DE RESERVAS
// ============================================

function inicializarCancelacionReservas() {
    const botonesCancelar = document.querySelectorAll('.cancelar-reserva');

    console.log('Botones de cancelar encontrados:', botonesCancelar.length);

    botonesCancelar.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const idReserva = btn.getAttribute('data-id');

            // Confirmar cancelación
            if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
                cancelarReserva(idReserva, btn);
            }
        });
    });
}

function cancelarReserva(idReserva, btn) {
    const url = `/api/reservas/${idReserva}/cancelar`;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.message || `Error ${response.status}`);
            });
        }
        return response.json();
    })
    .then(data => {
        console.log('Reserva cancelada correctamente:', data);
        mostrarModalExito('Reserva cancelada correctamente');

        // Actualizar el estado en la tabla
        const fila = btn.closest('tr');
        if (fila) {
            // Cambiar el badge de estado
            const estadoBadge = fila.querySelector('.badge');
            if (estadoBadge) {
                estadoBadge.className = 'badge bg-danger';
                estadoBadge.textContent = 'cancelada';
            }

            // Eliminar el botón de cancelar
            btn.remove();

            // Animar la fila
            fila.style.transition = 'all 0.3s ease';
            fila.style.backgroundColor = '#f8d7da';
            setTimeout(() => {
                fila.style.backgroundColor = '';
            }, 1000);
        }
    })
    .catch(error => {
        console.error('Error al cancelar reserva:', error);
        mostrarModalError(error.message || 'No se pudo cancelar la reserva');
    });
}
