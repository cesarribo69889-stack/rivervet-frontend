import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000, // 10 segundos
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de petición: corre antes de que salga cada request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de respuesta: corre al volver cada respuesta.
// El primer callback deja pasar las respuestas correctas sin tocarlas;
// el segundo solo recibe las que fallaron.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status

    // Excepción: un 401 del propio login significa "credenciales incorrectas",
    // no "sesión expirada". Ese error lo debe mostrar el formulario, no
    // disparar una redirección.
    const isLoginRequest = error.config?.url?.includes('/auth/login')

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('token')

      // Import dinámico a propósito: un `import` normal arriba crearía un ciclo
      // router -> stores/auth -> services/api -> router.
      const { default: router } = await import('../router')
      const current = router.currentRoute.value

      if (current.name !== 'login') {
        router.push({ name: 'login', query: { redirect: current.fullPath } })
      }
    }

    // Siempre se relanza: el interceptor centraliza la reacción global,
    // pero quien hizo la llamada sigue necesitando enterarse del fallo.
    return Promise.reject(error)
  }
)

export default api
