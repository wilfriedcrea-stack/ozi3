import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  Camera,
  Hash,
  Loader2,
  MessageCircle,
  Reply,
  Send,
  Smile,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import {
  deleteDiscussionMessage,
  getOrCreateGuestSessionId,
  getSavedGuestName,
  isAdminOrWilfriedEmail,
  saveGuestName,
  sendDiscussionMessage,
  subscribeToDiscussionMessages,
} from '../../services/discussionService';
import { DiscussionMessage, DiscussionReplyRef } from '../../types';
import { GalleryTab } from './GalleryTab';

const QUICK_EMOJIS = ['😄', '🔥', '❤️', '👏', '😍', '😂', '🤯', '✨', '🎨', '📖'];
const INITIAL_LIMIT = 80;
const LOAD_STEP = 50;
const SEND_COOLDOWN_MS = 1200;

function formatMessageTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  if (isToday) return timeStr;

  const dayStr = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(date);

  return `${dayStr} · ${timeStr}`;
}

interface MessageAvatarProps {
  message: DiscussionMessage;
  isAdminAuthor?: boolean;
}

const MessageAvatar: React.FC<MessageAvatarProps> = ({ message, isAdminAuthor = false }) => {
  const [imgFailed, setImgFailed] = useState(false);

  if (message.isGuest) {
    return (
      <div
        className="w-10 h-10 rounded-full bg-zinc-800/90 border border-zinc-700/80 flex items-center justify-center text-zinc-400 shrink-0 mt-0.5"
        title="Visiteur (sans compte)"
      >
        <UserRound className="w-5 h-5" />
      </div>
    );
  }

  const ringClass = isAdminAuthor
    ? 'bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 p-[2.5px] ring-2 ring-yellow-400/80 shadow-[0_0_12px_rgba(250,204,21,0.35)]'
    : 'bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5';

  if (message.authorPhotoURL && !imgFailed) {
    return (
      <div className={`w-10 h-10 rounded-full overflow-hidden shrink-0 mt-0.5 ${ringClass}`}>
        <img
          src={message.authorPhotoURL}
          alt={message.authorName}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover rounded-full bg-zinc-900"
        />
      </div>
    );
  }

  return (
    <div className={`w-10 h-10 rounded-full shrink-0 mt-0.5 ${ringClass}`}>
      <div
        className={`w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-sm font-black ${
          isAdminAuthor ? 'text-yellow-300' : 'text-[#ff8679]'
        }`}
      >
        {message.authorName.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};

export const DiscussionPage: React.FC = () => {
  const {
    currentUser,
    readerProfile,
    users,
    adminAuth,
    openAuthModal,
    openProfileModal,
    discussionChannel: activeChannel,
    setDiscussionChannel: setActiveChannel,
  } = useData();

  const [galleryCount, setGalleryCount] = useState<number | null>(null);
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [limitCount, setLimitCount] = useState(INITIAL_LIMIT);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [guestName, setGuestName] = useState(() => getSavedGuestName());
  const guestSessionId = useMemo(() => getOrCreateGuestSessionId(), []);
  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<DiscussionReplyRef | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasNewUnreadBelow, setHasNewUnreadBelow] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const lastSendTimestampRef = useRef(0);
  const forceScrollBottomRef = useRef(true);

  const currentMemberName =
    readerProfile?.displayName ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    'Lecteur OZI';
  const currentMemberPhoto = readerProfile?.photoURL || currentUser?.photoURL || '';

  const isCurrentUserAdmin = useMemo(() => {
    if (!currentUser) return false;
    const email = (currentUser.email || readerProfile?.email || '').toLowerCase();
    const isWilfried = isAdminOrWilfriedEmail(email);
    const matchedRole = users?.find(
      (u) => u.id === currentUser.uid || (email && u.email?.toLowerCase() === email)
    )?.role;
    const isStaffRole =
      matchedRole === 'super_admin' ||
      matchedRole === 'moderator' ||
      (matchedRole as string) === 'admin';
    return Boolean(isWilfried || isStaffRole || adminAuth.isAuthenticated);
  }, [currentUser, readerProfile?.email, users, adminAuth.isAuthenticated]);

  useEffect(() => {
    setSyncError(null);
    const unsubscribe = subscribeToDiscussionMessages(
      limitCount,
      (incoming) => {
        setMessages(incoming);
        setIsLoading(false);
        setSyncError(null);
      },
      (errMsg) => {
        setIsLoading(false);
        setSyncError(errMsg);
      }
    );

    return () => unsubscribe();
  }, [limitCount]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setHasNewUnreadBelow(false);
    isNearBottomRef.current = true;
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const newCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = newCount;

    if (newCount === 0) return;

    if (forceScrollBottomRef.current) {
      forceScrollBottomRef.current = false;
      requestAnimationFrame(() => scrollToBottom('auto'));
      return;
    }

    if (newCount > prevCount) {
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom('smooth'));
      } else {
        setHasNewUnreadBelow(true);
      }
    }
  }, [messages]);

  const handleFeedScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom <= 140;
    isNearBottomRef.current = nearBottom;
    if (nearBottom && hasNewUnreadBelow) {
      setHasNewUnreadBelow(false);
    }
  };

  const handleGuestNameChange = (value: string) => {
    setGuestName(value);
    saveGuestName(value);
  };

  const handleInsertEmoji = (emoji: string) => {
    setMessageText((prev) => {
      if (prev.length + emoji.length > 1000) return prev;
      return `${prev}${emoji}`;
    });
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleReplyClick = (msg: DiscussionMessage) => {
    const cleanExcerpt = msg.text.replace(/\s+/g, ' ').trim().slice(0, 110);
    setReplyTo({
      id: msg.id,
      authorName: msg.authorName,
      excerpt: cleanExcerpt,
    });
    textareaRef.current?.focus();
  };

  const handleDelete = async (messageId: string) => {
    setDeletingId(messageId);
    setSendError(null);
    const res = await deleteDiscussionMessage(messageId);
    if (!res.success && res.error) {
      setSendError(res.error);
    }
    setDeletingId(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSendError(null);

    const trimmed = messageText.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (now - lastSendTimestampRef.current < SEND_COOLDOWN_MS) {
      setSendError('Veuillez patienter un instant avant d\'envoyer un autre message.');
      return;
    }

    setIsSending(true);
    lastSendTimestampRef.current = now;
    forceScrollBottomRef.current = true;

    const isGuest = !currentUser;
    const authorName = isGuest ? guestName.trim() || 'Visiteur' : currentMemberName;

    const res = await sendDiscussionMessage({
      text: trimmed,
      authorName,
      authorPhotoURL: isGuest ? '' : currentMemberPhoto,
      userId: currentUser ? currentUser.uid : null,
      guestSessionId: isGuest ? guestSessionId : undefined,
      isGuest,
      authorIsAdmin: !isGuest && isCurrentUserAdmin,
      replyTo,
    });

    setIsSending(false);

    if (res.success) {
      setMessageText('');
      setReplyTo(null);
      setShowEmojiPicker(false);
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } else {
      forceScrollBottomRef.current = false;
      setSendError(res.error || 'Impossible d\'envoyer le message.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && messageText.trim()) {
        handleSubmit();
      }
    }
  };

  return (
    <section
      id="section-discussion"
      aria-label="Salon de discussion communautaire OZI"
      className="w-full flex-1 min-h-0 flex flex-col bg-[#0b0c12]"
    >
      {/* Discord-Style Top Channel Bar */}
      <div className="shrink-0 w-full bg-[#111218] border-t border-b border-zinc-800/80 px-3 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Channel Switcher: #discussion & #galerie */}
          <div className="flex items-center gap-1 shrink-0" role="tablist" aria-label="Salons communautaires">
            <button
              id="channel-tab-discussion"
              type="button"
              role="tab"
              aria-selected={activeChannel === 'discussion'}
              onClick={() => setActiveChannel('discussion')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-sm sm:text-base font-black tracking-tight font-almodobar transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeChannel === 'discussion'
                  ? 'bg-[#1f202a] text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <Hash
                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                  activeChannel === 'discussion' ? 'text-[#ff8679]' : 'text-zinc-500'
                }`}
              />
              <span>discussion</span>
            </button>

            <button
              id="channel-tab-galerie"
              type="button"
              role="tab"
              aria-selected={activeChannel === 'galerie'}
              onClick={() => setActiveChannel('galerie')}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-sm sm:text-base font-black tracking-tight font-almodobar transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeChannel === 'galerie'
                  ? 'bg-[#1f202a] text-white'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
              }`}
            >
              <Hash
                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                  activeChannel === 'galerie' ? 'text-[#ff8679]' : 'text-zinc-500'
                }`}
              />
              <span>galerie</span>
            </button>
          </div>

          <span className="hidden md:inline-block h-4 w-px bg-zinc-800 mx-1 shrink-0" />
          <p className="hidden md:flex items-center gap-2 text-xs text-zinc-400 truncate font-body">
            {activeChannel === 'discussion' ? (
              <>
                <span className="truncate">Salon ouvert en direct pour toute la communauté OZI</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-zinc-300 font-medium whitespace-nowrap shrink-0">
                  {messages.length} message{messages.length > 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <>
                <span className="truncate">Galerie réservée pour vos créations (images uniquement)</span>
                {galleryCount !== null && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums text-zinc-300 font-medium whitespace-nowrap shrink-0">
                      {galleryCount} création{galleryCount > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </>
            )}
          </p>
        </div>

        {/* Active Member Identity */}
        {currentUser && (
          <button
            type="button"
            onClick={() => openProfileModal()}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border transition-colors cursor-pointer shrink-0 ${
              isCurrentUserAdmin ? 'border-yellow-400/50' : 'border-zinc-800'
            }`}
            title="Modifier ma photo de profil"
          >
            <div
              className={`w-7 h-7 rounded-full overflow-hidden shrink-0 ${
                isCurrentUserAdmin
                  ? 'bg-gradient-to-tr from-yellow-300 via-amber-400 to-yellow-500 p-[2px] ring-2 ring-yellow-400/80 shadow-[0_0_10px_rgba(250,204,21,0.35)]'
                  : 'bg-gradient-to-tr from-[#ff8679] to-[#fb923c] p-0.5'
              }`}
            >
              {currentMemberPhoto ? (
                <img
                  src={currentMemberPhoto}
                  alt={currentMemberName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-full bg-zinc-900"
                />
              ) : (
                <div
                  className={`w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-[11px] font-black ${
                    isCurrentUserAdmin ? 'text-yellow-300' : 'text-[#ff8679]'
                  }`}
                >
                  {currentMemberName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span
              className={`text-xs font-bold truncate max-w-[120px] hidden sm:inline ${
                isCurrentUserAdmin ? 'text-yellow-300' : 'text-white'
              }`}
            >
              {currentMemberName}
            </span>
            {isCurrentUserAdmin && (
              <span className="hidden sm:inline text-[11px] font-bold text-yellow-400">
                Admin
              </span>
            )}
            <Camera
              className={`w-3.5 h-3.5 shrink-0 ${
                isCurrentUserAdmin ? 'text-yellow-400' : 'text-[#ff8679]'
              }`}
            />
          </button>
        )}
      </div>

      {activeChannel === 'galerie' ? (
        <GalleryTab onCountChange={setGalleryCount} />
      ) : (
        <>
          {/* Full-Page Scrollable Message Feed */}
          <div className="relative flex-1 min-h-0 w-full">
            <div
              ref={scrollContainerRef}
              onScroll={handleFeedScroll}
              className="h-full w-full overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 space-y-0.5"
            >
          {/* Load Older Messages */}
          {messages.length >= limitCount && (
            <div className="flex justify-center pb-3">
              <button
                type="button"
                onClick={() => setLimitCount((prev) => prev + LOAD_STEP)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Charger les messages précédents
              </button>
            </div>
          )}

          {/* Sync Error Banner */}
          {syncError && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3 mb-3">
              <span>{syncError}</span>
              <button
                type="button"
                onClick={() => setLimitCount((c) => c)}
                className="underline font-bold text-white cursor-pointer shrink-0"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Initial Loading Skeletons */}
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div key={idx} className="flex items-start gap-3.5 px-3 py-2 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-36 bg-zinc-800 rounded" />
                    <div className="h-4 w-2/3 bg-zinc-800/70 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#ff8679] mb-4">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-white font-almodobar">
                Bienvenue dans #discussion
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-md font-body">
                C'est le début de ce salon. Connecté ou simple visiteur, écrivez votre premier message ci-dessous !
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnAccountMessage =
                Boolean(currentUser) && !msg.isGuest && msg.userId === currentUser?.uid;
              const isAdminAuthor = Boolean(
                !msg.isGuest &&
                  (msg.authorIsAdmin || (isOwnAccountMessage && isCurrentUserAdmin))
              );
              const canDelete = Boolean(adminAuth.isAuthenticated || isOwnAccountMessage);

              return (
                <div
                  key={msg.id}
                  className="group flex items-start gap-3.5 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                  <MessageAvatar message={msg} isAdminAuthor={isAdminAuthor} />

                  <div className="flex-1 min-w-0">
                    {/* Author + Quiet Unboxed Metadata */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5 min-w-0">
                        <span
                          className={`text-sm font-bold truncate max-w-[200px] sm:max-w-xs ${
                            isAdminAuthor
                              ? 'text-yellow-300'
                              : msg.isGuest
                              ? 'text-zinc-300'
                              : 'text-white'
                          }`}
                        >
                          {msg.authorName}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-body whitespace-nowrap">
                          {isAdminAuthor ? (
                            <span className="text-yellow-400 font-bold">Admin</span>
                          ) : msg.isGuest ? (
                            'Visiteur'
                          ) : (
                            'Membre'
                          )}
                          <span aria-hidden="true" className="mx-1.5">·</span>
                          <span className="tabular-nums font-mono text-[10px]">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </span>
                      </div>

                      {/* Row Quick Actions */}
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReplyClick(msg)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                          title={`Répondre à ${msg.authorName}`}
                          aria-label={`Répondre à ${msg.authorName}`}
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(msg.id)}
                            disabled={deletingId === msg.id}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
                            title="Supprimer ce message"
                            aria-label="Supprimer ce message"
                          >
                            {deletingId === msg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Optional Quoted Reply */}
                    {msg.replyTo && (
                      <div className="mt-1 mb-1 px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 text-xs text-zinc-400">
                        <span className="font-bold text-[#ffa296]">
                          @{msg.replyTo.authorName}
                        </span>{' '}
                        <span className="line-clamp-1">{msg.replyTo.excerpt}</span>
                      </div>
                    )}

                    {/* Message Text */}
                    <p className="text-[15px] text-zinc-200 leading-relaxed whitespace-pre-wrap break-words font-body mt-0.5">
                      {msg.text}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Jump to New Messages Button */}
        {hasNewUnreadBelow && (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff8679] hover:bg-[#eb6e60] text-white text-xs font-bold shadow-xl transition-transform hover:scale-105 cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Nouveaux messages</span>
          </button>
        )}
      </div>

      {/* Full-Width Discord-Style Composer Bar */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 w-full bg-[#111218] border-t border-zinc-800/80 px-3 sm:px-6 lg:px-8 pt-3 pb-[74px] md:pb-4 space-y-2.5"
      >
        {/* Active Reply Preview */}
        {replyTo && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs">
            <div className="min-w-0 truncate text-zinc-300">
              <span className="text-zinc-400">Réponse à </span>
              <strong className="text-[#ff8679]">@{replyTo.authorName}</strong>
              <span className="text-zinc-500"> : {replyTo.excerpt}</span>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="p-1 text-zinc-400 hover:text-white cursor-pointer shrink-0"
              aria-label="Annuler la réponse"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Guest Pseudo Strip (when not logged in) */}
        {!currentUser && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0"
                title="Icône visiteur par défaut"
              >
                <UserRound className="w-3.5 h-3.5" />
              </div>
              <label htmlFor="guest-pseudo-input" className="sr-only">
                Votre pseudo visiteur
              </label>
              <input
                id="guest-pseudo-input"
                type="text"
                maxLength={30}
                value={guestName}
                onChange={(e) => handleGuestNameChange(e.target.value)}
                placeholder="Pseudo visiteur"
                className="px-3 py-1.5 rounded-xl bg-[#1a1b24] border border-zinc-800 focus:border-[#ff8679] text-xs font-semibold text-zinc-200 placeholder-zinc-500 focus:outline-none w-44 sm:w-52"
              />
            </div>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-[11px] font-semibold text-zinc-400 hover:text-[#ff8679] transition-colors cursor-pointer"
            >
              Se connecter pour afficher sa photo de profil
            </button>
          </div>
        )}

        {/* Quick Emoji Picker */}
        {showEmojiPicker && (
          <div className="flex items-center flex-wrap gap-1.5 p-2 rounded-xl bg-[#1a1b24] border border-zinc-800">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="w-9 h-9 rounded-lg hover:bg-zinc-800 flex items-center justify-center text-lg transition-transform hover:scale-110 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Inline Send Error */}
        {sendError && (
          <div className="text-xs text-rose-400 font-medium px-1">
            {sendError}
          </div>
        )}

        {/* Discord-Style Input Dock */}
        <div className="flex items-end gap-2 bg-[#1a1b24] border border-zinc-800/90 focus-within:border-[#ff8679]/60 rounded-2xl p-1.5 transition-colors">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-2.5 min-h-[42px] min-w-[42px] rounded-xl transition-colors flex items-center justify-center cursor-pointer shrink-0 ${
              showEmojiPicker
                ? 'bg-[#ff8679]/15 text-[#ff8679]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
            }`}
            title="Ajouter un emoji"
            aria-label="Ajouter un emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <div className="relative flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              maxLength={1000}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Envoyer un message dans #discussion..."
              className="w-full px-2 py-2.5 min-h-[42px] max-h-36 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none resize-none leading-snug"
            />
            {messageText.length >= 800 && (
              <span className="absolute right-2 bottom-1 text-[10px] font-mono tabular-nums text-zinc-500">
                {messageText.length}/1000
              </span>
            )}
          </div>

          <button
            id="discussion-send-btn"
            type="submit"
            disabled={isSending || !messageText.trim()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-ozi-primary bg-ozi-primary-hover text-white font-black text-sm shadow-md glow-ozi disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap shrink-0 font-almodobar"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>
      </form>
        </>
      )}
    </section>
  );
};
