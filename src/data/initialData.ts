import { 
  Series, 
  Teaser, 
  PressRelease, 
  MediaKitAsset, 
  AppVersionInfo, 
  AnalyticsOverview,
  AdminUser,
  MonetizationSettings,
  CreatorPayout,
  ReportedComment,
  ModerationLog
} from '../types';

export const INITIAL_SERIES: Series[] = [
  {
    id: 'kemet-legend',
    title: 'La Légende de Kemet',
    slug: 'la-legende-de-kemet',
    author: 'Kofi Mensah',
    artist: 'Awa Diallo',
    country: 'Sénégal / Côte d\'Ivoire',
    synopsis: 'Dans une Afrique mythologique où les divinités du Nil et les esprits ancestraux s\'affrontent, un jeune forgeron orphelin découvre qu\'il est l\'héritier du sceptre d\'Orishas. Entre guerres de clans et pouvoirs cosmiques, sa destinée va bouleverser l\'univers.',
    genre: 'Afro-Fantasy',
    format: 'série',
    secondaryGenres: ['Action & Shonen', 'Mythologie & Histoire'],
    tags: ['Magie Noire', 'Dieux Anciens', 'Combats Épiques', 'Destinée', 'Héros'],
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.9,
    reviewsCount: 3820,
    totalReads: 320500,
    totalLikes: 54100,
    chaptersCount: 28,
    isFeatured: true,
    isExclusive: true,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: 'Tous publics',
    teaserVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    updatedAt: '2026-08-25',
    chapters: [
      {
        id: 'kemet-ch-1',
        seriesId: 'kemet-legend',
        chapterNumber: 1,
        title: 'L\'Éveil du Sceptre d\'Or',
        releaseDate: '2025-01-10',
        isFree: true,
        coinsRequired: 0,
        likesCount: 14200,
        readTimeMinutes: 6,
        summary: 'Kofi découvre une roche incandescente au fond de la forge interdite de son grand-père.',
        pages: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
        ]
      },
      {
        id: 'kemet-ch-2',
        seriesId: 'kemet-legend',
        chapterNumber: 2,
        title: 'L\'Attaque des Gardiens d\'Ombre',
        releaseDate: '2025-01-17',
        isFree: true,
        coinsRequired: 0,
        likesCount: 11300,
        readTimeMinutes: 7,
        summary: 'Les émissaires du royaume des Ténèbres assiègent la cité sacrée.',
        pages: [
          'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80'
        ]
      },
      {
        id: 'kemet-ch-3',
        seriesId: 'kemet-legend',
        chapterNumber: 3,
        title: 'Le Pacte des Sept Flammes',
        releaseDate: '2025-01-24',
        isFree: false,
        coinsRequired: 15,
        likesCount: 9800,
        readTimeMinutes: 8,
        summary: 'Pour sauver les siens, Kofi doit accepter le rituel de passage ancestral.',
        pages: [
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
        ]
      }
    ]
  },
  {
    id: 'neo-abidjan-2088',
    title: 'Neo-Abidjan 2088',
    slug: 'neo-abidjan-2088',
    author: 'Yannick Bamba',
    artist: 'Tidiane Traoré',
    country: 'Côte d\'Ivoire',
    synopsis: 'Dans une mégapole ivoirienne cyberpunk dominée par les intelligences artificielles et les conglomérats de nanotechnologie lagunaires, une pirate informatique traque les secrets d\'un mystérieux réseau de transfert de conscience humaine.',
    genre: 'Sci-Fi & Cyberpunk',
    format: 'série',
    secondaryGenres: ['Thriller & Mystère', 'Action & Shonen'],
    tags: ['Cyberpunk', 'Hacking', 'Futurisme', 'Dystopie', 'Lagune Électrique'],
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.8,
    reviewsCount: 2940,
    totalReads: 245000,
    totalLikes: 41200,
    chaptersCount: 22,
    isFeatured: true,
    isExclusive: true,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: '16+',
    updatedAt: '2026-08-22',
    chapters: [
      {
        id: 'neo-ch-1',
        seriesId: 'neo-abidjan-2088',
        chapterNumber: 1,
        title: 'Fréquence Fantôme',
        releaseDate: '2025-02-01',
        isFree: true,
        coinsRequired: 0,
        likesCount: 9200,
        readTimeMinutes: 5,
        summary: 'Une intrusion réseau au coeur du Plateau déclenche l\'alerte rouge maximale.',
        pages: [
          'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80'
        ]
      }
    ]
  },
  {
    id: 'le-robot-sauvage',
    title: 'Le Robot Sauvage de la Lagune',
    slug: 'le-robot-sauvage',
    author: 'OZI Studio & Peter Brown',
    artist: 'Chris Sanders Style',
    country: 'Sénégal / International',
    synopsis: 'Échouée sur une île tropicale inhabitée au large du Golfe de Guinée, l\'unité robotique Rozzum 7134 apprend à survivre et à communiquer avec la faune sauvage.',
    genre: 'Sci-Fi & Cyberpunk',
    format: 'film',
    secondaryGenres: ['Jeunesse & Aventure', 'Afro-Fantasy'],
    tags: ['Robot', 'Nature', 'Émotion', 'Animation', 'Famille'],
    coverUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    status: 'completed',
    rating: 4.96,
    reviewsCount: 4520,
    totalReads: 410000,
    totalLikes: 78900,
    chaptersCount: 1,
    isFeatured: true,
    isExclusive: true,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: 'Tous publics',
    updatedAt: '2026-08-28'
  },
  {
    id: 'seigneur-anneaux-sahara',
    title: 'Les Seigneurs des Sables : Le Retour du Roi',
    slug: 'les-seigneurs-des-sables',
    author: 'J.K. Diawara',
    artist: 'Moussa Cissé',
    country: 'Mali / Mauritanie',
    synopsis: 'L\'ultime bataille pour le trône de Tombouctou commence. Les armées de lumière et les spectres des dunes se rassemblent devant la Forteresse Noire.',
    genre: 'Afro-Fantasy',
    format: 'film',
    secondaryGenres: ['Action & Shonen', 'Mythologie & Histoire'],
    tags: ['Épique', 'Bataille', 'Couronne', 'Magie', 'Honneur'],
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    status: 'completed',
    rating: 4.95,
    reviewsCount: 3910,
    totalReads: 380000,
    totalLikes: 67200,
    chaptersCount: 1,
    isFeatured: true,
    isExclusive: false,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: 'Tous publics',
    updatedAt: '2026-08-26'
  },
  {
    id: 'dakar-drift',
    title: 'Dakar Street Racers',
    slug: 'dakar-street-racers',
    author: 'Malick Seck',
    artist: 'Ibrahim Fall',
    country: 'Sénégal',
    synopsis: 'Sur la corniche de Dakar et dans les ruelles animées de la Médina, des pilotes clandestins s\'affrontent dans des courses effrénées au volant de bolides hybrides customisés. Amour, adrénaline et rivalités de quartiers.',
    genre: 'Action & Shonen',
    format: 'série',
    secondaryGenres: ['Jeunesse & Aventure'],
    tags: ['Courses Urbaines', 'Vitesse', 'Fraternité', 'Dakar Nocturne'],
    coverUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.7,
    reviewsCount: 1450,
    totalReads: 142000,
    totalLikes: 22800,
    chaptersCount: 14,
    isFeatured: false,
    isExclusive: true,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: '12+',
    updatedAt: '2026-08-18'
  },
  {
    id: 'voyage-chihiro-ancestral',
    title: 'Le Voyage d\'Amina au Pays des Esprits',
    slug: 'le-voyage-d-amina',
    author: 'Hayo Miyazaki & OZI Team',
    artist: 'Studio Ghibli Africa',
    country: 'Bénin / Togo',
    synopsis: 'Perdue dans un marché enchanté où les dieux se reposent, la jeune Amina doit trouver le courage de libérer ses parents transformés par un mauvais sortilège.',
    genre: 'Mythologie & Histoire',
    format: 'film',
    secondaryGenres: ['Afro-Fantasy', 'Jeunesse & Aventure'],
    tags: ['Esprits', 'Enchantement', 'Famille', 'Tradition', 'Poésie'],
    coverUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1600&q=80',
    status: 'completed',
    rating: 4.98,
    reviewsCount: 5120,
    totalReads: 490000,
    totalLikes: 95400,
    chaptersCount: 1,
    isFeatured: true,
    isExclusive: true,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: 'Tous publics',
    updatedAt: '2026-08-27'
  },
  {
    id: 'arcane-zaun-abidjan',
    title: 'Arcane : Les Flammes de la Lagune',
    slug: 'arcane-lagune',
    author: 'Riot Games & OZI Studio',
    artist: 'Fortiche Production',
    country: 'Côte d\'Ivoire / France',
    synopsis: 'Entre la haute-ville scintillante de Piltover et les souterrains brumeux de Zaun, deux soeurs séparées par le destin se livrent une guerre fratricide impitoyable.',
    genre: 'Sci-Fi & Cyberpunk',
    format: 'série',
    secondaryGenres: ['Action & Shonen', 'Romance & Drame'],
    tags: ['Hextech', 'Soeurs', 'Bataille', 'Chefs d\'oeuvre', 'Punk'],
    coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.99,
    reviewsCount: 8940,
    totalReads: 750000,
    totalLikes: 142000,
    chaptersCount: 18,
    isFeatured: true,
    isExclusive: true,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: '16+',
    updatedAt: '2026-08-29'
  },
  {
    id: 'gladiator-kolwezi',
    title: 'Gladiateur : Le Sang de l\'Arène',
    slug: 'gladiateur-arene',
    author: 'Ridley S. & Marc Zadi',
    artist: 'David Kouassi',
    country: 'RD Congo / Côte d\'Ivoire',
    synopsis: 'Général déchu trahi par l\'Empereur félon, Maximus devient le plus redoutable des gladiateurs pour assouvir sa vengeance devant le Colisée.',
    genre: 'Action & Shonen',
    format: 'film',
    secondaryGenres: ['Arts Martiaux', 'Mythologie & Histoire'],
    tags: ['Rome', 'Arène', 'Vengeance', 'Honneur', 'Guerre'],
    coverUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    status: 'completed',
    rating: 4.92,
    reviewsCount: 3200,
    totalReads: 290000,
    totalLikes: 48000,
    chaptersCount: 1,
    isFeatured: false,
    isExclusive: false,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: '16+',
    updatedAt: '2026-08-21'
  },
  {
    id: 'ombre-baobab',
    title: 'L\'Ombre du Baobab Sacré',
    slug: 'l-ombre-du-baobab-sacre',
    author: 'Aminata Ndiaye',
    artist: 'Chérif Keïta',
    country: 'Mali / Sénégal',
    synopsis: 'Chaque siècle, le Grand Baobab millénaire choisit une gardienne pour sceller le gouffre des Songes. Lorsque de mystérieuses disparitions frappent les villages alentour, Amina doit réveiller des incantations oubliées depuis des générations.',
    genre: 'Mythologie & Histoire',
    format: 'série',
    secondaryGenres: ['Afro-Fantasy', 'Thriller & Mystère'],
    tags: ['Esprits', 'Contes & Légendes', 'Enquête', 'Tradition & Mystère'],
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.95,
    reviewsCount: 1980,
    totalReads: 189000,
    totalLikes: 35600,
    chaptersCount: 16,
    isFeatured: true,
    isExclusive: false,
    isTrending: false,
    releaseYear: 2025,
    language: 'Français',
    ageRating: 'Tous publics',
    updatedAt: '2026-08-20',
    chapters: [
      {
        id: 'ombre-ch-1',
        seriesId: 'ombre-baobab',
        chapterNumber: 1,
        title: 'Le Murmure des Feuilles',
        releaseDate: '2025-03-05',
        isFree: true,
        coinsRequired: 0,
        likesCount: 7800,
        readTimeMinutes: 6,
        summary: 'Le baobab tremble pour la première fois en cent ans.',
        pages: [
          'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
        ]
      }
    ]
  },
  {
    id: 'reine-ebene',
    title: 'Reine d\'Ébène : Les Noces de Sable',
    slug: 'reine-d-ebene',
    author: 'Fatouma Touré',
    artist: 'Nathalie Kouamé',
    country: 'Cameroun / Bénin',
    synopsis: 'Dans les cours royales du 17ème siècle, la princesse Sika refuse un mariage arrangé avec l\'Empire rival et fomente une révolution secrète guidée par les guerrières Amazones.',
    genre: 'Romance & Drame',
    format: 'film',
    secondaryGenres: ['Mythologie & Histoire'],
    tags: ['Amazones', 'Intrigues Royales', 'Amour Interdit', 'Courage'],
    coverUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.9,
    reviewsCount: 2600,
    totalReads: 210000,
    totalLikes: 46000,
    chaptersCount: 19,
    isFeatured: false,
    isExclusive: true,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: '12+',
    updatedAt: '2026-08-24'
  },
  {
    id: 'chainsaw-demon',
    title: 'Chainsaw Man : L\'Ordre du Diable',
    slug: 'chainsaw-demon',
    author: 'Tatsuki Fujimoto & OZI Edit',
    artist: 'MAPPA Style Studio',
    country: 'International / Japon',
    synopsis: 'Pour rembourser les dettes de son père, Denji vit dans la misère avec Pochita, son démon-tronçonneuse. Devenu Chasseur de Démons officiel, sa nouvelle vie déjantée commence.',
    genre: 'Action & Shonen',
    format: 'série',
    secondaryGenres: ['Horreur', 'Sci-Fi & Cyberpunk'],
    tags: ['Démons', 'Action Pure', 'Shonen Dark', 'Tronçonneuse'],
    coverUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.94,
    reviewsCount: 6800,
    totalReads: 590000,
    totalLikes: 112000,
    chaptersCount: 24,
    isFeatured: true,
    isExclusive: false,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: '16+',
    updatedAt: '2026-08-28'
  },
  {
    id: 'simbba-twilight',
    title: 'Simbba : Le Guerrier du Crépuscule',
    slug: 'simbba-le-guerrier',
    author: 'Jean-Luc Owona',
    artist: 'Gaston M\'Peko',
    country: 'RD Congo / Gabon',
    synopsis: 'Élevé au coeur de la grande forêt équatoriale par une guilde secrète d\'artistes martiaux, Simbba maîtrise la technique ancestrale du Fauve d\'Or. Mais un tournoi clandestin va l\'obliger à révéler sa véritable identité.',
    genre: 'Arts Martiaux',
    format: 'série',
    secondaryGenres: ['Action & Shonen', 'Afro-Fantasy'],
    tags: ['Combat au Corps à Corps', 'Tournoi', 'Honneur', 'Puissance'],
    coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.85,
    reviewsCount: 1870,
    totalReads: 175000,
    totalLikes: 29800,
    chaptersCount: 20,
    isFeatured: false,
    isExclusive: false,
    isTrending: false,
    releaseYear: 2025,
    language: 'Français',
    ageRating: 'Tous publics',
    updatedAt: '2026-08-15'
  },
  {
    id: 'la-vie-est-belle',
    title: 'La Vie est Belle : Mémoires d\'Abidjan',
    slug: 'la-vie-est-belle',
    author: 'Aïcha Coulibaly',
    artist: 'Kader Ouattara',
    country: 'Côte d\'Ivoire',
    synopsis: 'Une chronique touchante et lumineuse sur la joie, la musique et l\'amour au coeur de Treichville dans les années d\'or.',
    genre: 'Romance & Drame',
    format: 'film',
    secondaryGenres: ['Tranche de vie', 'Comédie'],
    tags: ['Émotion', 'Musique', 'Famille', 'Vintage', 'Amour'],
    coverUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=80',
    status: 'completed',
    rating: 4.89,
    reviewsCount: 2140,
    totalReads: 195000,
    totalLikes: 34000,
    chaptersCount: 1,
    isFeatured: false,
    isExclusive: true,
    isTrending: false,
    releaseYear: 2025,
    language: 'Français',
    ageRating: 'Tous publics',
    updatedAt: '2026-08-19'
  },
  {
    id: 'kaguya-love-war',
    title: 'Kaguya-sama : Love is War (Édition OZI)',
    slug: 'kaguya-sama-love-is-war',
    author: 'Aka Akasaka & OZI Translation',
    artist: 'Shueisha & A-1 Pictures',
    country: 'International / Japon',
    synopsis: 'Au sein de l\'Académie d\'élite, deux génies trop fiers s\'aiment en secret et mettent au point des stratagèmes psychologiques hilarants pour forcer l\'autre à se confesser en premier.',
    genre: 'Comédie',
    format: 'série',
    secondaryGenres: ['Romance & Drame', 'Jeunesse & Aventure'],
    tags: ['Comédie Romantique', 'Génie', 'Bataille Intellectuelle', 'Humour'],
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    status: 'ongoing',
    rating: 4.97,
    reviewsCount: 7420,
    totalReads: 640000,
    totalLikes: 128000,
    chaptersCount: 30,
    isFeatured: true,
    isExclusive: false,
    isTrending: true,
    releaseYear: 2025,
    language: 'Français',
    ageRating: 'Tous publics',
    updatedAt: '2026-08-27'
  }
];

