// SISTEMA DE CARGA DE JSON - PANEL ADMIN

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

        if (!jsonFileInput.files || jsonFileInput.files.length === 0) {
            alert('Por favor, selecciona un archivo JSON');
            return;
        }
        if (!confirmarCheckbox.checked) {
            alert('Debes confirmar que entiendes los cambios que se realizarán');
            return;
        }

        const archivo = jsonFileInput.files[0];

        if (!archivo.name.toLowerCase().endsWith('.json')) {
            alert('Por favor, selecciona un archivo JSON válido (.json)');
            return;
        }
        if (archivo.size > 10 * 1024 * 1024) {
            alert('El archivo es demasiado grande. Tamaño máximo: 10MB');
            return;
        }

        // Leer y parsear el JSON en el cliente para verificar conflictos
        let jsonData;
        try {
            const texto = await archivo.text();
            jsonData = JSON.parse(texto);
        } catch (e) {
            alert('El archivo JSON no es válido');
            return;
        }

        // Verificar qué matrículas ya existen
        let actualizarExistentes = false;
        const matriculas = (jsonData.vehiculos || []).map(v => v.matricula).filter(Boolean);

        if (matriculas.length > 0) {
            try {
                const checkResp = await fetch('/es-admin/verificar-matriculas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ matriculas })
                });
                const checkData = await checkResp.json();

                if (checkData.existentes && checkData.existentes.length > 0) {
                    const lista = checkData.existentes.join('\n  • ');
                    actualizarExistentes = confirm(
                        `Los siguientes vehículos ya existen en la base de datos:\n\n  • ${lista}\n\n` +
                        `¿Deseas actualizarlos con los datos del JSON?\n\n` +
                        `  OK → Actualizar vehículos existentes\n` +
                        `  Cancelar → Mantenerlos sin cambios (solo se añadirán los nuevos)`
                    );
                }
            } catch (e) {
                console.warn('No se pudo verificar matrículas, continuando sin verificación');
            }
        }

        // Preparar y enviar el formulario
        const textoOriginal = btnCargarJSON.innerHTML;
        btnCargarJSON.disabled = true;
        btnCargarJSON.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

        const formData = new FormData(formCargarJSON);
        formData.append('actualizar_existentes', actualizarExistentes ? 'true' : 'false');

        try {
            const response = await fetch('/es-admin/cargar-json', {
                method: 'POST',
                body: formData
            });

            const text = await response.text();

            if (response.ok) {
                const urlMatch = text.match(/success_carga_json=([^"&]+)/);
                const mensaje = urlMatch ? decodeURIComponent(urlMatch[1]) : 'Base de datos actualizada correctamente';
                mostrarModalExitoJSON(mensaje);
                formCargarJSON.reset();
            } else {
                const urlMatch = text.match(/error_carga_json=([^"&]+)/);
                const mensajeError = urlMatch ? decodeURIComponent(urlMatch[1]) : 'Error al procesar el archivo';
                mostrarModalErrorJSON(mensajeError);
            }
        } catch (error) {
            console.error('Error al cargar JSON:', error);
            mostrarModalErrorJSON('Ocurrió un error al procesar el archivo.');
        } finally {
            btnCargarJSON.disabled = false;
            btnCargarJSON.innerHTML = textoOriginal;
        }
    });

    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', function () {
            if (this.files && this.files.length > 0) {
                console.log(`Archivo seleccionado: ${this.files[0].name}`);
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

    document.getElementById('exitoModalJSON').addEventListener('hidden.bs.modal', () => {
        window.location.reload();
    });
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