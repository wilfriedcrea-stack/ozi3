import React from 'react';
import { Chapter } from '../../../types';
import { ChapterRow } from './ChapterRow';

interface ChapterListProps {
  chapters: Chapter[];
  seriesCoverUrl?: string;
  seriesSlugOrId: string;
  onSelectChapter: (chapterId: string) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  chapters,
  seriesCoverUrl,
  seriesSlugOrId,
  onSelectChapter
}) => {
  return (
    <div className="w-full bg-[#000000]" role="feed" aria-label="Liste chronologique des chapitres">
      {chapters.map((chapter) => (
        <ChapterRow
          key={chapter.id}
          chapter={chapter}
          seriesCoverUrl={seriesCoverUrl}
          seriesSlugOrId={seriesSlugOrId}
          onSelectChapter={onSelectChapter}
        />
      ))}
    </div>
  );
};
