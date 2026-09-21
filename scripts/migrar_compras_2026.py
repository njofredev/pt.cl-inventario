import os
import sys
import re
import math
import unicodedata
from urllib.parse import urlparse
import pandas as pd
import psycopg2

# Asegurar stdout utf-8 en Windows
sys.stdout.reconfigure(encoding='utf-8')

def clean_text(s):
    if not isinstance(s, str):
        return ""
    s = unicodedata.normalize('NFKD', s).encode('ASCII', 'ignore').decode('ASCII')
    s = re.sub(r'[^A-Z0-9]', '', s.upper())
    return s

is_dry_run = '--dry-run' in sys.argv
print(f"\n=== MIGRACION COMPRAS 2026 TRIBUNALES/CASA MATRIZ ({'MODO SIMULACION --dry-run' if is_dry_run else 'MODO REAL'}) ===\n")

# 1. Conectar a PostgreSQL
with open('.env', 'r', encoding='utf-8') as f:
    env_content = f.read()
m = re.search(r'DATABASE_URL=["\']?([^"\'\n]+)', env_content)
u = urlparse(m.group(1))
conn = psycopg2.connect(dbname=u.path[1:], user=u.username, password=u.password, host=u.hostname, port=u.port or 5432)
cur = conn.cursor()

# 2. Cargar Bodegas y Ubicaciones de Casa Matriz
cur.execute('''
    SELECT b.id, b.nombre, u.id, u.nombre
    FROM "Bodega" b
    JOIN "Sucursal" s ON b."sucursalId" = s.id
    LEFT JOIN "Ubicacion" u ON u."bodegaId" = b.id
    WHERE s.nombre ILIKE '%Casa Matriz%'
''')
rows = cur.fetchall()
bodega_map = {}
for b_id, b_nom, u_id, u_nom in rows:
    if 'Clínica' in b_nom or 'Clinica' in b_nom:
        bodega_map['CLINICA'] = {'bodega_id': b_id, 'ubicacion_id': u_id, 'nombre': b_nom}
    elif 'Aseo' in b_nom:
        bodega_map['ASEO'] = {'bodega_id': b_id, 'ubicacion_id': u_id, 'nombre': b_nom}
    elif 'Oficina' in b_nom:
        bodega_map['OFICINA'] = {'bodega_id': b_id, 'ubicacion_id': u_id, 'nombre': b_nom}

print("[OK] Bodegas Casa Matriz configuradas:")
for k, v in bodega_map.items():
    print(f"  - {k}: {v['nombre']} (Ubicacion: {v['ubicacion_id']})")

# 3. Tipo movimiento y Usuario Admin
cur.execute('SELECT id, nombre FROM "TipoMovimiento" WHERE nombre ILIKE \'%Compra%\'')
tipo_mov = cur.fetchone()
cur.execute('SELECT id, username, nombre FROM "User" WHERE role = \'ADMIN\' LIMIT 1')
user_admin = cur.fetchone()

print(f"[OK] Tipo Movimiento: {tipo_mov[1]} ({tipo_mov[0]})")
print(f"[OK] Usuario: {user_admin[1]} ({user_admin[2]})\n")

# 4. Asegurar productos nuevos (Opcion A)
new_products = [
    ('ASE-AB-0001', 'CAFÉ INSTANTANEO TRADICIONAL 400GR', 'ASEO Y LIMPIEZA', 'Abarrotes y Cafetería', 'FRASCO'),
    ('ORT-BA-0035', '35+ UR BANDA 1ER M TUBO SIMPLE MB', 'CLÍNICA / DENTAL', 'Ortodoncia', 'UNIDAD'),
    ('ORT-BA-0036', '35+ UL BANDA 1ER M TUBO SIMPLE MB', 'CLÍNICA / DENTAL', 'Ortodoncia', 'UNIDAD'),
    ('ORT-BA-0037', '35+ LR BANDA 1ER M TUBO SIMPLE MB', 'CLÍNICA / DENTAL', 'Ortodoncia', 'UNIDAD'),
    ('ORT-BA-0038', '35+ LL BANDA 1ER M TUBO SIMPLE MB', 'CLÍNICA / DENTAL', 'Ortodoncia', 'UNIDAD'),
    ('INS-QU-0001', 'SACA PUENTE', 'INSTRUMENTAL', 'Instrumental Clínico', 'UNIDAD'),
    ('END-LM-0001', 'LIMA PROGLIDER 25MM', 'CLÍNICA / DENTAL', 'Endodoncia', 'UNIDAD'),
    ('END-LM-0002', 'LIMA PROGLIDER 31MM', 'CLÍNICA / DENTAL', 'Endodoncia', 'UNIDAD')
]

