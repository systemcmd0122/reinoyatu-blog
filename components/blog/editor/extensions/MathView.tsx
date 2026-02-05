import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';

export default ({ node }: any) => {
  const { latex, inline } = node.attrs;
  const html = katex.renderToString(latex || '', {
    displayMode: !inline,
    throwOnError: false,
  });

  return (
    <NodeViewWrapper 
      className={inline ? "inline-block mx-1" : "block my-4 text-center"}
      data-latex={latex}
      data-inline={inline}
    >
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </NodeViewWrapper>
  );
};
