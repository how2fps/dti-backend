const express = require("express");
const { SerialPort } = require("serialport");
const Readline = require("@serialport/parser-readline");

const app = express();
// Define the serial port
const portName = "COM5"; // Change this to your Arduino's port
const baudRate = 9600;

const port = new SerialPort({
       lock: false,
       path: portName,
       baudRate: baudRate,
});

port.on("open", () => {
       // Now that the port is open, you can write data to it

       setTimeout(() => {
              port.write("main screen turn on", function (err) {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
              });
       }, 3000);
});

port.write("main screen turn on", function (err) {
       if (err) {
              return console.log("Error on write: ", err.message);
       }
});

// Open errors will be emitted as an error event
port.on("error", function (err) {
       console.log("Error: ", err.message);
});
// Start the Express server
app.listen(3000, () => {});
