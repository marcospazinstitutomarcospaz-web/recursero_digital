// ============================================================================
// CONFIGURACIÓN DE SUPABASE (SRC/SUPABASE.JS)
// ============================================================================

const SUPABASE_URL = 'https://ymnaukmdoapukiuelfux.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6o8MwAGFEUKH5udXfYWULQ_drFWrtAH';

// Inicializar y exportar el cliente oficial de Supabase
export const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);