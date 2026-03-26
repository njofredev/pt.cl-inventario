export const API_BASE_URL = 'http://127.0.0.1:8000';
console.log('[API Client] Base URL:', API_BASE_URL);

async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`[API Client] Fetching: ${url}`, { method: options.method || 'GET', hasToken: !!token });

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.warn(`[API Client] HTTP Error: ${response.status}`, url);
      const error = await response.json();
      throw new Error(error.detail || 'Error en la petición');
    }

    return response.json();
  } catch (err) {
    console.error(`[API Client] Critical Error fetching ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Maestros
  getSucursales: () => fetchApi('/maestros/sucursales/'),
  createSucursal: (data: any) => fetchApi('/maestros/sucursales/', { method: 'POST', body: JSON.stringify(data) }),
  updateSucursal: (id: number, data: any) => fetchApi(`/maestros/sucursales/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getBodegas: () => fetchApi('/maestros/bodegas/'),
  createBodega: (data: any) => fetchApi('/maestros/bodegas/', { method: 'POST', body: JSON.stringify(data) }),
  updateBodega: (id: number, data: any) => fetchApi(`/maestros/bodegas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getUbicaciones: () => fetchApi('/maestros/ubicaciones/'),
  createUbicacion: (data: any) => fetchApi('/maestros/ubicaciones/', { method: 'POST', body: JSON.stringify(data) }),
  updateUbicacion: (id: number, data: any) => fetchApi(`/maestros/ubicaciones/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getProveedores: () => fetchApi('/maestros/proveedores/'),
  createProveedor: (data: any) => fetchApi('/maestros/proveedores/', { method: 'POST', body: JSON.stringify(data) }),
  updateProveedor: (id: number, data: any) => fetchApi(`/maestros/proveedores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getCuentas: () => fetchApi('/maestros/cuentas_contables/'),
  createCuenta: (data: any) => fetchApi('/maestros/cuentas_contables/', { method: 'POST', body: JSON.stringify(data) }),
  updateCuenta: (id: number, data: any) => fetchApi(`/maestros/cuentas_contables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getCentrosCosto: () => fetchApi('/maestros/centros_costos/'),
  createCentroCosto: (data: any) => fetchApi('/maestros/centros_costos/', { method: 'POST', body: JSON.stringify(data) }),
  updateCentroCosto: (id: number, data: any) => fetchApi(`/maestros/centros_costos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  getProductos: () => fetchApi('/maestros/productos/'),
  createProducto: (data: any) => fetchApi('/maestros/productos/', { method: 'POST', body: JSON.stringify(data) }),
  updateProducto: (id: number, data: any) => fetchApi(`/maestros/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Movimientos e Inventario
  getMovimientos: () => fetchApi('/movimientos/'),
  getSaldos: () => fetchApi('/movimientos/saldos'),
  createMovimiento: (data: any) => fetchApi('/movimientos/', { method: 'POST', body: JSON.stringify(data) }),
  
  getTiposMovimiento: () => fetchApi('/tipos/'),
  createTipoMovimiento: (data: any) => fetchApi('/tipos/', { method: 'POST', body: JSON.stringify(data) }),
  updateTipoMovimiento: (id: number, data: any) => fetchApi(`/tipos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};
