// 1. Configuración de Supabase
const SUPABASE_URL = 'https://ymnaukmdoapukiuelfux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6o8MwAGFEUKH5udXfYWULQ_drFWrtAH';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const TABLA_NOMBRE = 'instituciones_recursos'; 

// Elementos del DOM
const resultsCount = document.getElementById('resultsCount');
const searchInput = document.getElementById('searchInput');
const filterRubro = document.getElementById('filterRubro');
const filterComuna = document.getElementById('filterComuna');
const filterGestion = document.getElementById('filterGestion');
const btnClearFilters = document.getElementById('btnClearFilters');
const cardsContainer = document.getElementById('cardsContainer');

const dynTitle = document.getElementById('dynTitle');
const dynSubtitle = document.getElementById('dynSubtitle');
const modal = document.getElementById('adminModal');
const openBtn = document.getElementById('openAdminBtn');
const closeBtn = document.getElementById('closeAdminBtn');
const loginSection = document.getElementById('adminLoginSection');
const panelSection = document.getElementById('adminPanelSection');

let datosCompletos = [];

// 2. Cargar datos reales desde Supabase al abrir la página
window.addEventListener('DOMContentLoaded', async () => {
    try {
        resultsCount.textContent = "Cargando registros desde la base de datos...";

        const { data, error } = await db.from(TABLA_NOMBRE).select('*');

        if (error) throw error;

        datosCompletos = data || [];
        resultsCount.textContent = `Se encontraron ${datosCompletos.length} recursos.`;

        renderCards(datosCompletos);
    } catch (error) {
        console.error('Error al conectar con Supabase:', error);
        resultsCount.textContent = 'Error al cargar los datos de la base de datos.';
    }
});

// 3. Lógica de Filtrado dinámico
function filtrarYRenderizar() {
    const textQuery = searchInput.value.toLowerCase().trim();
    const rubroQuery = filterRubro.value;
    const comunaQuery = filterComuna.value;
    const gestionQuery = filterGestion.value;

    const filtered = datosCompletos.filter(item => {
        const nombre = item.nombre || item.institucion || '';
        const direccion = item.direccion || '';
        const subrubro = item.subrubro || item.tipo_institucion || '';
        const seccion = item.seccion || '';

        const matchesText = !textQuery || 
                            nombre.toLowerCase().includes(textQuery) || 
                            direccion.toLowerCase().includes(textQuery) ||
                            subrubro.toLowerCase().includes(textQuery);

        const matchesRubro = rubroQuery === 'Todos' || !rubroQuery || seccion === rubroQuery || item.rubro === rubroQuery;
        const matchesComuna = comunaQuery === 'Todas' || !comunaQuery || comunaQuery === '' || item.comuna === comunaQuery;
        const matchesGestion = gestionQuery === 'Todas' || !gestionQuery || item.gestion === gestionQuery;

        return matchesText && matchesRubro && matchesComuna && matchesGestion;
    });

    renderCards(filtered);
}

// 4. Renderizar Tarjetas en la interfaz
function renderCards(data) {
    cardsContainer.innerHTML = '';
    resultsCount.textContent = `Mostrando ${data.length} recurso(s)`;

    if (data.length === 0) {
        cardsContainer.innerHTML = `<div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: white; border-radius: 12px; color: #64748b;">No se encontraron registros que coincidan con la búsqueda.</div>`;
        return;
    }

    data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.innerHTML = `
            <div>
                <div class="card-header">
                    <h3 class="card-title">${item.nombre || item.institucion || 'Sin nombre'}</h3>
                    <span class="tag-rubro">${item.seccion || item.rubro || 'General'}</span>
                </div>
                <div class="card-subrubro">${item.tipo_institucion || item.subrubro || ''}</div>
                <div class="card-body">
                    <p><strong>Dirección:</strong> ${item.direccion || 'No especificada'}</p>
                    <p><strong>Teléfono:</strong> ${item.telefono || 'No especificado'}</p>
                    ${item.responsable ? `<p><strong>Responsable:</strong> ${item.responsable}</p>` : ''}
                </div>
            </div>
            <div class="card-footer">
                <span class="badge-gestion">${item.gestion || 'N/D'}</span>
                <span class="badge-comuna">${item.comuna || ''}</span>
            </div>
        `;
        cardsContainer.appendChild(card);
    });
}

// Event Listeners de Filtros
searchInput?.addEventListener('input', filtrarYRenderizar);
filterRubro?.addEventListener('change', filtrarYRenderizar);
filterComuna?.addEventListener('change', filtrarYRenderizar);
filterGestion?.addEventListener('change', filtrarYRenderizar);

btnClearFilters?.addEventListener('click', () => {
    searchInput.value = '';
    filterRubro.value = 'Todos';
    filterComuna.value = 'Todas';
    filterGestion.value = 'Todas';
    renderCards(datosCompletos);
});

// Control de Ventana Modal Admin
if (openBtn && modal && closeBtn) {
    openBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        if (localStorage.getItem('mp_isAdmin') === 'true') {
            showPanel();
        } else {
            showLogin();
        }
    });
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
}

function showLogin() {
    loginSection.style.display = 'block';
    panelSection.style.display = 'none';
}

function showPanel() {
    loginSection.style.display = 'none';
    panelSection.style.display = 'block';
    if(document.getElementById('editTitle')) document.getElementById('editTitle').value = dynTitle.textContent;
    if(document.getElementById('editSubtitle')) document.getElementById('editSubtitle').value = dynSubtitle.textContent;
}

document.getElementById('adminLoginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const user = document.getElementById('adminUser').value;
    const pass = document.getElementById('adminPass').value;

    if (user === 'admin' && pass === 'marcospaz2026') {
        localStorage.setItem('mp_isAdmin', 'true');
        document.getElementById('adminLoginError').style.display = 'none';
        showPanel();
    } else {
        document.getElementById('adminLoginError').style.display = 'block';
    }
});

document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('mp_isAdmin');
    showLogin();
});