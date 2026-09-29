import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Feather, ArrowLeft, ArrowRight, Calendar, User, AlertCircle } from 'lucide-react';
import { BlogPost } from '../types';
import { BLOG_POSTS } from '../data/blogPosts';
import { useLanguage } from '../context/LanguageContext';

const formatDate = (iso: string, locale: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
};

export const BlogSection: React.FC = () => {
  const { t, language } = useLanguage();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const locale = language === 'hi' ? 'hi-IN' : language === 'mai' ? 'hi-IN' : 'en-US';

  if (selectedPost) {
    return (
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto space-y-8">
        <button
          onClick={() => setSelectedPost(null)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#8C2711] hover:text-[#5C1A0B] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.blog.backToBlog}</span>
        </button>

        {selectedPost.isPlaceholder && (
          <div className="p-3 bg-[#FBEAE6] rounded border border-[#E0A192] text-xs text-[#8C2711] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{t.blog.placeholderNotice}</span>
          </div>
        )}

        <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-[#DFCDB3]">
          <img
            src={selectedPost.coverImage}
            alt={selectedPost.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="space-y-3">
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-[#241A14]">
            {selectedPost.title}
          </h1>
          <div className="flex items-center gap-4 text-xs text-[#7A6452]">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#8C2711]" />
              {t.blog.byAuthor} {selectedPost.author}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#8C2711]" />
              {formatDate(selectedPost.date, locale)}
            </span>
          </div>
        </div>

        <div className="text-sm sm:text-base text-[#3D2C1E] leading-relaxed space-y-4 whitespace-pre-line">
          {selectedPost.body}
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-[#F5EDE0] border-t border-[#DFCDB5]">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8DAC5] border border-[#8C2711]/20 text-[#8C2711] text-xs uppercase tracking-widest font-semibold">
            <Feather className="w-3.5 h-3.5 text-[#C94A29]" />
            <span>{t.blog.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif-display font-bold text-[#241A14]">
            {t.blog.title}
          </h1>
          <p className="text-sm sm:text-base text-[#5C4A3C]">
            {t.blog.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {BLOG_POSTS.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="group flex flex-col h-full bg-[#FAF5EA] rounded-md border border-[#E2D4BF] hover:border-[#8C2711]/50 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div
                  onClick={() => setSelectedPost(post)}
                  className="relative aspect-[16/10] w-full overflow-hidden bg-[#EFE6D5] cursor-pointer"
                >
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {post.isPlaceholder && (
                    <span className="absolute top-2.5 left-2.5 bg-[#241A14]/80 backdrop-blur-sm text-[#FAF5EA] text-[12px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded shadow-sm">
                      Placeholder
                    </span>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-grow justify-between">
                  <div className="space-y-2">
                    <h3
                      onClick={() => setSelectedPost(post)}
                      className="font-serif-display text-lg font-semibold text-[#241A14] group-hover:text-[#8C2711] transition-colors line-clamp-2 cursor-pointer"
                    >
                      {post.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[12px] text-[#877260]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(post.date, locale)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {post.author}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B5747] line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-[#E8DEC8]">
                    <button
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C2711] hover:text-[#5C1A0B] cursor-pointer group/link"
                    >
                      <span>{t.blog.readMore}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
