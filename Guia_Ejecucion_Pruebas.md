# Guía de Ejecución de Pruebas y Reportes

Este documento explica de manera sencilla cómo ejecutar las pruebas automatizadas de este proyecto y dónde visualizar los resultados detallados.

---

## 🚀 Comando para Ejecutar el Proyecto

El proyecto está estructurado con **Maven** y **Serenity BDD** con **Cucumber**. Dado que el archivo de configuración `pom.xml` está dentro de la subcarpeta `Proyecto_Robot`, primero debes ingresar a ella.

El comando recomendado es:

```bash
cd Proyecto_Robot
mvn clean verify
```

### ¿Qué hace exactamente este comando?

1. **`clean`**: Borra el directorio `target/`. Esto limpia compilaciones anteriores, clases antiguas y reportes de ejecuciones pasadas para garantizar una ejecución limpia desde cero.
2. **`verify`**: 
   - Compila el proyecto.
   - Ejecuta las pruebas de integración. Gracias a la configuración del plugin **Maven Failsafe** en el `pom.xml`, buscará y ejecutará de forma automática todas las clases que terminen en `Runner.java` (como `src/test/java/com/login/runners/LoginRunner.java`).
   - Al finalizar las pruebas, ejecuta la fase `post-integration-test` donde el **Serenity Maven Plugin** agrega (`aggregate`) todos los resultados individuales y genera un sitio web interactivo con el reporte final.

---

## 📊 ¿Dónde ver si las pruebas pasaron o no?

Tienes dos formas de verificar el resultado de las pruebas:

### 1. En la Consola (Terminal)
Al terminar la ejecución de `mvn clean verify`, la consola mostrará un resumen indicando:
- Si el build fue exitoso (`BUILD SUCCESS`) o falló (`BUILD FAILURE`).
- El número de pruebas ejecutadas, falladas, con errores o ignoradas.
- Mensajes de error en caso de que alguna aserción haya fallado.

### 2. En el Reporte Interactivo de Serenity BDD 🏆
La forma más completa y visual de analizar los resultados es mediante el reporte HTML autogenerado por Serenity.

* **Ruta del Reporte:** 
  ```text
  target/site/serenity/index.html
  ```

> [!TIP]
> Para abrir el reporte, puedes buscar la carpeta `target/site/serenity/` en tu gestor de archivos, hacer clic derecho sobre el archivo `index.html` y seleccionarlo para abrir con tu navegador web (Chrome, Firefox, Edge, etc.).

#### ¿Qué encontrarás en este reporte?
* **Dashboard Visual:** Gráficas de torta que indican el porcentaje de escenarios exitosos, fallidos, comprometidos o con errores.
* **Detalle por Escenario:** Puedes dar clic en cada feature (`login.feature`) y ver el paso a paso de lo que se ejecutó.
* **Capturas de Pantalla (Screenshots):** Dado que en `serenity.conf` está habilitado `take.screenshots = FOR_EACH_ACTION`, verás una foto del navegador por cada acción realizada (clic, escribir texto, navegación), lo cual es ideal para auditar la ejecución.
* **Trazas de Error Detalladas:** Si un paso falla, el reporte te mostrará exactamente qué línea de código falló y el motivo (ej. un elemento no encontrado o una aserción fallida).
