package com.login.userinterfaces;

import net.serenitybdd.screenplay.targets.Target;
import org.openqa.selenium.By;

public class InventoryPage {
    // Agrega esta línea que es la que te está pidiendo ValidarLogin:
    public static final Target TITULO_PRODUCTOS = Target.the("título de la página de productos")
            .located(By.xpath("//button[contains(text(), 'Cerrar Sesión')]"));

    public static final Target BOTON_ADD_TO_CART = Target.the("botón agregar al carrito")
            .located(By.id("add-to-cart-sauce-labs-backpack"));
    
    public static final Target ICONO_CARRITO = Target.the("icono del carrito")
            .located(By.className("shopping_cart_link"));
    
    public static final Target BOTON_MENU = Target.the("botón menú lateral")
            .located(By.id("react-burger-menu-btn"));
    
    public static final Target LINK_LOGOUT = Target.the("enlace de cerrar sesión")
            .located(By.id("logout_sidebar_link"));
}