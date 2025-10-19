import React, { ReactNode } from "react";
import { Highlight, Language, PrismTheme } from "prism-react-renderer";

import { theme as lightTheme } from "./customized-night-owl-light";

export const CodeBlock = ({ children, ...rest }: React.HTMLAttributes<HTMLPreElement>) => {
  if (!React.isValidElement(children) || children.type !== "code") {
    return <pre children={children} {...rest} />;
  }

  const codeProps = children.props as React.HTMLAttributes<HTMLElement>;
  const lang = String(codeProps.className ?? "").replace(/language-/, "");

  console.log('BOSH: code-block: ', codeProps.style);

  return (
    <Highlight
      theme={lightTheme as PrismTheme}
      code={codeProps.children?.toString().trim() ?? ""}
      language={lang as Language}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <div className="-mt-3 px-4 py-2">
          <div className="flex justify-end">
            <div
              style={{
                backgroundColor: "#fdfdfd",
              }}
              className="lang-box relative z-10 -mb-3 inline-block font-mono text-sm border text-gray-400 px-3 py-1 rounded leading-none mr-4"
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
            {tokens.map((line, i) => {
              const { key: lineKey, ...lineProps } = getLineProps({ line, key: i });
              return (
                <div key={lineKey as string} {...lineProps}>
                  {line.map((token, key) => {
                    const { key: tokenKey, ...tokenProps } = getTokenProps({ token, key });
                    return <span key={tokenKey as string} {...tokenProps} />;
                  })}
                </div>
              );
            })}
          </pre>
        </div>
      )}
    </Highlight>
  );
};