export const INITIAL_TEASERS: Teaser[] = [
  {
    id: 'teaser-1',
    title: 'La Légende de Kemet — Trailer Officiel de Lancement',
    seriesId: 'kemet-legend',
    seriesTitle: 'La Légende de Kemet',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    duration: '01:45',
    viewsCount: 94200,
    description: 'Plongez dans l\'univers épique de Kofi et des divinités oubliées. Une animation vibrante et des planches haute définition à découvrir en exclusivité sur OZI.',
    type: 'trailer',
    releaseDate: '2026-07-15',
    featured: true
  },
  {
    id: 'teaser-2',
    title: 'Neo-Abidjan 2088 — Motion Comic Teaser #1',
    seriesId: 'neo-abidjan-2088',
    seriesTitle: 'Neo-Abidjan 2088',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
    duration: '02:10',
    viewsCount: 68500,
    description: 'Bande-son électro-afrobeat et néons éblouissants : découvrez les coulisses du futur cyberpunk d\'Abidjan.',
    type: 'motion_comic',
    releaseDate: '2026-08-01',
    featured: true
  },
  {
    id: 'teaser-3',
    title: 'Rencontre avec Awa Diallo & Kofi Mensah (Créateurs)',
    seriesId: 'kemet-legend',
    seriesTitle: 'La Légende de Kemet',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    duration: '04:30',
    viewsCount: 41200,
    description: 'Les auteurs partagent leurs inspirations, le processus créatif et l\'importance de donner vie à des héros africains mémorables.',
    type: 'interview',
    releaseDate: '2026-08-10',
    featured: false
  }
];

