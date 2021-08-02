const shell = require("shelljs");

const currVerStr = require("../package.json").version;
const currVerMajor = parseInt(currVerStr.split(".")[0], 10);
const currVerMinor = parseInt(currVerStr.split(".")[1], 10);

shell.rm("-r", "src/docs/old-docs");
shell.mkdir("src/docs/old-docs");
shell.touch("src/docs/old-docs/.gitkeep");

const writeFileLegacy = (verMajor, verMinor) => {
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

const writeFile = (verMajor, verMinor) => {
  if (verMajor === 0 && verMinor <= 3) {
    console.log("nope won't write it", verMajor, verMinor);
    // writeFileLegacy(verMajor, verMinor);
  }

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

  shell.mkdir("src/docs/old-docs/" + verStr);

  shell.exec(
    `git --work-tree=src/docs/old-docs/${verStr} checkout ${nextCommitHash}^ -- src`
  );
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
