package com.login.stepdefinitions;

import com.login.tasks.*;
import com.login.questions.*; // Importamos todas las questions (ValidarLogin y ConfirmacionCompra)
import io.cucumber.java.Before;
import io.cucumber.java.es.*;
import net.serenitybdd.screenplay.actors.OnStage;
import net.serenitybdd.screenplay.actors.OnlineCast;

import static net.serenitybdd.screenplay.GivenWhenThen.seeThat;
import static org.hamcrest.Matchers.equalTo;

public class LoginStepDefinitions {

    @Before
    public void prepararEscenario() {
        OnStage.setTheStage(new OnlineCast());
    }

    @Dado("el usuario abre la pagina")
    public void abrirPagina() {
        OnStage.theActorCalled("Robot").wasAbleTo(AbrirPagina.deSauceDemo());
    }

    @Cuando("ingresa usuario {string} y password {string}")
    public void ingresarDatos(String user, String pass) {
        OnStage.theActorInTheSpotlight().attemptsTo(
                RealizarLogin.conCredenciales(user, pass)
        );
    }

    @Y("el usuario agrega un producto al carrito")
    public void agregarProducto() {
        OnStage.theActorInTheSpotlight().attemptsTo(
                GestionarCarrito.agregarProducto()
        );
    }

    @Y("el usuario intenta realizar el pago")
    public void realizarPago() {
        OnStage.theActorInTheSpotlight().attemptsTo(
                RealizarPago.deLosProductos()
        );
    }

    @Entonces("valida resultado {string}")
    public void validar(String resultadoEsperado) {
        OnStage.theActorInTheSpotlight().should(
                seeThat(ValidarLogin.esExitoso(), equalTo(resultadoEsperado))
        );
    }

    @Entonces("valida el mensaje de error {string}")
    public void validarMensajeError(String mensajeEsperado) {
        OnStage.theActorInTheSpotlight().should(
                seeThat("El mensaje de error",
                        ValidarError.es(), equalTo(mensajeEsperado))
        );
    }

    @Entonces("valida que la compra fue exitosa con el mensaje {string}")
    public void validarCompraExitosa(String mensajeEsperado) {
        OnStage.theActorInTheSpotlight().should(
                seeThat("El mensaje de confirmación de compra",
                        ConfirmacionCompra.es(), equalTo(mensajeEsperado))
        );
    }

    // Este paso es opcional si quieres cerrar sesión al final de todo
    @Y("el usuario cierra la sesion")
    public void cerrarSesion() {
        OnStage.theActorInTheSpotlight().attemptsTo(
                CerrarSesion.deLaPagina()
        );
    }
}