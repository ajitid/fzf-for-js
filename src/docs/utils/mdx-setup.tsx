import React, {
  forwardRef,
  isValidElement,
  useEffect,
  useRef,
  useState,
} from "react";

import { mergeReferences } from "./merge-references";
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
    const elRef = useRef<HTMLHeadingElement>(null);
    const mergedRefs = mergeReferences(ref, elRef);

    const [anchor, setAnchor] = useState("");
    useEffect(() => {
      let anchor = getAnchor(
        typeof props.children === "string" ? getAnchor(props.children) : ""
      );
      if (!anchor) {
        if (isValidElement(props.children)) {
          const elProps = props.children.props;
          const children = elProps["children"];
          if (typeof children === "string") {
            anchor = getAnchor(children);
          }
        }
      }

      // eg. for h3, try to find h2 and combine to form the anchor
      let headingEl = elRef.current;
      if (level >= 3 && headingEl) {
        let el: Node | null = headingEl;

        const tagNameToFind = "H" + (level - 1);
        while ((el = el.previousSibling)) {
          if (el instanceof HTMLElement && el.tagName === tagNameToFind) {
            const { textContent } = el;
            if (!textContent) break;

            anchor = getAnchor(textContent) + "-" + anchor;
            break;
          }
        }
      }

      setAnchor(anchor);
    }, []);

    const link = `#${anchor}`;

    return React.createElement(
      `h${level}`,
      {
        id: anchor,
        ref: mergedRefs,
      },
      [
        <a
          key="1"
          href={link}
          className="heading-link"
          style={{ textDecoration: "none" }}
        >
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

export const mdxComponents = {
  wrapper: (props: any) => (
    <div className="container mx-auto prose lg:max-w-3xl px-3 sm:px-0">
      <main {...props} />
    </div>
  ),
  code: CodeBlock as React.ComponentType<{ children: React.ReactNode }>,
  // headings
  ...Object.fromEntries(
    [2, 3, 4].map((level) => ["h" + level, getHeading(level)])
  ),
};
