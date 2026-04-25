import 'package:flutter/material.dart';

class CounterScreen extends StatefulWidget {
  const CounterScreen({super.key});

  @override
  State<CounterScreen> createState() => _CounterScreenState();
}

class _CounterScreenState extends State<CounterScreen> {
  int clickCounter = 0;
  @override
  Widget build(BuildContext context) {
    return  Scaffold(
      appBar: AppBar(
        title: const  Text('contador'),
      ) ,
      body: Center(
          child:Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('$clickCounter', style:TextStyle(fontSize: 160, fontWeight: FontWeight.w100 ,)),
               Text('click${clickCounter == 1 ? '':'s' }', style:TextStyle(fontSize: 25 )),
              /*if(clickCounter == 1 )
              const Text('clicks',style:TextStyle(fontSize: 25 )),
              if(clickCounter != 1)
                const Text('click',style:TextStyle(fontSize: 25 )),
              if(clickCounter == 0)
                const Text('cero clicks',style:TextStyle(fontSize: 25 )),*/
            ]
          ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: (){
          clickCounter++;
          setState(() {

          });
        },
        child: const Icon(Icons.plus_one),
      ),
    );
  }
}
