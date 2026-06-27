package com.login.questions;
import com.login.userinterfaces.InventoryPage;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.questions.Text;

public class ValidarLogin {
    public static Question<String> esExitoso() {
        return actor -> Text.of(InventoryPage.TITULO_PRODUCTOS).answeredBy(actor);
    }
}