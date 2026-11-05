import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Check, ShoppingBag } from 'lucide-react';
import { Artist } from '../../types';
import { useData } from '../../context/DataContext';

export interface ArtistShopProduct {
  id: string;
  name: string;
  price: string;
  priceNumber: number;
  format: 'Vinyle' | 'CD' | 'Artbook' | 'Collector' | string;
  mainImage: string;
  alternateImage: string;
  description: string;
  editionBadge?: string;
}

export const ArtistDetailPage: React.FC = () => {
  const { 
    artists, 
    artbooks, 
    selectedArtistId, 
    setViewMode 
  } = useData();

  // Find target artist
  const currentArtist = useMemo<Artist | null>(() => {
    if (!artists || artists.length === 0) return null;
    if (!selectedArtistId) return artists[0];
    return artists.find(a => a.id === selectedArtistId || a.slug === selectedArtistId) || artists[0];
  }, [artists, selectedArtistId]);

  // Build the boutique products for this artist using real artbooks from dashboard
  const products = useMemo<ArtistShopProduct[]>(() => {
    if (!currentArtist) return [];
    
    const artistName = currentArtist.name;
    const relatedArtbooks = (artbooks || []).filter(
      a => a.artistId === currentArtist.id || a.artistName?.toLowerCase() === artistName.toLowerCase()
    );

    const defaultAlternate1 = 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=900&q=80';
    const defaultAlternate2 = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80';
    const defaultAlternate3 = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=900&q=80';
    const defaultAlternate4 = 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80';

    const items: ArtistShopProduct[] = [];

    // Map each related artbook to a product with its exact 2 cover images chosen in the dashboard
    relatedArtbooks.forEach((ab, idx) => {
      const altUrl = ab.alternateCoverUrl || (idx % 2 === 0 ? defaultAlternate1 : defaultAlternate3);
      const isFree = ab.isFree;
      const priceStr = isFree ? 'Gratuit' : `€${(ab.price ? (ab.price / 100).toFixed(2) : '29,99')}`.replace('.', ',');
      const priceNum = isFree ? 0 : (ab.price ? ab.price / 100 : 29.99);

      items.push({
        id: ab.id,
        name: `${artistName} - ${ab.title}`,
        price: priceStr,
        priceNumber: priceNum,
        format: ab.tags?.[0] || 'Artbook & Vinyle',
        mainImage: ab.coverUrl,
        alternateImage: altUrl,
        description: ab.description || `Édition exclusive conçue par ${artistName}. Comprend les illustrations haute définition et planches originales.`,
        editionBadge: isFree ? 'Téléchargement Libre' : 'Édition Vinyle & Artbook'
      });
    });

    // Supplement with curated vinyl/CD editions if fewer than 4 to preserve the 4-column boutique grid
    const fallbackTemplates = [
      {
        nameSuffix: '(The Moth Tapes) - Vinyle Splatter Toffee',
        format: 'Vinyle',
        price: '€29,99',
        priceNumber: 29.99,
        altImg: defaultAlternate1,
        desc: `Édition collector vinyle couleur marbrée (Splatter Toffee) 180g sous pochette gatefold vernie. Comprend les créations visuelles de ${artistName} avec un livret d'art exclusif de 16 pages.`,
        badge: 'Édition Vinyle Marbré'
      },
      {
        nameSuffix: '(The Moth Tapes) - Vinyle Standard',
        format: 'Vinyle',
        price: '€29,99',
        priceNumber: 29.99,
        altImg: defaultAlternate2,
        desc: `Vinyle noir traditionnel audiophile 180g haute précision. Pochette double cartonnée avec gaufrage doré et gravure réalisée sous la direction artistique de ${artistName}.`,
        badge: 'Vinyle Standard 180g'
      },
      {
        nameSuffix: '(The Moth Tapes) - CD Deluxe',
        format: 'CD',
        price: '€17,99',
        priceNumber: 17.99,
        altImg: defaultAlternate3,
        desc: `Boîtier Digipack deluxe à trois volets avec vernis sélectif. Contient le disque doré sérigraphié et le livret d'illustrations de 24 pages.`,
        badge: 'CD Digipack Deluxe'
      },
      {
        nameSuffix: 'Pt. 2 Deluxe [RSD2026] - Vinyle Édition Limitée',
        format: 'Vinyle',
        price: '€25,99',
        priceNumber: 25.99,
        altImg: defaultAlternate4,
        desc: `Tirage limité pour collectionneurs numéroté à la main avec poster grand format dédicacé par ${artistName}.`,
        badge: 'Tirage Numéroté Limité'
      }
    ];

    let tIdx = 0;
    while (items.length < 4) {
      const template = fallbackTemplates[tIdx % fallbackTemplates.length];
      const sourceAb = relatedArtbooks[tIdx % (relatedArtbooks.length || 1)];
      const mainImg = sourceAb?.coverUrl || currentArtist.photoUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80';
      const altImg = sourceAb?.alternateCoverUrl || template.altImg;

      items.push({
        id: `${currentArtist.id}-prod-${items.length + 1}`,
        name: `${artistName} - ${sourceAb ? sourceAb.title : 'All My Demons Greeting Me As A Friend'} ${template.nameSuffix}`,
        price: template.price,
        priceNumber: template.priceNumber,
        format: template.format,
        mainImage: mainImg,
        alternateImage: altImg,
        description: template.desc,
        editionBadge: template.badge
      });
      tIdx++;
    }

    return items;
  }, [currentArtist, artbooks]);

  // Active hover/touch product state
  const [activeProductId, setActiveProductId] = useState<string>(() => products[0]?.id || '');
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState<{ show: boolean; productName: string }>({ show: false, productName: '' });

  // Update active product when artist changes
  useEffect(() => {
    if (products.length > 0) {
      setActiveProductId(products[0].id);
    }
  }, [products]);

  // Preload all product images to ensure zero flicker or flash on hover
  useEffect(() => {
    products.forEach(p => {
      const img1 = new Image();
      img1.src = p.mainImage;
      const img2 = new Image();
      img2.src = p.alternateImage;
    });
  }, [products]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [currentArtist?.id]);

  // Handler for adding to cart
  const handleAddToCart = (product: ArtistShopProduct) => {
    setAddedToast({ show: true, productName: product.name });
    setTimeout(() => {
      setAddedToast({ show: false, productName: '' });
    }, 3500);
  };

  // Find currently featured/spotlighted product
  const spotlightProduct = useMemo<ArtistShopProduct>(() => {
    const found = products.find(p => p.id === activeProductId);
    return found || products[0];
  }, [products, activeProductId]);

  if (!currentArtist) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-3 font-almodobar">Artiste introuvable</h2>
        <p className="text-zinc-400 mb-6 max-w-md">L'artiste sélectionné n'existe pas ou a été déplacé.</p>
        <button
          onClick={() => setViewMode('artistes')}
          className="px-6 py-2.5 bg-white text-black font-semibold hover:bg-zinc-200 transition-colors cursor-pointer"
        >
          Retour aux artistes
        </button>
      </div>
    );
  }

  // Fallback banner image if artist has none
  const bannerImage = currentArtist.bannerUrl || '/assets/aistudio/B_b43464f2.png';

  return (
    <div className="w-full bg-[#000000] text-white">

      {/* Cart Toast Notification */}
      {addedToast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3.5 shadow-2xl border border-zinc-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center font-bold shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div className="text-xs">
            <p className="font-bold">Ajouté au panier !</p>
            <p className="text-zinc-300 line-clamp-1 max-w-xs">{addedToast.productName}</p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1) SECTION BANNIÈRE ARTISTE (Image + Nom + Description)  */}
      {/* ======================================================== */}
      <section className="relative w-full h-[52vh] min-h-[380px] max-h-[640px] overflow-hidden bg-black flex flex-col justify-between">
        
        {/* Background Banner Image */}
        <div className="absolute inset-0 w-full h-full">
          <img 
            src={bannerImage} 
            alt={currentArtist.name}
            className="w-full h-full object-cover object-center"
          />
          {/* Subtle gradient to ensure clear text legibility matching B_b43464f2.png */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/20" />
        </div>

        {/* Top Floating Back Link */}
        <div className="relative z-20 px-6 sm:px-10 lg:px-16 pt-6">
          <button
            onClick={() => setViewMode('artistes')}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white/80 hover:text-white transition-colors bg-black/40 backdrop-blur-md px-3.5 py-1.5 border border-white/20 hover:border-white cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Artistes</span>
          </button>
        </div>

        {/* Bottom Banner Content: Nom de l'artiste + petite description */}
        <div className="relative z-20 w-full px-6 sm:px-10 lg:px-16 pb-8 sm:pb-12 max-w-6xl">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white uppercase tracking-tight font-sans leading-none drop-shadow-md">
            {currentArtist.name}
          </h1>

          <p className="text-sm sm:text-base text-white/90 max-w-2xl mt-3 sm:mt-4 leading-relaxed font-sans drop-shadow font-normal">
            {currentArtist.bio || 'Directeur artistique et maître illustrateur, explorant la richesse des mythes et de l\'imaginaire contemporain.'}
          </p>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2) SECTION ŒUVRES / BOUTIQUE (Fond Blanc, style Capitol)  */}
      {/* ======================================================== */}
      <section className="w-full bg-[#FFFFFF] text-[#000000] py-14 sm:py-20 lg:py-24">
        <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12">
          
          {/* Grille de 4 produits par ligne sur ordinateur, 2 sur tablette, 1 sur mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 lg:gap-x-10 gap-y-14">
            {products.map((product) => {
              const isHovered = hoveredProductId === product.id;
              const showAlternate = isHovered;

              return (
                <div
                  key={product.id}
                  onMouseEnter={() => {
                    setHoveredProductId(product.id);
                    setActiveProductId(product.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredProductId(null);
                  }}
                  onClick={() => {
                    setActiveProductId(product.id);
                  }}
                  onFocus={() => {
                    setHoveredProductId(product.id);
                    setActiveProductId(product.id);
                  }}
                  onBlur={() => {
                    setHoveredProductId(null);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${product.name} - ${product.price}`}
                  className="flex flex-col justify-between focus:outline-none group cursor-pointer"
                >
                  {/* Zone Image : Grande image produit entièrement visible sans recadrage */}
                  <div className="relative w-full aspect-[4/3] sm:aspect-square flex items-center justify-center p-2 overflow-hidden bg-transparent">
                    {/* Vue Principale : revient immédiatement sans latence dès la sortie du curseur */}
                    <img
                      src={product.mainImage}
                      alt={product.name}
                      className={`absolute inset-0 w-full h-full object-contain ${
                        showAlternate ? 'opacity-0 pointer-events-none' : 'opacity-100'
                      }`}
                    />

                    {/* Vue Alternative (Vinyle / CD / Livret) : apparaît immédiatement au survol sans délai */}
                    <img
                      src={product.alternateImage}
                      alt={`${product.name} vue alternative`}
                      className={`absolute inset-0 w-full h-full object-contain ${
                        showAlternate ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    />
                  </div>

                  {/* Informations Produit : Harmonisation de la hauteur des titres pour aligner les boutons */}
                  <div className="flex flex-col items-center text-center mt-4">
                    {/* Nom du produit centré */}
                    <h3 className="text-zinc-900 font-sans text-[13px] sm:text-[14px] leading-snug line-clamp-2 h-11 flex items-center justify-center px-1 font-normal">
                      {product.name}
                    </h3>

                    {/* Prix centré */}
                    <div className="mt-2 text-zinc-900 font-sans text-[13px] sm:text-[14px] font-normal">
                      {product.price}
                    </div>

                    {/* Bouton rectangulaire noir « Ajouter au panier » avec texte blanc */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="mt-3.5 px-6 py-2 bg-black hover:bg-zinc-800 active:bg-zinc-900 text-white font-sans text-[12px] font-semibold tracking-normal transition-colors cursor-pointer rounded-none inline-flex items-center justify-center"
                    >
                      Ajouter au panier
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ======================================================== */}
          {/* SECONDE SECTION : PRÉSENTATION SPOTLIGHT DU PRODUIT     */}
          {/* Apparaît / se met à jour automatiquement sous la grille  */}
          {/* ======================================================== */}
          {spotlightProduct && (
            <div 
              id="spotlight-section"
              className="mt-20 pt-16 border-t border-zinc-200 transition-all duration-300 ease-out"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center max-w-5xl mx-auto">
                
                {/* Grand aperçu du CD ou du Vinyle */}
                <div className="md:col-span-6 flex items-center justify-center p-4">
                  <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
                    <img 
                      src={spotlightProduct.alternateImage} 
                      alt={spotlightProduct.name}
                      className="w-full h-full object-contain transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Détails : Titre, Courte description, Prix, Bouton d'achat */}
                <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left">
                  {spotlightProduct.editionBadge && (
                    <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                      {spotlightProduct.editionBadge}
                    </span>
                  )}

                  <h2 className="text-xl sm:text-2xl font-black text-black font-sans leading-tight">
                    {spotlightProduct.name}
                  </h2>

                  <div className="text-lg sm:text-xl font-normal text-zinc-900 my-3">
                    {spotlightProduct.price}
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed max-w-lg mb-6">
                    {spotlightProduct.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(spotlightProduct)}
                      className="px-8 py-3 bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-none cursor-pointer flex items-center gap-2"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Ajouter au panier</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(spotlightProduct)}
                      className="px-6 py-3 border border-black hover:bg-zinc-100 text-black text-xs font-bold uppercase tracking-wider transition-colors rounded-none cursor-pointer"
                    >
                      Acheter maintenant
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
};
