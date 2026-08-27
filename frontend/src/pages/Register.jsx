import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UsuariosService from "../api/services/usuarios.service";
import "../styles/LoginAndRegister.css";
import GlobalButton from "../components/GlobalButton";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password_hash: "",
    id_rol: 2,
  });

  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState({
    texto: "",
    tipo: "",
  });


  /* ==========================================================
     MANEJAR CAMBIOS
     ========================================================== */

  const handleChange = (e) => {
    const { name, value } = e.target;

    const fieldName =
      name === "password"
        ? "password_hash"
        : name;

    setForm({
      ...form,
      [fieldName]: value,
    });

    if (msg.texto) {
      setMsg({
        texto: "",
        tipo: "",
      });
    }
  };


  /* ==========================================================
     REGISTRO
     ========================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    setMsg({
      texto: "",
      tipo: "",
    });


    /* --------------------------------------------------------
       VALIDACIÓN DE CONTRASEÑA
       -------------------------------------------------------- */

    if (form.password_hash.length < 8) {

      setMsg({
        texto:
          "La contraseña debe tener al menos 8 caracteres.",
        tipo: "error",
      });

      setLoading(false);

      return;
    }


    try {

      /* ------------------------------------------------------
         DATOS PARA EL BACKEND
         ------------------------------------------------------ */

      const datosEnvio = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password_hash: form.password_hash,
        id_rol: form.id_rol,
      };


      console.log(
        "📤 Datos enviados:",
        {
          ...datosEnvio,
          password_hash: "********",
        }
      );


      /* ------------------------------------------------------
         CREAR USUARIO
         ------------------------------------------------------ */

      const response =
        await UsuariosService.create(
          datosEnvio
        );


      console.log(
        "✅ Registro exitoso:",
        response
      );


      setMsg({
        texto:
          response.mensaje ||
          "Registro exitoso. Ahora inicia sesión.",
        tipo: "success",
      });


      /* ------------------------------------------------------
         LIMPIAR FORMULARIO
         ------------------------------------------------------ */

      setForm({
        nombre: "",
        apellido: "",
        email: "",
        password_hash: "",
        id_rol: 2,
      });


      /* ------------------------------------------------------
         REDIRECCIÓN
         ------------------------------------------------------ */

      setTimeout(() => {
        navigate("/login");
      }, 2000);


    } catch (error) {

      console.error(
        "❌ Error en registro:",
        error
      );


      let errorMsg =
        "Error al registrarse";


      if (
        error.response?.data?.message
      ) {

        if (
          Array.isArray(
            error.response.data.message
          )
        ) {

          errorMsg =
            error.response.data.message.join(
              ", "
            );

        } else {

          errorMsg =
            error.response.data.message;

        }

      } else if (error.message) {

        errorMsg = error.message;

      }


      setMsg({
        texto: errorMsg,
        tipo: "error",
      });


    } finally {

      setLoading(false);

    }
  };


  return (

    <div className="auth-page">

      {/* =====================================================
          PANEL IZQUIERDO
          ===================================================== */}

      <section className="auth-showcase">

        {/* BRAND */}

        <div className="auth-brand">

          <div className="auth-brand-icon">
            🌱
          </div>

          <div className="auth-brand-text">

            <span className="auth-brand-name">
              Gramas y Suministros
            </span>

            <span className="auth-brand-subtitle">
              Calidad para cada espacio
            </span>

          </div>

        </div>


        {/* CONTENIDO */}

        <div className="auth-showcase-content">

          <h2>
            Crea tu cuenta
            <br />
            y empieza a <span>explorar.</span>
          </h2>

          <p>
            Regístrate en Gramas y Suministros
            y descubre una forma sencilla de
            encontrar productos para tus proyectos.
          </p>


          {/* BENEFICIOS */}

          <div className="auth-benefits">

            <span className="auth-benefit">
              🌿 Amplio catálogo
            </span>

            <span className="auth-benefit">
              📦 Productos disponibles
            </span>

            <span className="auth-benefit">
              ⚡ Atención rápida
            </span>

          </div>

          <button
            type="button"
            className="showcase-explore-button"
            onClick={() => navigate("/")}
          >
            <span>🌿</span>

            <span>
              Explorar catálogo
            </span>

            <strong>→</strong>
          </button>

        </div>


        {/* FOOTER */}

        <div className="auth-showcase-footer">

          <span>
            © 2026 Gramas y Suministros
          </span>

          <span>•</span>

          <span>
            Tu espacio, nuestra calidad
          </span>

        </div>

      </section>


      {/* =====================================================
          FORMULARIO
          ===================================================== */}

      <main className="auth-container">

        <form
          onSubmit={handleSubmit}
          className="auth-card"
        >

          {/* TITULO */}

          <h1 className="auth-title">
            Crear cuenta 🌱
          </h1>

          <p className="auth-subtitle">
            Completa tus datos para crear tu cuenta
            y comenzar a utilizar la plataforma.
          </p>


          {/* =================================================
              MENSAJE
              ================================================= */}

          {msg.texto && (

            <div
              className={`auth-message ${msg.tipo}`}
            >
              {msg.texto}
            </div>

          )}


          {/* =================================================
              NOMBRE
              ================================================= */}

          <label className="auth-label">
            Nombre
            <span>(Obligatorio)</span>
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/user.webp"
              alt="Usuario"
            />

            <input
              className="input-field"
              type="text"
              name="nombre"
              placeholder="Ingresa tu nombre"
              value={form.nombre}
              onChange={handleChange}
              disabled={loading}
              autoComplete="given-name"
              required
            />

          </div>


          {/* =================================================
              APELLIDO
              ================================================= */}

          <label className="auth-label">
            Apellido
            <span>(Obligatorio)</span>
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/apellido.png"
              alt="Apellido"
            />

            <input
              className="input-field"
              type="text"
              name="apellido"
              placeholder="Ingresa tu apellido"
              value={form.apellido}
              onChange={handleChange}
              disabled={loading}
              autoComplete="family-name"
              required
            />

          </div>


          {/* =================================================
              EMAIL
              ================================================= */}

          <label className="auth-label">
            Correo electrónico
            <span>(Obligatorio)</span>
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/email.png"
              alt="Correo electrónico"
            />

            <input
              className="input-field"
              type="email"
              name="email"
              placeholder="ejemplo@correo.com"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              autoComplete="email"
              required
            />

          </div>


          {/* =================================================
              CONTRASEÑA
              ================================================= */}

          <label className="auth-label">
            Contraseña
            <span>(Mínimo 8 caracteres)</span>
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/contraseña.png"
              alt="Contraseña"
            />

            <input
              className="input-field"
              type="password"
              name="password"
              placeholder="Crea una contraseña segura"
              value={form.password_hash}
              onChange={handleChange}
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
              required
            />

          </div>


          {/* =================================================
              BOTÓN
              ================================================= */}

          <GlobalButton
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: "10px",
              opacity: loading ? 0.7 : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "Creando cuenta..."
              : "Crear mi cuenta"}
          </GlobalButton>


          {/* =================================================
              LOGIN
              ================================================= */}

          <p
            className="auth-link"
            onClick={() =>
              !loading &&
              navigate("/login")
            }
          >
            ¿Ya tienes una cuenta?
            {" "}
            Inicia sesión aquí
          </p>

        </form>

      </main>

    </div>
  );
}