const http = require("http");
const WebSocket = require("ws");
const websocket = require("../websocket"); // Adjust the path as needed
const { logger } = require("../utils/LoggerUtils");
const db = require("../db");
const sinon = require("sinon");

let expect;
let server;
let wss;
let clients;

describe("WebSocket Server", function () {
  this.timeout(15000); // Increase timeout for async operations

  before(async function () {
    // Dynamically import chai
    const chai = await import("chai");
    expect = chai.expect;

    // Create a new HTTP server
    server = http.createServer();
    ({ wss, clients } = websocket(server));
    await new Promise((resolve) => server.listen(0, resolve));

    console.log("Server started on port:", server.address().port);
  });

  after(function (done) {
    // Restore the original db module
    sinon.restore();

    // Close the WebSocket server and the HTTP server
    wss.close(() => {
      server.close(() => {
        console.log("Server closed");
        done();
      });
    });
  });

  it("should handle client connection and disconnection", function (done) {
    const ws = new WebSocket(`ws://localhost:${server.address().port}`);
    let closeCalled = false;
    ws.on("open", () => {
      console.log("Client connected");
      expect(Array.from(wss.clients).length).to.equal(1);
      ws.close();
    });
    ws.on("close", async () => {
      if (closeCalled) return;
      closeCalled = true;
      console.log("Client disconnected");
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(Array.from(wss.clients).length).to.equal(0);
      done();
    });
    ws.on("error", done);
  });

  it("should handle PING message", function (done) {
    const ws = new WebSocket(`ws://localhost:${server.address().port}`);
    let closeCalled = false;
    ws.on("open", () => {
      ws.send(JSON.stringify({ type: "PING" }));
    });
    ws.on("message", (message) => {
      const data = JSON.parse(message);
      if (data.type === "ONLINE_USERS_COUNT") return;
      console.log("Received message:", data);
      expect(data.type).to.equal("PONG");
      ws.close();
    });
    ws.on("close", () => {
      if (closeCalled) return;
      closeCalled = true;
      done();
    });
    ws.on("error", done);
  });

  it("should handle client reconnection", function (done) {
    const ws = new WebSocket(`ws://localhost:${server.address().port}`);
    ws.on("open", () => {
      console.log("Client connected");
      expect(Array.from(wss.clients).length).to.equal(1);
      ws.close();
    });
    ws.on("close", () => {
      console.log("Client disconnected");
      const wsReconnect = new WebSocket(
        `ws://localhost:${server.address().port}`,
      );
      wsReconnect.on("open", () => {
        console.log("Client reconnected");
        expect(Array.from(wss.clients).length).to.equal(1);
        wsReconnect.close();
      });
      wsReconnect.on("close", () => {
        done();
      });
    });
    ws.on("error", done);
  });
});
