let reservasCache = [];

// Cache de elementos DOM
const elementos = {};

document.addEventListener('DOMContentLoaded', function () {
    console.log('Script fetch() de reservas con callbacks cargado');

    // Cachear elementos
    elementos.tablaBody = document.getElementById('reservasTableBody');
    elementos.formNuevaReserva = document.getElementById('formNuevaReserva');
    elementos.btnGuardar = document.getElementById('btnGuardarReserva');
    elementos.modal = document.getElementById('modalNuevaReserva');
    elementos.contador = document.getElementById('contadorReservas');

    // Verificar que existen los elementos necesarios
    if (!elementos.tablaBody) {
        console.error('No se encontró el tbody de la tabla');
        return;
    }

    // Establecer fecha mínima como hoy
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInicio = document.getElementById('fecha_inicio');
    const fechaFin = document.getElementById('fecha_fin');

    if (fechaInicio) fechaInicio.setAttribute('min', hoy);
    if (fechaFin) fechaFin.setAttribute('min', hoy);

    // Event listeners
    if (elementos.btnGuardar) {
        elementos.btnGuardar.addEventListener('click', crearReserva);
    }

    if (fechaInicio) {
        fechaInicio.addEventListener('change', validarFechas);
    }

    if (fechaFin) {
        fechaFin.addEventListener('change', validarFechas);
    }

    // Cargar reservas al inicio
    cargarReservas(function (error, reservas) {
        if (error) {
            console.error('Error al cargar reservas:', error);
        } else {
            console.log('Reservas cargadas correctamente:', reservas.length);
        }
    });
});

function cargarReservas(callback) {
    mostrarLoader(true);
    ocultarMensajes();

    fetch('/api/reservas')
        .then(function (response) {
            console.log('Respuesta reservas:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error('Error HTTP ' + response.status + ': ' + response.statusText);
            }

            return response.json();
        })
        .then(function (json) {
            console.log('Reservas recibidas:', json);

            // Manejar formato {success, data, count} o array directo
            if (json.data) {
                reservasCache = json.data;
            } else if (Array.isArray(json)) {
                reservasCache = json;
            } else {
                throw new Error('Formato de respuesta inválido');
            }

            mostrarReservas(reservasCache);

            if (elementos.contador) {
                elementos.contador.textContent = reservasCache.length;
            }

            if (callback) {
                callback(null, reservasCache);
            }
        })
        .catch(function (error) {
            console.error('Error al cargar reservas:', error);

            let mensajeError = 'Error al cargar reservas';

            if (error.message.includes('Failed to fetch')) {
                mensajeError = 'No se puede conectar con el servidor';
            } else if (error.message.includes('404')) {
                mensajeError = 'Endpoint de reservas no encontrado';
            } else if (error.message.includes('500')) {
                mensajeError = 'Error interno del servidor';
            }

            mostrarError(mensajeError);

            if (callback) {
                callback(error);
            }
        })
        .finally(function () {
            mostrarLoader(false);
        });
}


function mostrarReservas(reservas) {
    if (!elementos.tablaBody) {
        console.error('No se encontró el tbody de la tabla');
        return;
    }

    elementos.tablaBody.innerHTML = '';

    if (reservas.length === 0) {
        elementos.tablaBody.innerHTML = '\n' +
            '            <tr>\n' +
            '                <td colspan="8" class="text-center text-muted">\n' +
            '                    No hay reservas registradas\n' +
            '                </td>\n' +
            '            </tr>\n' +
            '        ';
        return;
    }

    reservas.forEach(function (reserva) {
        const fila = crearFilaReserva(reserva);
        elementos.tablaBody.insertAdjacentHTML('beforeend', fila);
    });

    // Animación de entrada con Vanilla JS
    const filas = elementos.tablaBody.querySelectorAll('tr');
    filas.forEach(function (fila, index) {
        fila.style.opacity = '0';
        fila.style.transform = 'translateX(-20px)';

        setTimeout(function () {
            fila.style.transition = 'all 0.6s ease';
            fila.style.opacity = '1';
            fila.style.transform = 'translateX(0)';
        }, index * 50);
    });
}

