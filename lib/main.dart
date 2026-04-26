import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Login_Screen.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Register-Screen.dart';


void main(){
  runApp(Myapp());
}
class Myapp extends StatelessWidget {
  const Myapp({super.key});

  @override
  Widget build(BuildContext context) {
    return  MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
          colorSchemeSeed: Colors.blue
      ),
    home:  LoginScreen()
    );
    throw UnimplementedError();
  }

}
