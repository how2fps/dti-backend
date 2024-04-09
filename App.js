const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const { getFirestore, doc, setDoc, getDoc } = require("firebase/firestore");
const { initializeApp } = require("firebase/app");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
const wss = new WebSocket.Server({ port: 8080 });

let connectedClient;
wss.on("connection", function connection(ws) {
       console.log("Client connected");
       connectedClient = ws;
       ws.on("message", function incoming(message) {
              console.log("received: %s", message);
              // Handle received message from client
       });
       ws.send("Hello from server");
});

const firebaseConfig = {
       apiKey: "AIzaSyCdDsg6x19bzJAokeCqtfdBYpv4aoQUH64",
       authDomain: "dti-ui.firebaseapp.com",
       projectId: "dti-ui",
       storageBucket: "dti-ui.appspot.com",
       messagingSenderId: "283041040161",
       appId: "1:283041040161:web:de955f8da2c49742492060",
       measurementId: "G-BTYJBZYSYT",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const portName = process.env.ARDUINO_PORT;
const baudRate = 9600;
const port = new SerialPort({
       lock: false,
       path: portName,
       baudRate: baudRate,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
async function fetchPixels() {
       try {
              const docRef = doc(db, "pixels", "pixels");
              const docSnap = await getDoc(docRef);
              const gridArray = JSON.parse(docSnap.data().gridData);
              const dataSentToArduino = [];
              gridArray.map((row, rowIndex) => {
                     row.map((column, columnIndex) => {
                            if (column.length > 0) {
                                   const valuesString = column.substring(4, column.length - 1);
                                   const valuesArray = valuesString.split(", ");
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
                                   dataSentToArduino.push(`r${r}g${g}b${b}c${JSON.stringify([rowIndex, columnIndex])}`);
                            }
                     });
              });
              port.write(dataSentToArduino.join(""), function (err) {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
              });
       } catch (e) {
              console.log(e);
       }
}

parser.on("data", (data) => {
       if (data.toString() === "bus_arrives") {
              connectedClient.send("bus_arrives");
       }
       if (data.toString() == "bus_left") {
              connectedClient.send("bus_left");
              fetchPixels();
       }
});

port.on("open", () => {
       // Now that the port is open, you can write data to it

       setTimeout(() => {
              port.write("hi", function (err) {
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
              const rgbValues = req.body["rgb"];
              const coordinates = req.body["coordinates"];
              const gridData = req.body["newGridData"];
              const valuesString = rgbValues.substring(4, rgbValues.length - 1);
              const valuesArray = valuesString.split(", ");
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
              port.write(`r${r}g${g}b${b}c${JSON.stringify(coordinates)}`, function (err) {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
              });
              await setDoc(doc(db, "pixels", "pixels"), {
                     gridData: JSON.stringify(gridData),
              });
              res.status(200).header("Access-Control-Allow-Origin", "*").send("nice");
       } catch (e) {
              console.log(e);
       }
});

app.get("/pixel", async (req, res) => {
       try {
              const docRef = doc(db, "pixels", "pixels");
              const docSnap = await getDoc(docRef);
              const gridArray = JSON.parse(docSnap.data().gridData);
              const dataSentToArduino = [];
              gridArray.map((row, rowIndex) => {
                     row.map((column, columnIndex) => {
                            if (column.length > 0) {
                                   const valuesString = column.substring(4, column.length - 1);
                                   const valuesArray = valuesString.split(", ");
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
                                   dataSentToArduino.push(`r${r}g${g}b${b}c${JSON.stringify([rowIndex, columnIndex])}`);
                            }
                     });
              });
              port.write(dataSentToArduino.join(""), function (err) {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
              });
              res.send(gridArray);
       } catch (e) {
              console.log(e);
       }
});

app.get("/bus-arrives", async (req, res) => {
       try {
              port.write("bus_arrives", function (err) {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
              });
              res.status(200).header("Access-Control-Allow-Origin", "*").send("Bus arrive");
       } catch (e) {
              console.log(e);
       }
});

app.get("/bus-leaves", async (req, res) => {
       try {
              port.write("bus_left", function (err) {
                     if (err) {
                            return console.log("Error on write: ", err.message);
                     }
              });
              res.status(200).header("Access-Control-Allow-Origin", "*").send("Bus left");
       } catch (e) {
              console.log(e);
       }
});

app.liste`1`
