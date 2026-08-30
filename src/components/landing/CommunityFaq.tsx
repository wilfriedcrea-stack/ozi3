import React, { useState } from 'react';
import { 
  HelpCircle, 
  ChevronDown, 
  Star, 
  Users
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Application Mobile',
    question: 'Comment installer l\'APK OZI sur mon téléphone Android ?',
    answer: 'C\'est très simple : téléchargez le fichier APK (14.8 Mo) depuis le bouton en haut de page. Ouvrez ensuite le fichier téléchargé. Si votre smartphone vous demande une autorisation, cochez « Autoriser cette source ». L\'application s\'installe en moins de 10 secondes et est 100% sécurisée.'
  },
  {
    category: 'Fonctionnalités',
    question: 'Puis-je lire mes webtoons en mode hors-ligne sans connexion ?',
    answer: 'Oui ! L\'application mobile OZI intègre un gestionnaire de préchargement et de téléchargement hors-ligne. Vous pouvez sauvegarder vos chapitres préférés en Wi-Fi et les dévorer dans les transports ou en zone sans réseau.'
  },
  {
    category: 'Synchronisation Cloud',
    question: 'Comment fonctionne la synchronisation en temps réel avec Firebase Firestore ?',
    answer: 'La vitrine web et l\'application mobile sont connectées à la même base de données Firestore centralisée. Dès qu\'un auteur ou un administrateur publie un nouvel épisode ou modifie une série depuis le Studio, la mise à jour apparaît instantanément sur les téléphones de tous les lecteurs.'
  },
  {
    category: 'Modèle & Tarifs',
    question: 'L\'accès aux séries est-il gratuit ?',
    answer: 'La grande majorité des premiers chapitres et des séries découvertes sont 100% gratuits et sans publicité intrusive. Pour soutenir les créateurs sur les chapitres exclusifs récents, un système de pièces équitables permet de débloquer les épisodes en avant-première tout en reversant 70% aux auteurs.'
  },
  {
    category: 'Plateforme & Studio',
    question: 'À quoi sert cette vitrine officielle ?',
    answer: 'Ce site web officiel sert de vitrine pour la marque OZI : il permet aux lecteurs de télécharger l\'APK officiel en direct, de visionner les bandes-annonces, de consulter les dossiers de presse et d\'offrir aux créateurs un grand panneau d\'administration pour piloter leurs publications sur grand écran d\'ordinateur.'
  }
];

const TESTIMONIALS = [
  {
    name: 'Moussa Diop',
    role: 'Lecteur assidu • Dakar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    comment: 'L\'application est incroyablement rapide même en 3G. La Légende de Kemet est un chef-d\'œuvre absolu, fier de voir notre mythologie mise en valeur !',
    rating: 5,
    series: 'La Légende de Kemet'
  },
  {
    name: 'Audrey N\'Guessan',
    role: 'Fan de Webtoons • Abidjan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    comment: 'Neo-Abidjan 2088 m\'a scotché dès le premier épisode. Le lecteur vertical est super ergonomique sur mon téléphone.',
    rating: 5,
    series: 'Neo-Abidjan 2088'
  },
  {
    name: 'Benoît Mbeki',
    role: 'Artiste illustrateur • Yaoundé',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    comment: 'Le studio d\'administration sur grand écran est un régal pour uploader mes planches. Enfin une plateforme qui respecte et rémunère les artistes.',
    rating: 5,
    series: 'Créateur partenaire'
  }
];

export const CommunityFaq: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  return (
    <section id="section-community" className="py-24 bg-[#07080c] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ff5a50]/15 border border-[#ff5a50]/30 text-[#ff6b5b] text-xs font-bold uppercase tracking-wider mb-4 font-almodobar">
            <Users className="w-4 h-4" />
            <span>Communauté & Réponses</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-almodobar">
            Ce que Disent Nos Lecteurs & FAQ
          </h2>
          <p className="text-base sm:text-lg text-slate-300 mt-4 leading-relaxed font-body">
            Découvrez les retours de la communauté OZI et toutes les réponses à vos questions techniques et éditoriales.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-[#0d0e15] border border-slate-800 flex flex-col justify-between shadow-xl"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 italic font-body">
                  « {t.comment} »
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-[#ff5a50]/40" />
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white font-almodobar">{t.name}</span>
                  <span className="text-[11px] text-slate-500 font-body">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Accordion Box */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-black text-white flex items-center justify-center gap-2 font-almodobar">
              <HelpCircle className="w-6 h-6 text-[#ff5a50]" />
              <span>Foire Aux Questions Fréquentes</span>
            </h3>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'bg-[#0d0e15] border-[#ff5a50]/50 shadow-lg glow-ozi' 
                      : 'bg-[#0d0e15]/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-black text-sm sm:text-base text-slate-100 font-almodobar"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown className={`w-5 h-5 text-[#ff5a50] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-4 animate-in fade-in font-body">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
