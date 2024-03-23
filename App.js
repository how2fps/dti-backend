const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");

const deviceLocation = "COM5";
const baudRate = 9600;
const matched = false;

SerialPort.list().then((devices) => {
       console.log(devices);
       if (matched) {
              const SP = new SerialPort(deviceLocation, {
                     baudRate: baudRate,
              });

              SP.on("open", () => this.onConnectionOpened());
              SP.on("closed", () => this.onConnectionClosed());

              const parser = SP.pipe(new Readline({ delimiter: "\n" }));
              parser.on("data", (data) => this.onDataReceived(data));

              SP.write("message", (err) => {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
                     console.log("message written");
              });
       }
});
