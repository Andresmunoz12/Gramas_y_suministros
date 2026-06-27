package com.login.userinterfaces;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

public class LoginPage {
    public static final Target INPUT_USUARIO = Target.the("campo nombre de usuario")
            .located(By.cssSelector("input[type='email']"));
    public static final Target INPUT_PASSWORD = Target.the("campo contraseña")
            .located(By.cssSelector("input[type='password']"));
    public static final Target BOTON_LOGIN = Target.the("botón de login")
            .located(By.cssSelector("button.auth-button"));
    public static final Target ERROR = Target.the("mensaje de error")
            .located(By.cssSelector(".auth-message"));
}