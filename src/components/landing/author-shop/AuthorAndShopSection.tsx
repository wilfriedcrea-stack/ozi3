import React, { useState } from 'react';
import { ShoppingBag, Check, X, MessageCircle, CreditCard, ExternalLink } from 'lucide-react';
import { Series } from '../../../types';

interface ProductItem {
  id: string;
  title: string;
  category: string;
  image: string;
  priceCfa: number;
  priceEur: number;
  description: string;
  linkUrl?: string;
  sizes?: string[];
}

interface AuthorAndShopSectionProps {
  series: Series;
}

export const AuthorAndShopSection: React.FC<AuthorAndShopSectionProps> = ({ series }) => {
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [quantity, setQuantity] = useState<number>(1);
  const [isOrdered, setIsOrdered] = useState<boolean>(false);

  // Author details tailored to series
  const authorName = series.author || '';
  const artistName = series.artist || '';
  const authorPhoto = series.authorPhotoUrl || '';
  const authorBio = series.authorBio?.trim() || '';

  const hasAuthorInfo = Boolean(authorName || authorBio || authorPhoto);
  const hasShopArticles = Array.isArray(series.shopArticles) && series.shopArticles.length > 0;

  // Si ni l'auteur ni aucun article boutique n'est configuré, ne rien afficher
  if (!hasAuthorInfo && !hasShopArticles) {
    return null;
  }

  // Articles boutique réels configurés pour cette série
  const products: ProductItem[] = hasShopArticles
    ? series.shopArticles!.map((item, idx) => ({
        id: item.id || `shop-item-${idx}`,
        title: item.title,
        category: item.category || 'Article Officiel',
        image: item.image,
        priceCfa: item.priceCfa ?? 10000,
        priceEur: item.priceEur ?? 15,
        description: item.description || `Produit officiel dérivé de l'univers de ${series.title}.`,
        linkUrl: item.linkUrl,
        sizes: item.sizes
      }))
    : [];

  const handleOpenOrder = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsOrdered(false);
    setQuantity(1);
    if (product.sizes) {
      setSelectedSize(product.sizes[2] || 'L');
    }
  };

  const handleDirectOrder = () => {
    setIsOrdered(true);
    setTimeout(() => {
      setIsOrdered(false);
      setSelectedProduct(null);
    }, 2800);
  };

  return (
    <div className="w-full my-12 pt-6 pb-8 text-white">
      
      {/* 1. SECTION L'AUTEUR (visible si des informations sur l'auteur existent) */}
      {hasAuthorInfo && (
        <section className={`max-w-4xl mx-auto px-4 text-center ${hasShopArticles ? 'mb-16' : 'mb-6'}`}>
          <h2 
            className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wider mb-8 font-almodobar"
            style={{ letterSpacing: '0.06em' }}
          >
            L'AUTEUR
          </h2>

          {/* Circular Avatar */}
          {authorPhoto ? (
            <div className="relative mx-auto mb-7 w-36 h-36 sm:w-44 sm:h-44">
              <div className="w-full h-full rounded-full border-2 border-white/90 overflow-hidden shadow-2xl bg-zinc-900 flex items-center justify-center p-0.5 ring-4 ring-white/10">
                <img
                  src={authorPhoto}
                  alt={`Portrait de ${authorName}`}
                  className="w-full h-full object-cover object-center rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-2 -right-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-[11px] shadow-lg border border-white/20">
                Créateur
              </div>
            </div>
          ) : (
            <div className="relative mx-auto mb-7 w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-white/40 overflow-hidden shadow-xl bg-zinc-900 flex items-center justify-center p-0.5">
              <span className="text-3xl font-black text-amber-400">
                {(authorName || 'OZI').charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Author Bio */}
          <div className="space-y-4 max-w-2xl mx-auto text-zinc-300 text-xs sm:text-sm leading-relaxed font-sans">
            <p className="font-semibold text-white text-base sm:text-lg">
              {authorName} {artistName && artistName !== authorName ? `& ${artistName}` : ''}
            </p>
            {authorBio ? (
              <p className="text-zinc-300 leading-relaxed text-justify sm:text-center whitespace-pre-line">
                {authorBio}
              </p>
            ) : (
              <p className="text-zinc-400 italic text-xs">
                Auteur et artiste créateur de la série {series.title} sur la plateforme OZI BD.
              </p>
            )}
            <p className="text-zinc-400 text-[11px] sm:text-xs italic">
              Chaque chapitre est minutieusement composé avec passion et sens du détail. Merci pour votre lecture !
            </p>
          </div>
        </section>
      )}

      {/* 2. SECTION BOUTIQUE : STRICTEMENT VISIBLE SEULEMENT SI DES ARTICLES ONT ÉTÉ AJOUTÉS */}
      {hasShopArticles && products.length > 0 && (
        <section className={`max-w-6xl mx-auto px-4 ${hasAuthorInfo ? 'pt-8' : ''}`}>
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Boutique Officielle</span>
            </div>
            <h2 
              className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wider font-almodobar"
              style={{ letterSpacing: '0.06em' }}
            >
              BOUTIQUE
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md">
              Produits dérivés et éditions exclusives créés pour l'univers de {series.title}.
            </p>
          </div>

          {/* Columns Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 lg:gap-10">
            {products.map((product) => (
              <div 
                key={product.id}
                className="flex flex-col group"
              >
                {/* Image Frame with White Border & Buy Button */}
                <div className="relative aspect-square w-full rounded-sm border-2 border-white/80 bg-zinc-950 overflow-visible mb-6 shadow-2xl flex items-center justify-center p-2.5">
                  <div className="w-full h-full overflow-hidden bg-zinc-900 rounded-sm">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Overlapping Buy Button */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-10">
                    {product.linkUrl ? (
                      <a
                        href={product.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-8 py-2 rounded-full bg-[#ff8679] hover:bg-[#ffa296] text-white text-sm font-bold shadow-lg shadow-orange-950/60 hover:shadow-orange-600/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                      >
                        <span>Achetez</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => handleOpenOrder(product)}
                        className="px-8 py-2 rounded-full bg-[#ff8679] hover:bg-[#ffa296] text-white text-sm font-bold shadow-lg shadow-orange-950/60 hover:shadow-orange-600/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      >
                        Achetez
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div className="pt-2 text-center sm:text-left">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 
                      className="text-lg sm:text-xl font-black text-white uppercase font-almodobar tracking-wide"
                    >
                      {product.title}
                    </h3>
                    <span className="text-xs font-bold text-orange-400 font-mono whitespace-nowrap">
                      {product.priceCfa.toLocaleString('fr-FR')} F
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans line-clamp-3">
                    {product.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal Commande Produit */}
      {hasShopArticles && selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="relative w-full max-w-lg rounded-3xl bg-[#12131c] border border-zinc-700/80 shadow-2xl p-6 text-white overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isOrdered ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-almodobar">Précommande Enregistrée !</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Votre demande pour <strong className="text-white">{selectedProduct.title}</strong> a bien été prise en compte. Un conseiller de l'équipe OZI Store vous contactera sous peu.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex gap-4 mb-6">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden border border-zinc-700 shrink-0 bg-zinc-900">
                    <img 
                      src={selectedProduct.image} 
                      alt={selectedProduct.title}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 font-mono">
                      {selectedProduct.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-black font-almodobar tracking-wide text-white truncate">
                      {selectedProduct.title}
                    </h3>
                    <p className="text-sm font-bold text-emerald-400 font-mono mt-1">
                      {selectedProduct.priceCfa.toLocaleString('fr-FR')} FCFA{' '}
                      <span className="text-zinc-500 text-xs">({selectedProduct.priceEur} €)</span>
                    </p>
                    <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                      {selectedProduct.description}
                    </p>
                  </div>
                </div>

                {/* Size selector if available */}
                {selectedProduct.sizes && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-zinc-400 mb-2">Choisir la taille :</label>
                    <div className="flex gap-2">
                      {selectedProduct.sizes.map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setSelectedSize(sz)}
                          className={`w-10 h-10 rounded-xl font-bold text-xs border transition-all ${
                            selectedSize === sz
                              ? 'bg-[#ff8679] text-white border-orange-400 shadow-md'
                              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-zinc-500'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 mb-6">
                  <span className="text-xs font-semibold text-zinc-300">Quantité</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm min-w-[20px] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold text-sm flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between py-2 border-t border-zinc-800 text-sm mb-6">
                  <span className="text-zinc-400">Total à régler :</span>
                  <span className="text-base font-black text-white font-mono">
                    {(selectedProduct.priceCfa * quantity).toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-2.5">
                  {selectedProduct.linkUrl && (
                    <a
                      href={selectedProduct.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Accéder à la boutique en ligne</span>
                    </a>
                  )}

                  <a
                    href={`https://wa.me/2250700000000?text=${encodeURIComponent(
                      `Bonjour l'équipe OZI Store ! Je souhaite commander :\n- Produit : ${selectedProduct.title} (Série : ${series.title})${selectedProduct.sizes ? ` - Taille : ${selectedSize}` : ''}\n- Quantité : ${quantity}\n- Montant : ${(selectedProduct.priceCfa * quantity).toLocaleString('fr-FR')} FCFA (${(selectedProduct.priceEur * quantity)} €)\nMerci de m'indiquer les modalités de livraison !`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Commander via WhatsApp OZI Store</span>
                  </a>

                  <button
                    onClick={handleDirectOrder}
                    className="w-full py-3 rounded-2xl bg-[#ff8679] hover:bg-[#ffa296] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Précommander en ligne (Paiement à la livraison)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
