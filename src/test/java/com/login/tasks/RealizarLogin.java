package com.login.tasks;
import com.login.userinterfaces.LoginPage;
import net.serenitybdd.screenplay.Actor;
import net.serenitybdd.screenplay.Task;
import net.serenitybdd.screenplay.actions.Enter;
import net.serenitybdd.screenplay.actions.Click;
import static net.serenitybdd.screenplay.Tasks.instrumented;

public class RealizarLogin implements Task {
    private final String user, pass;
    public RealizarLogin(String user, String pass) { this.user = user; this.pass = pass; }
    @Override
    public <T extends Actor> void performAs(T actor) {
        try { Thread.sleep(2000); } catch (InterruptedException e) { e.printStackTrace(); }
        actor.attemptsTo(
            Enter.theValue(user).into(LoginPage.INPUT_USUARIO),
            Enter.theValue(pass).into(LoginPage.INPUT_PASSWORD),
            Click.on(LoginPage.BOTON_LOGIN)
        );
    }
    public static RealizarLogin conCredenciales(String user, String pass) {
        return instrumented(RealizarLogin.class, user, pass);
    }
}