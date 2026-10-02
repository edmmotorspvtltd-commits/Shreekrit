import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Check, Palette, Send, FileText } from 'lucide-react';
import { Artist } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CommissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  artists: Artist[];
  preselectedArtist?: string;
  preselectedTheme?: string;
}

export const CommissionModal: React.FC<CommissionModalProps> = ({
  isOpen,
  onClose,
  artists,
  preselectedArtist,
  preselectedTheme
}) => {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Identity, budget and notes are left blank; only the selects carry a
  // starting option to pick from.
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    artist: preselectedArtist || artists[0]?.name || 'Any Available Master',
    theme: preselectedTheme || 'Tree of Life with Personal Family Motifs',
    style: 'Kachni (Fine Line Inking)',
    size: 'Large Wall Canvas (36" × 24")',
    pigmentPreference: '100% Organic Earth & Plant Pigments',
    budgetRange: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/commissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.name,
          customerEmail: formData.email,
          subject: `${formData.theme} — ${formData.style} (artist: ${formData.artist})`,
          description: [
            `Artist: ${formData.artist}`,
            `Theme: ${formData.theme}`,
            `Style: ${formData.style}`,
            `Size: ${formData.size}`,
            `Pigments: ${formData.pigmentPreference}`,
            formData.phone ? `Phone: ${formData.phone}` : '',
            formData.notes ? `Notes: ${formData.notes}` : ''
          ].filter(Boolean).join('\n'),
          budget: formData.budgetRange || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Commission request failed');
      }

      setSubmitted(true);
    } catch {
      setSubmitError('Something went wrong sending your request. Please try again, or email shreekrit06@gmail.com directly.');
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
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif-display font-bold text-lg text-[#241A14]">
                {t.commission.title}
              </h3>
              <p className="text-xs text-[#7A6452]">
                {t.commission.subtitle}
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
                {t.commission.descriptionNotice}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.commission.yourName}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.commission.email}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.commission.preferredArtist}
                  </label>
                  <select
                    value={formData.artist}
                    onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  >
                    {artists.map(a => (
                      <option key={a.id} value={a.name}>{a.name} ({a.village})</option>
                    ))}
                    <option value="Any Available Master">Recommend Best Master for Subject</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.commission.desiredTheme}
                  </label>
                  <select
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  >
                    <option value="Tree of Life with Personal Family Motifs">Sacred Tree of Life (Kalpavriksha)</option>
                    <option value="Radha Krishna Divine Love">Radha Krishna under Kadamba</option>
                    <option value="Surya Devata Solar Mandala">Surya Devata Radiant Mandala</option>
                    <option value="Nuptial Kohbar Chamber Blessing">Kohbar Wedding Chamber Blessing</option>
                    <option value="Goddess Durga / Shakti Iconography">Goddess Durga / Shakti Iconography</option>
                    <option value="Custom Family Narrative">Custom Family Heritage Story</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.commission.dimensions}
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  >
                    <option value={'Medium (24" × 18")'}>{'Medium (24" × 18" / 60 × 45 cm)'}</option>
                    <option value={'Large Wall Canvas (36" × 24")'}>{'Large Wall Canvas (36" × 24" / 90 × 60 cm)'}</option>
                    <option value={'Grand Heritage Centerpiece (48" × 36")'}>{'Grand Heritage Centerpiece (48" × 36" / 120 × 90 cm)'}</option>
                    <option value="Custom Architectural Scale">Custom Architectural Scale</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                    {t.commission.budgetRange}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $800 – $1,500 USD"
                    value={formData.budgetRange}
                    onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })}
                    className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A4535] mb-1">
                  {t.commission.notes}
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 text-base rounded border border-[#D5C3A5] bg-[#FAF5EA] focus:outline-[#8C2711]"
                  placeholder={t.commission.notesPlaceholder}
                />
              </div>

              <div className="pt-2 space-y-3">
                {submitError && (
                  <div className="p-3 bg-[#FBEAE6] rounded border border-[#E0A192] text-xs text-[#8C2711]">
                    {submitError}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#8C2711] hover:bg-[#6E1C0A] disabled:opacity-60 disabled:cursor-not-allowed text-white rounded text-sm font-semibold tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.commission.submitBtn}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-[#E8F0E5] border border-[#426B43] flex items-center justify-center mx-auto text-[#426B43]">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-serif-display font-bold text-[#241A14]">
                {t.commission.submittedTitle}
              </h4>
              <p className="text-xs sm:text-sm text-[#665141] max-w-md mx-auto">
                {t.commission.submittedDesc}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#8C2711] text-white rounded text-xs font-semibold cursor-pointer"
              >
                {t.commission.closeBtn}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
