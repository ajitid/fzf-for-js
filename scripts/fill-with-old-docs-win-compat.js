const shell = require("shelljs");

const currVerStr = require("../package.json").version;
const currVerMajor = parseInt(currVerStr.split(".")[0], 10);
const currVerMinor = parseInt(currVerStr.split(".")[1], 10);

shell.rm("-r", "src/docs/old-docs");
shell.mkdir("src/docs/old-docs");
shell.touch("src/docs/old-docs/.gitkeep");

const fillDocs = (verMajor, verMinor) => {
  if (verMajor === 0 && verMinor <= 4) {
    return;
  }

  const nextCommitHash = shell
    .exec(
      `git log -S "\\"version\\": \\"${verMajor}.${verMinor}" --oneline -n 1 --branches HEAD -- package.json`,
      {
        silent: true,
      }
    )
    .stdout.split(" ")[0];

  const verStr = JSON.parse(
    shell.exec(`git show "${nextCommitHash}^:./package.json"`, { silent: true }).stdout
  )["version"];

  shell.exec(`git worktree add -f "src/docs/old-docs/${verStr}" "${nextCommitHash}^"`, {
    silent: true,
  });

  shell.rm(
    "-r",
    `src/docs/old-docs/${verStr}/vite*`,
    `src/docs/old-docs/${verStr}/src/docs/typings`
  );
};

for (let i = currVerMajor; i >= Math.max(0, currVerMajor - 2); i--) {
  if (i === currVerMajor) {
    for (let j = currVerMinor - 1; j >= Math.max(0, currVerMinor - 2); j--) {
      fillDocs(i, j);
    }
  } else {
    const nextCommitHash = shell
      .exec(`git log -S "\\"version\\": \\"${i}." --oneline -n 1 --branches HEAD -- package.json`, {
        silent: true,
      })
      .stdout.split(" ")[0];

    const verStr = JSON.parse(
      shell.exec(`git show "${nextCommitHash}^:./package.json"`, {
        silent: true,
      }).stdout
    )["version"];
    const verMinor = parseInt(verStr.split(".")[1], 10);

    for (let j = verMinor; j >= Math.max(0, verMinor - 2); j--) {
      fillDocs(i, j);
    }
  }
}
