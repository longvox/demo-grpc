const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");

const packageDefinition = protoLoader.loadSync(
  __dirname + "/proto/demo.proto",
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);

let demo_proto = grpc.loadPackageDefinition(packageDefinition).demo;

const square = (x) => x * x;

class employeeService {
  construct() {
    this._server = null;
    this._client = null;
  }

  server() {
    this._server = new grpc.Server();
    this._server.addService(demo_proto.Demo.service, {
      unary: this._unary,
      serverStream: this._serverStream,
      clientStream: this._clientStream,
      bidirectionalStream: this._bidirectionalStream,
    });
    this._server.bind(
      "0.0.0.0:111097",
      grpc.ServerCredentials.createInsecure()
    );
    this._server.start();
    console.log("employeeService start!!!");
    return this;
  }

  client() {
    this._client = new demo_proto.Demo(
      "localhost:111097",
      grpc.credentials.createInsecure()
    );
    console.log("employeeService connected!!!");
    return this;
  }

  _unary(call, callback) {
    console.log("[SERVER] - Unary");
    return callback(null, {
      ids: call.request.ids.map(square),
    });
  }

  async unary(ids) {
    console.log("[CLIENT] - Unary");
    return await new Promise((res, rej) => {
      this._client.unary({ ids: ids }, (err, response) => {
        if (err) rej(err);
        res(response);
      });
    });
  }

  _clientStream(call, callback) {
    console.log("[SERVER] - ClientStream");
    const dataInput = [];
    call.on("data", function (data) {
      dataInput.push(data.id);
    });
    call.on("end", function () {
      callback(null, {
        ids: dataInput.map(square),
      });
    });
  }

  async clientStream(ids) {
    console.log("[CLIENT] - ClientStream");
    return await new Promise((res, rej) => {
      const call = this._client.clientStream(function (error, response) {
        if (error) rej(error);
        res(response);
      });
      ids.forEach((id) => {
        call.write({ id: id });
      });
      call.end();
    });
  }

  _serverStream(call) {
    console.log("[SERVER] - serverStream");
    const ids = call.request.ids;
    ids.forEach((id) => {
      call.write({ id: square(id) });
    });
    call.end();
  }

  async serverStream(ids) {
    console.log("[CLIENT] - serverStream");
    let call = this._client.serverStream({ ids: ids });
    let result = [];
    return await new Promise((res, rej) => {
      call.on("data", function (response) {
        result.push(response);
      });
      call.on("error", function (error) {
        rej(error);
      });
      call.on("end", function () {
        res(result);
      });
    });
  }

  _bidirectionalStream(call) {
    console.log("[SERVER] - bidirectionalStream");
    let dataInput = [];
    call.on("data", function (data) {
      dataInput.push(data.id);
    });
    call.on("end", function () {
      dataInput.forEach((id) => call.write({ id: id }));
    });
  }

  async bidirectionalStream(ids) {
    console.log("[CLIENT] - bidirectionalStream");
    const call = this._client.clientStream();
    const result = [];
    return await new Promise((res, rej) => {
      ids.forEach((id) => {
        call.write({ id: id });
      });
      call.end();

      call.on("data", function (response) {
        result.push(response.id);
      });
      call.on("error", function (error) {
        rej(error);
      });
      call.on("end", function () {
        res(result.map(square));
      });
    });
  }
}

module.exports = employeeService;
