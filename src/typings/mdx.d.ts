// https://github.com/microsoft/TypeScript-React-Starter/issues/12#issuecomment-341503691
declare module "*.mdx" {
  import type { mdx } from "@mdx-js/react";

  const content: () => ReturnType<typeof mdx>;
  export default content;
}
