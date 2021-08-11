const shell = require("shelljs");

const pkg = require("../package.json");
pkg["type"] = "module";

const pkgStr = JSON.stringify(pkg, null, 2) + "\n";
shell.ShellString(pkgStr).to("package.json");
