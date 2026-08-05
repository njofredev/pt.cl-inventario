import pandas as pd
import json
import os
import re

excel_path = "scratch/InventarioTribunales2026.xlsm"
output_dir = "prisma/data"

os.makedirs(output_dir, exist_ok=True)

def clean_column_name(col):
    # Normalize col name to lowercase, no special characters, simple ascii
    col_str = str(col).lower()
    col_str = col_str.replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u")
    col_str = re.sub(r'[^a-z0-9]', '', col_str)
    return col_str

try:
    xl = pd.ExcelFile(excel_path)
    
    # 1. Parse Proveedores
    df_prov = xl.parse("PROVEEDOR")
    # Clean columns
    orig_cols = df_prov.columns
    df_prov.columns = [clean_column_name(c) for c in df_prov.columns]
    
    # We look for columns like 'rut', 'razonsocial', 'direccion', 'contacto', 'mail', 'telefonos'
    # Find matching columns
    rut_col = 'rut1' if 'rut1' in df_prov.columns else ('rut' if 'rut' in df_prov.columns else None)
    razon_col = [c for c in df_prov.columns if 'razon' in c][0] if [c for c in df_prov.columns if 'razon' in c] else 'razonsocial'
    dir_col = [c for c in df_prov.columns if 'direc' in c][0] if [c for c in df_prov.columns if 'direc' in c] else 'direccion'
    contact_col = 'contacto' if 'contacto' in df_prov.columns else None
    email_col = 'mail' if 'mail' in df_prov.columns else None
    tel_col = [c for c in df_prov.columns if 'telefono' in c or 'fono' in c][0] if [c for c in df_prov.columns if 'telefono' in c or 'fono' in c] else 'telefonos'
    
    df_prov = df_prov.dropna(subset=[razon_col])
    
    proveedores = []
    for idx, row in df_prov.iterrows():
        # Handle rut
        rut_val = str(row[rut_col]).strip() if rut_col and pd.notna(row[rut_col]) else ""
        if not rut_val and 'rut' in df_prov.columns and pd.notna(row['rut']):
            dv_val = str(row['dv']).strip() if 'dv' in df_prov.columns and pd.notna(row['dv']) else ""
            rut_val = f"{int(row['rut'])}-{dv_val}"
            
        proveedores.append({
            "rut": rut_val,
            "razonSocial": str(row[razon_col]).strip(),
            "direccion": str(row[dir_col]).strip() if dir_col in row and pd.notna(row[dir_col]) else "",
            "contacto": str(row[contact_col]).strip() if contact_col and pd.notna(row[contact_col]) else "",
            "email": str(row[email_col]).strip() if email_col and pd.notna(row[email_col]) else "",
            "telefono": str(row[tel_col]).strip() if tel_col in row and pd.notna(row[tel_col]) else ""
        })
    with open(f"{output_dir}/proveedores.json", "w", encoding="utf-8") as f:
        json.dump(proveedores, f, ensure_ascii=False, indent=2)
        
    # 2. Parse Productos & Stock Inicial
    df_prod = xl.parse("PRODUCTOS")
    df_stock = xl.parse("Stok_Inicial")
    
    # Map stock by code
    stock_map = {}
    for _, row in df_stock.iterrows():
        if pd.notna(row["CODIGO"]):
            code = str(row["CODIGO"]).strip()
            stock_map[code] = {
                "stockInicial": int(row["Stock Inicial"]) if pd.notna(row["Stock Inicial"]) else 0,
                "valorNetoUnitario": float(row["Valor Neto Unitario"]) if pd.notna(row["Valor Neto Unitario"]) else 0.0
            }
            
    productos = []
    for _, row in df_prod.iterrows():
        if pd.notna(row["CODIGO"]) and pd.notna(row["PRODUCTOS"]):
            code = str(row["CODIGO"]).strip()
            stock_info = stock_map.get(code, {"stockInicial": 0, "valorNetoUnitario": 0.0})
            productos.append({
                "codigo": code,
                "nombre": str(row["PRODUCTOS"]).strip(),
                "clasificacion": str(row["CLASIFICACION"]).strip() if pd.notna(row["CLASIFICACION"]) else "OTROS",
                "tipo": str(row["TIPO"]).strip() if pd.notna(row["TIPO"]) else "",
                "unidad": str(row["UNIDAD"]).strip() if pd.notna(row["UNIDAD"]) else "UND",
                "stockActual": stock_info["stockInicial"],
                "valorNeto": stock_info["valorNetoUnitario"]
            })
            
    with open(f"{output_dir}/productos.json", "w", encoding="utf-8") as f:
        json.dump(productos, f, ensure_ascii=False, indent=2)
        
    # 3. Parse Lugares / Destinos (from LISTAS)
    df_listas = xl.parse("LISTAS")
    destinos = []
    # Collect Lugares
    if "Lugares" in df_listas.columns:
        for val in df_listas["Lugares"].dropna().unique():
            destinos.append({
                "nombre": str(val).strip(),
                "tipo": "LUGAR"
            })
    # Collect Destinatarios (Personas)
    if "Destinatarios" in df_listas.columns:
        for val in df_listas["Destinatarios"].dropna().unique():
            destinos.append({
                "nombre": str(val).strip(),
                "tipo": "PERSONA"
            })
            
    with open(f"{output_dir}/destinos.json", "w", encoding="utf-8") as f:
        json.dump(destinos, f, ensure_ascii=False, indent=2)

    print("Éxito: JSON generados.")

except Exception as e:
    import traceback
    print(f"Error parsing Excel: {e}")
    traceback.print_exc()