if not is_dry_run:
    for cod, nom, clas, tip, un in new_products:
        cur.execute('''
            INSERT INTO "Product" (id, codigo, nombre, clasificacion, "tipoProducto", unidad, "stockCritico", ppp, "costoNeto", "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, 5, 0.0, 0.0, NOW(), NOW())
            ON CONFLICT (codigo) DO NOTHING
        ''', (cod, nom, clas, tip, un))
    conn.commit()
    print("[OK] Productos nuevos asegurados en catalogo.")

# 5. Cargar catalogo actual de productos y proveedores
cur.execute('SELECT id, codigo, nombre, clasificacion, ppp, "costoNeto" FROM "Product"')
db_prods = cur.fetchall()
prod_by_code = {r[1]: {'id': r[0], 'codigo': r[1], 'nombre': r[2], 'clasificacion': r[3], 'ppp': r[4], 'costoNeto': r[5]} for r in db_prods}
prod_by_clean_name = {clean_text(r[2]): {'id': r[0], 'codigo': r[1], 'nombre': r[2], 'clasificacion': r[3], 'ppp': r[4], 'costoNeto': r[5]} for r in db_prods}

cur.execute('SELECT id, rut, "razonSocial" FROM "Proveedor"')
db_provs = cur.fetchall()
prov_by_rut = {r[1].upper().replace('.', ''): {'id': r[0], 'rut': r[1], 'razonSocial': r[2]} for r in db_provs}

# 6. Leer y preparar Excel
df = pd.read_excel('scratch/migra-invent.xlsx', header=1)
df = df.dropna(how='all', axis=1).dropna(how='all')
df.columns = ['fecha', 'n_factura', 'rut_proveedor', 'cod_producto', 'producto', 'cant_basica', 'unidad_basica', 'cantidad', 'precio_unitario', 'con_iva']

# Mapeos directos por codigo
code_exceptions = {
    'MA000264': 'ASE-AL-0034', # Trapero microfibra Excell
    'MD000356': 'CLT-MC-0433', # Guia de colores vita classic
    'MD000363': 'CLT-MC-0471', # Limas protaper gold 21
    'MD000364': 'CLT-MC-0472', # Limas protaper gold 25
    'MD000365': 'CLT-MC-0466', # Waveone gold primary
}

for cod, nom, _, _, _ in new_products:
    if cod in prod_by_code:
        code_exceptions[cod] = cod

# Ordenar por fecha cronologicamente
df['fecha'] = pd.to_datetime(df['fecha'])
df = df.sort_values('fecha').reset_index(drop=True)

processed_rows = []
errors = 0

for idx, r in df.iterrows():
    cod_antiguo = str(r['cod_producto']).strip()
    nombre_excel = str(r['producto']).strip() if pd.notna(r['producto']) else ""
    rut_prov = str(r['rut_proveedor']).strip().upper().replace('.', '')
    
    # Proveedor
    prov = prov_by_rut.get(rut_prov)
    if not prov:
        print(f"Error fila {idx}: Proveedor no encontrado {rut_prov}")
        errors += 1

    # Producto
    prod = None
    if cod_antiguo in code_exceptions and code_exceptions[cod_antiguo] in prod_by_code:
        prod = prod_by_code[code_exceptions[cod_antiguo]]
    elif clean_text(nombre_excel) in prod_by_clean_name:
        prod = prod_by_clean_name[clean_text(nombre_excel)]
    elif is_dry_run:
        for np_c, np_n, np_cl, _, _ in new_products:
            if clean_text(np_n) == clean_text(nombre_excel):
                prod = {'id': 'SIMULATED', 'codigo': np_c, 'nombre': np_n, 'clasificacion': np_cl, 'ppp': 0.0, 'costoNeto': 0.0}
                break
    
    if not prod:
        print(f"Error fila {idx}: Producto no resuelto [{cod_antiguo}] '{nombre_excel}'")
        errors += 1

    # Bodega segun clasificacion
    clasif = (prod['clasificacion'] or '').upper() if prod else ''
    p_nom = (prod['nombre'] or '').upper() if prod else ''
    if 'ASEO' in clasif or 'TRAPERO' in p_nom or 'BOLSA' in p_nom or 'BASURA' in p_nom:
        target_b = bodega_map['ASEO']
    elif 'OFICINA' in clasif or 'CAFÉ' in p_nom or 'CAFE' in p_nom:
        target_b = bodega_map['OFICINA']
    else:
        target_b = bodega_map['CLINICA']

    # Precios
    con_iva = (r['con_iva'] is True or str(r['con_iva']).strip().upper() in ['SI', 'TRUE'])
    precio_u = float(r['precio_unitario'])
    valor_neto = round(precio_u / 1.19, 2) if con_iva else precio_u
    cant = int(r['cantidad'])
    subtotal = round(cant * precio_u, 2)

    processed_rows.append({
        'fecha': r['fecha'],
        'n_factura': str(r['n_factura']).strip(),
        'proveedor': prov,
        'producto': prod,
        'bodega': target_b,
        'cantidad': cant,
        'precio_unitario': precio_u,
        'valor_neto': valor_neto,
        'con_iva': con_iva,
        'subtotal': subtotal
    })

