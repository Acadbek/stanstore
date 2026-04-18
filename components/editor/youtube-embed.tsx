
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

function extractVideoId(src: string): string | null {
  try {
    const u = new URL(src);
    let videoId = '';
    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1);
    } else if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v') || '';
      if (!videoId && u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.replace('/embed/', '');
      }
      if (!videoId && u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.replace('/shorts/', '');
      }
    }
    if (!videoId) return null;
    return videoId.split(/[?&]/)[0];
  } catch {
    return null;
  }
}

function YoutubeEmbedNodeView({ node }: NodeViewProps) {
  const src = (node.attrs.src as string) || '';
  const videoId = extractVideoId(src);
  const thumbnailUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : null;

  return (
    <NodeViewWrapper>
      <div
        data-youtube-embed={''}
        data-src={src}
        contentEditable={false}
        className="youtube-embed-placeholder"
      >
        {thumbnailUrl ? (
          <div className="yt-thumbnail-wrap">
            <img
              src={thumbnailUrl}
              alt="YouTube thumbnail"
              className="yt-thumbnail"
            />
            <div className="yt-play-btn">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        ) : (
          <div className="yt-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
        <span className="yt-label">YouTube Video</span>
        {videoId && <span className="yt-url">{videoId}</span>}
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
