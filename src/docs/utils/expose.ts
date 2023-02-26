import GitInfo from "react-git-info/macro";
import { version as newestVersion } from "../../../package.json";

function loadScript(
  filePath: string,
  successMsg = "loaded",
  cacheBuster = `?bust=${new Date().getTime()}`
) {
  const scriptTag = document.createElement("script");
  scriptTag.onload = () => console.log(successMsg);
  scriptTag.type = "text/javascript";
  scriptTag.src = `${filePath}${cacheBuster}`;
  document.querySelector("head")?.appendChild(scriptTag);
}

export const expose = (version = "") => {
  version = version ? "@" + version : "";

  console.log("Retrieving FZF...");
  loadScript(
    `https://unpkg.com/fzf${version}/dist/fzf.umd.js`,
    "FZF is now available using `fzf.Fzf`"
  );
};

if (import.meta.env.PROD) {
  const gitInfo = GitInfo();
  console.log("on commit", gitInfo.commit.hash);
  console.log(
    '%cFZF\n%cTo use FZF here type, `init()` or `init("' + newestVersion + '" /* version */)`',
    "font-size:1.2rem;font-style:italic;font-weight:bold",
    ""
  );
}

// @ts-ignore
window.init = expose;