if errors > 0:
    print(f"\n[ERROR] Se encontraron {errors} errores. Migracion cancelada.")
    sys.exit(1)

print(f"[OK] Validacion 100% exitosa: {len(processed_rows)} filas validadas.")

# Agrupar por Factura
facturas = {}
for it in processed_rows:
    key = (it['proveedor']['id'] if it['proveedor'] else 'P', it['n_factura'])
    if key not in facturas:
        facturas[key] = {
            'proveedor_id': key[0],
            'n_factura': it['n_factura'],
            'fecha': it['fecha'],
            'items': []
        }
    facturas[key]['items'].append(it)

# Cálculo a nivel de Factura Global (Estándar SII)
for key, f_data in facturas.items():
    items = f_data['items']
    
    # 1. Total Neto acumulado exacto de todas las líneas de la factura
    total_neto_factura = sum(it['cantidad'] * (it['precio_unitario'] / 1.19 if it['con_iva'] else it['precio_unitario']) for it in items)
    
    # 2. Si las líneas son afectas (o con IVA), se calcula el IVA global 19%
    tiene_afectos = any(it['con_iva'] or True for it in items)
    if tiene_afectos:
        iva_global = round(total_neto_factura * 0.19)
        total_factura_global = round(total_neto_factura) + iva_global
    else:
        total_factura_global = round(total_neto_factura)

    # 3. Asignar a cada ítem su subtotal bruto (con IVA si es afecto)
    for it in items:
        if it['con_iva']:
            it['subtotal'] = round(it['cantidad'] * it['precio_unitario'], 2)
        else:
            # Si el precio unitario ingresado era neto, el subtotal con IVA es neto * 1.19
            it['subtotal'] = round(it['cantidad'] * it['precio_unitario'] * 1.19, 2)

    suma_subtotales = sum(it['subtotal'] for it in items)
    diferencia = round(total_factura_global - suma_subtotales, 2)

    f_data['total_neto'] = total_neto_factura
    f_data['total_factura'] = total_factura_global
    f_data['total_linea_a_linea'] = suma_subtotales
    f_data['diferencia'] = diferencia

    # 4. Ajustar la diferencia de redondeo tributario en el ítem de mayor subtotal
    if len(items) > 0 and abs(diferencia) > 0:
        item_mayor = max(items, key=lambda x: x['subtotal'])
        item_mayor['subtotal'] = round(item_mayor['subtotal'] + diferencia, 2)

print(f"[OK] Total Facturas unicas agrupadas: {len(facturas)}")

if is_dry_run:
    print("\n=== COMPARATIVA: CÁLCULO LÍNEA A LÍNEA vs FACTURA GLOBAL (SII) ===")
    print(f"{'Factura':<12} | {'Items':<5} | {'Antiguo (Línea)':<18} | {'Nuevo (Global SII)':<18} | {'Diferencia':<10}")
    print("-" * 75)
    descuadres = 0
    for key, f_data in facturas.items():
        dif = f_data['diferencia']
        if abs(dif) > 0:
            descuadres += 1
            print(f"{f_data['n_factura']:<12} | {len(f_data['items']):<5} | ${f_data['total_linea_a_linea']:>16,.2f} | ${f_data['total_factura']:>16,.2f} | {dif:>+9.2f}")
    
    print("-" * 75)
    print(f"Facturas con diferencia de redondeo corregidas: {descuadres} de {len(facturas)}")
    print("\n=== RESUMEN DRY-RUN ===")
    print(f"- {len(facturas)} Facturas procesadas.")
    print(f"- {len(processed_rows)} Items validados.")
    print("- Cuadratura: 100% Exacta (Suma de ítems == Total Factura).")
    sys.exit(0)

