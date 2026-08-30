import React, { useState } from 'react';
import { 
  Users, 
  Mail, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  Filter, 
  MessageSquare,
  Globe
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { CreatorSubmission } from '../../types';

export const AdminSubmissionsManager: React.FC = () => {
  const { submissions, updateSubmissionStatus } = useData();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<CreatorSubmission | null>(null);
  const [notesInput, setNotesInput] = useState('');

  const filtered = submissions.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  const handleOpenDetail = (sub: CreatorSubmission) => {
    setSelectedSub(sub);
    setNotesInput(sub.editorialNotes || '');
  };

  const handleStatusChange = async (newStatus: 'pending' | 'reviewed' | 'accepted' | 'rejected') => {
    if (!selectedSub) return;
    await updateSubmissionStatus(selectedSub.id, newStatus, notesInput);
    setSelectedSub({
      ...selectedSub,
      status: newStatus,
      editorialNotes: notesInput
    });
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Candidatures & Projets Créateurs
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Passez en revue les synopsis et planches soumis par les artistes depuis la vitrine web.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">Tous les projets ({submissions.length})</option>
            <option value="pending">En attente ({submissions.filter(s => s.status === 'pending').length})</option>
            <option value="reviewed">Examinés ({submissions.filter(s => s.status === 'reviewed').length})</option>
            <option value="accepted">Acceptés ({submissions.filter(s => s.status === 'accepted').length})</option>
          </select>
        </div>
      </div>

      {/* Submissions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((sub) => (
          <div
            key={sub.id}
            onClick={() => handleOpenDetail(sub)}
            className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 transition-all cursor-pointer flex flex-col justify-between gap-4 shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {sub.genre}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  sub.status === 'pending'
                    ? 'bg-amber-500/20 text-amber-300'
                    : sub.status === 'accepted'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {sub.status === 'pending' ? 'En attente' : sub.status === 'accepted' ? 'Accepté' : 'Examiné'}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-1">{sub.seriesTitle}</h3>
              <div className="text-xs text-zinc-400 mb-3">
                Par <strong className="text-zinc-200">{sub.creatorName}</strong> ({sub.country})
              </div>

              <p className="text-xs text-zinc-400 line-clamp-3 italic leading-relaxed">
                « {sub.pitch} »
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 text-xs">
              <span className="text-zinc-500 text-[11px]">{sub.submittedAt}</span>
              <span className="text-amber-400 font-semibold">Examiner →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedSub && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedSub(null)}
        >
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-700 p-6 sm:p-8 text-zinc-100 shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {selectedSub.genre} • Soumis le {selectedSub.submittedAt}
                </span>
                <h3 className="text-xl font-black text-white">{selectedSub.seriesTitle}</h3>
              </div>
              <button 
                onClick={() => setSelectedSub(null)}
                className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Creator Profile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-500 block mb-0.5">Artiste / Auteur</span>
                <strong className="text-white text-sm">{selectedSub.creatorName}</strong>
              </div>
              <div>
                <span className="text-zinc-500 block mb-0.5">Email</span>
                <a href={`mailto:${selectedSub.email}`} className="text-amber-400 hover:underline">{selectedSub.email}</a>
              </div>
              <div>
                <span className="text-zinc-500 block mb-0.5">Pays</span>
                <span className="text-zinc-300 font-medium">{selectedSub.country}</span>
              </div>
            </div>

            {/* Pitch & Story */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Synopsis & Pitch de l'Histoire
              </h4>
              <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                {selectedSub.pitch}
              </div>
            </div>

            {/* Portfolio Links */}
            {selectedSub.portfolioUrl && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Portfolio / Planches Soumises
                </h4>
                <a
                  href={selectedSub.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-xs text-amber-400 transition-colors"
                >
                  <span className="truncate">{selectedSub.portfolioUrl}</span>
                  <ExternalLink className="w-4 h-4 shrink-0 ml-2" />
                </a>
              </div>
            )}

            {/* Editorial Notes */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Notes Internes du Comité Éditorial OZI
              </h4>
              <textarea
                rows={3}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                placeholder="Ajouter des notes, avis sur le dessin, date de rendez-vous..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Decision Status Controls */}
            <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange('reviewed')}
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
                >
                  Marquer comme Examiné
                </button>
                <button
                  onClick={() => handleStatusChange('accepted')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accepter le Projet</span>
                </button>
              </div>

              <a
                href={`mailto:${selectedSub.email}?subject=Votre projet de webtoon sur OZI: ${encodeURIComponent(selectedSub.seriesTitle)}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-bold shadow-md hover:bg-amber-400"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Répondre par Email</span>
              </a>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
