const path = require("path");
const glob = require("glob");

let fileVersions = glob.sync("./src/views/old-docs/*.mdx").map(v => path.parse(v).name);

module.exports = { fileVersions };
