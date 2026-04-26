// Cargar estadísticas generales
fetch('/api/estadisticas/resumen-general')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('total-reservas').textContent = data.data.total_reservas;
            document.getElementById('total-vehiculos').textContent = data.data.total_vehiculos;
            document.getElementById('total-concesionarios').textContent = data.data.total_concesionarios;
            document.getElementById('total-usuarios').textContent = data.data.total_usuarios;
        }
    })
    .catch(err => console.error('Error al cargar resumen:', err));

// Cargar reservas por concesionario
fetch('/api/estadisticas/reservas-por-concesionario')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const tbody = document.getElementById('reservas-concesionario');
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center">No hay datos</td></tr>';
            } else {
                tbody.innerHTML = data.data.map(c => `
                        <tr>
                            <td>${c.concesionario}</td>
                            <td>${c.ciudad}</td>
                            <td><span class="badge bg-success">${c.total_reservas}</span></td>
                        </tr>
                    `).join('');
            }
        }
    })
    .catch(err => console.error('Error al cargar reservas por concesionario:', err));

// Cargar top vehículos
fetch('/api/estadisticas/vehiculo-mas-usado')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const tbody = document.getElementById('top-vehiculos');
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No hay datos</td></tr>';
            } else {
                tbody.innerHTML = data.data.map((v, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${v.marca}</td>
                            <td>${v.modelo}</td>
                            <td>${v.matricula}</td>
                            <td><span class="badge bg-success">${v.total_reservas}</span></td>
                        </tr>
                    `).join('');
            }
        }
    })
    .catch(err => console.error('Error al cargar top vehículos:', err));

// Kilómetros totales
fetch('/api/estadisticas/kms-totales')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const kms = Number(data.data.total_kms);
            document.getElementById('total-kms').textContent =
                kms.toLocaleString('es-ES') + ' km';
        }
    })
    .catch(err => console.error('Error al cargar kms:', err));

// Incidencias
fetch('/api/estadisticas/incidencias')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            document.getElementById('total-incidencias').textContent =
                data.data.total_incidencias;
        }
    })
    .catch(err => console.error('Error al cargar incidencias:', err));

// Franjas horarias
fetch('/api/estadisticas/franjas-horarias')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            const contenedor = document.getElementById('franjas-horarias');
            const total = data.data.reduce((sum, f) => sum + f.total, 0);

            if (total === 0) {
                contenedor.innerHTML = '<p class="text-muted">No hay datos de reservas aún.</p>';
                return;
            }

            const iconos = { 'Mañana': 'bi-sunrise', 'Tarde': 'bi-sun', 'Noche': 'bi-moon-stars' };
            const colores = { 'Mañana': 'bg-warning', 'Tarde': 'bg-success', 'Noche': 'bg-primary' };

            contenedor.innerHTML = data.data.map(f => {
                const pct = Math.round((f.total / total) * 100);
                return `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between mb-1">
                            <span><i class="bi ${iconos[f.franja] || 'bi-clock'} me-2"></i>${f.franja}</span>
                            <span class="fw-bold">${f.total} reservas (${pct}%)</span>
                        </div>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar ${colores[f.franja] || 'bg-secondary'}"
                                 role="progressbar"
                                 style="width: ${pct}%"
                                 aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    })
    .catch(err => console.error('Error al cargar franjas:', err));