export const INITIAL_PRESS_RELEASES: PressRelease[] = [
  {
    id: 'press-1',
    title: 'OZI déploie sa nouvelle version mobile v2.4.0 et son Studio Créateur Cloud',
    slug: 'ozi-deploie-nouvelle-version-mobile-et-studio-cloud',
    date: '2026-08-25',
    category: 'Actualités & Tech',
    summary: 'La plateforme panafricaine de webtoons OZI franchit le cap des 50 000 lecteurs actifs et lance son infrastructure de publication unifiée avec synchronisation Firestore temps réel.',
    content: `Abidjan / Dakar / Paris — OZI annonce aujourd'hui une étape majeure dans son développement avec la mise en ligne de sa vitrine officielle et le déploiement de sa version APK 2.4.0 optimisée.
    
Grâce à une architecture ultra-légère, l'application permet une lecture instantanée, même avec une connectivité réseau modérée, répondant ainsi aux exigences des lecteurs sur l'ensemble du continent et de la diaspora.

"Notre mission est de donner aux scénaristes et illustrateurs africains une vitrine mondiale et une juste rémunération de leur travail", déclare l'équipe fondatrice d'OZI.

Les nouveautés incluent :
- Nouveau mode lecteur vertical continu avec préchargement
- Gestionnaire de téléchargement hors-ligne des chapitres
- Système de synchronisation instantanée avec le Studio Créateur
- Réduction de 40% de la consommation de données mobiles.`,
    author: 'Direction de la Communication OZI',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    readTime: '3 min'
  },
  {
    id: 'press-3',
    title: 'Carnet de Création : Comment est né l\'univers épique de « La Légende de Kemet »',
    slug: 'carnet-de-creation-la-legende-de-kemet',
    date: '2026-08-18',
    category: 'Carnet de Création',
    summary: 'Découvrez les coulisses scénaristiques, les recherches iconographiques et les premiers croquis du sceptre d\'Orishas avec Kofi Mensah et Awa Diallo.',
    content: `Comment réinventer la mythologie et les légendes des pharaons noirs et des dieux d'ébène dans un format webtoon ultra-dynamique ?
    
Dans ce carnet de création exclusif, les auteurs reviennent sur 18 mois de travail acharné :
1. La recherche documentaire sur les mythes de Kemet et les traditions orales sahéliennes.
2. Le travail des couleurs : des ocres chauds aux magies astrales violettes et dorées.
3. La découpe des cases pensée spécialement pour le défilement vertical sur écran de téléphone.

"Nous voulions que chaque case claque comme un tableau tout en conservant le rythme d'un Shonen moderne."`,
    author: 'Awa Diallo & Kofi Mensah',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    readTime: '5 min'
  },
  {
    id: 'press-2',
    title: 'Partenariat stratégique : 12 nouveaux studios d\'animation et de BD rejoignent OZI',
    slug: 'partenariat-12-nouveaux-studios-rejoignent-ozi',
    date: '2026-07-28',
    category: 'Partenariat',
    summary: 'Des collectifs d\'artistes de Côte d\'Ivoire, du Sénégal, du Cameroun et du Nigéria signent un accord exclusif de distribution avec la plateforme OZI.',
    content: `Le catalogue d'OZI s'enrichit de plus de 40 nouvelles séries inédites et motion comics prévus pour l'automne 2026. Ce partenariat assure aux artistes un accompagnement éditorial, des traductions multilingues et un partage de revenus direct à hauteur de 70%.

Les créateurs bénéficient d'un accès complet au grand écran d'administration d'OZI pour programmer la parution de leurs chapitres et échanger avec leur communauté de lecteurs.`,
    author: 'Service Éditorial OZI',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    readTime: '2 min'
  },
  {
    id: 'press-4',
    title: 'Interview : Tidiane Traoré dévoile l\'ambiance visuelle de « Neo-Abidjan 2088 »',
    slug: 'interview-tidiane-traore-neo-abidjan',
    date: '2026-07-12',
    category: 'Interview Auteur',
    summary: 'Entre lagune électrique, taxis volants et gratte-ciels néons du Plateau, le dessinateur ivoirien nous plonge dans sa vision cyberpunk de l\'Afrique de demain.',
    content: `Le style visuel de Neo-Abidjan 2088 a immédiatement conquis les lecteurs d'OZI.
    
"Abidjan a toujours été une ville en effervescence, lumineuse et festive. Projeter cette énergie en 2088 avec des câbles cybernétiques, des marchés flottants et des hackers en wax était une évidence", confie Tidiane.

Retrouvez dans cet article une série de planches préparatoires exclusives et les concepts d'armures biotechnologiques.`,
    author: 'Rédaction OZI Magazine',
    imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    readTime: '4 min'
  }
];

