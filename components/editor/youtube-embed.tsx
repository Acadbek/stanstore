'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtubeEmbed: {
      setYoutubeEmbed: (src: string) => ReturnType;
    };
  }
}

function YoutubeEmbedNodeView({ node }: NodeViewProps) {
  const src = (node.attrs.src as string) || '';

  let displayUrl: string;
  try {
    const u = new URL(src);
    displayUrl = u.hostname + u.pathname;
  } catch {
    displayUrl = src;
  }

  return (
    <NodeViewWrapper>
      <div
        data-youtube-embed={''}
        data-src={src}
        contentEditable={false}
        className="youtube-embed-placeholder"
      >
        <div className="yt-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <span className="yt-label">YouTube Video</span>
        <span className="yt-url">{displayUrl}</span>
      </div>
    </NodeViewWrapper>
  );
}

export const YoutubeEmbed = Node.create({
  name: 'youtubeEmbed',
  group: 'block',
  atom: true,
  defining: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('src') || element.getAttribute('data-src'),
        renderHTML: (attributes: Record<string, string>) => ({
          src: attributes.src,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-youtube-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-youtube-embed': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(YoutubeEmbedNodeView);
  },

  addCommands() {
    return {
      setYoutubeEmbed:
        (src: string) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { src },
          });
        },
    } as any;
  },
});
