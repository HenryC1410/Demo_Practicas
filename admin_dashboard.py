import streamlit as st
from database import Database
import pandas as pd
import time

def admin_dashboard():
    """Panel de administrador"""
    st.markdown("### 👑 Panel Administrador")
    
    if 'user' not in st.session_state or st.session_state['user']['role'] != 'admin':
        st.error("❌ Acceso denegado")
        return
    
    db = Database()
    user = st.session_state['user']
    
    # Sidebar
    with st.sidebar:
        st.markdown(f"**👑 Admin:** {user['nombre']} {user['apellido']}")
        st.divider()
        
        menu = st.radio("Gestión", 
                       ["📊 Dashboard", "🏢 Gestionar Ofertas", 
                        "📋 Revisar Postulaciones", "👥 Usuarios"])
    
    if menu == "📊 Dashboard":
        dashboard_admin(db)
    elif menu == "🏢 Gestionar Ofertas":
        gestionar_ofertas(db)
    elif menu == "📋 Revisar Postulaciones":
        revisar_postulaciones(db)
    else:
        gestionar_usuarios(db)

def dashboard_admin(db):
    """Dashboard principal con estadísticas"""
    st.markdown("#### 📊 Dashboard General")
    
    stats = db.get_estadisticas()
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("📌 Ofertas Activas", stats['total_ofertas'])
    with col2:
        st.metric("📬 Postulaciones", stats['total_postulaciones'])
    with col3:
        st.metric("⏳ Pendientes", stats['pendientes'])
    
    st.divider()
    
    # Postulaciones aceptadas recientes
    st.markdown("#### ✅ Postulaciones Aceptadas Recientes")
    try:
        aceptadas = db.sb.table("postulaciones")\
            .select("*, ofertas_practicas(*), users(nombre, apellido, email)")\
            .eq("estado", "aprobado")\
            .order("fecha_postulacion", desc=True)\
            .limit(5)\
            .execute()
        
        if aceptadas.data:
            for post in aceptadas.data:
                with st.expander(f"✅ {post['ofertas_practicas']['titulo']} - {post['users']['nombre']} {post['users']['apellido']}", expanded=False):
                    st.markdown(f"**📧 Email:** {post['users']['email']}")
                    st.markdown(f"**🏢 Empresa:** {post['ofertas_practicas']['empresa']}")
                    st.markdown(f"**📅 Aprobada:** {post.get('fecha_postulacion', 'N/A')}")
        else:
            st.info("No hay postulaciones aceptadas aún")
    except Exception as e:
        st.error(f"Error cargando postulaciones aceptadas: {e}")

def gestionar_ofertas(db):
    """CRUD completo de ofertas"""
    st.markdown("#### 🏢 Gestión de Ofertas de Prácticas")
    
    tab1, tab2, tab3 = st.tabs(["➕ Crear Oferta", "📋 Listar Ofertas", "✏️ Editar/Eliminar"])
    
    with tab1:
        crear_oferta_form(db)
    
    with tab2:
        listar_ofertas_admin(db)
    
    with tab3:
        editar_oferta_form(db)

def crear_oferta_form(db):
    """Formulario para crear oferta"""
    st.markdown("**Nueva Oferta de Práctica**")
    
    with st.form("nueva_oferta", clear_on_submit=True):
        col1, col2 = st.columns(2)
        with col1:
            titulo = st.text_input("Título del puesto *", placeholder="Desarrollador Frontend")
            empresa = st.text_input("Empresa *", placeholder="Tech Solutions SAC")
            area = st.selectbox("Área *", 
                ["Tecnología", "Administración", "Marketing", "Recursos Humanos", 
                 "Finanzas", "Diseño", "Ingeniería", "Otro"])
        
        with col2:
            duracion = st.text_input("Duración *", placeholder="6 meses")
            modalidad = st.selectbox("Modalidad *", ["Presencial", "Remoto", "Híbrido"])
            ubicacion = st.text_input("Ubicación *", placeholder="Lima, Perú")
        
        descripcion = st.text_area("Descripción *", height=150)
        requisitos = st.text_area("Requisitos *", height=150)
        
        if st.form_submit_button("Publicar Oferta", type="primary"):
            if not all([titulo, empresa, area, duracion, modalidad, ubicacion]):
                st.error("❌ Completa todos los campos obligatorios")
                return
            
            datos = {
                "titulo": titulo,
                "empresa": empresa,
                "area": area,
                "duracion": duracion,
                "modalidad": modalidad,
                "ubicacion": ubicacion,
                "descripcion": descripcion,
                "requisitos": requisitos,
                "estado": "activa"
            }
            
            try:
                db.crear_oferta(datos)
                st.success("✅ Oferta creada exitosamente")
                st.balloons()
            except Exception as e:
                st.error(f"❌ Error: {e}")

