import React, { useState, useCallback } from "react";

const COLLAPSE_LINE_THRESHOLD = 18;
const COLLAPSED_MAX_HEIGHT = "20em";

type PreProps = React.ComponentPropsWithoutRef<"pre"> & {
  children?: React.ReactNode;
};

function getFirstElement(children: React.ReactNode): React.ReactElement | null {
  if (children == null) return null;
  if (typeof children === "string" || typeof children === "number") return null;
  const arr = React.Children.toArray(children);
  const first = arr[0];
  if (first != null && typeof first === "object" && "props" in first) return first as React.ReactElement;
  return null;
}

function getCodeText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  const child = getFirstElement(children) as React.ReactElement<{ children?: React.ReactNode }> | null;
  if (!child) return String(children ?? "");
  const c = child.props?.children;
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.map((x) => (typeof x === "string" ? x : getCodeText(x))).join("");
  if (c != null && typeof c === "object") return getCodeText(c as React.ReactNode);
  return String(children ?? "");
}

function getLanguageFromChild(children: React.ReactNode): string {
  const child = getFirstElement(children) as React.ReactElement<{ className?: string }> | null;
  if (!child) return "txt";
  const cn = child.props?.className ?? "";
  const match = String(cn).match(/language-(\S+)/);
  return match ? match[1] : "txt";
}

const CodeBlock: React.FC<PreProps> = ({ children, ...preProps }) => {
  const codeText = getCodeText(children);
  const language = getLanguageFromChild(children);
  const lineCount = (codeText.match(/\n/g) ?? []).length + 1;
  const isCollapsible = lineCount > COLLAPSE_LINE_THRESHOLD;
  const [collapsed, setCollapsed] = useState(isCollapsible);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(codeText);
  }, [codeText]);

  const download = useCallback(() => {
    const ext = language === "txt" ? "txt" : language;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([codeText], { type: "text/plain" }));
    a.download = `snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [codeText, language]);

  return (
    <div className="code-block-wrap">
      <div className="code-block-actions" aria-hidden>
        <button type="button" className="code-block-btn" onClick={copy} title="Copy">
          Copy
        </button>
        <button type="button" className="code-block-btn" onClick={download} title="Download">
          Download
        </button>
        {isCollapsible && (
          <button
            type="button"
            className="code-block-btn"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
        )}
      </div>
      <pre
        {...preProps}
        className={`code-block-pre ${preProps.className ?? ""}`.trim()}
        style={
          isCollapsible && collapsed
            ? { maxHeight: COLLAPSED_MAX_HEIGHT, overflow: "hidden" }
            : undefined
        }
      >
        {children}
      </pre>
      {isCollapsible && collapsed && (
        <button
          type="button"
          className="code-block-expand-overlay"
          onClick={() => setCollapsed(false)}
          aria-label="Expand full code"
        >
          Expand ({lineCount} lines)
        </button>
      )}
    </div>
  );
};

export default CodeBlock;
