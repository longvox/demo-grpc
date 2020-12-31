const employeeService = require("./demo-service");

new employeeService()
  .client()
  .unary([1, 10, 2])
  .then((data) => console.log("unary : ", data));

new employeeService()
  .client()
  .clientStream([1, 10, 2])
  .then((data) => console.log("clientStream : ", data));

new employeeService()
  .client()
  .serverStream([1, 10, 2])
  .then((data) => console.log("serverStream : ", data));

new employeeService()
  .client()
  .bidirectionalStream([1, 10, 2])
  .then((data) => console.log("bidirectionalStream : ", data));