export const INITIAL_MEDIA_KIT: MediaKitAsset[] = [
  {
    id: 'asset-logo-svg',
    name: 'Logo OZI Officiel Vectoriel (Pack Gold & Obsidian)',
    category: 'Logos Officiels',
    format: 'SVG',
    resolution: 'Vectoriel infini',
    fileSize: '1.2 Mo',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    downloadUrl: '#'
  },
  {
    id: 'asset-press-kit-pdf',
    name: 'Dossier de Presse Complet OZI 2026 (Chiffres & Vision)',
    category: 'Charte Graphique',
    format: 'PDF',
    resolution: '300 DPI Print Ready',
    fileSize: '8.4 Mo',
    previewUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80',
    downloadUrl: '#'
  },
  {
    id: 'asset-series-posters',
    name: 'Pack Affiches & Bannières Séries Phares (Kemet, Neo-Abidjan)',
    category: 'Affiches Séries HD',
    format: 'ZIP',
    resolution: '4K Ultra-HD',
    fileSize: '45.0 Mo',
    previewUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
    downloadUrl: '#'
  },
  {
    id: 'asset-app-screens',
    name: 'Captures d\'Écran Application Mobile Android & PWA',
    category: 'Captures Écran App',
    format: 'PNG HD',
    resolution: '1080 x 2400 px',
    fileSize: '12.8 Mo',
    previewUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=400&q=80',
    downloadUrl: '#'
  }
];

