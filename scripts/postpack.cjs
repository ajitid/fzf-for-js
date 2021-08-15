const shell = require("shelljs");

const pkg = require("../package.json");
delete pkg["type"];

// we're putting newline at end so it matches w/ prettier format
const pkgStr = JSON.stringify(pkg, null, 2) + "\n";
shell.ShellString(pkgStr).to("package.json");
