package com.login.tasks;

import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Open;
import static net.serenitybdd.screenplay.Tasks.instrumented;

public class AbrirPagina implements Task {
    @Override
    public <T extends Actor> void performAs(T actor) {
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        actor.attemptsTo(Open.url("http://localhost:5173/login"));
    }

    public static AbrirPagina deSauceDemo() {
        return instrumented(AbrirPagina.class);
    }
}