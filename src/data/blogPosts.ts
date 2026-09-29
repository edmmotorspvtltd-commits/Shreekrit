import { BlogPost } from '../types';

// TODO: These are structural placeholders for BlogSection's layout —
// NOT real editorial content. Replace every post below with actual
// article copy before this page ships. Do not write Mithila-art blog
// posts here as if they were genuine — that would be fabricated
// editorial content presented as real, the same problem the fictional
// "Master Artists" bios already have (see artists.ts).
export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'placeholder-post-1',
    title: 'Placeholder Post — Replace Before Launch',
    excerpt: 'This is placeholder text standing in for a real excerpt. Replace with actual article copy before publishing.',
    body: 'This is placeholder body copy used only to preview the blog post layout (typography, spacing, image placement). It is not a real article and must be replaced with genuine editorial content before this page goes live.\n\nDo not treat any sentence in this placeholder as factual or publishable.',
    date: '2026-01-01',
    coverImage: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1200&q=80',
    author: 'TBD',
    isPlaceholder: true
  },
  {
    id: 'placeholder-post-2',
    title: 'Placeholder Post 2 — Replace Before Launch',
    excerpt: 'Another placeholder excerpt, here only to verify that the blog grid handles multiple cards correctly.',
    body: 'Second placeholder post body. Used to check that the listing grid, the detail view, and the "read more" flow all work with more than one entry.\n\nReplace with real content before launch.',
    date: '2026-01-08',
    coverImage: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
    author: 'TBD',
    isPlaceholder: true
  },
  {
    id: 'placeholder-post-3',
    title: 'Placeholder Post 3 — Replace Before Launch',
    excerpt: 'A third placeholder excerpt, so the grid layout can be checked with an odd number of cards too.',
    body: 'Third placeholder post body, for layout testing only.\n\nReplace with real content before launch.',
    date: '2026-01-15',
    coverImage: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=80',
    author: 'TBD',
    isPlaceholder: true
  }
];
