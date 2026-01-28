// ============================================
// SISTEMA DE CARGA DE JSON - PANEL ADMIN
// Usando AJAX para cargar datos desde JSON
// ============================================

document.addEventListener('DOMContentLoaded', function () {
    inicializarCargaJSON();
});

function inicializarCargaJSON() {
    const formCargarJSON = document.getElementById('formCargarJSON');
    const btnCargarJSON = document.getElementById('btnCargarJSON');
    const jsonFileInput = document.getElementById('jsonFile');
    const confirmarCheckbox = document.getElementById('confirmarEliminacion');

    if (!formCargarJSON) return;

    formCargarJSON.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validar que se haya seleccionado un archivo
        if (!jsonFileInput.files || jsonFileInput.files.length === 0) {
            alert('⚠️ Por favor, selecciona un archivo JSON');
            return;
        }

        // Validar que el checkbox esté marcado
        if (!confirmarCheckbox.checked) {
            alert('⚠️ Debes confirmar que entiendes que esta acción eliminará todos los datos');
            return;
        }

        const archivo = jsonFileInput.files[0];

        // Validar extensión del archivo
        if (!archivo.name.toLowerCase().endsWith('.json')) {
            alert('⚠️ Por favor, selecciona un archivo JSON válido (.json)');
            return;
        }

        // Validar tamaño del archivo (10MB)
        if (archivo.size > 10 * 1024 * 1024) {
            alert('⚠️ El archivo es demasiado grande. Tamaño máximo: 10MB');
            return;
        }

        // Mostrar alerta de confirmación
        const confirmacion = confirm(
            '⚠️ ÚLTIMA ADVERTENCIA ⚠️\n\n' +
            'Estás a punto de ELIMINAR TODOS los datos de la base de datos:\n\n' +
            '• Todos los concesionarios\n' +
            '• Todos los usuarios\n' +
            '• Todos los vehículos\n' +
            '• Todos los clientes\n' +
            '• Todas las reservas\n\n' +
            'Archivo a cargar: ' + archivo.name + '\n' +
            'Tamaño: ' + (archivo.size / 1024).toFixed(2) + ' KB\n\n' +
            '¿Estás COMPLETAMENTE SEGURO de que deseas continuar?'
        );

        if (!confirmacion) {
            return;
        }

        // Preparar FormData
        const formData = new FormData(formCargarJSON);

        // Deshabilitar botón y cambiar texto
        const textoOriginal = btnCargarJSON.innerHTML;
        btnCargarJSON.disabled = true;
        btnCargarJSON.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

        try {
            // Enviar la petición AJAX
            const response = await fetch('/es-admin/cargar-json', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                // Leer la respuesta como texto
                const text = await response.text();

                // Extraer el mensaje de éxito de la URL de redirección
                const urlMatch = text.match(/success_carga_json=([^"&]+)/);
                let mensaje = 'Base de datos actualizada correctamente';

                if (urlMatch) {
                    mensaje = decodeURIComponent(urlMatch[1]);
                }

                // Mostrar modal de éxito usando la función existente
                mostrarModalExitoJSON(mensaje);

                // Resetear formulario
                formCargarJSON.reset();
                confirmarCheckbox.checked = false;

                // Colapsar el dropdown
                const collapse = bootstrap.Collapse.getInstance(document.getElementById('collapseCargarJSON'));
                if (collapse) {
                    collapse.hide();
                }

                // Recargar la página después de 2 segundos
                setTimeout(() => {
                    window.location.reload();
                }, 2000);

            } else {
                // Extraer mensaje de error
                const text = await response.text();
                const urlMatch = text.match(/error_carga_json=([^"&]+)/);
                let mensajeError = 'Error al procesar el archivo';

                if (urlMatch) {
                    mensajeError = decodeURIComponent(urlMatch[1]);
                }

                mostrarModalErrorJSON(mensajeError);
            }

        } catch (error) {
            console.error('Error al cargar JSON:', error);
            mostrarModalErrorJSON('Ocurrió un error al procesar el archivo. Por favor, verifica que el JSON tenga la estructura correcta e intenta nuevamente.');

        } finally {
            // Rehabilitar botón
            btnCargarJSON.disabled = false;
            btnCargarJSON.innerHTML = textoOriginal;
        }
    });

    // Mostrar información del archivo seleccionado
    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                const archivo = this.files[0];
                const tamañoKB = (archivo.size / 1024).toFixed(2);
                console.log(`📄 Archivo seleccionado: ${archivo.name} (${tamañoKB} KB)`);
            }
        });
    }
}

// Modal de éxito para carga de JSON (siguiendo el estilo de admin-ajax.js)
function mostrarModalExitoJSON(mensaje) {
    const modalHTML = `
        <div class="modal fade" id="exitoModalJSON" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-check-circle-fill me-2"></i>Base de Datos Actualizada
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center py-3">
                            <i class="bi bi-database-check text-success" style="font-size: 3.5rem;"></i>
                            <p class="mt-3 mb-0 fw-bold">${mensaje}</p>
                            <p class="text-muted small mt-2">La página se recargará automáticamente...</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-success" data-bs-dismiss="modal">
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Eliminar modal previo si existe
    const oldModal = document.getElementById('exitoModalJSON');
    if (oldModal) {
        const bs = bootstrap.Modal.getInstance(oldModal);
        if (bs) bs.dispose();
        oldModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('exitoModalJSON'));
    modal.show();
}

// Modal de error para carga de JSON (siguiendo el estilo de admin-ajax.js)
function mostrarModalErrorJSON(mensaje) {
    const modalHTML = `
        <div class="modal fade" id="errorModalJSON" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>Error al Cargar Datos
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center py-3">
                            <i class="bi bi-x-circle text-danger" style="font-size: 3.5rem;"></i>
                            <p class="mt-3 mb-0">${mensaje}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Eliminar modal previo si existe
    const oldModal = document.getElementById('errorModalJSON');
    if (oldModal) {
        const bs = bootstrap.Modal.getInstance(oldModal);
        if (bs) bs.dispose();
        oldModal.remove();
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = new bootstrap.Modal(document.getElementById('errorModalJSON'));
    modal.show();
}