export const INITIAL_APP_VERSION: AppVersionInfo = {
  version: 'v2.4.0',
  buildNumber: 2040,
  releaseDate: '2026-08-25',
  apkDownloadUrl: 'https://ozibd.net/ozi-reader.apk',
  apkSizeMb: 14.8,
  minAndroidVersion: 'Android 6.0 (Marshmallow) ou supérieur',
  checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  isForceUpdateRequired: false,
  pwaUrl: './',
  webAppUrl: './',
  downloadUrl: 'https://ozibd.net/ozi-reader.apk',
  changelog: [
    '⚡ Mode lecteur plein écran ultra-rapide avec préchargement intelligent',
    '📥 Support du téléchargement hors-ligne des chapitres favoris',
    '🌙 Mode nuit OLED à contraste dynamique',
    '🔄 Synchronisation temps réel avec Firestore (ai-studio-oziplateformeweb)',
    '🔒 Système de sécurité renforcé et consommation de données réduite de 40%'
  ],
  downloadsCount: 52400
};

export const INITIAL_ANALYTICS: AnalyticsOverview = {
  totalReads: 1082500,
  totalUsers: 54320,
  apkDownloads: 52400,
  creatorEarningsCfa: 38450000,
  seriesCount: 18,
  chaptersPublished: 246,
  activeReadersToday: 4890,
  averageRating: 4.88,
  dailyViewsHistory: [
    { date: '22 Août', views: 42000, reads: 28500 },
    { date: '23 Août', views: 48500, reads: 32100 },
    { date: '24 Août', views: 56000, reads: 39400 },
    { date: '25 Août', views: 64200, reads: 45000 },
    { date: '26 Août', views: 71800, reads: 51200 },
    { date: '27 Août', views: 85400, reads: 62800 },
    { date: '28 Août', views: 98200, reads: 74500 }
  ],
  userGrowthHistory: [
    { date: '22 Août', newUsers: 340, apkDownloads: 410 },
    { date: '23 Août', newUsers: 480, apkDownloads: 560 },
    { date: '24 Août', newUsers: 620, apkDownloads: 740 },
    { date: '25 Août', newUsers: 810, apkDownloads: 920 },
    { date: '26 Août', newUsers: 950, apkDownloads: 1100 },
    { date: '27 Août', newUsers: 1240, apkDownloads: 1450 },
    { date: '28 Août', newUsers: 1680, apkDownloads: 1920 }
  ],
  revenueHistory: [
    { date: '22 Août', revenueXof: 850000, coinsBought: 170000 },
    { date: '23 Août', revenueXof: 1120000, coinsBought: 224000 },
    { date: '24 Août', revenueXof: 1450000, coinsBought: 290000 },
    { date: '25 Août', revenueXof: 1890000, coinsBought: 378000 },
    { date: '26 Août', revenueXof: 2340000, coinsBought: 468000 },
    { date: '27 Août', revenueXof: 2980000, coinsBought: 596000 },
    { date: '28 Août', revenueXof: 3620000, coinsBought: 724000 }
  ]
};

