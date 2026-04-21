'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

type GoogleCalendarKind = 'calendar' | 'appointment';

type GoogleCalendarEmbedAttrs = {
  src: string;
  title: string;
  kind: GoogleCalendarKind;
};

const GOOGLE_CALENDAR_HOSTS = new Set([
  'calendar.google.com',
  'www.google.com',
]);

function extractIframeSrc(value: string) {
  const match = value.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? value;
}

function isGoogleCalendarUrl(url: URL) {
  if (url.hostname === 'calendar.google.com') return true;
  if (url.hostname === 'www.google.com' && url.pathname.startsWith('/calendar')) {
    return true;
  }
  return false;
}

function getGoogleCalendarKind(url: URL): GoogleCalendarKind {
  const path = url.pathname.toLowerCase();
  if (path.includes('/appointments') || path.includes('/schedules')) {
    return 'appointment';
  }
  return 'calendar';
}

export function extractGoogleCalendarEmbedAttrs(
  value: string
): GoogleCalendarEmbedAttrs | null {
  const raw = extractIframeSrc(value.trim()).replace(/&amp;/g, '&');
  if (!raw) return null;

  try {
    const url = new URL(raw);
    if (!GOOGLE_CALENDAR_HOSTS.has(url.hostname) || !isGoogleCalendarUrl(url)) {
      return null;
    }

    const kind = getGoogleCalendarKind(url);
    const title =
      kind === 'appointment' ? 'Google Calendar Booking' : 'Google Calendar';

    return {
      src: url.toString(),
      title,
      kind,
    };
  } catch {
    return null;
  }
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    googleCalendarEmbed: {
      setGoogleCalendarEmbed: (attrs: GoogleCalendarEmbedAttrs) => ReturnType;
    };
  }
}

function GoogleCalendarEmbedNodeView({ node }: NodeViewProps) {
  const title = (node.attrs.title as string) || 'Google Calendar';
  const src = (node.attrs.src as string) || '';
  const kind = (node.attrs.kind as GoogleCalendarKind) || 'calendar';

  return (
    <NodeViewWrapper>
      <div
        data-google-calendar-embed=""
        data-kind={kind}
        data-src={src}
        contentEditable={false}
        className="google-calendar-embed-placeholder"
      >
        <div className="gc-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3.5" y="5.5" width="17" height="15" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7.5 3.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16.5 3.5V7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M3.5 9.5H20.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 13H8.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 13H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M16 13H16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="gc-label">{title}</span>
        <span className="gc-meta">
          {kind === 'appointment' ? 'Booking page embed' : 'Calendar embed'}
        </span>
        <span className="gc-url">{src}</span>
      </div>
    </NodeViewWrapper>
  );
}

export const GoogleCalendarEmbed = Node.create({
  name: 'googleCalendarEmbed',
  group: 'block',
  atom: true,
  defining: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-src') ||
          element.querySelector('iframe')?.getAttribute('src'),
      },
      title: {
        default: 'Google Calendar',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-title') ||
          element.querySelector('iframe')?.getAttribute('title') ||
          'Google Calendar',
      },
      kind: {
        default: 'calendar',
        parseHTML: (element: HTMLElement) =>
          element.getAttribute('data-kind') || 'calendar',
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-google-calendar-embed]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, title, kind, ...rest } = HTMLAttributes;

    return [
      'div',
      mergeAttributes(rest, {
        'data-google-calendar-embed': '',
        'data-src': src,
        'data-title': title,
        'data-kind': kind,
      }),
      [
        'iframe',
        {
          src,
          title: title || 'Google Calendar',
          loading: 'lazy',
          frameborder: '0',
        },
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GoogleCalendarEmbedNodeView);
  },

  addCommands() {
    return {
      setGoogleCalendarEmbed:
        (attrs: GoogleCalendarEmbedAttrs) =>
          ({ commands }: { commands: any }) => {
            return commands.insertContent({
              type: this.name,
              attrs,
            });
          },
    } as any;
  },
});
