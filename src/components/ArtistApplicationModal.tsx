import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Feather, Check, Send, AlertCircle } from 'lucide-react';
import { PaintingStyle } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ArtistApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PAINTING_STYLES: PaintingStyle[] = ['Kachni', 'Bharni', 'Godna', 'Tantrik', 'Kohbar'];

// TODO: This is a temporary bridge — form submissions go straight to a
// Formspree inbox because this repo has no backend yet (cart/currency are
// localStorage-only, see App.tsx). Replace with a real API endpoint +
// admin review dashboard once one exists, so applications can be tracked,
// approved, and turned into artist records instead of living in an inbox.
const FORMSPREE_FORM_ID = import.meta.env.VITE_ARTIST_APPLICATION_FORMSPREE_ID as string | undefined;

export const ArtistApplicationModal: React.FC<ArtistApplicationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Left blank by default — this is a real application form, not a
  // filled-in demo submission. Only the style select carries a starting
  // option to pick from.
  const [formData, setFormData] = useState({
    fullName: '',
    village: '',
    district: '',
    state: '',
    phone: '',
    email: '',
    yearsOfExperience: '',
    primaryStyle: PAINTING_STYLES[0] as PaintingStyle,
    bio: '',
    sampleWork: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!FORMSPREE_FORM_ID) {
      setError(t.artistApplication.errorMsg);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          formType: 'Artist Guild Application',
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Form submission failed');
      }

      setSubmitted(true);
    } catch {
      setError(t.artistApplication.errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-[#1A120B]/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-[#FAF5EA] rounded-lg shadow-2xl border border-[#D5C3A5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        <div className="p-4 sm:p-5 border-b border-[#E0D0B8] bg-[#F4EADB] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded bg-[#8C2711] text-white">
              <Feather className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif-display font-bold text-lg text-[#241A14]">
                {t.artistApplication.title}
              </h3>
              <p className="text-xs text-[#7A6452]">
                {t.artistApplication.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#EAE0CD] text-[#241A14] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-[#F4EBDB] rounded border border-[#DFCDB3] text-xs text-[#5C4535] leading-relaxed">
                {t.artistApplication.descriptionNotice}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                  {t.artistApplication.fullName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.artistApplication.village}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.artistApplication.district}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.artistApplication.state}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.artistApplication.phone}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.artistApplication.email}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.artistApplication.yearsOfExperience}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.artistApplication.primaryStyle}
                  </label>
                  <select
                    value={formData.primaryStyle}
                    onChange={(e) => setFormData({ ...formData, primaryStyle: e.target.value as PaintingStyle })}
                    className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  >
                    {PAINTING_STYLES.map((style) => (
                      <option key={style} value={style}>
                        {(t.styles as Record<string, string>)[style] || style}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                  {t.artistApplication.bio}
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  placeholder={t.artistApplication.bioPlaceholder}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                  {t.artistApplication.sampleWork}
                </label>
                <input
                  type="text"
                  value={formData.sampleWork}
                  onChange={(e) => setFormData({ ...formData, sampleWork: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  placeholder={t.artistApplication.sampleWorkPlaceholder}
                />
              </div>

              {error && (
                <div className="p-3 bg-[#FBEAE6] rounded border border-[#E0A192] text-xs text-[#8C2711] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#8C2711] hover:bg-[#6E1C0A] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? t.artistApplication.submittingBtn : t.artistApplication.submitBtn}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F0E5] border border-[#426B43] flex items-center justify-center mx-auto text-[#426B43]">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-serif-display font-bold text-[#241A14]">
                {t.artistApplication.submittedTitle}
              </h4>
              <p className="text-xs sm:text-sm text-[#665141] max-w-md mx-auto">
                {t.artistApplication.submittedDesc}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#8C2711] text-white rounded text-xs font-semibold cursor-pointer"
              >
                {t.artistApplication.closeBtn}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