export const DEFAULT_ADMIN_USER: AdminUser = {
  email: 'wilfriedcrea@gmail.com',
  name: 'Wilfried Créa',
  role: 'Super Admin',
  permissions: [
    'series:crud',
    'chapters:editor',
    'moderation:manage',
    'monetization:manage',
    'creators:payout',
    'firestore:direct_sync',
    'apk:deploy',
    'users:manage',
    'ads:manage',
    'storage:lws'
  ],
  lastLogin: '2026-08-28T11:20:00Z',
  is2FAEnabled: true
};

export const INITIAL_USERS: import('../types').UserAccount[] = [
  {
    id: 'usr-001',
    email: 'wilfriedcrea@gmail.com',
    name: 'Wilfried Créa',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    role: 'super_admin',
    coinsBalance: 99999,
    isVip: true,
    isBanned: false,
    country: 'Côte d\'Ivoire',
    joinedAt: '2025-01-01T00:00:00Z',
    lastActiveAt: '2026-08-28T11:21:00Z',
    readChaptersCount: 1420,
    unlockedSeriesCount: 18
  },
  {
    id: 'usr-002',
    email: 'kofi.mensah@studio-kemet.com',
    name: 'Kofi Mensah',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    role: 'creator',
    coinsBalance: 245000,
    isVip: true,
    isBanned: false,
    country: 'Sénégal',
    joinedAt: '2025-01-10T10:00:00Z',
    lastActiveAt: '2026-08-28T09:30:00Z',
    readChaptersCount: 310,
    unlockedSeriesCount: 12
  },
  {
    id: 'usr-003',
    email: 'yannick.bamba@neo-abj.ci',
    name: 'Yannick Bamba',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    role: 'creator',
    coinsBalance: 182000,
    isVip: true,
    isBanned: false,
    country: 'Côte d\'Ivoire',
    joinedAt: '2025-02-14T08:00:00Z',
    lastActiveAt: '2026-08-28T10:15:00Z',
    readChaptersCount: 220,
    unlockedSeriesCount: 8
  },
  {
    id: 'usr-004',
    email: 'fatima.mod@ozi.africa',
    name: 'Fatima Touré',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'moderator',
    coinsBalance: 1250,
    isVip: true,
    isBanned: false,
    country: 'Mali',
    joinedAt: '2025-03-01T12:00:00Z',
    lastActiveAt: '2026-08-28T11:05:00Z',
    readChaptersCount: 450,
    unlockedSeriesCount: 15
  },
  {
    id: 'usr-005',
    email: 'ibrahim.reader@gmail.com',
    name: 'Ibrahim Diop',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    role: 'reader',
    coinsBalance: 320,
    isVip: true,
    isBanned: false,
    country: 'Sénégal',
    joinedAt: '2025-04-18T16:20:00Z',
    lastActiveAt: '2026-08-28T08:45:00Z',
    readChaptersCount: 185,
    unlockedSeriesCount: 6
  },
  {
    id: 'usr-006',
    email: 'spammer99@fakemail.com',
    name: 'CryptoBot_24',
    avatarUrl: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=200&q=80',
    role: 'reader',
    coinsBalance: 0,
    isVip: false,
    isBanned: true,
    country: 'Inconnu',
    joinedAt: '2026-08-27T18:00:00Z',
    lastActiveAt: '2026-08-27T18:40:00Z',
    readChaptersCount: 1,
    unlockedSeriesCount: 0
  }
];

export const INITIAL_COIN_TRANSACTIONS: import('../types').CoinTransaction[] = [
  {
    id: 'tx-001',
    userId: 'usr-005',
    userName: 'Ibrahim Diop',
    userEmail: 'ibrahim.reader@gmail.com',
    type: 'pack_purchase',
    coins: 330,
    amountXof: 1500,
    description: 'Achat Pack Aventure (300 + 30 Coins bonus) via Wave',
    timestamp: '2026-08-28T10:45:00Z',
    status: 'completed'
  },
  {
    id: 'tx-002',
    userId: 'usr-005',
    userName: 'Ibrahim Diop',
    userEmail: 'ibrahim.reader@gmail.com',
    type: 'chapter_unlock',
    coins: -15,
    seriesTitle: 'La Légende de Kemet',
    chapterNumber: 4,
    description: 'Déblocage du Chapitre 4 : Le Temple des Sables',
    timestamp: '2026-08-28T10:48:00Z',
    status: 'completed'
  },
  {
    id: 'tx-003',
    userId: 'usr-002',
    userName: 'Kofi Mensah',
    userEmail: 'kofi.mensah@studio-kemet.com',
    type: 'creator_payout',
    coins: -245000,
    amountXof: 857500,
    seriesTitle: 'La Légende de Kemet',
    description: 'Versement des revenus créateurs Août 2026 (Part 70%)',
    timestamp: '2026-08-28T09:30:00Z',
    status: 'pending'
  },
  {
    id: 'tx-004',
    userId: 'usr-004',
    userName: 'Fatima Touré',
    userEmail: 'fatima.mod@ozi.africa',
    type: 'admin_credit',
    coins: 500,
    description: 'Attribution bonus de modération par Super Admin',
    timestamp: '2026-08-27T16:00:00Z',
    status: 'completed'
  }
];

