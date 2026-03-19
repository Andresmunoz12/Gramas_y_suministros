import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthGuard } from "./components/AuthGuard";

// CLIENTS PAGES
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Catalogo from "./pages/Catalogo.jsx"
import Perfil from "./pages/Perfil.jsx"
import Logout from "./pages/Logout.jsx"
import Nosotros from "./pages/Nosotros.jsx"
import ForgotPassword from "./pages/forgot-password.jsx";
import VerifyCode from "./pages/verify-code.jsx";
import ResetPassword from "./pages/reset-password.jsx";
import MisPedidos from "./pages/MisPedidos.jsx";
import EditarPerfil from "./pages/EditarPerfil.jsx";
import MisCotizaciones from "./pages/MisCotizaciones.jsx";

// ADMIN PAGES
import Stock from "./pages/AdminPages/Stock.jsx"
import InsertarProducto from "./pages/AdminPages/ProductInsert.jsx";
import EditarProducto from "./pages/AdminPages/EditProduct.jsx";
import EntradasProductos from "./pages/AdminPages/HistoryInsert.jsx";
import EliminarProducto from "./pages/AdminPages/Remove-Product.jsx";
import Usuarios from "./pages/AdminPages/PRUEBAusuarios.jsx";
import Reportes from "./pages/AdminPages/PRUEBAreportes.jsx"
import Panel from "./pages/AdminPages/Panel.jsx"

// 👇 Componente separado que usa hooks de router y auth
function AppRoutesContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Efecto para proteger contra navegación hacia atrás
  useEffect(() => {
    const handlePopState = () => {
      if (!isAuthenticated() && !location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAuthenticated, location]);

  return (
    <Routes>
      {/* RUTAS PÚBLICAS */}
      <Route path="/" element={<Catalogo />} />
      <Route path="/login" element={<Login />} />
      <Route path="/nosotros" element={<Nosotros />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-code" element={<VerifyCode />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* RUTAS PROTEGIDAS DE CLIENTE */}
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editar-perfil"
        element={
          <ProtectedRoute>
            <EditarPerfil />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-pedidos"
        element={
          <ProtectedRoute>
            <MisPedidos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mis-cotizaciones"
        element={
          <ProtectedRoute>
            <MisCotizaciones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logout"
        element={
          <ProtectedRoute>
            <Logout />
          </ProtectedRoute>
        }
      />

      {/* RUTAS PROTEGIDAS DE ADMINISTRADOR (rol = 1) */}
      <Route
        path="/panel"
        element={
          <ProtectedRoute requiredRole={1}>
            <AuthGuard>
              <Panel />
            </AuthGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute requiredRole={1}>
            <Stock />
          </ProtectedRoute>
        }
      />
      <Route
        path="/insertarProducto"
        element={
          <ProtectedRoute requiredRole={1}>
            <InsertarProducto />
          </ProtectedRoute>
        }
      />
      <Route
        path="/editar-producto/:id"
        element={
          <ProtectedRoute requiredRole={1}>
            <EditarProducto />
          </ProtectedRoute>
        }
      />
      <Route
        path="/eliminarProducto"
        element={
          <ProtectedRoute requiredRole={1}>
            <EliminarProducto />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entradasProductos"
        element={
          <ProtectedRoute requiredRole={1}>
            <EntradasProductos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute requiredRole={1}>
            <Usuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reportes"
        element={
          <ProtectedRoute requiredRole={1}>
            <Reportes />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// 👇 Componente principal que envuelve todo con AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppRoutesContent />
    </AuthProvider>
  );
}

export default App;