def listar_ofertas_admin(db):
    """Listar todas las ofertas"""
    ofertas = db.obtener_ofertas()
    
    if not ofertas.data:
        st.info("No hay ofertas registradas")
        return
    
    # Mostrar en tabla interactiva
    if st.checkbox("Ver como tabla"):
        df = pd.DataFrame(ofertas.data)
        st.dataframe(df, use_container_width=True)
    
    # Vista de expansores
    st.markdown("**📋 Vista Detallada:**")
    for oferta in ofertas.data:
        with st.expander(f"🏢 {oferta['titulo']} - {oferta['empresa']} (ID: {oferta['id']})"):
            col1, col2 = st.columns(2)
            with col1:
                st.markdown(f"**Área:** {oferta['area']}")
                st.markdown(f"**Modalidad:** {oferta['modalidad']}")
                st.markdown(f"**Duración:** {oferta['duracion']}")
                st.markdown(f"**Ubicación:** {oferta['ubicacion']}")
                st.markdown(f"**Estado:** `{oferta['estado']}`")
            
            st.markdown("**Descripción:**")
            st.info(oferta['descripcion'])
            st.markdown("**Requisitos:**")
            st.warning(oferta['requisitos'])

def editar_oferta_form(db):
    """Editar o eliminar oferta - IMPLEMENTACIÓN COMPLETA"""
    ofertas = db.obtener_ofertas()
    
    if not ofertas.data:
        st.info("No hay ofertas para editar")
        return
    
    # Crear diccionario para el selectbox
    opciones = {f"{o['titulo']} - {o['empresa']} (ID: {o['id']})": o['id'] for o in ofertas.data}
    
    seleccion = st.selectbox(
        "Selecciona una oferta para editar o eliminar",
        list(opciones.keys())
    )
    
    if seleccion:
        oferta_id = opciones[seleccion]
        oferta_resp = db.obtener_oferta_por_id(oferta_id)
        
        if oferta_resp.data:
            oferta = oferta_resp.data[0]
            
            st.markdown(f"### ✏️ Editando: **{oferta['titulo']}**")
            
            # Formulario completo de edición
            with st.form(key=f"editar_oferta_{oferta_id}"):
                col1, col2 = st.columns(2)
                with col1:
                    titulo = st.text_input("Título del puesto *", value=oferta.get('titulo', ''))
                    empresa = st.text_input("Empresa *", value=oferta.get('empresa', ''))
                    area = st.selectbox("Área *", 
                        ["Tecnología", "Administración", "Marketing", "Recursos Humanos", 
                         "Finanzas", "Diseño", "Ingeniería", "Otro"],
                        index=["Tecnología", "Administración", "Marketing", "Recursos Humanos", 
                               "Finanzas", "Diseño", "Ingeniería", "Otro"].index(oferta.get('area', 'Tecnología'))
                    )
                
                with col2:
                    duracion = st.text_input("Duración *", value=oferta.get('duracion', ''))
                    modalidad = st.selectbox("Modalidad *", 
                        ["Presencial", "Remoto", "Híbrido"],
                        index=["Presencial", "Remoto", "Híbrido"].index(oferta.get('modalidad', 'Presencial'))
                    )
                    ubicacion = st.text_input("Ubicación *", value=oferta.get('ubicacion', ''))
                
                descripcion = st.text_area("Descripción *", value=oferta.get('descripcion', ''), height=150)
                requisitos = st.text_area("Requisitos *", value=oferta.get('requisitos', ''), height=150)
                estado = st.selectbox("Estado", 
                    ["activa", "inactiva", "cerrada"],
                    index=["activa", "inactiva", "cerrada"].index(oferta.get('estado', 'activa'))
                )
                
                col_btn1, col_btn2 = st.columns([1, 3])
                with col_btn1:
                    if st.form_submit_button("💾 Actualizar", type="primary"):
                        datos_actualizados = {
                            "titulo": titulo,
                            "empresa": empresa,
                            "area": area,
                            "duracion": duracion,
                            "modalidad": modalidad,
                            "ubicacion": ubicacion,
                            "descripcion": descripcion,
                            "requisitos": requisitos,
                            "estado": estado
                        }
                        
                        try:
                            db.actualizar_oferta(oferta_id, datos_actualizados)
                            st.success("✅ Oferta actualizada exitosamente")
                            st.balloons()
                            time.sleep(1.5)
                            st.rerun()
                        except Exception as e:
                            st.error(f"❌ Error: {e}")
                
                with col_btn2:
                    if st.form_submit_button("🗑️ Eliminar", type="secondary"):
                        try:
                            db.eliminar_oferta(oferta_id)
                            st.success("🗑️ Oferta eliminada exitosamente")
                            time.sleep(1.5)
                            st.rerun()
                        except Exception as e:
                            st.error(f"❌ Error: {e}")
        else:
            st.error("❌ Oferta no encontrada")

