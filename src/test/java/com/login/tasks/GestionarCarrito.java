package com.login.tasks;

import com.login.userinterfaces.InventoryPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import static net.serenitybdd.screenplay.Tasks.instrumented;

public class GestionarCarrito implements Task {
    @Override
    public <T extends Actor> void performAs(T actor) {
        try { Thread.sleep(2000); } catch (InterruptedException e) { e.printStackTrace(); }
        actor.attemptsTo(
            Click.on(InventoryPage.BOTON_ADD_TO_CART),
            Click.on(InventoryPage.ICONO_CARRITO)
        );
    }
    public static GestionarCarrito agregarProducto() {
        return instrumented(GestionarCarrito.class);
    }
}