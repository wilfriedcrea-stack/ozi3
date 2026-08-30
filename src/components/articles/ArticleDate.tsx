import React from 'react';
import { Clock } from 'lucide-react';

interface ArticleDateProps {
  date: string;
  className?: string;
}

export const ArticleDate: React.FC<ArticleDateProps> = ({ date, className = '' }) => {
  return (
    <div className={`flex items-center gap-1 text-[#ff5a50] font-bold uppercase tracking-wider text-[9px] sm:text-[10px] select-none ${className}`}>
      <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#ff5a50] shrink-0 stroke-[2.5]" />
      <time dateTime="2026-01-01">{date}</time>
    </div>
  );
};
