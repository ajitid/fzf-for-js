import React, { createContext, forwardRef, isValidElement, useContext, useRef } from "react";

import { CodeBlock } from "../components/code-block";
import linkIconSrc from "../assets/link.svg";

function getAnchor(text: string) {
  return text
    .toLowerCase()
    .replace(/[ \(\.]/g, "-")
    .replace(/→/g, "to")
    .replace(/[^a-z0-9-]/g, "");
}

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

const getHeading = (level: number) => {
  const Heading = (props: HeadingProps, ref: React.Ref<HTMLHeadingElement>) => {
    const { lastHeadingsLink } = useContext(HeadingContext);

    let anchor = getAnchor(typeof props.children === "string" ? getAnchor(props.children) : "");
    if (!anchor) {
      if (isValidElement(props.children)) {
        const elProps = props.children.props;
        const children = elProps["children"];
        if (typeof children === "string") {
          anchor = getAnchor(children);
        }
      }
    }

    lastHeadingsLink[level] = anchor;
    if (level >= 3 && lastHeadingsLink[level - 1]) {
      anchor = lastHeadingsLink[level - 1] + "-" + anchor;
    }
    const link = `#${anchor}`;

    return React.createElement(
      `h${level}`,
      {
        id: anchor,
        ref,
      },
      [
        <a key="1" href={link} className="heading-link" style={{ textDecoration: "none" }}>
          {props.children}
          <img
            src={linkIconSrc}
            className="w-5 inline-block ml-2"
            style={{ marginTop: 0, marginBottom: 0 }}
          />
        </a>,
      ]
    );
  };

  return forwardRef(Heading);
};

const HeadingContext = createContext<{
  lastHeadingsLink: Record<string, string>;
}>({ lastHeadingsLink: {} });

export const mdxComponents = {
  wrapper: (props: any) => {
    const lastHeadingsLinkRef = useRef<Record<string, string>>({});

    return (
      <HeadingContext.Provider value={{ lastHeadingsLink: lastHeadingsLinkRef.current }}>
        <div className="container mx-auto prose lg:max-w-3xl px-3 sm:px-0">
          <main {...props} />
        </div>
      </HeadingContext.Provider>
    );
  },
  pre: CodeBlock,
  // headings
  ...Object.fromEntries([2, 3, 4].map((level) => ["h" + level, getHeading(level)])),
};