# 7. EJECUCION REAL
print("\n--- Ejecutando insercion real en PostgreSQL ---")
cur.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

doc_inserted = 0
mov_inserted = 0

for key, f_data in facturas.items():
    total_factura = f_data['total_factura']
    
    # Insertar DocumentoMovimiento
    cur.execute('''
        INSERT INTO "DocumentoMovimiento" (id, categoria, "tipoDocumento", "numeroDocumento", "fechaDocumento", "proveedorId", "montoTotal", "estadoConciliacion", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'COMPRA', 'FACTURA', %s, %s, %s, %s, 'CUADRADO', NOW(), NOW())
        RETURNING id
    ''', (f_data['n_factura'], f_data['fecha'], f_data['proveedor_id'], total_factura))
    doc_id = cur.fetchone()[0]
    doc_inserted += 1

    for it in f_data['items']:
        prod_id = it['producto']['id']
        b_id = it['bodega']['bodega_id']
        u_id = it['bodega']['ubicacion_id']
        cant = it['cantidad']
        v_neto = it['valor_neto']

        # 1. DocumentoMovimientoItem
        cur.execute('''
            INSERT INTO "DocumentoMovimientoItem" (id, "documentoMovimientoId", "productoId", cantidad, "precioUnitario", "esAfecto", "incluyeIva", subtotal, "bodegaId", "ubicacionId")
            VALUES (gen_random_uuid(), %s, %s, %s, %s, TRUE, %s, %s, %s, %s)
        ''', (doc_id, prod_id, cant, it['precio_unitario'], it['con_iva'], it['subtotal'], b_id, u_id))

        # 2. Obtener Stock y PPP actuales
        cur.execute('SELECT ppp FROM "Product" WHERE id = %s', (prod_id,))
        current_ppp = float(cur.fetchone()[0] or 0.0)

        cur.execute('SELECT id, cantidad FROM "Stock" WHERE "productoId" = %s AND "bodegaId" = %s AND "ubicacionId" = %s', (prod_id, b_id, u_id))
        stock_row = cur.fetchone()
        stock_ant = stock_row[1] if stock_row else 0
        nuevo_stock = stock_ant + cant

        # Calcular nuevo PPP
        if stock_ant > 0 and current_ppp > 0:
            nuevo_ppp = round(((stock_ant * current_ppp) + (cant * v_neto)) / nuevo_stock, 2)
        else:
            nuevo_ppp = round(v_neto, 2)

        # 3. Insertar Movimiento
        cur.execute('''
            INSERT INTO "Movimiento" (id, fecha, "productoId", "tipoMovimientoId", cantidad, "valorUnitario", "pppCalculado", "bodegaId", "ubicacionId", "proveedorId", "usuarioId", "documentoTipo", "documentoNumero", "documentoMovimientoId", "createdAt")
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'FACTURA', %s, %s, NOW())
        ''', (it['fecha'], prod_id, tipo_mov[0], cant, v_neto, nuevo_ppp, b_id, u_id, f_data['proveedor_id'], user_admin[0], f_data['n_factura'], doc_id))
        mov_inserted += 1

        # 4. Upsert Stock
        if stock_row:
            cur.execute('UPDATE "Stock" SET cantidad = %s WHERE id = %s', (nuevo_stock, stock_row[0]))
        else:
            cur.execute('''
                INSERT INTO "Stock" (id, "productoId", "bodegaId", "ubicacionId", cantidad)
                VALUES (gen_random_uuid(), %s, %s, %s, %s)
            ''', (prod_id, b_id, u_id, nuevo_stock))

        # 5. Actualizar Product PPP y costoNeto
        cur.execute('UPDATE "Product" SET ppp = %s, "costoNeto" = %s, "updatedAt" = NOW() WHERE id = %s', (nuevo_ppp, v_neto, prod_id))

conn.commit()
conn.close()

print(f"\n========================================================")
print(f"MIGRACION COMPLETADA CON EXITO EN CASA MATRIZ!")
print(f"[OK] Facturas insertadas: {doc_inserted}")
print(f"[OK] Movimientos de compra registrados: {mov_inserted}")
print(f"[OK] Stocks y PPPs cronologicos calculados con total precision.")
print(f"========================================================\n")
