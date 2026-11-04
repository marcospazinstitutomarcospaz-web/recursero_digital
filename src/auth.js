// ============================================================================
// GESTIÓN DE AUTENTICACIÓN Y ROLES (SRC/AUTH.JS)
// ============================================================================

import { db } from './supabase.js';

// Obtiene la sesión del usuario actual
export async function obtenerSesionActual() {
    const { data: { session }, error } = await db.auth.getSession();
    if (error || !session) return null;
    return session;
}

// Verifica si el usuario actual es específicamente Administrador
export async function verificarEsAdmin() {
    const session = await obtenerSesionActual();
    if (!session || !session.user) return false;

    // Comprueba el rol en app_metadata o user_metadata
    const rol = session.user.app_metadata?.role || session.user.user_metadata?.role;
    return rol === 'admin';
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