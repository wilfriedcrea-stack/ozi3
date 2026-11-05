import { Artist, Artbook } from '../types';

export const INITIAL_ARTISTS: Artist[] = [
  {
    id: 'artist-kofi-mensah',
    name: 'Kofi Mensah',
    slug: 'kofi-mensah',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    country: 'Sénégal',
    bio: 'Directeur artistique et maître illustrateur chez Studio Kemet. Formé aux beaux-arts de Dakar et pionnier du mouvement Afro-Fantasy moderne, Kofi Mensah mêle mythologies nubiennes ancestrales, parures solaires et dynamisme shōnen.',
    specialties: ['Afro-Fantasy', 'Character Design', 'Peinture Digitale', 'Concept Art'],
    artbookIds: ['artbook-kemet-celeste', 'artbook-gardiens-nil'],
    featuredSeriesTitle: 'La Légende de Kemet',
    socials: {
      instagram: 'https://instagram.com/kofi.art.kemet',
      twitter: 'https://twitter.com/kofi_mensah_art',
      artstation: 'https://artstation.com/kofimensah',
      youtube: 'https://youtube.com/@kofimensah_art'
    },
    createdAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 'artist-tidiane-traore',
    name: 'Tidiane Traoré',
    slug: 'tidiane-traore',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    country: 'Côte d\'Ivoire',
    bio: 'Architecte urbain reconverti dans le concept art et l\'illustration de bandes dessinées. Créateur de l\'univers visuel de « Neo-Abidjan 2088 », Tidiane imagine le futur de l\'Afrique à travers des néons lagunaires, des implants cybernétiques et des étoffes en wax luminescent.',
    specialties: ['Sci-Fi & Cyberpunk', 'Architecture Urbaine', 'Mecha & Véhicules', 'Worldbuilding'],
    artbookIds: ['artbook-neo-abidjan-bible', 'artbook-abidjan-neon-sketches'],
    featuredSeriesTitle: 'Neo-Abidjan 2088',
    socials: {
      instagram: 'https://instagram.com/tidiane.cyberabj',
      twitter: 'https://twitter.com/tidiane_cyber',
      artstation: 'https://artstation.com/tidianetraore',
      youtube: 'https://youtube.com/@tidiane_cyberpunk'
    },
    createdAt: '2025-02-14T08:00:00Z'
  },
  {
    id: 'artist-nathalie-kouame',
    name: 'Nathalie Kouamé',
    slug: 'nathalie-kouame',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    country: 'Bénin / Cameroun',
    bio: 'Peintre numérique et concept artist de renom. Passionnée d\'histoire africaine et de l\'épopée des guerrières du Dahomey, Nathalie donne vie à des reines guerrières inoubliables et des décors de cours royales somptueuses avec une maestria des contrastes et des textures dorées.',
    specialties: ['Costumes Royaux', 'Illustration Historique', 'Lumières Dramatiques', 'Portraits'],
    artbookIds: ['artbook-reine-ebene-royaume'],
    featuredSeriesTitle: 'Reine d\'Ébène : Les Noces de Sable',
    socials: {
      instagram: 'https://instagram.com/nathalie.kouame.art',
      artstation: 'https://artstation.com/nathaliekouame'
    },
    createdAt: '2025-03-01T12:00:00Z'
  },
  {
    id: 'artist-cherif-keita',
    name: 'Chérif Keïta',
    slug: 'cherif-keita',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=80',
    country: 'Mali',
    bio: 'Artiste traditionnel et illustrateur reconnu pour son encrage profond à la plume et ses lavis d\'aquarelle aux teintes ocres. Il explore les contes initiatiques du Sahel, la poésie du Baobab millénaire et les esprits gardiens de la nuit.',
    specialties: ['Encrage Traditionnel', 'Aquarelle & Lavis', 'Bestiaire Mythologique', 'Conte & Poésie'],
    artbookIds: ['artbook-esprits-baobab', 'artbook-dakar-racers-garage'],
    featuredSeriesTitle: 'L\'Ombre du Baobab Sacré',
    socials: {
      instagram: 'https://instagram.com/cherif.keita.ink',
      twitter: 'https://twitter.com/cherif_keita'
    },
    createdAt: '2025-04-18T16:20:00Z'
  },
  {
    id: 'artist-amina-diop',
    name: 'Amina Diop',
    slug: 'amina-diop',
    photoUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    country: 'Sénégal',
    bio: 'Character designer et directrice d\'animation. Reconnue pour son style ultra-expressif fusionnant les codes du manga shōjo et la richesse des parures wolof.',
    specialties: ['Character Design', 'Animation 2D', 'Color Script'],
    artbookIds: [],
    featuredSeriesTitle: 'Étoiles du Sahel',
    socials: {
      instagram: 'https://instagram.com/amina.diop.art',
      artstation: 'https://artstation.com/aminadiop'
    },
    createdAt: '2025-05-10T14:00:00Z'
  },
  {
    id: 'artist-femi-adebayo',
    name: 'Femi Adebayo',
    slug: 'femi-adebayo',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=80',
    country: 'Nigéria',
    bio: 'Illustrateur cyberpunk basé à Lagos. Ses compositions futuristes mettent en scène des gratte-ciels en lianes solaires et des véhicules autonomes afro-technologiques.',
    specialties: ['Afro-Futurisme', 'Cyber-Lagos', 'Mecha Design'],
    artbookIds: [],
    featuredSeriesTitle: 'Lagos 2099',
    socials: {
      instagram: 'https://instagram.com/femi.adebayo.art',
      twitter: 'https://twitter.com/femi_adebayo'
    },
    createdAt: '2025-05-22T09:30:00Z'
  },
  {
    id: 'artist-sarah-benali',
    name: 'Sarah Benali',
    slug: 'sarah-benali',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    country: 'Maroc',
    bio: 'Spécialiste de Dark Fantasy et d\'enluminures arabo-andalouses. Elle peint des créatures du désert et des citadelles de marbre noir sous des ciels crépusculaires.',
    specialties: ['Dark Fantasy', 'Enluminures', 'Environnement'],
    artbookIds: [],
    featuredSeriesTitle: 'Le Souffle d\'Atlas',
    socials: {
      instagram: 'https://instagram.com/sarah.benali.art',
      artstation: 'https://artstation.com/sarahbenali'
    },
    createdAt: '2025-06-05T11:15:00Z'
  },
  {
    id: 'artist-yannick-ngoran',
    name: 'Yannick N\'Goran',
    slug: 'yannick-ngoran',
    photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1600&q=80',
    country: 'Côte d\'Ivoire',
    bio: 'Maître des scènes de combat chorégraphiées et des impacts cinétiques inspirés du Shōnen. Ses planches se distinguent par leur énergie brute et leur découpage immersif.',
    specialties: ['Scènes d\'Action', 'Storyboard', 'Encrage Dynamique'],
    artbookIds: [],
    featuredSeriesTitle: 'Lames d\'Ivoire',
    socials: {
      instagram: 'https://instagram.com/yannick.ngoran',
      youtube: 'https://youtube.com/@yannick_art'
    },
    createdAt: '2025-06-18T15:45:00Z'
  },
  {
    id: 'artist-mireille-sow',
    name: 'Mireille Sow',
    slug: 'mireille-sow',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1600&q=80',
    country: 'Guinée',
    bio: 'Aquarelliste et poète visuelle. Ses toiles célèbrent la faune des hauts plateaux du Fouta-Djalon et les esprits des chutes d\'eau dans une palette de teintes turquoise et or.',
    specialties: ['Aquarelle', 'Nature & Faune', 'Mythologie Animiste'],
    artbookIds: [],
    featuredSeriesTitle: 'Le Chant des Eaux Vives',
    socials: {
      instagram: 'https://instagram.com/mireille.sow.art',
      artstation: 'https://artstation.com/mireillesow'
    },
    createdAt: '2025-07-02T10:00:00Z'
  },
  {
    id: 'artist-djibril-diallo',
    name: 'Djibril Diallo',
    slug: 'djibril-diallo',
    photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    country: 'Mali / France',
    bio: 'Directeur artistique international pour le cinéma d\'animation et le jeu vidéo. Il conçoit des architectures futuristes monumentales et des éclairages cinématiques saisissants.',
    specialties: ['Direction Artistique', 'Concept Art', 'Éclairage Cinématique'],
    artbookIds: [],
    featuredSeriesTitle: 'Chroniques de Tombouctou Prime',
    socials: {
      instagram: 'https://instagram.com/djibril.diallo.art',
      artstation: 'https://artstation.com/djibrildiallo'
    },
    createdAt: '2025-07-20T17:30:00Z'
  }
];

