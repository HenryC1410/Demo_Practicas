from database import Database
import bcrypt

def crear_admin_directo():
    """Crea usuario admin con hash generado localmente"""
    
    # Datos del admin
    ADMIN_EMAIL = "admin@practicas.com"
    ADMIN_PASS = "admin123"
    
    db = Database()
    
    # 1. Borrar admin si existe
    print("🔍 Verificando si admin existe...")
    resultado = db.obtener_usuario_por_email(ADMIN_EMAIL)
    
    if resultado.data:
        print(" Admin ya existe. Eliminando...")
        db.sb.table("users").delete().eq("email", ADMIN_EMAIL).execute()
        print(" Admin anterior eliminado")
    
    # 2. Generar hash con bcrypt
    print("🔐 Generando hash de contraseña...")
    hashed = bcrypt.hashpw(ADMIN_PASS.encode(), bcrypt.gensalt()).decode()
    print(f" Hash generado: {hashed[:50]}...")
    
    # 3. Insertar admin directamente
    print("➕ Creando nuevo admin...")
    datos = {
        "email": ADMIN_EMAIL,
        "password_hash": hashed,
        "role": "admin",
        "nombre": "Admin",
        "apellido": "Principal",
        "dni": "00000000",
        "telefono": "+51 900 000 000",
        "carrera": "Administración de Sistemas",
        "universidad": "Universidad Admin Sistema"
    }
    
    try:
        db.sb.table("users").insert(datos).execute()
        print("\n" + "="*50)
        print("🎉 ¡ADMIN CREADO EXITOSAMENTE!")
        print("="*50)
        print(f"📧 Email: {ADMIN_EMAIL}")
        print(f"🔑 Contraseña: {ADMIN_PASS}")
        print("\n Ahora ejecuta: streamlit run main.py")
        print("\nSi aún no funciona, prueba la Alternativa 2 abajo")
        
    except Exception as e:
        print(f" Error: {e}")

if __name__ == "__main__":
    crear_admin_directo()