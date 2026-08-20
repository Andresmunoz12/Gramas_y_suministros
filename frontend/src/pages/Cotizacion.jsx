// src/pages/Cotizacion.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import NavComponent from '../components/GlobalNav';
import Footer from '../components/Footer';
import CotizacionesService from '../api/services/cotizaciones.service';
import '../styles/Cotizacion.css';

export default function Cotizacion() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, removeFromCart, updateQuantity, getSubtotal, clearCart } = useCart();

  const [metodoVenta, setMetodoVenta] = useState('fisico');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [direccion, setDireccion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState(null);

  // ✅ Estado para los datos de la tarjeta (solo para envío)
  const [tarjeta, setTarjeta] = useState({
    numero: '',
    nombre: '',
    expiracion: '',
    cvv: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (cart.length === 0 && !exito) {
      navigate('/');
    }
  }, [isAuthenticated, cart, navigate, exito]);

  // ✅ Cuando cambia el método de venta, ajustar método de pago
  useEffect(() => {
    if (metodoVenta === 'fisico') {
      setMetodoPago('efectivo');
      // Resetear tarjeta
      setTarjeta({ numero: '', nombre: '', expiracion: '', cvv: '' });
    } else {
      setMetodoPago('tarjeta_debito');
    }
  }, [metodoVenta]);

  const subtotal = getSubtotal();
  const costoEnvio = metodoVenta === 'envio' ? 8000 : 0;
  const total = subtotal + costoEnvio;

  // ✅ Validar tarjeta (solo para envío)
  const validarTarjeta = () => {
    if (metodoVenta === 'fisico') return true;

    const numeroLimpio = tarjeta.numero.replace(/\s/g, '');
    if (numeroLimpio.length < 16) {
      setError('Número de tarjeta inválido (mínimo 16 dígitos)');
      return false;
    }
    if (tarjeta.nombre.trim().length < 3) {
      setError('Nombre en la tarjeta es requerido');
      return false;
    }
    if (tarjeta.expiracion.length < 5) {
      setError('Fecha de expiración inválida (MM/AA)');
      return false;
    }
    if (tarjeta.cvv.length < 3) {
      setError('CVV inválido (mínimo 3 dígitos)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    setExito(null);

    if (metodoVenta === 'envio' && !direccion.trim()) {
      setError('Debes ingresar una dirección de envío');
      setCargando(false);
      return;
    }

    // ✅ Validar tarjeta si es envío
    if (metodoVenta === 'envio' && !validarTarjeta()) {
      setCargando(false);
      return;
    }

    // ✅ Validar stock disponible antes de enviar
    for (const item of cart) {
      const stockDisponible = item.stock?.cantidad_actual ?? item.stock_disponible ?? (typeof item.stock === 'number' ? item.stock : undefined);
      if (stockDisponible !== undefined && item.cantidad > stockDisponible) {
        setError(`La cantidad solicitada del producto "${item.nombre}" supera el stock disponible (Máximo: ${stockDisponible})`);
        setCargando(false);
        return;
      }
    }

    try {
      const items = cart.map((item) => ({
        idProducto: item.id_producto,
        cantidad: item.cantidad,
      }));

      // ✅ 1. Crear la cotización (siempre como "pendiente")
      const response = await CotizacionesService.crear({
        metodoVenta,
        metodoPago,
        direccionEnvio: metodoVenta === 'envio' ? direccion : undefined,
        items,
      });

      let mensajeExito = '¡Cotización creada exitosamente!';
      let estadoFinal = 'pendiente';
      let mensajeAdicional = '';

      // ✅ 2. Si es envío, SIMULAR PAGO (cambia estado a "pagado")
      if (metodoVenta === 'envio') {
        // Simular procesamiento de pago con delay para efecto visual
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        await CotizacionesService.simularPago(response.idCotizacion);
        mensajeExito = '✅ ¡Pago procesado exitosamente!';
        estadoFinal = 'pagado';
        mensajeAdicional = 'El pago ha sido procesado correctamente. Recibirás tu pedido en 3-7 días hábiles. Te enviaremos el estado del pedido al correo electrónico.';
      } else {
        mensajeAdicional = 'Lleve este recibo al punto físico de la empresa para completar tu compra.';
      }

      // ✅ 3. Descargar PDF
      await CotizacionesService.descargarPDF(response.idCotizacion);

      // ✅ 4. Limpiar carrito
      clearCart();

      // ✅ 5. Mostrar mensaje de éxito
      setExito({
        message: mensajeExito,
        id: response.idCotizacion,
        total: response.total || total,
        estado: estadoFinal,
        mensaje: mensajeAdicional,
        metodoVenta: metodoVenta,
      });

      setTimeout(() => {
        navigate('/');
      }, 8000);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err.response?.data?.message || err.message || (typeof err === 'string' ? err : 'Error al crear la cotización');
      setError(errorMessage);
    } finally {
      setCargando(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <NavComponent />
      <div className="cotizacion-container">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Seguir comprando
        </button>

        <h1>Resumen de cotización</h1>

        {error && <div className="cotizacion-error">{error}</div>}

        {exito && (
          <div className="cotizacion-exito">
            <h3>{exito.message}</h3>
            <p>Cotización #{exito.id}</p>
            <p>
              <strong>Total:</strong> ${new Intl.NumberFormat('es-CO').format(exito.total)}
            </p>
            <p>
              <strong>Estado:</strong>{' '}
              <span className={exito.estado === 'pagado' ? 'estado-pagado' : 'estado-pendiente'}>
                {exito.estado === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
              </span>
            </p>
            <p style={{ marginTop: '10px' }}>{exito.mensaje}</p>
            <p style={{ fontSize: '14px', color: '#666', marginTop: '12px' }}>
              El PDF se ha descargado automáticamente.
            </p>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Serás redirigido al catálogo en unos segundos...
            </p>
          </div>
        )}

        {!exito && (
          <div className="cotizacion-grid">
            {/* Productos */}
            <div className="cotizacion-productos">
              <h2>Productos</h2>
              {cart.map((item) => {
                const stockDisponible = item.stock?.cantidad_actual ?? item.stock_disponible ?? (typeof item.stock === 'number' ? item.stock : undefined);
                const maxAlcanzado = stockDisponible !== undefined && item.cantidad >= stockDisponible;

                return (
                  <div key={item.id_producto} className="cotizacion-item">
                    <div className="item-info">
                      <h4>{item.nombre}</h4>
                      <p>${new Intl.NumberFormat('es-CO').format(item.precio)}</p>
                      {stockDisponible !== undefined && (
                        <small style={{ color: maxAlcanzado ? '#e65100' : '#2e7d32', fontWeight: '600', display: 'block', marginTop: '2px' }}>
                          Stock disponible: {stockDisponible}
                        </small>
                      )}
                    </div>
                    <div className="item-cantidad">
                      <button onClick={() => updateQuantity(item.id_producto, item.cantidad - 1)}>
                        -
                      </button>
                      <span>{item.cantidad}</span>
                      <button
                        onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}
                        disabled={maxAlcanzado}
                        style={maxAlcanzado ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        title={maxAlcanzado ? `Stock máximo alcanzado (${stockDisponible})` : ''}
                      >
                        +
                      </button>
                    </div>
                    <div className="item-subtotal">
                      ${new Intl.NumberFormat('es-CO').format(item.precio * item.cantidad)}
                    </div>
                    <button className="item-remove" onClick={() => removeFromCart(item.id_producto)}>
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Formulario */}
            <div className="cotizacion-formulario">
              <h2>Datos de la cotización</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Método de venta</label>
                  <select
                    value={metodoVenta}
                    onChange={(e) => setMetodoVenta(e.target.value)}
                    required
                  >
                    <option value="fisico">📍 Punto físico</option>
                    <option value="envio">🚚 Entrega al cliente (aplican costos)</option>
                  </select>
                </div>

                {metodoVenta === 'envio' && (
                  <div className="form-group">
                    <label>Dirección de envío</label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Calle, número, ciudad"
                      required
                    />
                    <small>El costo de envío es de $8,000 COP</small>
                  </div>
                )}

                <div className="form-group">
                  <label>Método de pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    required
                    disabled={metodoVenta === 'envio'} // ✅ Bloquear cambio si es envío
                  >
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta_debito" disabled={metodoVenta === 'fisico'}>
                      💳 Tarjeta débito {metodoVenta === 'fisico' && '(no disponible)'}
                    </option>
                    <option value="tarjeta_credito" disabled={metodoVenta === 'fisico'}>
                      💳 Tarjeta crédito {metodoVenta === 'fisico' && '(no disponible)'}
                    </option>
                  </select>
                  {metodoVenta === 'envio' && (
                    <small style={{ color: '#2e7d32', fontWeight: '600' }}>
                      Para envíos solo se acepta pago con tarjeta
                    </small>
                  )}
                </div>

                {/* ✅ Formulario de tarjeta (solo si es envío) */}
                {metodoVenta === 'envio' && (
                  <div className="tarjeta-container">
                    <h3>💳 Datos de la tarjeta</h3>
                    <p className="tarjeta-subtitle">Ingresa los datos de tu tarjeta para procesar el pago</p>

                    <div className="form-group">
                      <label>Número de tarjeta</label>
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={tarjeta.numero}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const formatted = value.replace(/(.{4})/g, '$1 ').trim();
                          setTarjeta({ ...tarjeta, numero: formatted });
                        }}
                        maxLength="19"
                      />
                    </div>

                    <div className="form-group">
                      <label>Nombre del titular</label>
                      <input
                        type="text"
                        placeholder="Como aparece en la tarjeta"
                        value={tarjeta.nombre}
                        onChange={(e) => setTarjeta({ ...tarjeta, nombre: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="tarjeta-row">
                      <div className="form-group">
                        <label>Fecha expiración</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={tarjeta.expiracion}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 2) {
                              setTarjeta({ ...tarjeta, expiracion: value });
                            } else {
                              setTarjeta({ ...tarjeta, expiracion: `${value.slice(0, 2)}/${value.slice(2, 4)}` });
                            }
                          }}
                          maxLength="5"
                        />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input
                          type="password"
                          placeholder="123"
                          value={tarjeta.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setTarjeta({ ...tarjeta, cvv: value.slice(0, 4) });
                          }}
                          maxLength="4"
                        />
                      </div>
                    </div>

                    <div className="tarjeta-nota">
                      <small>🔒 El pago es 100% seguro. Solo se simulará la transacción.</small>
                    </div>
                  </div>
                )}

                <div className="cotizacion-totales">
                  <div className="total-line">
                    <span>Subtotal:</span>
                    <span>${new Intl.NumberFormat('es-CO').format(subtotal)}</span>
                  </div>
                  {costoEnvio > 0 && (
                    <div className="total-line">
                      <span>Envío:</span>
                      <span>${new Intl.NumberFormat('es-CO').format(costoEnvio)}</span>
                    </div>
                  )}
                  <div className="total-line total-grande">
                    <span>Total:</span>
                    <span>${new Intl.NumberFormat('es-CO').format(total)}</span>
                  </div>
                </div>

                <button type="submit" className="btn-confirmar" disabled={cargando}>
                  {cargando ? (
                    metodoVenta === 'envio' ? 'Procesando pago...' : 'Procesando...'
                  ) : (
                    metodoVenta === 'envio' ? 'Pagar con tarjeta y descargar PDF' : 'Confirmar cotización y descargar PDF'
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}