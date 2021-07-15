import React, { ReactNode } from "react";
import Highlight, {
  defaultProps as prismDefaultProps,
  Language,
  PrismTheme,
} from "prism-react-renderer";
// @ts-expect-error missing declaration file
import { theme as lightTheme } from "./customized-night-owl-light";

interface Props {
  children: ReactNode;
  className?: string;
}

export const CodeBlock = ({ children, className = "" }: Props) => {
  const lang = String(className).replace(/language-/, "");

  return (
    <Highlight
      {...prismDefaultProps}
      theme={lightTheme as PrismTheme}
      code={children?.toString().trim() ?? ""}
      language={lang as Language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <div className="-mt-3">
          <div className="flex justify-end">
            <div
              style={{
                backgroundColor: "#f3f7fb",
              }}
              className="relative z-10 -mb-3 inline-block text-sm border text-gray-400 px-3 py-1 rounded leading-none mr-4"
            >
              {lang.toUpperCase()}
            </div>
          </div>
          <pre
            className={`block overflow-auto rounded px-5 border ${className}`}
            style={{
              ...style,
              marginTop: 0,
              marginBottom: 0,
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line, key: i })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token, key })} />
                ))}
              </div>
            ))}
          </pre>
        </div>
      )}
    </Highlight>
  );
};
