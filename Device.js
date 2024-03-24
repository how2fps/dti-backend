const express = require("express");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const app = express();
// Define the serial port
const portName = "COM5"; // Change this to your Arduino's port
const baudRate = 9600;

const port = new SerialPort({
       lock: false,
       path: portName,
       baudRate: baudRate,
});
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" })); // Use Readline parser to read data line by line
parser.on("data", (data) => {
       console.log("Data received from Arduino:", data.toString()); // Convert the incoming buffer to a string and log it
});
port.on("open", () => {
       // Now that the port is open, you can write data to it

       setTimeout(() => {
              port.write("r255g255b002", function (err) {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
              });
       }, 2000);
});

port.write("main screen turn on", function (err) {
       if (err) {
              return console.log("Error on write: ", err.message);
       }
});
port.on("readable", function () {
       console.log("Data:", port.read());
});
// Open errors will be emitted as an error event
port.on("error", function (err) {
       console.log("Error: ", err.message);
});
// Start the Express server
app.listen(3000, () => {});
