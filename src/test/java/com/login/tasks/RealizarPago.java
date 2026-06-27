package com.login.tasks;

import com.login.userinterfaces.CheckoutPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Click;
import net.serenitybdd.screenplay.actions.Enter;
import static net.serenitybdd.screenplay.Tasks.instrumented;

public class RealizarPago implements Task {
    @Override
    public <T extends Actor> void performAs(T actor) {
        try { Thread.sleep(2000); } catch (InterruptedException e) { e.printStackTrace(); }
        actor.attemptsTo(
            Click.on(CheckoutPage.BTN_CHECKOUT),
            Enter.theValue("Aprendiz").into(CheckoutPage.INPUT_NAME),
            Enter.theValue("Sena").into(CheckoutPage.INPUT_LASTNAME),
            Enter.theValue("110111").into(CheckoutPage.INPUT_POSTAL),
            Click.on(CheckoutPage.BTN_CONTINUE),
            Click.on(CheckoutPage.BTN_FINISH)
        );
    }
    public static RealizarPago deLosProductos() { return instrumented(RealizarPago.class); }
}
