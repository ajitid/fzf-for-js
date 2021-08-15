const shell = require("shelljs");

const pkg = require("../package.json");

const LIBRARY_NAME = pkg.name;
const VERSION = pkg.version;
const AUTHOR = pkg.author;
const currYear = new Date().getFullYear();
const YEAR = currYear === 2021 ? "2021" : `2021-${currYear}`;

// Intentionally using a script instead of using rollup output option for banner
// because for UMD builds the banner wasn't appearing at the top.
const BANNER = `/** @license
 * ${LIBRARY_NAME} v${VERSION}
 * Copyright (c) ${YEAR} ${AUTHOR.name}
 * Licensed under BSD 3-Clause
 */\n`;

shell.ls("dist/**/*.@(es|umd).js").forEach((file) => {
  const content = shell.cat(file);
  shell.ShellString(BANNER + content).to(file);
});
