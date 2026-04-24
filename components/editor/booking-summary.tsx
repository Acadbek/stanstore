'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

export type BookingSummaryAttrs = {
  timezone: string;
  duration: string;
  interval: string;
  notice: string;
  daysAhead: string;
  availability: string;
  location: string;
};

function buildRows(attrs: BookingSummaryAttrs) {
  return [
    { label: 'Timezone', value: attrs.timezone },
    { label: 'Session', value: attrs.duration },
    { label: 'Slot Interval', value: attrs.interval },
    { label: 'Min Notice', value: attrs.notice },
    { label: 'Days Ahead', value: attrs.daysAhead },
    { label: 'Location', value: attrs.location },
  ];
}

function BookingSummaryCard({ attrs }: { attrs: BookingSummaryAttrs }) {
  const rows = buildRows(attrs);

  return (
    <div data-booking-summary="" className="booking-summary-card">
      <div className="booking-summary-card__header">
        <div className="booking-summary-card__icon" aria-hidden="true">
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
        <div>
          <div className="booking-summary-card__eyebrow">Booking Setup</div>
          <h3 className="booking-summary-card__title">Google Calendar Booking</h3>
        </div>
      </div>

      <div className="booking-summary-card__table" role="table" aria-label="Booking summary">
        {rows.map((row) => (
          <div key={row.label} className="booking-summary-card__row" role="row">
            <div className="booking-summary-card__cell booking-summary-card__cell--label" role="cell">
              {row.label}
            </div>
            <div className="booking-summary-card__cell booking-summary-card__cell--value" role="cell">
              {row.value}
            </div>
          </div>
        ))}
      </div>

      <div className="booking-summary-card__availability">
        <span className="booking-summary-card__availability-label">Availability</span>
        <span className="booking-summary-card__availability-value">{attrs.availability}</span>
      </div>
    </div>
  );
}

function BookingSummaryNodeView({ node }: NodeViewProps) {
  const attrs = node.attrs as BookingSummaryAttrs;
  return (
    <NodeViewWrapper>
      <BookingSummaryCard attrs={attrs} />
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    bookingSummary: {
      setBookingSummary: (attrs: BookingSummaryAttrs) => ReturnType;
    };
  }
}

export const BookingSummary = Node.create({
  name: 'bookingSummary',
  group: 'block',
  atom: true,
  defining: true,

  addAttributes() {
    return {
      timezone: { default: '' },
      duration: { default: '' },
      interval: { default: '' },
      notice: { default: '' },
      daysAhead: { default: '' },
      availability: { default: '' },
      location: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-booking-summary]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const attrs = HTMLAttributes as unknown as BookingSummaryAttrs;
    const rows = buildRows(attrs);

    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-booking-summary': '', class: 'booking-summary-card' }),
      [
        'div',
        { class: 'booking-summary-card__header' },
        [
          'div',
          { class: 'booking-summary-card__icon', 'aria-hidden': 'true' },
          [
            'svg',
            { viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
            ['rect', { x: '3.5', y: '5.5', width: '17', height: '15', rx: '3', stroke: 'currentColor', 'stroke-width': '1.5' }],
            ['path', { d: 'M7.5 3.5V7.5', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }],
            ['path', { d: 'M16.5 3.5V7.5', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round' }],
            ['path', { d: 'M3.5 9.5H20.5', stroke: 'currentColor', 'stroke-width': '1.5' }],
            ['path', { d: 'M8 13H8.01', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }],
            ['path', { d: 'M12 13H12.01', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }],
            ['path', { d: 'M16 13H16.01', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round' }],
          ],
        ],
        [
          'div',
          {},
          ['div', { class: 'booking-summary-card__eyebrow' }, 'Booking Setup'],
          ['h3', { class: 'booking-summary-card__title' }, 'Google Calendar Booking'],
        ],
      ],
      [
        'div',
        { class: 'booking-summary-card__table', role: 'table', 'aria-label': 'Booking summary' },
        ...rows.map((row) => [
          'div',
          { class: 'booking-summary-card__row', role: 'row' },
          ['div', { class: 'booking-summary-card__cell booking-summary-card__cell--label', role: 'cell' }, row.label],
          ['div', { class: 'booking-summary-card__cell booking-summary-card__cell--value', role: 'cell' }, row.value],
        ]),
      ],
      [
        'div',
        { class: 'booking-summary-card__availability' },
        ['span', { class: 'booking-summary-card__availability-label' }, 'Availability'],
        ['span', { class: 'booking-summary-card__availability-value' }, attrs.availability],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookingSummaryNodeView);
  },

  addCommands() {
    return {
      setBookingSummary:
        (attrs: BookingSummaryAttrs) =>
        ({ commands }: { commands: any }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    } as any;
  },
});
