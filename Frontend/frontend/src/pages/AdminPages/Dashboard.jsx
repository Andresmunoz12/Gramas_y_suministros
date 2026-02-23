import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import '../../styles/Dashboard.css';

const InventarioGrama = () => {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(null);

  // 🔥 Obtener datos de la base de datos al cargar el componente
  useEffect(() => {
    obtenerInventario();
  }, []);

  const obtenerInventario = async () => {
    try {
      const token = localStorage.getItem("token"); // 🔑 Obtener token

      const res = await fetch("http://localhost:3001/api/inventario", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 🔒 Enviar token
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data.message || "Error al cargar el inventario");
        setCargando(false);
        return;
      }

      setProductos(data);
      setCargando(false);
    } catch (error) {
      console.error("Error:", error);
      setMsg("Error al conectar con el servidor");
      setCargando(false);
    }
  };

  const toggleMenu = (event, menuId) => {
    event.stopPropagation();
    setMenuAbierto(menuAbierto === menuId ? null : menuId);
  };

  const cerrarMenus = () => {
    setMenuAbierto(null);
  };

  const masInfo = (id) => {
    navigate(`/mas-info/${id}`);
  };

  const editarProducto = (id) => {
    navigate(`/editar-producto/${id}`);
  };

  const verStock = (id) => {
    navigate(`/stock/${id}`);
  };

  const eliminarProducto = (id) => {
    navigate(`/eliminar-producto/${id}`);
  };

  const handleRegresar = () => {
    navigate(-1);
  };

  const handleAgregar = () => {
    navigate("/agregar-producto");
  };

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    document.addEventListener("click", cerrarMenus);
    return () => {
      document.removeEventListener("click", cerrarMenus);
    };
  }, []);

  // 🔄 Mostrar mensaje de carga
  if (cargando) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p>Cargando inventario...</p>
      </div>
    );
  }

  return (
    <>
      <NavComponent />

      <main>
        {/* Mostrar mensaje de error si existe */}
        {msg && <p style={{ color: "red", textAlign: "center" }}>{msg}</p>}

        <div className="top-section">
          <h2>Inventario de Grama Sintética</h2>
          <button
            className="btn-agregar"
            onClick={() => navigate("/insertarProducto")}
          >
            +
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Producto</th>
              <th>Altura</th>
              <th>Peso</th>
              <th>Stock</th>
              <th>Precio x m2</th>
              <th>Más</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  No hay productos en el inventario
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <tr key={producto.id_producto}>
                  <td>{producto.id_producto}</td>
                  <td>{producto.nombre}</td>
                  <td>{producto.altura || "N/A"}</td>
                  <td>{producto.peso || "N/A"}</td>
                  <td>{producto.stock}</td>
                  <td>${producto.precio}</td>
                  <td>
                    <button
                      className="btn-options"
                      onClick={(e) => toggleMenu(e, `menu${producto.id_producto}`)}
                    >
                      ...
                    </button>
                    <div
                      className={`dropdown-menu ${menuAbierto === `menu${producto.id_producto}` ? "show" : ""
                        }`}
                      id={`menu${producto.id_producto}`}
                    >
                      <button
                        onClick={() => {
                          masInfo(producto.id_producto);
                        }}
                      >
                        Mas Info.
                      </button>

                      <button
                        onClick={() => {
                          editarProducto(producto.id_producto);
                        }}
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => {
                          navigate("/Stock");
                        }}
                      >
                        Stock
                      </button>

                      <button
                        onClick={() => {
                          eliminarProducto(producto.id_producto);
                          navigate("/EliminarProducto")
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="bottom-button">
          <button className="btn-regresar-bottom" onClick={handleRegresar}>
            Regresar
          </button>
        </div>
      </main>
    </>
  );
};

export default InventarioGrama;