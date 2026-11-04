// ============================================================================
// LÓGICA PRINCIPAL (SRC/MAIN.JS) - BUSCADOR, FILTROS Y CRUD DE BASE DE DATOS
// ============================================================================

import { db } from './supabase.js';
import { verificarEsAdmin, iniciarSesionAdmin, cerrarSesionAdmin } from './auth.js';

const TABLA_NOMBRE = 'instituciones_recursos';
let datosCompletos = [];
let esUsuarioAdmin = false;

// Elementos del DOM
const searchInput = document.getElementById('searchInput');
const selectSeccion = document.getElementById('filterSeccion');
const selectTipo = document.getElementById('filterTipo');
const selectGestion = document.getElementById('filterGestion');
const btnClearFilters = document.getElementById('btnClearFilters');
const resultsCount = document.getElementById('resultsCount');
const cardsContainer = document.getElementById('cardsContainer');

// Elementos del Modal Admin
const openAdminBtn = document.getElementById('openAdminBtn');
const closeAdminBtn = document.getElementById('closeAdminBtn');
const adminModal = document.getElementById('adminModal');
const adminLoginSection = document.getElementById('adminLoginSection');
const adminPanelSection = document.getElementById('adminPanelSection');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminLoginError = document.getElementById('adminLoginError');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

// Formulario de Instituciones
const resourceForm = document.getElementById('resourceForm');
const resourceFormTitle = document.getElementById('resourceFormTitle');
const resId = document.getElementById('resId');
const resNombre = document.getElementById('resNombre');
const resSeccion = document.getElementById('resSeccion');
const resTipo = document.getElementById('resTipo');
const resGestion = document.getElementById('resGestion');
const resTelefono = document.getElementById('resTelefono');
const resDireccion = document.getElementById('resDireccion');
const resResponsable = document.getElementById('resResponsable');
const resDetalles = document.getElementById('resDetalles');
const btnCancelEdit = document.getElementById('btnCancelEdit');

// 1. Cargar datos desde Supabase
async function cargarDatos() {
    try {
        if (!resultsCount || !cardsContainer) return;

        resultsCount.textContent = 'Cargando recursos de la base de datos...';
        esUsuarioAdmin = await verificarEsAdmin();

        const { data, error } = await db.from(TABLA_NOMBRE).select('*');
        
        if (error) throw error;
        
        datosCompletos = data || [];
        poblarSelects(datosCompletos);
        filtrarYRenderizar();
        await chequearEstadoAdminUI();
    } catch (err) {
        console.error('Error al consultar Supabase:', err);
        if (resultsCount) resultsCount.textContent = 'Error al cargar los datos.';
        if (cardsContainer) {
            cardsContainer.innerHTML = `<p style="color: #dc2626; text-align: center; grid-column: 1 / -1; padding: 2rem;">⚠️ Ocurrió un error: ${err.message}</p>`;
        }
    }
}

// 2. Poblar selectores de filtro de forma dinámica
function poblarSelects(data) {
    if (!selectSeccion || !selectTipo || !selectGestion) return;

    const secciones = [...new Set(data.map(item => item.seccion).filter(Boolean))].sort();
    const tipos = [...new Set(data.map(item => item.tipo_institucion).filter(Boolean))].sort();
    const gestiones = [...new Set(data.map(item => item.gestion).filter(Boolean))]
        .filter(g => !g.includes('-') && !/\d/.test(g))
        .sort();

    selectSeccion.innerHTML = '<option value="">Todas las secciones</option>' +
        secciones.map(sec => `<option value="${sec}">${sec}</option>`).join('');

    selectTipo.innerHTML = '<option value="">Todos los tipos</option>' +
        tipos.map(t => `<option value="${t}">${t}</option>`).join('');

    selectGestion.innerHTML = '<option value="">Todas</option>' +
        gestiones.map(g => `<option value="${g}">${g}</option>`).join('');
}