export const INITIAL_ADS: import('../types').AdBanner[] = [
  {
    id: 'ad-001',
    title: 'Campagne Lancement Wave Mobile Money',
    advertiserName: 'Wave CI & SN',
    placement: 'hero_home',
    imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    redirectUrl: 'https://wave.com/fr/',
    startDate: '2026-08-01',
    expiryDate: '2026-10-31',
    isActive: true,
    impressions: 142500,
    clicks: 8640,
    priority: 1
  },
  {
    id: 'ad-002',
    title: 'Festival International du Manga d\'Abidjan (FIMA)',
    advertiserName: 'FIMA Studio',
    placement: 'interstitial_chapter',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
    redirectUrl: 'https://fima-africa.org',
    startDate: '2026-08-15',
    expiryDate: '2026-09-30',
    isActive: true,
    impressions: 89300,
    clicks: 5120,
    priority: 2
  },
  {
    id: 'ad-003',
    title: 'Concours Jeunes Auteurs & Dessinateurs OZI 2026',
    advertiserName: 'OZI Foundation',
    placement: 'footer_banner',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    redirectUrl: '#creators',
    startDate: '2026-08-01',
    expiryDate: '2026-12-31',
    isActive: true,
    impressions: 210000,
    clicks: 14300,
    priority: 3
  }
];

export const INITIAL_LWS_FILES: import('../types').LwsStorageFile[] = [
  {
    name: 'cover_kemet_hd.webp',
    path: 'htdocs/uploads/covers/cover_kemet_hd.webp',
    directory: 'covers',
    size: 245000,
    sizeFormatted: '239 Ko',
    mimeType: 'image/webp',
    url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
    uploadedAt: '2026-08-25T14:30:00Z'
  },
  {
    name: 'banner_neo_abidjan.webp',
    path: 'htdocs/uploads/banners/banner_neo_abidjan.webp',
    directory: 'banners',
    size: 480000,
    sizeFormatted: '468 Ko',
    mimeType: 'image/webp',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80',
    uploadedAt: '2026-08-26T11:15:00Z'
  },
  {
    name: 'kemet_ch1_p01.webp',
    path: 'htdocs/uploads/chapters/kemet-legend/ch_1/kemet_ch1_p01.webp',
    directory: 'chapters',
    size: 190000,
    sizeFormatted: '185 Ko',
    mimeType: 'image/webp',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    uploadedAt: '2026-08-20T09:00:00Z'
  },
  {
    name: 'ost_epic_battle_kemet.mp3',
    path: 'htdocs/uploads/audio/ost_epic_battle_kemet.mp3',
    directory: 'audio',
    size: 4850000,
    sizeFormatted: '4.62 Mo',
    mimeType: 'audio/mpeg',
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=epic-cinematic-trailer-113981.mp3',
    uploadedAt: '2026-08-22T16:40:00Z'
  }
];

export const INITIAL_MONETIZATION: MonetizationSettings = {
  currency: 'XOF',
  coinRateXof: 5, // 1 Coin = 5 FCFA
  creatorRevenueSharePercent: 70,
  vipMonthlyPriceXof: 2900,
  freeChaptersThreshold: 3,
  defaultPaidChapterCoins: 15,
  totalPlatformRevenueXof: 54900000,
  totalPaidToCreatorsXof: 38450000,
  supportedPaymentGateways: [
    {
      id: 'gateway-wave',
      name: 'Wave Mobile Money',
      provider: 'Wave',
      countries: ['Sénégal', 'Côte d\'Ivoire', 'Mali', 'Burkina Faso'],
      isActive: true,
      feePercent: 1.0
    },
    {
      id: 'gateway-orange',
      name: 'Orange Money Afrique',
      provider: 'Orange Money',
      countries: ['Côte d\'Ivoire', 'Sénégal', 'Cameroun', 'Mali', 'Guinée', 'RDC'],
      isActive: true,
      feePercent: 1.5
    },
    {
      id: 'gateway-mtn',
      name: 'MTN MoMo',
      provider: 'MTN Mobile Money',
      countries: ['Côte d\'Ivoire', 'Ghana', 'Bénin', 'Cameroun', 'Congo'],
      isActive: true,
      feePercent: 1.5
    },
    {
      id: 'gateway-moov',
      name: 'Moov Africa Flooz',
      provider: 'Moov Money',
      countries: ['Togo', 'Bénin', 'Côte d\'Ivoire', 'Gabon'],
      isActive: true,
      feePercent: 1.5
    },
    {
      id: 'gateway-stripe',
      name: 'Cartes Visa / Mastercard / Stripe',
      provider: 'Carte Bancaire / Stripe',
      countries: ['International', 'France', 'Belgique', 'Canada', 'USA'],
      isActive: true,
      feePercent: 2.9
    }
  ],
  coinPacks: [
    {
      id: 'pack-starter',
      name: 'Pack Découverte',
      coins: 100,
      bonusCoins: 0,
      priceXof: 500,
      priceEur: 0.80,
      isPopular: false
    },
    {
      id: 'pack-adventurer',
      name: 'Pack Aventure',
      coins: 300,
      bonusCoins: 30,
      priceXof: 1500,
      priceEur: 2.30,
      isPopular: true,
      badge: 'Le + Choisi'
    },
    {
      id: 'pack-binge',
      name: 'Pack Marathoneur',
      coins: 700,
      bonusCoins: 120,
      priceXof: 3500,
      priceEur: 5.30,
      isPopular: false
    },
    {
      id: 'pack-legend',
      name: 'Pack Légende OZI',
      coins: 1500,
      bonusCoins: 400,
      priceXof: 7500,
      priceEur: 11.50,
      isPopular: false,
      badge: '+26% Bonus'
    }
  ]
};

