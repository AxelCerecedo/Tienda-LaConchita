import os
import re
import csv
import requests
import pandas as pd
import unicodedata
from duckduckgo_search import DDGS
from PIL import Image
from io import BytesIO

# Cargar y limpiar encabezados del archivo CSV
archivo_csv = "productos.csv"
df = pd.read_csv(archivo_csv)
df.columns = df.columns.str.strip()

# Validar existencia de la columna esperada
if "nombre" not in df.columns:
    print("❌ Error: No se encontró la columna 'nombre'.")
    print("Columnas disponibles:", df.columns.tolist())
    exit()

# Crear carpeta de imágenes
carpeta_imagenes = "imagenes"
os.makedirs(carpeta_imagenes, exist_ok=True)

# Función para generar nombres de archivo seguros
def nombre_archivo_seguro(nombre):
    nombre = nombre.lower()
    nombre = unicodedata.normalize('NFD', nombre).encode('ascii', 'ignore').decode("utf-8")
    nombre = re.sub(r'[^a-z0-9]+', '_', nombre)
    return nombre.strip('_') + ".jpg"

# Función para buscar URL de imagen
def buscar_imagen(producto):
    print(f"🔍 Buscando imagen para: {producto}")
    try:
        with DDGS() as ddgs:
            resultados = ddgs.images(producto, max_results=1)
            for r in resultados:
                return r["image"]
    except Exception as e:
        print(f"❌ Error al buscar imagen para {producto}: {e}")
    return None

# Validar si la imagen es válida
def es_imagen_valida(ruta_imagen):
    try:
        with Image.open(ruta_imagen) as img:
            img.verify()
        return True
    except Exception:
        print(f"❌ Archivo inválido: {ruta_imagen}")
        return False

# Descargar imágenes
productos_no_encontrados = []
for _, fila in df.iterrows():
    nombre_producto = str(fila["nombre"]).strip()
    if not nombre_producto or nombre_producto.isdigit():
        continue

    nombre_archivo = nombre_archivo_seguro(nombre_producto)
    ruta_imagen = os.path.join(carpeta_imagenes, nombre_archivo)

    if os.path.exists(ruta_imagen):
        if es_imagen_valida(ruta_imagen):
            print(f"✅ Ya existe: {nombre_archivo}")
            continue
        else:
            os.remove(ruta_imagen)

    url_imagen = buscar_imagen(nombre_producto)
    if url_imagen:
        try:
            resp = requests.get(url_imagen, timeout=10)
            if "image" in resp.headers.get("Content-Type", ""):
                with open(ruta_imagen, "wb") as f:
                    f.write(resp.content)
                if es_imagen_valida(ruta_imagen):
                    print(f"📥 Guardada: {nombre_archivo}")
                else:
                    productos_no_encontrados.append(nombre_producto)
                    os.remove(ruta_imagen)
            else:
                productos_no_encontrados.append(nombre_producto)
        except Exception as e:
            print(f"❌ Error al descargar {nombre_producto}: {e}")
            productos_no_encontrados.append(nombre_producto)
    else:
        productos_no_encontrados.append(nombre_producto)

# Guardar lista de productos sin imagen
if productos_no_encontrados:
    with open("productos_no_encontrados.txt", "w") as f:
        for prod in productos_no_encontrados:
            f.write(prod + "\n")
    print("📝 Productos sin imagen guardados en 'productos_no_encontrados.txt'")
