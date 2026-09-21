import psycopg2
import re
from urllib.parse import urlparse

with open('.env', 'r', encoding='utf-8') as f:
    env = f.read()
m = re.search(r'DATABASE_URL=["\']?([^"\'\n]+)', env_content if 'env_content' in locals() else env)
u = urlparse(m.group(1))
conn = psycopg2.connect(dbname=u.path[1:], user=u.username, password=u.password, host=u.hostname, port=u.port or 5432)
cur = conn.cursor()

# Verificar Factura de la foto 14502529
import pandas as pd
cur.execute('SELECT "numeroDocumento", "montoTotal" FROM "DocumentoMovimiento" WHERE "numeroDocumento" = \'14502529\'')
doc = cur.fetchone()
print(f"\n=======================================================")
print(f"Factura 14502529 en BD: Monto Total = ${doc[1]:,.2f}")
cur.execute('SELECT sum(subtotal) FROM "DocumentoMovimientoItem" WHERE "documentoMovimientoId" IN (SELECT id FROM "DocumentoMovimiento" WHERE "numeroDocumento" = \'14502529\')')
sum_i = cur.fetchone()[0]
print(f"Suma de Subtotales de Items en BD = ${sum_i:,.2f}")
print(f"=======================================================\n")




# Chequear todas las facturas en la BD para ver si alguna tiene descuadre
cur.execute('''
    SELECT d."numeroDocumento", d."montoTotal", round(sum(i.subtotal)::numeric, 2) as sum_items
    FROM "DocumentoMovimiento" d
    JOIN "DocumentoMovimientoItem" i ON i."documentoMovimientoId" = d.id
    GROUP BY d.id, d."numeroDocumento", d."montoTotal"
    HAVING abs(d."montoTotal" - sum(i.subtotal)) > 0.01
''')
descuadradas = cur.fetchall()
print(f"\nFacturas con descuadre entre Total e Items: {len(descuadradas)}")
if len(descuadradas) == 0:
    print("[OK] EL 100% DE LAS FACTURAS ESTÁ COMPLETAMENTE CUADRADO AL PESO EXACTO!")
else:
    for d in descuadradas:
        print(f"Factura {d[0]}: Total={d[1]}, Suma={d[2]}")

conn.close()