export const INITIAL_CREATOR_PAYOUTS: CreatorPayout[] = [
  {
    id: 'payout-101',
    creatorId: 'kofi-mensah',
    creatorName: 'Kofi Mensah',
    creatorEmail: 'kofi.mensah@studio-kemet.com',
    seriesTitle: 'La Légende de Kemet',
    period: 'Août 2026',
    totalReads: 84200,
    coinsEarned: 245000,
    amountXof: 857500,
    status: 'pending',
    paymentMethod: 'Wave Mobile Money (+225 07 48 99 12 00)',
    paymentAccount: '+2250748991200',
    requestedAt: '2026-08-25T10:30:00Z'
  },
  {
    id: 'payout-102',
    creatorId: 'yannick-bamba',
    creatorName: 'Yannick Bamba',
    creatorEmail: 'yannick.bamba@neo-abj.ci',
    seriesTitle: 'Neo-Abidjan 2088',
    period: 'Août 2026',
    totalReads: 61000,
    coinsEarned: 182000,
    amountXof: 637000,
    status: 'processing',
    paymentMethod: 'Orange Money CI (+225 07 08 45 11 22)',
    paymentAccount: '+2250708451122',
    requestedAt: '2026-08-24T14:15:00Z'
  },
  {
    id: 'payout-103',
    creatorId: 'esther-makosso',
    creatorName: 'Esther Makosso',
    creatorEmail: 'esther.makosso@mamiwata.cg',
    seriesTitle: 'Reine Mami Wata',
    period: 'Juillet 2026',
    totalReads: 49800,
    coinsEarned: 142000,
    amountXof: 497000,
    status: 'paid',
    paymentMethod: 'MTN Mobile Money (+242 06 512 88 90)',
    paymentAccount: '+242065128890',
    requestedAt: '2026-08-01T09:00:00Z',
    processedAt: '2026-08-03T16:20:00Z'
  },
  {
    id: 'payout-104',
    creatorId: 'mamadou-sy',
    creatorName: 'Mamadou Sy',
    creatorEmail: 'mamadou.sy@baobab-art.sn',
    seriesTitle: 'Chroniques du Baobab',
    period: 'Juillet 2026',
    totalReads: 32000,
    coinsEarned: 95000,
    amountXof: 332500,
    status: 'paid',
    paymentMethod: 'Wave Sénégal (+221 77 645 32 10)',
    paymentAccount: '+221776453210',
    requestedAt: '2026-08-02T11:45:00Z',
    processedAt: '2026-08-03T17:00:00Z'
  }
];

export const INITIAL_REPORTED_COMMENTS: ReportedComment[] = [
  {
    id: 'rep-001',
    seriesId: 'kemet-legend',
    seriesTitle: 'La Légende de Kemet',
    chapterNumber: 3,
    userEmail: 'spammer99@fakemail.com',
    userName: 'CryptoBot_24',
    commentText: 'Rejoignez mon canal Telegram pour gagner 50000 FCFA en 1h !! Cliquez ici http://scam.link/bonus',
    reportedReason: 'spam',
    reportCount: 14,
    status: 'pending',
    createdAt: '2026-08-27T18:40:00Z'
  },
  {
    id: 'rep-002',
    seriesId: 'neo-abidjan-2088',
    seriesTitle: 'Neo-Abidjan 2088',
    chapterNumber: 2,
    userEmail: 'reader_alex@yahoo.fr',
    userName: 'Alexandre K.',
    commentText: 'ATTENTION SPOILER : Ne lisez pas, à la fin du chapitre 4 le traître est le frère jumeau du hacker !!',
    reportedReason: 'spoiler',
    reportCount: 6,
    status: 'pending',
    createdAt: '2026-08-26T22:15:00Z'
  },
  {
    id: 'rep-003',
    seriesId: 'reine-mami-wata',
    seriesTitle: 'Reine Mami Wata',
    chapterNumber: 1,
    userEmail: 'troll_user@gmail.com',
    userName: 'DarkWarrior22',
    commentText: 'Dessins nuls à chier, l\'artiste ferait mieux de changer de métier immédiatement bande d\'incapables.',
    reportedReason: 'harassment',
    reportCount: 9,
    status: 'pending',
    createdAt: '2026-08-26T14:30:00Z'
  }
];

export const INITIAL_MODERATION_LOGS: ModerationLog[] = [
  {
    id: 'log-001',
    moderatorEmail: 'wilfriedcrea@gmail.com',
    action: 'Acceptation Projet Créateur',
    targetType: 'submission',
    targetId: 'sub-001',
    details: 'Validation éditoriale de la soumission "Chroniques du Baobab Sacré" par Mamadou Sy.',
    timestamp: '2026-08-27T15:20:00Z'
  },
  {
    id: 'log-002',
    moderatorEmail: 'wilfriedcrea@gmail.com',
    action: 'Virement Gains Créateur',
    targetType: 'payout',
    targetId: 'payout-103',
    details: 'Approbation du versement de 497 000 FCFA via MTN MoMo pour Esther Makosso.',
    timestamp: '2026-08-03T16:20:00Z'
  },
  {
    id: 'log-003',
    moderatorEmail: 'wilfriedcrea@gmail.com',
    action: 'Mise à jour Règles Monétisation',
    targetType: 'monetization',
    targetId: 'settings',
    details: 'Ajustement du partage des revenus créateurs à 70% pour stimuler les nouvelles créations.',
    timestamp: '2026-08-01T10:00:00Z'
  }
];