export const INITIAL_ARTBOOKS: Artbook[] = [
  {
    id: 'artbook-kemet-celeste',
    artistId: 'artist-kofi-mensah',
    artistName: 'Kofi Mensah',
    title: 'Kemet : Chroniques Célestes & Armures Solaires',
    slug: 'kemet-chroniques-celestes',
    description: 'Une plongée majestueuse dans l\'univers visuel de La Légende de Kemet. Ce recueil d\'art exceptionnel compile plus de 120 pages de peintures achevées, d\'études préparatoires pour les pharaons célestes, de designs d\'armes solaires forgées dans l\'or divin et de panoramas inédits des cités volantes du Nil.',
    coverUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80',
    alternateCoverUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=900&q=80',
    previewImages: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80'
    ],
    price: 2500,
    isFree: false,
    pageCount: 124,
    releaseYear: 2026,
    tags: ['Afro-Fantasy', 'Peinture Digitale', 'Armures Divines', 'Studio Kemet'],
    fileSizeFormatted: '68 Mo',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    downloadsCount: 1420,
    rating: 4.95,
    createdAt: '2026-03-15T10:00:00Z'
  },
  {
    id: 'artbook-gardiens-nil',
    artistId: 'artist-kofi-mensah',
    artistName: 'Kofi Mensah',
    title: 'Carnet de Croquis : Les Gardiens du Nil',
    slug: 'carnet-croquis-gardiens-nil',
    description: 'Offert gracieusement à la communauté OZI par Kofi Mensah. Découvrez l\'intimité du processus créatif avec 48 pages de crayonnés bruts, d\'annotations manuscrites, de recherches d\'anatomie héroïque et d\'explorations de visages pour les héros de Kemet.',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80',
    alternateCoverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80',
    previewImages: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80'
    ],
    price: 0,
    isFree: true,
    pageCount: 48,
    releaseYear: 2026,
    tags: ['Gratuit', 'Croquis & Sketchnotes', 'Line-art', 'Work In Progress'],
    fileSizeFormatted: '32 Mo',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    downloadsCount: 3890,
    rating: 4.88,
    createdAt: '2026-04-01T12:00:00Z'
  },
  {
    id: 'artbook-neo-abidjan-bible',
    artistId: 'artist-tidiane-traore',
    artistName: 'Tidiane Traoré',
    title: 'Neo-Abidjan 2088 : The Cyberpunk Visual Bible',
    slug: 'neo-abidjan-2088-visual-bible',
    description: 'Le recueil ultime pour les passionnés de science-fiction africaine et de design prospectif. 160 pages grand format consacrées aux gratte-ciels néons du Plateau, aux marchés flottants de Treichville sous pluies acides, aux pinasses volantes et aux bio-implants de combat.',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80',
    alternateCoverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
    previewImages: [
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80'
    ],
    price: 3000,
    isFree: false,
    pageCount: 160,
    releaseYear: 2026,
    tags: ['Cyberpunk', 'Concept Art', 'Architecture Futuriste', 'Mechas'],
    fileSizeFormatted: '85 Mo',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    downloadsCount: 1850,
    rating: 4.97,
    createdAt: '2026-02-20T14:30:00Z'
  },
  {
    id: 'artbook-abidjan-neon-sketches',
    artistId: 'artist-tidiane-traore',
    artistName: 'Tidiane Traoré',
    title: 'Abidjan Néon : Concept Sketchnote',
    slug: 'abidjan-neon-concept-sketchnote',
    description: 'Un artbook gratuit offert aux lecteurs d\'OZI présentant les premières ébauches graphiques qui ont donné naissance à l\'univers cyberpunk de la lagune Ébrié. Comprend des études de costumes urbains en wax cybernétique et des storyboards d\'action.',
    coverUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
    alternateCoverUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=900&q=80',
    previewImages: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80'
    ],
    price: 0,
    isFree: true,
    pageCount: 42,
    releaseYear: 2026,
    tags: ['Gratuit', 'Storyboard', 'Urban Wax', 'Sketches'],
    fileSizeFormatted: '28 Mo',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    downloadsCount: 4210,
    rating: 4.91,
    createdAt: '2026-05-10T09:00:00Z'
  },
  {
    id: 'artbook-reine-ebene-royaume',
    artistId: 'artist-nathalie-kouame',
    artistName: 'Nathalie Kouamé',
    title: 'Guerrières & Palais d\'Ébène : L\'Art du Royaume',
    slug: 'guerrieres-palais-ebene-art-royaume',
    description: 'Une célébration magistrale de la puissance et de l\'élégance des reines et guerrières africaines. 96 pages d\'illustrations de haute volée montrant les parures royales serties de cauris et d\'or, les danses rituelles de guerre et les décors d\'argile sacrée du Dahomey.',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    alternateCoverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80',
    previewImages: [
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80'
    ],
    price: 2000,
    isFree: false,
    pageCount: 96,
    releaseYear: 2026,
    tags: ['Amazones', 'Histoire & Mythes', 'Peinture Numérique', 'Or & Ébène'],
    fileSizeFormatted: '54 Mo',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    downloadsCount: 1620,
    rating: 4.96,
    createdAt: '2026-03-25T11:00:00Z'
  },
  {
    id: 'artbook-esprits-baobab',
    artistId: 'artist-cherif-keita',
    artistName: 'Chérif Keïta',
    title: 'Esprits & Racines : Bestiaire Mythologique Sahélien',
    slug: 'esprits-racines-bestiaire-sahelien',
    description: 'Téléchargement libre. Une fresque poétique et mystique capturant les génies de la brousse, les ancêtres gardiens du Grand Baobab et les incantations de la nuit sahélienne à travers des encres pures et des lavis sépia d\'une rare intensité.',
    coverUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
    alternateCoverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80',
    previewImages: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80'
    ],
    price: 0,
    isFree: true,
    pageCount: 64,
    releaseYear: 2026,
    tags: ['Gratuit', 'Bestiaire', 'Encrage', 'Mythologie Sahélienne'],
    fileSizeFormatted: '38 Mo',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    downloadsCount: 3150,
    rating: 4.93,
    createdAt: '2026-04-12T16:00:00Z'
  },
  {
    id: 'artbook-dakar-racers-garage',
    artistId: 'artist-cherif-keita',
    artistName: 'Chérif Keïta',
    title: 'Dakar Asphalt : Designs de Bolides & Pistes Côtières',
    slug: 'dakar-asphalt-designs-bolides',
    description: 'Les bolides personnalisés des ruelles des Almadies aux plages sauvages de Toubab Dialaw. 88 pages de concept-cars hybrides, de motifs traditionnels peints sur carrosseries en fibre de carbone et de planches préparatoires dynamiques.',
    coverUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=900&q=80',
    alternateCoverUrl: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=900&q=80',
    previewImages: [
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
    ],
    price: 2000,
    isFree: false,
    pageCount: 88,
    releaseYear: 2026,
    tags: ['Racing', 'Concept Vehicles', 'Dakar Spirit', 'Vitesse'],
    fileSizeFormatted: '49 Mo',
    downloadUrl: 'https://raw.githubusercontent.com/mozilla/pdf.js/master/web/compressed.tracemonkey-pldi-09.pdf',
    downloadsCount: 1190,
    rating: 4.89,
    createdAt: '2026-03-01T15:00:00Z'
  }
];
