package com.login.tasks;

import com.login.userinterfaces.InventoryPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.waits.WaitUntil;
import static net.serenitybdd.screenplay.matchers.WebElementStateMatchers.isVisible;
import static net.serenitybdd.screenplay.Tasks.instrumented;

public class CerrarSesion implements Task {
    @Override
    public <T extends Actor> void performAs(T actor) {
        try { Thread.sleep(2000); } catch (InterruptedException e) { e.printStackTrace(); }
        actor.attemptsTo(
                Click.on(InventoryPage.BOTON_MENU),
                WaitUntil.the(InventoryPage.LINK_LOGOUT, isVisible()).forNoMoreThan(5).seconds(),
                Click.on(InventoryPage.LINK_LOGOUT));
    }

    public static CerrarSesion deLaPagina() {
        return instrumented(CerrarSesion.class);
    }
}