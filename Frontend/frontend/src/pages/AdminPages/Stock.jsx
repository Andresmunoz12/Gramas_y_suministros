import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Stock.css";
import NavComponent from "../../components/GlobalNav";

const StockGrama = () => {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(true);

  // 🔥 Obtener datos de la base de datos al cargar el componente
  useEffect(() => {
    obtenerStock();
  }, []);

  const obtenerStock = async () => {
    try {
      const token = localStorage.getItem("token"); // 🔑 Obtener token

      const res = await fetch("http://localhost:3001/api/stock", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔒 Enviar token
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Error al cargar el stock");
        setCargando(false);
        return;
      }

      // 🎯 Procesar los datos y agregar el estado según el stock
      const productosConEstado = data.map((producto) => {
        let estado = "Activo";
        let claseEstado = "estado-activo";

        // Determinar el estado basado en cantidad_actual y nivel_minimo
        if (producto.cantidad_actual === 0) {
          estado = "Inactivo";
          claseEstado = "estado-inactivo";
        } else if (producto.cantidad_actual <= producto.nivel_minimo) {
          estado = "Alerta";
          claseEstado = "estado-alerta";
        }

        return {
          ...producto,
          estado,
          claseEstado,
        };
      });

      setProductos(productosConEstado);
      setCargando(false);
    } catch (error) {
      console.error("Error:", error);
      setMsg("Error al conectar con el servidor");
      setCargando(false);
    }
  };

  const handleVerHistorial = (id) => {
    console.log(`Ver historial del producto ${id}`);
    // Guardar el ID del producto para usarlo en la vista de historial
    localStorage.setItem("producto_seleccionado", id);
    navigate("/entradasProductos");
  };

  const handleRegresar = () => {
    navigate("/inventario-grama");
  };

  // 🔄 Mostrar mensaje de carga
  if (cargando) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Cargando stock...</p>
      </div>
    );
  }

return (
  <>
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>Dashboard</h2>

        <nav>
          <button onClick={() => navigate("/panel")}>Inventario</button>
          <button onClick={() => navigate("/usuarios")}>Usuarios</button>
          <button onClick={() => navigate("/stock")}>Stock</button>
          <button onClick={() => navigate("/reportes")}>Reportes</button>
          <button onClick={() => navigate("/")}>Catalogo</button>
        </nav>
      </aside>

      {/* MAIN */}
      <div className="main-area">

        <section className="table-section">
          <div className="table-card">

            <div className="table-header">
              <h3>Stock de Productos</h3>
              <div className="table-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/entradasProductos")}
                >
                  Nueva Entrada
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Stock</th>
                    <th>Nivel Mínimo</th>
                    <th>Estado</th>
                    <th>Última Actualización</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {productos.length === 0 ? (
                    <tr>
                      <td colSpan="7">No hay productos en stock</td>
                    </tr>
                  ) : (
                    productos.map((producto) => (
                      <tr key={producto.id_producto}>
                        <td>{producto.id_producto}</td>
                        <td>{producto.nombre}</td>
                        <td>{producto.cantidad_actual}</td>
                        <td>{producto.nivel_minimo}</td>

                        <td>
                          <span className={`status ${producto.claseEstado}`}>
                            {producto.estado}
                          </span>
                        </td>

                        <td>
                          {new Date(
                            producto.ultima_actualizacion
                          ).toLocaleDateString()}
                        </td>

                        <td>
                          <button
                            className="btn-extra"
                            onClick={() =>
                              handleVerHistorial(producto.id_producto)
                            }
                          >
                            Ver Historial
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </section>

      </div>
    </div>
  </>
);

};

export default StockGrama;