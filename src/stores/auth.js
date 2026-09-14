import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { isTokenExpired } from '../utils/jwt'

// Store de autenticación.
// Centraliza el token y los datos del usuario para que ningún componente
// tenga que leer localStorage por su cuenta.
export const useAuthStore = defineStore('auth', () => {
  // --- Estado ---
  // Inicializamos desde localStorage para que la sesión sobreviva a un refresh:
  // el estado de Pinia vive en memoria y se pierde al recargar la página.
  const token = ref(localStorage.getItem('token'))
  const user = ref(null)

  // --- Getters ---
  // Tener token no basta: también tiene que seguir vigente.
  const isAuthenticated = computed(
    () => Boolean(token.value) && !isTokenExpired(token.value)
  )

  // --- Acciones ---

  // Guarda el token en el estado y en localStorage a la vez,
  // para que las dos fuentes nunca queden desincronizadas.
  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  // TODO: ajustar el endpoint y los nombres de campo a los de tu backend.
  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    setToken(data.token)
    user.value = data.user ?? null
    return data
  }

  function logout() {
    setToken(null)
    user.value = null
  }

  // Recupera el perfil del usuario con el token actual.
  // Útil tras un refresh: hay token pero `user` está vacío.
  async function fetchUser() {
    const { data } = await api.get('/auth/me')
    user.value = data
    return data
  }

  // Al arrancar la app: si quedó un token vencido de una sesión anterior,
  // lo limpiamos aquí en vez de esperar a que el backend lo rechace.
  if (token.value && isTokenExpired(token.value)) {
    logout()
  }

  return { token, user, isAuthenticated, setToken, login, logout, fetchUser }
})
