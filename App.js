const express = require("express");
const cors = require("cors");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
const portName = process.env.ARDUINO_PORT;
const baudRate = 9600;

const port = new SerialPort({
       lock: false,
       path: portName,
       baudRate: baudRate,
});
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
parser.on("data", (data) => {
       console.log("Data received from Arduino:", data.toString());
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

port.on("readable", function () {
       console.log("Data:", port.read());
});
// Open errors will be emitted as an error event
port.on("error", function (err) {
       console.log("Error: ", err.message);
});
// Start the Express server

app.post("/pixel", async (req, res) => {
       try {
              console.log(req.body);
              const rgbValues = req.body["rgb"];
              // Extract the numeric values using a regular expression
              // Remove the 'rgb(' prefix and ')' suffix
              const valuesString = rgbValues.substring(4, rgbValues.length - 1);
              console.log("hi", valuesString);
              console.log("hi", rgbValues);

              // Split the string into an array of individual values
              const valuesArray = valuesString.split(", ");

              // Extract individual r, g, and b values
              valuesArray.forEach((value, index) => {
                     if (valuesArray[index].length === 0) {
                            valuesArray[index] = "000";
                     }
                     if (valuesArray[index].length === 1) {
                            valuesArray[index] = "00" + valuesArray[index];
                     }
                     if (valuesArray[index].length === 2) {
                            valuesArray[index] = "0" + valuesArray[index];
                     }
              });

              const r = valuesArray[0];
              const g = valuesArray[1];
              const b = valuesArray[2];

              console.log("Red:", r); // Output: 48
              console.log("Green:", g); // Output: 127
              console.log("Blue:", b); // Output: 230

              port.write(`r${r}g${g}b${b}`, function (err) {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
              });
              res.status(200).header("Access-Control-Allow-Origin", "*").send(response);
       } catch (e) {
              res.status(403).header("Access-Control-Allow-Origin", "*").send("Team already redeemed.");
       }
});

app.listen(3000, () => {});
