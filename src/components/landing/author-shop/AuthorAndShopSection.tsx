import React, { useState } from 'react';
import { ShoppingBag, Check, X, MessageCircle, CreditCard, Sparkles, Star } from 'lucide-react';
import { Series } from '../../../types';

interface ProductItem {
  id: string;
  title: string;
  category: string;
  image: string;
  priceCfa: number;
  priceEur: number;
  description: string;
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

  // Default author bio tailored to series or fallback
  const authorName = series.author || 'Wilfried Crea';
  const artistName = series.artist || series.author || 'Studio OZI';

  // Products tailored to the series
  const products: ProductItem[] = [
    {
      id: 'artbook',
      title: 'ARTBOOK DU PROJET',
      category: 'Livre & Édition',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      priceCfa: 15000,
      priceEur: 23,
      description: `Recueil officiel d'illustrations haute définition, planches inédites, croquis préparatoires et coulisses de conception de l'univers de ${series.title}. Reliure rigide collector de 160 pages couleur.`
    },
    {
      id: 'tshirt',
      title: 'T-SHIRT AKOUN',
      category: 'Vêtements Officiels',
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      priceCfa: 10000,
      priceEur: 15,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      description: `T-shirt officiel collector en coton 100% peigné bio ultra-doux avec sérigraphie haute résistance représentant les héros de ${series.title}. Coupe décontractée et finitions soignées.`
    },
    {
      id: 'cards',
      title: 'JEU DE CARTE',
      category: 'Goodies & Jeux',
      image: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=800&q=80',
      priceCfa: 8000,
      priceEur: 12,
      description: `Coffret collector de 54 cartes de jeu magnifiquement illustrées mettant en scène les combattants, totems sacrés et divinités de l'univers OZI BD.`
    }
  ];

  const handleOpenOrder = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsOrdered(false);
    setQuantity(1);
    if (product.sizes) {
      setSelectedSize(product.sizes[2] || 'L');
    }
  };

  const handleWhatsAppOrder = () => {
    if (!selectedProduct) return;
    const sizeText = selectedProduct.sizes ? ` - Taille : ${selectedSize}` : '';
    const message = encodeURIComponent(
      `Bonjour l'équipe OZI Store ! Je souhaite commander :\n- Produit : ${selectedProduct.title} (Série : ${series.title})${sizeText}\n- Quantité : ${quantity}\n- Montant : ${(selectedProduct.priceCfa * quantity).toLocaleString('fr-FR')} FCFA (${(selectedProduct.priceEur * quantity)} €)\nMerci de m'indiquer les modalités de livraison !`
    );
    window.open(`https://wa.me/2250700000000?text=${message}`, '_blank');
  };

  const handleDirectOrder = () => {
    setIsOrdered(true);
    setTimeout(() => {
      setIsOrdered(false);
      setSelectedProduct(null);
    }, 2800);
  };

  return (
    <div className="w-full my-12 pt-6 pb-8 text-white border-t border-zinc-800/80">
      
      {/* 1. SECTION L'AUTEUR */}
      <section className="max-w-4xl mx-auto px-4 text-center mb-16">
        <h2 
          className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wider mb-8 font-almodobar"
          style={{ letterSpacing: '0.06em' }}
        >
          L'AUTEUR
        </h2>

        {/* Circular Avatar */}
        <div className="relative mx-auto mb-7 w-36 h-36 sm:w-44 sm:h-44">
          <div className="w-full h-full rounded-full border-2 border-white/90 overflow-hidden shadow-2xl bg-zinc-900 flex items-center justify-center p-0.5 ring-4 ring-white/10">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
              alt={`Portrait de ${authorName}`}
              className="w-full h-full object-cover object-center rounded-full"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-2 -right-1 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-bold text-[11px] shadow-lg border border-white/20">
            Créateur
          </div>
        </div>

        {/* Author Bio */}
        <div className="space-y-4 max-w-2xl mx-auto text-zinc-300 text-xs sm:text-sm leading-relaxed font-sans">
          <p className="font-semibold text-white text-base sm:text-lg">
            {authorName} {artistName && artistName !== authorName ? `& ${artistName}` : ''}
          </p>
          <p className="text-zinc-300 leading-relaxed text-justify sm:text-center">
            Auteur et artiste passionné de la scène afro-manga et webtoon contemporaine. À travers <strong className="text-orange-400 font-medium">{series.title}</strong>, l'ambition est de sublimer les récits épiques, les mythes ancestraux et les fresques visuelles percutantes pour offrir aux lecteurs du continent et du monde entier une expérience graphique inoubliable.
          </p>
          <p className="text-zinc-400 text-[11px] sm:text-xs italic">
            Chaque chapitre est minutieusement composé avec amour du détail, découpage dynamique et une colorisation immersive. Merci à toute la communauté pour votre fidélité !
          </p>
        </div>
      </section>

      {/* 2. SECTION BOUTIQUE */}
      <section className="max-w-6xl mx-auto px-4">
        <h2 
          className="text-3xl sm:text-5xl font-black uppercase text-white tracking-wider mb-10 text-center font-almodobar"
          style={{ letterSpacing: '0.06em' }}
        >
          BOUTIQUE
        </h2>

        {/* 3 Columns Products Grid */}
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
                  <button
                    onClick={() => handleOpenOrder(product)}
                    className="px-8 py-2 rounded-full bg-[#f05146] hover:bg-[#ff6154] text-white text-sm font-bold shadow-lg shadow-red-950/60 hover:shadow-red-600/40 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                  >
                    Achetez
                  </button>
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
                  <span className="text-xs font-bold text-orange-400 font-mono">
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

      {/* Modal Commande Produit */}
      {selectedProduct && (
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
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
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
                              ? 'bg-[#f05146] text-white border-red-500 shadow-md'
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
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold text-sm flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm min-w-[20px] text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-bold text-sm flex items-center justify-center"
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
                  <button
                    onClick={handleWhatsAppOrder}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Commander via WhatsApp OZI Store</span>
                  </button>

                  <button
                    onClick={handleDirectOrder}
                    className="w-full py-3 rounded-2xl bg-[#f05146] hover:bg-[#ff6154] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/50 transition-all cursor-pointer"
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
