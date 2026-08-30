import React, { useState } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  EyeOff, 
  AlertTriangle, 
  MessageSquare, 
  Filter, 
  Search, 
  Clock, 
  FileText, 
  UserCheck, 
  History, 
  ShieldCheck, 
  Trash2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { ReportedComment, CreatorSubmission, ModerationLog } from '../../types';

export const AdminModerationManager: React.FC = () => {
  const { 
    reportedComments, 
    moderateComment, 
    deleteReportedComment,
    submissions, 
    updateSubmissionStatus,
    moderationLogs,
    adminUser,
    series
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'comments' | 'submissions' | 'compliance' | 'audit'>('comments');
  const [commentFilter, setCommentFilter] = useState<'all' | 'pending' | 'hidden' | 'approved'>('pending');
  const [commentReasonFilter, setCommentReasonFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selected item modal/drawer for deep inspection
  const [selectedComment, setSelectedComment] = useState<ReportedComment | null>(null);
  const [moderatorNote, setModeratorNote] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<CreatorSubmission | null>(null);

  // Filtered comments
  const filteredComments = reportedComments.filter(c => {
    const matchesStatus = commentFilter === 'all' || c.status === commentFilter;
    const matchesReason = commentReasonFilter === 'all' || c.reportedReason === commentReasonFilter;
    const matchesSearch = c.commentText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.seriesTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesReason && matchesSearch;
  });

  const pendingCommentsCount = reportedComments.filter(c => c.status === 'pending').length;
  const pendingSubmissionsCount = submissions.filter(s => s.status === 'pending').length;

  const handleModerateCommentAction = (id: string, action: 'approved' | 'hidden' | 'deleted') => {
    moderateComment(id, action, moderatorNote);
    setSelectedComment(null);
    setModeratorNote('');
  };

  const getReasonBadge = (reason: ReportedComment['reportedReason']) => {
    switch (reason) {
      case 'spam':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">Spam / Pub</span>;
      case 'harassment':
      case 'hate_speech':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">Harcèlement / Haine</span>;
      case 'spoiler':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">Spoiler non masqué</span>;
      case 'copyright':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Droits d'auteur</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-700 text-zinc-300">Contenu inapproprié</span>;
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-8 max-w-7xl mx-auto w-full font-sans">
      
      {/* Top Banner with Admin Identity & Security status */}
      <div className="rounded-3xl bg-gradient-to-r from-[#12121c] via-[#101018] to-[#0a0a0f] border border-[#222238] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Centre de Modération & Salubrité OZI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Modération & Conformité Panafricaine
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-2xl">
            Gestion centralisée des signalements de la communauté, validation éditoriale des planches créateurs et audit de sécurité opéré par <strong className="text-amber-400">{adminUser.email}</strong>.
          </p>
        </div>

        {/* Quick Badges */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Signalements actifs</div>
              <div className="text-base font-black text-white">{pendingCommentsCount} à traiter</div>
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <div>
              <div className="text-[10px] text-zinc-400 uppercase font-bold">Candidatures Artistes</div>
              <div className="text-base font-black text-white">{pendingSubmissionsCount} en attente</div>
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-96 h-full bg-rose-500/5 blur-3xl pointer-events-none" />
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#202030] pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab('comments')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'comments'
              ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Commentaires Signalés</span>
          {pendingCommentsCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-white/20 text-white font-bold">
              {pendingCommentsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('submissions')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'submissions'
              ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Projets & Candidatures</span>
          {pendingSubmissionsCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-md bg-black/20 text-zinc-950 font-bold">
              {pendingSubmissionsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('compliance')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'compliance'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Charte & Classification d'Âge</span>
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeSubTab === 'audit'
              ? 'bg-zinc-800 text-zinc-100 shadow-lg'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Journal d'Audit Modérateur</span>
        </button>
      </div>

      {/* TAB 1: Reported Comments */}
      {activeSubTab === 'comments' && (
        <div className="flex flex-col gap-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-zinc-400 mr-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" /> Statut :
              </span>
              {(['all', 'pending', 'hidden', 'approved'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => setCommentFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    commentFilter === status
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {status === 'all' && 'Tous'}
                  {status === 'pending' && `En attente (${reportedComments.filter(c => c.status === 'pending').length})`}
                  {status === 'hidden' && 'Masqués'}
                  {status === 'approved' && 'Approuvés'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Rechercher mot-clé, utilisateur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 pl-9 pr-3 py-2 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <select
                value={commentReasonFilter}
                onChange={(e) => setCommentReasonFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-rose-500"
              >
                <option value="all">Tous les motifs</option>
                <option value="spam">Spam / Publicité</option>
                <option value="harassment">Harcèlement / Insultes</option>
                <option value="spoiler">Spoilers</option>
                <option value="copyright">Droits d'auteur</option>
              </select>
            </div>
          </div>

          {/* Comments List */}
          {filteredComments.length === 0 ? (
            <div className="p-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col items-center justify-center text-center gap-3">
              <ShieldCheck className="w-12 h-12 text-emerald-400/60" />
              <h3 className="text-base font-bold text-white">Aucun commentaire signalé dans cette catégorie</h3>
              <p className="text-xs text-zinc-400 max-w-md">
                L'espace communautaire OZI est propre et conforme aux standards de bienveillance.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredComments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getReasonBadge(comment.reportedReason)}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">
                        {comment.reportCount} signalements
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {comment.seriesTitle} {comment.chapterNumber ? `• Épisode ${comment.chapterNumber}` : ''}
                      </span>
                      <span className="text-zinc-500 text-xs">•</span>
                      <span className="text-xs text-zinc-400">Par <strong>{comment.userName}</strong> ({comment.userEmail})</span>
                      <span className="text-zinc-500 text-xs">•</span>
                      <span className="text-[11px] text-zinc-500">{new Date(comment.createdAt).toLocaleString('fr-FR')}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-sm text-zinc-200 font-mono break-all">
                      "{comment.commentText}"
                    </div>

                    {comment.moderatorNotes && (
                      <div className="text-xs text-amber-300/90 italic bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                        Note Modérateur : {comment.moderatorNotes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleModerateCommentAction(comment.id, 'approved')}
                      title="Valider et rétablir le commentaire"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approuver</span>
                    </button>

                    <button
                      onClick={() => handleModerateCommentAction(comment.id, 'hidden')}
                      title="Masquer le commentaire des lecteurs"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-colors"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span>Masquer</span>
                    </button>

                    <button
                      onClick={() => deleteReportedComment(comment.id)}
                      title="Supprimer définitivement"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Submissions & Creator Review */}
      {activeSubTab === 'submissions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              onClick={() => setSelectedSubmission(sub)}
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
                    {sub.status === 'pending' ? 'En attente' : sub.status === 'accepted' ? 'Accepté' : sub.status === 'reviewed' ? 'Examiné' : 'Rejeté'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{sub.seriesTitle}</h3>
                <div className="text-xs text-zinc-400 mb-3">
                  Par <strong className="text-zinc-200">{sub.creatorName}</strong> ({sub.country})
                </div>

                <p className="text-xs text-zinc-300 line-clamp-3 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  {sub.pitch}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span>{new Date(sub.submittedAt).toLocaleDateString('fr-FR')}</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  Examiner les planches <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Compliance & Age Classification */}
      {activeSubTab === 'compliance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Règles de Classification OZI Standard</span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Toutes les œuvres publiées sur OZI sont soumises à la validation d'un modérateur accrédité avant d'être référencées sur le catalogue public ou l'application Android.
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black shrink-0">Tous publics</span>
                  <div className="text-xs text-zinc-300">
                    <strong className="text-white block mb-0.5">Adapté à tous les lecteurs</strong>
                    Aventures, shonen légers, contes éducatifs sans violence explicite ni vulgarité.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-black shrink-0">12+ & 16+</span>
                  <div className="text-xs text-zinc-300">
                    <strong className="text-white block mb-0.5">Adolescents et Jeunes Adultes</strong>
                    Combats intenses, scènes fantastiques sombres, thèmes matures avec avertissement contextuel.
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-start gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-400 text-xs font-black shrink-0">18+ (VIP Uniquement)</span>
                  <div className="text-xs text-zinc-300">
                    <strong className="text-white block mb-0.5">Public Averti & Verrouillage Parental</strong>
                    Thrillers psychologiques lourds, violence stylisée adulte. Accès strictement réservé aux comptes majeurs vérifiés.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Protection des Droits d'Auteur & Propriété Intellectuelle</span>
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed">
                OZI garantit aux créateurs 100% de la propriété de leurs univers originaux. Les artistes conservent l'intégralité de leurs droits moraux et d'adaptation (séries animées, jeux vidéo, cinéma).
              </p>
            </div>
          </div>

          {/* Quick Stats sidebar */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">Statistiques du Catalogue</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Séries actives</span>
                  <span className="font-bold text-white">{series.length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Chapitres sous modération</span>
                  <span className="font-bold text-emerald-400">100% Validés</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Délai moyen de revue</span>
                  <span className="font-bold text-amber-400">&lt; 24h</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Audit Logs */}
      {activeSubTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <span>Historique Récent des Décisions de Modération</span>
            </h3>
            <span className="text-xs font-mono text-zinc-400">Opérateur : {adminUser.email}</span>
          </div>

          <div className="space-y-2.5">
            {moderationLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-amber-400 font-bold text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-zinc-200">{log.details}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-[11px] shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedSubmission(null)}
        >
          <div 
            className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl p-6 sm:p-8 text-zinc-100 flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Revue Projet Créateur
                </span>
                <h3 className="text-xl font-black text-white">{selectedSubmission.seriesTitle}</h3>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div>
                  <span className="text-zinc-500 block">Créateur</span>
                  <strong className="text-zinc-200">{selectedSubmission.creatorName}</strong>
                </div>
                <div>
                  <span className="text-zinc-500 block">Pays & Contact</span>
                  <strong className="text-zinc-200">{selectedSubmission.country} • {selectedSubmission.email}</strong>
                </div>
              </div>

              <div>
                <span className="text-zinc-400 font-bold block mb-1">Synopsis & Pitch</span>
                <p className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 leading-relaxed">
                  {selectedSubmission.pitch}
                </p>
              </div>

              {selectedSubmission.portfolioUrl && (
                <a
                  href={selectedSubmission.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold hover:bg-amber-500/20 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Consulter le portfolio / Planches d'essai
                  </span>
                  <span className="text-[10px] underline">Ouvrir le lien</span>
                </a>
              )}
            </div>

            {/* Decision buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  updateSubmissionStatus(selectedSubmission.id, 'rejected');
                  setSelectedSubmission(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-300 text-xs font-bold transition-colors"
              >
                Refuser le projet
              </button>
              <button
                onClick={() => {
                  updateSubmissionStatus(selectedSubmission.id, 'reviewed');
                  setSelectedSubmission(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold transition-colors"
              >
                Marquer comme Examiné
              </button>
              <button
                onClick={() => {
                  updateSubmissionStatus(selectedSubmission.id, 'accepted');
                  setSelectedSubmission(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                Accepter & Inviter au Studio OZI
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