def revisar_postulaciones(db):
    """Revisar y aprobar/rechazar postulaciones"""
    st.markdown("#### 📋 Revisión de Postulaciones")
    
    postulaciones = db.obtener_postulaciones_admin()
    
    if not postulaciones.data:
        st.info("📭 No hay postulaciones pendientes para revisar")
        return
    
    # Mostrar contadores
    total = len(postulaciones.data)
    st.markdown(f"**Postulaciones pendientes:** `{total}`")
    
    for post in postulaciones.data:
        with st.container():
            estudiante = post['users']
            oferta = post['ofertas_practicas']
            
            st.markdown(f"### 📄 **{oferta['titulo']}**")
            st.markdown(f"**👤 Estudiante:** {estudiante['nombre']} {estudiante['apellido']} | 📧 {estudiante['email']}")
            st.markdown(f"**🏢 Empresa:** {oferta['empresa']} | 📍 {oferta['ubicacion']}")
            
            if post.get('notas'):
                st.markdown(f"**📝 Notas:** {post['notas']}")
            
            st.markdown(f"**📅 Postulado:** {post.get('fecha_postulacion', 'N/A')[:10]}")
            
            botones_col1, botones_col2 = st.columns(2)
            with botones_col1:
                if st.button("✅ Aprobar", key=f"apr_{post['id']}", type="primary"):
                    db.actualizar_estado_postulacion(post['id'], 'aprobado')
                    st.success(f"✅ Postulación aprobada para {estudiante['nombre']}")
                    time.sleep(0.5)
                    st.rerun()
            
            with botones_col2:
                if st.button("❌ Rechazar", key=f"rec_{post['id']}", type="secondary"):
                    db.actualizar_estado_postulacion(post['id'], 'rechazado')
                    st.error(f"❌ Postulación rechazada para {estudiante['nombre']}")
                    time.sleep(0.5)
                    st.rerun()
            
            st.divider()

def gestionar_usuarios(db):
    """Gestión básica de usuarios"""
    st.markdown("#### 👥 Gestión de Usuarios")
    st.info("💡 En un sistema completo, aquí se gestionarían usuarios")
    
    if st.checkbox("Mostrar todos los usuarios"):
        users = db.sb.table("users").select("id, nombre, apellido, email, role, created_at").execute()
        if users.data:
            df = pd.DataFrame(users.data)
            st.dataframe(df, use_container_width=True)
            
            # Distribución por rol
            st.markdown("**📊 Distribución por rol:**")
            col_roles = st.columns(len(df['role'].unique()))
            for i, rol in enumerate(df['role'].unique()):
                with col_roles[i]:
                    st.metric(rol, len(df[df['role'] == rol]))