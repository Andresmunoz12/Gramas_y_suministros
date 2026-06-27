package com.login.userinterfaces;
import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

public class CheckoutPage {
    public static final Target BTN_CHECKOUT = Target.the("checkout").located(By.id("checkout"));
    public static final Target INPUT_NAME = Target.the("nombre").located(By.id("first-name"));
    public static final Target INPUT_LASTNAME = Target.the("apellido").located(By.id("last-name"));
    public static final Target INPUT_POSTAL = Target.the("postal").located(By.id("postal-code"));
    public static final Target BTN_CONTINUE = Target.the("continuar").located(By.id("continue"));
    public static final Target BTN_FINISH = Target.the("finalizar").located(By.id("finish"));
    public static final Target MSJ_EXITO = Target.the("mensaje éxito").located(By.className("complete-header"));
}