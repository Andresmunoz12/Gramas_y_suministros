package com.login.questions;

import com.login.userinterfaces.LoginPage;
import net.serenitybdd.screenplay.Question;
import net.serenitybdd.screenplay.questions.Text;

public class ValidarError {
    public static Question<String> es() {
        return actor -> Text.of(LoginPage.ERROR).answeredBy(actor).trim();
    }
}
