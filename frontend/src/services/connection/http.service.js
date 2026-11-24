import Axios from 'axios'

const API_ORIGIN =
  process.env.NODE_ENV === 'production'
    ? ''
    : process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL.replace(/\/+$/, '')
      : ''
const BASE_URL = API_ORIGIN
  ? `${API_ORIGIN}/api/`
  : process.env.NODE_ENV === 'production'
    ? '/api/'
    : '//localhost:3030/api/'

var axios = Axios.create({
  withCredentials: true,
})

export const httpService = {
  get(endpoint, data) {
    return ajax(endpoint, 'GET', data)
  },
  post(endpoint, data) {
    return ajax(endpoint, 'POST', data)
  },
  put(endpoint, data) {
    return ajax(endpoint, 'PUT', data)
  },
  delete(endpoint, data) {
    return ajax(endpoint, 'DELETE', data)
  },
}

async function ajax(endpoint, method = 'GET', data = null) {
  try {
    const cleanEndpoint = endpoint.replace(/^\/+/, '').replace(/\/+$/, '')
    const res = await axios({
      url: `${BASE_URL}${cleanEndpoint}`,
      method,
      data,
      params: method === 'GET' ? data : null,
    })
    return res.data
  } catch (err) {
    console.error(
      `Request failed: ${method} ${endpoint} (${err.response?.status || 'network error'})`
    )
    if (
      err.response?.status === 401 &&
      !endpoint.startsWith('auth/login') &&
      !endpoint.startsWith('auth/signup')
    ) {
      sessionStorage.clear()
      window.location.assign('/login')
    }
    throw err
  }
}
