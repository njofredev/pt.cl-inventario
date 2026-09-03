'use server';

import { prisma } from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';

export interface GlobalSearchResultItem {
  type: 'PRODUCT' | 'PAGE';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  href?: string;
  meta?: {
    stockTotal?: number;
    codigo?: string;
    unidad?: string;
    bodega?: string;
  };
}

export async function globalSearchAction(query: string): Promise<GlobalSearchResultItem[]> {
  const q = query?.trim();
  if (!q || q.length < 2) return [];

  const results: GlobalSearchResultItem[] = [];

  // 1. Static application modules / sections
  const appSections = [
    { title: 'Panel de Control', subtitle: 'Métricas generales, KPIs y resumen de inventario', href: '/', keywords: 'inicio metricas dashboard kpi panel' },
    { title: 'Productos / Stock', subtitle: 'Catálogo de insumos, materiales y fichas técnicas', href: '/productos', keywords: 'productos stock catalogo materiales insumos articulos' },
    { title: 'Recepción / Compras', subtitle: 'Ingreso de facturas y guías comerciales (+ stock)', href: '/movimientos?tab=COMPRAS', keywords: 'compras recepcion facturas guias ingreso entradas' },
    { title: 'Salidas / Consumos', subtitle: 'Egreso de insumos a clínicas, boxes o mermas (- stock)', href: '/movimientos?tab=EGRESO_DIRECTO', keywords: 'salidas consumos despachos egresos mermas entregas' },
    { title: 'Histórico & Bitácora', subtitle: 'Auditoría cronológica de todos los movimientos', href: '/movimientos?tab=HISTORIAL', keywords: 'historico bitacora auditoria movimientos transacciones' },
    { title: 'Guías Pendientes', subtitle: 'Control y conciliación de guías sin facturar', href: '/movimientos?tab=PENDIENTES', keywords: 'guias pendientes conciliacion alertas' },
    { title: 'Solicitudes de Material', subtitle: 'Pedidos de personal clínico y autorizaciones', href: '/solicitudes', keywords: 'solicitudes pedidos requerimientos' },
    { title: 'Bodegas y Ubicaciones', subtitle: 'Configuración de bodegas físicas y estantes', href: '/bodegas', keywords: 'bodegas ubicaciones almacenes estantes' },
    { title: 'Unidades de Medida', subtitle: 'Configuración de UND, CAJA, FRASCO, etc.', href: '/unidades', keywords: 'unidades medida conversion empaque' },
    { title: 'Destinos Clínicos', subtitle: 'Centros de costo, boxes y clínicas receptoras', href: '/destinos', keywords: 'destinos centros costo boxes salas' },
    { title: 'Proveedores', subtitle: 'Directorio de empresas, RUTs y contactos', href: '/proveedores', keywords: 'proveedores empresas rut contactos' },
    { title: 'Gestión de Usuarios', subtitle: 'Administración de usuarios, roles y accesos', href: '/usuarios', keywords: 'usuarios roles cuentas contraseñas permisos' },
  ];

  const qLower = q.toLowerCase();
  for (const s of appSections) {
    if (s.title.toLowerCase().includes(qLower) || s.keywords.includes(qLower)) {
      results.push({
        type: 'PAGE',
        id: `page-${s.href}`,
        title: s.title,
        subtitle: s.subtitle,
        href: s.href,
        badge: 'SECCIÓN',
        badgeColor: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20',
      });
    }
  }

  // 2. Search Products
  try {
    const permissions = await getUserPermissions();
    const stocksWhere = permissions?.isFiltered 
      ? { bodegaId: { in: permissions.bodegasIds } }
      : undefined;

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { nombre: { contains: q, mode: 'insensitive' } },
          { codigo: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 8,
      include: {
        stocks: stocksWhere ? { where: stocksWhere, include: { bodega: true } } : { include: { bodega: true } },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    for (const p of products) {
      const stockTotal = p.stocks.reduce((acc, s) => acc + s.cantidad, 0);
      const bodegasTxt = p.stocks.map(s => `${s.bodega.nombre}: ${s.cantidad}`).join(' | ');

      results.push({
        type: 'PRODUCT',
        id: p.id,
        title: p.nombre,
        subtitle: `Código: ${p.codigo} ${bodegasTxt ? `• (${bodegasTxt})` : '• Sin stock registrado'}`,
        badge: `${stockTotal} ${p.unidad || 'UND'}`,
        badgeColor: stockTotal > (p.stockCritico || 0) 
          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        meta: {
          stockTotal,
          codigo: p.codigo,
          unidad: p.unidad || 'UND',
        },
      });
    }
  } catch (error) {
    console.error('Error in globalSearchAction:', error);
  }

  return results;
}
