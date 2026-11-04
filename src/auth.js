// ============================================================================
// GESTIÓN DE AUTENTICACIÓN Y ROLES (SRC/AUTH.JS)
// ============================================================================

import { db } from './supabase.js';

// Verificar si el usuario actual es administrador (sin importar su email, basándose en su sesión/rol)
export async function verificarEsAdmin() {
    const { data: { session } } = await db.auth.getSession();
    
    if (!session || !session.user) return false;

    // Opción flexible: Puedes verificar si tiene un rol específico en los metadatos
    // o simplemente permitir el acceso a cualquier usuario autenticado que elijas.
    const rol = session.user.app_metadata?.role || session.user.user_metadata?.role;
    
    // Si prefieres que cualquier usuario logueado en este panel sea considerado admin, 
    // simplemente retorna true si hay sesión activa:
    return !!session; 
    
    // O si usas metadatos de rol: return rol === 'admin';
}

// Iniciar sesión con cualquier correo y contraseña registrados en Supabase
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