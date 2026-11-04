// ============================================================================
// LÓGICA PRINCIPAL (SRC/MAIN.JS) - BUSCADOR, FILTROS Y ESTADO DE ADMIN
// ============================================================================

import { db } from './supabase.js';
import { verificarEsAdmin, iniciarSesionAdmin, cerrarSesionAdmin } from './auth.js';

const TABLA_NOMBRE = 'instituciones_recursos';
let datosCompletos = [];

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

// 1. Cargar datos iniciales
async function cargarDatos() {
    try {
        if (!resultsCount || !cardsContainer) return;

        resultsCount.textContent = 'Cargando recursos de la base de datos...';

        const { data, error } = await db.from(TABLA_NOMBRE).select('*');
        
        if (error) throw error;
        
        datosCompletos = data || [];
        poblarSelects(datosCompletos);
        filtrarYRenderizar();
        await chequearEstadoAdminUI();
    } catch (err) {
        console.error('Error al consultar Supabase:', err);
        if (resultsCount) resultsCount.textContent = 'Error al cargar los datos desde el servidor.';
        if (cardsContainer) {
            cardsContainer.innerHTML = `<p style="color: #dc2626; text-align: center; grid-column: 1 / -1; font-weight: 500; padding: 2rem;">⚠️ Ocurrió un error: ${err.message}</p>`;
        }
    }
}

// 2. Poblar selectores de forma dinámica
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

// 3. Filtrar y Renderizar
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

// 4. Renderizar tarjetas
function renderizarResultados(lista) {
    if (!cardsContainer || !resultsCount) return;

    cardsContainer.innerHTML = '';
    resultsCount.textContent = `Se encontraron ${lista.length} de ${datosCompletos.length} recursos disponibles.`;

    if (lista.length === 0) {
        cardsContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #64748b; padding: 2rem;">No se encontraron instituciones con los filtros aplicados.</p>';
        return;
    }

    lista.forEach(item => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.style.cssText = 'background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between;';

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
        `;
        cardsContainer.appendChild(card);
    });
}

// 5. Control del estado visual según si hay sesión iniciada
// Control del estado visual según si hay sesión iniciada
async function chequearEstadoAdminUI() {
    const esAdmin = await verificarEsAdmin();
    
    if (esAdmin) {
        if (adminLoginSection) adminLoginSection.style.display = 'none';
        if (adminPanelSection) adminPanelSection.style.display = 'block';
        if (openAdminBtn) {
            openAdminBtn.innerHTML = '⚙️ Admin (Activo)';
            openAdminBtn.style.backgroundColor = '#065f46'; // Verde oscuro
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

// Evento Login desde el Modal
if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('adminUser').value.trim();
        const password = document.getElementById('adminPass').value;

        try {
            await iniciarSesionAdmin(email, password);
            if (adminLoginError) adminLoginError.style.display = 'none';
            adminLoginForm.reset();
            await chequearEstadoAdminUI();
            alert('¡Sesión iniciada con éxito como Administrador!');
        } catch (err) {
            if (adminLoginError) {
                adminLoginError.style.display = 'block';
                adminLoginError.textContent = 'Credenciales inválidas o usuario no registrado.';
            }
        }
    });
}

// Evento Logout
if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async () => {
        try {
            await cerrarSesionAdmin();
            await chequearEstadoAdminUI();
            alert('Sesión cerrada correctamente.');
            if (adminModal) adminModal.style.display = 'none';
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
        }
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

// Modal Admin Open/Close
if (openAdminBtn && closeAdminBtn && adminModal) {
    openAdminBtn.addEventListener('click', async () => {
        await chequearEstadoAdminUI();
        adminModal.style.display = 'flex';
    });
    closeAdminBtn.addEventListener('click', () => adminModal.style.display = 'none');
}

// Inicialización
cargarDatos();