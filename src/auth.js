// ============================================================================
// GESTIÓN DE AUTENTICACIÓN Y ROLES (SRC/AUTH.JS)
// ============================================================================

import { db } from './supabase.js';

// Verificar sesión actual de forma robusta
export async function verificarEsAdmin() {
    const { data: { session }, error } = await db.auth.getSession();
    if (error || !session) return false;
    return !!session.user;
}

// Iniciar sesión
export async function iniciarSesionAdmin(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

// Cerrar sesión
export async function cerrarSesionAdmin() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
}