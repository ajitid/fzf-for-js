const path = require("path");
const glob = require("glob");

let fileVersions = glob
  .sync("./src/docs/old-docs/*/")
  .map((v) => path.parse(v).name);

module.exports = { fileVersions };
