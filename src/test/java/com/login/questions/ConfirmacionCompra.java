package com.login.questions;
import com.login.userinterfaces.CheckoutPage;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.questions.Text;

public class ConfirmacionCompra {
    public static Question<String> es() {
        return actor -> Text.of(CheckoutPage.MSJ_EXITO).answeredBy(actor);
    }
}