function crearFilaReserva(reserva) {
    const estadoBadge = obtenerBadgeEstado(reserva.estado);

    return '\n' +
        '        <tr data-id="' + reserva.id_reserva + '">\n' +
        '            <td>' + reserva.id_reserva + '</td>\n' +
        '            <td>' + reserva.id_vehiculo + '</td>\n' +
        '            <td>' + escaparHTML(reserva.nombre_usuario || reserva.id_usuario) + '</td>\n' +
        '            <td>' + formatearFecha(reserva.fecha_inicio) + '</td>\n' +
        '            <td>' + formatearFecha(reserva.fecha_fin) + '</td>\n' +
        '            <td>' + estadoBadge + '</td>\n' +
        '            <td>' + escaparHTML(reserva.observaciones || '-') + '</td>\n' +
        '            <td>\n' +
        '                <button class="btn btn-sm btn-danger" onclick="eliminarReserva(' + reserva.id_reserva + ')">\n' +
        '                    <i class="bi bi-trash"></i>\n' +
        '                </button>\n' +
        '            </td>\n' +
        '        </tr>\n' +
        '    ';
}

function crearReserva() {
    const datos = {
        id_vehiculo: document.getElementById('id_vehiculo').value,
        id_usuario: document.getElementById('id_usuario').value,
        fecha_inicio: document.getElementById('fecha_inicio').value,
        fecha_fin: document.getElementById('fecha_fin').value,
        observaciones: document.getElementById('observaciones').value
    };

    // Validaciones básicas
    if (!datos.id_vehiculo || !datos.id_usuario || !datos.fecha_inicio || !datos.fecha_fin) {
        mostrarError('Por favor, completa todos los campos obligatorios');
        return;
    }

    mostrarLoader(true);
    if (elementos.btnGuardar) {
        elementos.btnGuardar.disabled = true;
    }

    fetch('/api/reservas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
        .then(function (response) {
            console.log('Respuesta crear reserva:', response.status);

            if (!response.ok) {
                // Intentar leer el mensaje de error del servidor
                return response.json().then(function (errorData) {
                    throw new Error(errorData.message || 'Error HTTP ' + response.status);
                });
            }

            return response.json();
        })
        .then(function (json) {
            console.log('Reserva creada:', json);

            if (json.success) {
                mostrarExito(json.message);

                // Limpiar formulario
                if (elementos.formNuevaReserva) {
                    elementos.formNuevaReserva.reset();
                }

                // Cerrar modal (Bootstrap 5)
                if (elementos.modal && window.bootstrap) {
                    const modalInstance = bootstrap.Modal.getInstance(elementos.modal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }

                // Recargar reservas
                cargarReservas(function (error) {
                    if (error) {
                        console.error('Error al recargar reservas:', error);
                    }
                });
            } else {
                mostrarError(json.message || 'Error al crear reserva');
            }
        })
        .catch(function (error) {
            console.error('Error al crear reserva:', error);
            mostrarError(error.message || 'Error al crear la reserva');
        })
        .finally(function () {
            mostrarLoader(false);
            if (elementos.btnGuardar) {
                elementos.btnGuardar.disabled = false;
            }
        });
}

function eliminarReserva(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
        return;
    }

    mostrarLoader(true);

    fetch('/api/reservas/' + id, {
        method: 'DELETE'
    })
        .then(function (response) {
            if (!response.ok) {
                return response.json().then(function (errorData) {
                    throw new Error(errorData.message || 'Error HTTP ' + response.status);
                });
            }
            return response.json();
        })
        .then(function (json) {
            if (json.success) {
                mostrarExito(json.message);

                // Eliminar fila con animación
                const fila = document.querySelector('tr[data-id="' + id + '"]');
                if (fila) {
                    fila.style.transition = 'all 0.4s ease';
                    fila.style.opacity = '0';
                    fila.style.transform = 'translateX(20px)';

                    setTimeout(function () {
                        fila.remove();

                        // Si no quedan reservas, mostrar mensaje
                        if (elementos.tablaBody.querySelectorAll('tr').length === 0) {
                            mostrarReservas([]);
                        }

                        // Actualizar contador
                        reservasCache = reservasCache.filter(function (r) {
                            return r.id_reserva !== id;
                        });

                        if (elementos.contador) {
                            elementos.contador.textContent = reservasCache.length;
                        }
                    }, 400);
                }
            } else {
                mostrarError(json.message);
            }
        })
        .catch(function (error) {
            console.error('Error al eliminar:', error);
            mostrarError(error.message || 'Error al eliminar la reserva');
        })
        .finally(function () {
            mostrarLoader(false);
        });
}

function validarFechas() {
    const fechaInicioInput = document.getElementById('fecha_inicio');
    const fechaFinInput = document.getElementById('fecha_fin');

    if (!fechaInicioInput || !fechaFinInput) return;

    const fechaInicio = new Date(fechaInicioInput.value);
    const fechaFin = new Date(fechaFinInput.value);

    if (fechaFin <= fechaInicio) {
        fechaFinInput.setCustomValidity('La fecha de fin debe ser posterior a la fecha de inicio');
        fechaFinInput.classList.add('is-invalid');
    } else {
        fechaFinInput.setCustomValidity('');
        fechaFinInput.classList.remove('is-invalid');
    }
}

function formatearFecha(fecha) {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES');
}

function obtenerBadgeEstado(estado) {
    let badgeClass;

    switch (estado) {
        case 'pendiente':
            badgeClass = 'bg-warning text-dark';
            break;
        case 'confirmada':
            badgeClass = 'bg-success';
            break;
        case 'completada':
            badgeClass = 'bg-primary';
            break;
        case 'cancelada':
            badgeClass = 'bg-danger';
            break;
        default:
            badgeClass = 'bg-secondary';
    }

    return '<span class="badge ' + badgeClass + '">' + escaparHTML(estado) + '</span>';
}

function escaparHTML(texto) {
    if (texto === null || texto === undefined) return '';
    const div = document.createElement('div');
    div.textContent = texto.toString();
    return div.innerHTML;
}

function mostrarLoader(mostrar) {
    let loader = document.getElementById('loader');

    if (!loader) {
        const main = document.querySelector('main .container');
        if (main) {
            main.insertAdjacentHTML('afterbegin', '\n' +
                '                <div id="loader" class="text-center my-4" style="display: none;">\n' +
                '                    <div class="spinner-border text-primary" role="status">\n' +
                '                        <span class="visually-hidden">Cargando...</span>\n' +
                '                    </div>\n' +
                '                </div>\n' +
                '            ');
            loader = document.getElementById('loader');
        }
    }

    if (loader) {
        if (mostrar) {
            loader.style.display = 'block';
            loader.style.opacity = '0';
            setTimeout(function () {
                loader.style.transition = 'opacity 0.3s';
                loader.style.opacity = '1';
            }, 10);
        } else {
            loader.style.opacity = '0';
            setTimeout(function () {
                loader.style.display = 'none';
            }, 300);
        }
    }
}

function mostrarExito(mensaje) {
    mostrarMensaje(mensaje, 'success');
}

function mostrarError(mensaje) {
    mostrarMensaje(mensaje, 'danger');
}

function mostrarMensaje(mensaje, tipo) {
    const contenedor = document.querySelector('main .container .row');

    if (!contenedor) return;

    const alertId = tipo === 'success' ? 'successMessage' : 'errorMessage';
    let alertDiv = document.getElementById(alertId);

    if (!alertDiv) {
        contenedor.insertAdjacentHTML('afterbegin', '\n' +
            '            <div id="' + alertId + '" class="alert alert-' + tipo + ' alert-dismissible fade show" role="alert" style="display: none;">\n' +
            '                ' + escaparHTML(mensaje) + '\n' +
            '                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>\n' +
            '            </div>\n' +
            '        ');
        alertDiv = document.getElementById(alertId);
    } else {
        alertDiv.className = 'alert alert-' + tipo + ' alert-dismissible fade show';
        alertDiv.innerHTML = escaparHTML(mensaje) + '\n' +
            '                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>\n' +
            '            ';
    }

    if (alertDiv) {
        alertDiv.style.display = 'block';
        alertDiv.style.opacity = '0';

        setTimeout(function () {
            alertDiv.style.transition = 'opacity 0.3s';
            alertDiv.style.opacity = '1';
        }, 10);

        // Scroll suave hacia el mensaje
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Auto-cerrar después de 5 segundos (excepto errores)
        if (tipo !== 'danger') {
            setTimeout(function () {
                alertDiv.style.opacity = '0';
                setTimeout(function () {
                    if (alertDiv && alertDiv.parentNode) {
                        alertDiv.remove();
                    }
                }, 500);
            }, 5000);
        }
    }
}

function ocultarMensajes() {
    const mensajes = document.querySelectorAll('#successMessage, #errorMessage');
    mensajes.forEach(function (msg) {
        msg.style.opacity = '0';
        setTimeout(function () {
            msg.style.display = 'none';
        }, 300);
    });
}

// Exponer función global para uso en HTML
window.eliminarReserva = eliminarReserva;