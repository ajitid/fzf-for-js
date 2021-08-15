const path = require("path");
const glob = require("glob");

let fileVersions = glob
  .sync("./src/docs/old-docs/*/")
  .map((v) => path.parse(v).base);

module.exports = { fileVersions };
