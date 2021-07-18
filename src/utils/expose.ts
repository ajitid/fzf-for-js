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

export const expose = () => {
  loadScript(
    "https://unpkg.com/fzf/dist/fzf.umd.js",
    "FZF is now available using `fzf.Fzf`"
  );
};

if (import.meta.env.PROD) {
  console.log("To use FZF here, type `init()`");
}

// @ts-ignore
window.init = expose;
