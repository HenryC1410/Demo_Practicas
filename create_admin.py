from database import Database

def crear_admin():
    db = Database()
    try:
        db.crear_usuario(
            email="admin@practicas.com",
            password="admin123",
            role="admin",
            nombre="Admin",
            apellido="Principal",
            dni="00000000",
            telefono="+51 900 000 000",
            carrera="Administración de Sistemas",
            universidad="Universidad Admin Sistema"
        )
        print("✅ Usuario admin creado exitosamente")
        print("📧 Email: admin@practicas.com")
        print("🔑 Password: admin123")
        print("\n🚀 Ahora ejecuta: streamlit run main.py")
    except Exception as e:
        print(f"⚠️ Error: {e}")
        print("ℹ️ El usuario admin ya puede existir. Intenta iniciar sesión.")

if __name__ == "__main__":
    crear_admin()