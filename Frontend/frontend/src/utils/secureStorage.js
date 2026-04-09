import CryptoJS from 'crypto-js';

// Clave secreta para encriptar los datos del storage.
// Idealmente esto debería venir de una variable de entorno, ej: import.meta.env.VITE_STORAGE_SECRET
const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET || 'gRam4s_&_Sum1n1str0s_S3cr3t_K3y_2026';

export const secureStorage = {
    /**
     * Guarda un valor en el localStorage después de encriptarlo.
     * @param {string} key Nombre de la llave
     * @param {any} value Valor a guardar
     */
    setItem: (key, value) => {
        try {
            const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
            const encryptedValue = CryptoJS.AES.encrypt(stringValue, SECRET_KEY).toString();
            localStorage.setItem(key, encryptedValue);
        } catch (error) {
            console.error(`Error guardando en secureStorage [${key}]:`, error);
        }
    },

    /**
     * Obtiene y desencripta un valor del localStorage.
     * Si no puede desencriptarlo (por ej. si había un valor viejo en texto plano), intenta recuperarlo normal.
     * @param {string} key Nombre de la llave
     * @returns {string|null} El valor desencriptado o nulo si no existe
     */
    getItem: (key) => {
        try {
            const storedValue = localStorage.getItem(key);
            if (!storedValue) return null;

            // Intentar desencriptar
            const bytes = CryptoJS.AES.decrypt(storedValue, SECRET_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

            // Si desencriptó con éxito, retornar ese valor
            if (decryptedString) {
                return decryptedString;
            }

            // Fallback: Si el valor no estaba encriptado (ej. sesión vieja activa), devolver en plano
            return storedValue;
        } catch (error) {
            // Si hay error en desencriptar (ej: el valor era plano originalmente o clave mala), retornar el original
            return localStorage.getItem(key);
        }
    },

    /**
     * Elimina un valor del localStorage
     * @param {string} key Nombre de la llave
     */
    removeItem: (key) => {
        localStorage.removeItem(key);
    },

    /**
     * Limpia todo el localStorage
     */
    clear: () => {
        localStorage.clear();
    }
};
