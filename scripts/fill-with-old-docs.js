const shell = require("shelljs");

const currVerStr = require("../package.json").version;
const currVerMajor = parseInt(currVerStr.split(".")[0], 10);
const currVerMinor = parseInt(currVerStr.split(".")[1], 10);

shell.rm("-r", "src/docs/views/old-docs");
shell.mkdir("src/docs/views/old-docs");
shell.touch("src/docs/views/old-docs/.gitkeep");

const writeFile = (verMajor, verMinor) => {
  const nextCommitHash = shell
    .exec(
      `git log -S '"version": "${verMajor}.${verMinor}' --oneline -n 1 --branches HEAD -- package.json`,
      {
        silent: true,
      }
    )
    .stdout.split(" ")[0];

  const verStr = JSON.parse(
    shell.exec(`git show ${nextCommitHash}^:./package.json`, { silent: true })
      .stdout
  )["version"];

  const fileContent = shell.exec(
    `git show ${nextCommitHash}^:./src/docs/views/docs.mdx`,
    { silent: true }
  ).stdout;

  if (fileContent !== "") {
    shell.ShellString(fileContent).to(`src/docs/views/old-docs/${verStr}.mdx`);
  }
};

for (let i = currVerMajor; i >= Math.max(0, currVerMajor - 2); i--) {
  if (i === currVerMajor) {
    for (let j = currVerMinor - 1; j >= Math.max(0, currVerMinor - 2); j--) {
      writeFile(i, j);
    }
  } else {
    const nextCommitHash = shell
      .exec(
        `git log -S '"version": "${i}.' --oneline -n 1 --branches HEAD -- package.json`,
        {
          silent: true,
        }
      )
      .stdout.split(" ")[0];

    const verStr = JSON.parse(
      shell.exec(`git show ${nextCommitHash}^:./package.json`, { silent: true })
        .stdout
    )["version"];
    const verMinor = parseInt(verStr.split(".")[1], 10);

    for (let j = verMinor; j >= Math.max(0, verMinor - 2); j--) {
      writeFile(i, j);
    }
  }
}