// 3. Aplicar Filtros
function filtrarYRenderizar() {
    const texto = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const seccionSel = selectSeccion ? selectSeccion.value : '';
    const tipoSel = selectTipo ? selectTipo.value : '';
    const gestionSel = selectGestion ? selectGestion.value : '';

    const filtrados = datosCompletos.filter(item => {
        const coincideTexto = !texto ||
            (item.nombre && item.nombre.toLowerCase().includes(texto)) ||
            (item.direccion && item.direccion.toLowerCase().includes(texto)) ||
            (item.responsable && item.responsable.toLowerCase().includes(texto)) ||
            (item.detalles && item.detalles.toLowerCase().includes(texto));

        const coincideSeccion = !seccionSel || item.seccion === seccionSel;
        const coincideTipo = !tipoSel || item.tipo_institucion === tipoSel;
        const coincideGestion = !gestionSel || item.gestion === gestionSel;

        return coincideTexto && coincideSeccion && coincideTipo && coincideGestion;
    });

    renderizarResultados(filtrados);
}

// 4. Renderizar tarjetas (con acciones de Admin en la base de datos)
function renderizarResultados(lista) {
    if (!cardsContainer || !resultsCount) return;

    cardsContainer.innerHTML = '';
    resultsCount.textContent = `Se encontraron ${lista.length} de ${datosCompletos.length} recursos disponibles.`;

    if (lista.length === 0) {
        cardsContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 2rem;">No se encontraron instituciones.</p>';
        return;
    }

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.style.cssText = 'background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;';

        // Si el usuario inició sesión como Admin, se añaden los botones directos de Editar y Eliminar
        const adminActions = esUsuarioAdmin ? `
            <div style="margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button class="btn-edit-item" data-id="${item.id}" style="background: #2563eb; color: white; border: none; padding: 0.35rem 0.7rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: 600;">✏️ Editar</button>
                <button class="btn-delete-item" data-id="${item.id}" style="background: #dc2626; color: white; border: none; padding: 0.35rem 0.7rem; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: 600;">🗑️ Eliminar</button>
            </div>
        ` : '';

        card.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <h3 style="font-size: 1.1rem; font-weight: bold; color: #1e293b;">${item.nombre || 'Sin nombre'}</h3>
                    <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.6rem; border-radius: 12px; font-weight: 600;">
                        ${item.gestion || 'N/D'}
                    </span>
                </div>
                <p style="font-size: 0.85rem; color: #475569; margin: 0.2rem 0;"><strong>Sección:</strong> ${item.seccion || '-'}</p>
                <p style="font-size: 0.85rem; color: #475569; margin: 0.2rem 0;"><strong>Tipo:</strong> ${item.tipo_institucion || '-'}</p>
                <p style="font-size: 0.85rem; color: #64748b; margin-top: 0.5rem;">📍 ${item.direccion || 'Sin dirección'}</p>
                ${item.telefono ? `<p style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">📞 ${item.telefono}</p>` : ''}
                ${item.responsable ? `<p style="font-size: 0.85rem; color: #64748b; margin-top: 0.2rem;">👤 Resp: ${item.responsable}</p>` : ''}
                ${item.detalles ? `<p style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.5rem; font-style: italic;">${item.detalles}</p>` : ''}
            </div>
            ${adminActions}
        `;
        cardsContainer.appendChild(card);
    });

    // Eventos de Editar y Eliminar en cada tarjeta
    if (esUsuarioAdmin) {
        document.querySelectorAll('.btn-edit-item').forEach(btn => {
            btn.addEventListener('click', () => prepararEdicion(btn.dataset.id));
        });
        document.querySelectorAll('.btn-delete-item').forEach(btn => {
            btn.addEventListener('click', () => eliminarInstitucion(btn.dataset.id));
        });
    }
}

// 5. Guardar (Insert / Update) en Supabase
if (resourceForm) {
    resourceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = resId.value;

        const payload = {
            nombre: resNombre.value.trim(),
            seccion: resSeccion.value.trim(),
            tipo_institucion: resTipo.value.trim(),
            gestion: resGestion.value,
            telefono: resTelefono.value.trim(),
            direccion: resDireccion.value.trim(),
            responsable: resResponsable.value.trim(),
            detalles: resDetalles.value.trim()
        };

        try {
            if (id) {
                // UPDATE
                const { error } = await db.from(TABLA_NOMBRE).update(payload).eq('id', id);
                if (error) throw error;
                alert('Institución actualizada en la base de datos.');
            } else {
                // INSERT
                const { error } = await db.from(TABLA_NOMBRE).insert([payload]);
                if (error) throw error;
                alert('Nueva institución guardada exitosamente.');
            }

            resetResourceForm();
            adminModal.style.display = 'none';
            cargarDatos();
        } catch (err) {
            alert('Error al guardar en Supabase: ' + err.message);
        }
    });
}

// Cargar datos en el formulario para Editar
function prepararEdicion(id) {
    const item = datosCompletos.find(d => String(d.id) === String(id));
    if (!item) return;

    resId.value = item.id;
    resNombre.value = item.nombre || '';
    resSeccion.value = item.seccion || '';
    resTipo.value = item.tipo_institucion || '';
    resGestion.value = item.gestion || 'Estatal';
    resTelefono.value = item.telefono || '';
    resDireccion.value = item.direccion || '';
    resResponsable.value = item.responsable || '';
    resDetalles.value = item.detalles || '';

    resourceFormTitle.textContent = 'Editar Institución';
    btnCancelEdit.style.display = 'block';

    adminModal.style.display = 'flex';
}

// Eliminar Institución
async function eliminarInstitucion(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta institución de la base de datos?')) return;

    try {
        const { error } = await db.from(TABLA_NOMBRE).delete().eq('id', id);
        if (error) throw error;
        alert('Institución eliminada de la base de datos.');
        cargarDatos();
    } catch (err) {
        alert('Error al eliminar: ' + err.message);
    }
}

function resetResourceForm() {
    resId.value = '';
    resourceForm.reset();
    resourceFormTitle.textContent = 'Agregar Nueva Institución';
    btnCancelEdit.style.display = 'none';
}

if (btnCancelEdit) btnCancelEdit.addEventListener('click', resetResourceForm);

// 6. UI Admin general
async function chequearEstadoAdminUI() {
    esUsuarioAdmin = await verificarEsAdmin();
    
    if (esUsuarioAdmin) {
        if (adminLoginSection) adminLoginSection.style.display = 'none';
        if (adminPanelSection) adminPanelSection.style.display = 'block';
        if (openAdminBtn) {
            openAdminBtn.innerHTML = '⚙️ Admin (Activo)';
            openAdminBtn.style.backgroundColor = '#065f46';
        }
    } else {
        if (adminLoginSection) adminLoginSection.style.display = 'block';
        if (adminPanelSection) adminPanelSection.style.display = 'none';
        if (openAdminBtn) {
            openAdminBtn.innerHTML = '⚙️ Admin';
            openAdminBtn.style.backgroundColor = '#047857';
        }
    }
}

// Login
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminUser').value.trim();
        const password = document.getElementById('adminPass').value;

        try {
            await iniciarSesionAdmin(email, password);
            if (adminLoginError) adminLoginError.style.display = 'none';
            adminLoginForm.reset();
            await cargarDatos();
            alert('¡Sesión iniciada con éxito!');
        } catch (err) {
            if (adminLoginError) {
                adminLoginError.style.display = 'block';
                adminLoginError.textContent = 'Credenciales incorrectas.';
            }
        }
    });
}

// Logout
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
        await cerrarSesionAdmin();
        resetResourceForm();
        await cargarDatos();
        alert('Sesión cerrada.');
        if (adminModal) adminModal.style.display = 'none';
    });
}

// Listeners Filtros
if (searchInput) searchInput.addEventListener('input', filtrarYRenderizar);
if (selectSeccion) selectSeccion.addEventListener('change', filtrarYRenderizar);
if (selectTipo) selectTipo.addEventListener('change', filtrarYRenderizar);
if (selectGestion) selectGestion.addEventListener('change', filtrarYRenderizar);

if (btnClearFilters) {
    btnClearFilters.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (selectSeccion) selectSeccion.value = '';
        if (selectTipo) selectTipo.value = '';
        if (selectGestion) selectGestion.value = '';
        filtrarYRenderizar();
    });
}

// Modal Admin
if (openAdminBtn && closeAdminBtn && adminModal) {
    openAdminBtn.addEventListener('click', async () => {
        await chequearEstadoAdminUI();
        adminModal.style.display = 'flex';
    });
    closeAdminBtn.addEventListener('click', () => {
        resetResourceForm();
        adminModal.style.display = 'none';
    });
}

// Inicializar
cargarDatos();