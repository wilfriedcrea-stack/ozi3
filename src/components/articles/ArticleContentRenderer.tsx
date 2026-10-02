import React from 'react';

interface ArticleContentRendererProps {
  content?: string;
  className?: string;
}

export const ArticleContentRenderer: React.FC<ArticleContentRendererProps> = ({ content = '', className = '' }) => {
  if (!content) return null;

  // Split content into major blocks separated by double newlines or single newlines with markdown markers
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-6 text-zinc-200 text-base sm:text-lg leading-relaxed ${className}`}>
      {rawBlocks.map((block, blockIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // 1. Check for standalone Markdown Image: ![Caption](imageUrl)
        const imageMatch = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
        if (imageMatch) {
          const caption = imageMatch[1];
          const url = imageMatch[2];
          return (
            <figure key={`img-block-${blockIdx}`} className="my-8 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl">
              <div className="relative overflow-hidden bg-zinc-900 flex items-center justify-center">
                <img
                  src={url}
                  alt={caption || 'Illustration article OZI'}
                  className="w-full h-auto max-h-[650px] object-cover sm:object-contain mx-auto"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
              {caption && (
                <figcaption className="p-3 text-center text-xs sm:text-sm text-zinc-400 italic bg-zinc-900/60 border-t border-zinc-800/80">
                  {caption}
                </figcaption>
              )}
            </figure>
          );
        }

        // 2. Check for raw Image URL on standalone line
        if (/^https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif|avif)(\?[^\s]*)?$/i.test(trimmed)) {
          return (
            <figure key={`raw-img-${blockIdx}`} className="my-8 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl">
              <img
                src={trimmed}
                alt="Illustration OZI Magazine"
                className="w-full h-auto max-h-[650px] object-cover sm:object-contain mx-auto"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </figure>
          );
        }

        // 3. Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={`h3-${blockIdx}`} className="text-lg sm:text-xl font-black text-white tracking-tight mt-8 mb-3 font-almodobar">
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={`h2-${blockIdx}`} className="text-xl sm:text-2xl font-black text-white tracking-tight mt-10 mb-4 font-almodobar border-l-4 border-[#ff8679] pl-3">
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={`h1-${blockIdx}`} className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-10 mb-4 font-almodobar">
              {trimmed.replace(/^#\s+/, '')}
            </h1>
          );
        }

        // 4. Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={`quote-${blockIdx}`} className="my-6 p-4 sm:p-5 rounded-2xl bg-zinc-900/70 border-l-4 border-amber-500 text-zinc-200 italic font-medium">
              {trimmed.replace(/^>\s+/, '')}
            </blockquote>
          );
        }

        // 5. Paragraph with potential inline images or markdown
        // Check if paragraph contains embedded images
        if (trimmed.includes('![') && trimmed.includes('](')) {
          const parts = trimmed.split(/(!\[.*?\]\(https?:\/\/[^\s)]+\))/g);
          return (
            <div key={`mixed-p-${blockIdx}`} className="space-y-4 leading-relaxed">
              {parts.map((part, partIdx) => {
                const subImgMatch = part.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/);
                if (subImgMatch) {
                  const subCaption = subImgMatch[1];
                  const subUrl = subImgMatch[2];
                  return (
                    <figure key={`sub-img-${partIdx}`} className="my-6 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-xl">
                      <img
                        src={subUrl}
                        alt={subCaption || 'Illustration article'}
                        className="w-full h-auto max-h-[600px] object-cover sm:object-contain mx-auto"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                      {subCaption && (
                        <figcaption className="p-2.5 text-center text-xs text-zinc-400 italic bg-zinc-900/50">
                          {subCaption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }
                if (!part.trim()) return null;
                return (
                  <p key={`sub-text-${partIdx}`} className="leading-relaxed">
                    {formatInlineText(part)}
                  </p>
                );
              })}
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={`p-${blockIdx}`} className="leading-relaxed">
            {formatInlineText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// Helper to format **bold** and *italic*
function formatInlineText(text: string): React.ReactNode {
  // Simple regex parser for **bold** and *italic*
  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return <strong key={idx} className="font-bold text-white">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
      return <em key={idx} className="italic text-zinc-300">{token.slice(1, -1)}</em>;
    }
    return token;
  });
}
