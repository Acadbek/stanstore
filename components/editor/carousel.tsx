'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Plus } from 'lucide-react';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    carousel: {
      insertCarousel: () => ReturnType;
    };
  }
}

const CarouselView = (props: NodeViewProps) => {
  const { editor, node, getPos } = props;
  const count = node.childCount;
  const isCarousel = count > 2;

  const handleAddCard = () => {
    if (!editor) return;
    const position = typeof getPos === 'function' ? getPos() : null;
    if (typeof position !== 'number') return;
    const itemType = editor.schema.nodes.carouselItem;
    if (!itemType) return;
    const newItem = itemType.createAndFill();
    if (!newItem) return;
    const insertPos = position + node.nodeSize - 1;
    const transaction = editor.state.tr.insert(insertPos, newItem);
    editor.view.dispatch(transaction);
    editor.commands.focus();
  };

  return (
    <NodeViewWrapper
      className={`carousel-node ${isCarousel ? 'is-carousel' : 'is-static'}`}
      data-count={count}
    >
      <div className="carousel-node__header">
        <span className="carousel-node__label">Carousel</span>
        <button
          type="button"
          className="carousel-node__add"
          onClick={handleAddCard}
        >
          <Plus className="h-3.5 w-3.5" />
          Add card
        </button>
      </div>
      <NodeViewContent
        className={`carousel ${isCarousel ? 'is-carousel' : 'is-static'}`}
        data-carousel="true"
        data-count={count}
      />
    </NodeViewWrapper>
  );
};

export const CarouselItem = Node.create({
  name: 'carouselItem',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div[data-carousel-item]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-carousel-item': 'true',
        class: 'carousel-card',
      }),
      0,
    ];
  },
});

export const Carousel = Node.create({
  name: 'carousel',
  group: 'block',
  content: 'carouselItem+',
  defining: true,
  isolating: true,
  parseHTML() {
    return [{ tag: 'div[data-carousel]' }];
  },
  renderHTML({ HTMLAttributes, node }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-carousel': 'true',
        'data-count': String(node.childCount),
        class: 'carousel',
      }),
      0,
    ];
  },
  addCommands() {
    return {
      insertCarousel:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            content: [
              {
                type: 'carouselItem',
                content: [{ type: 'paragraph' }],
              },
            ],
          });
        },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(CarouselView);
  },
});
