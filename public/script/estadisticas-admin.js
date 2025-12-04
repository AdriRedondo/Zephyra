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