/**
 * Parité officielle FCFA (XOF) / Euro (EUR) : 1 EUR = 655,957 FCFA.
 */
export const XOF_PER_EUR = 655.957;

export function convertXofToEur(amountXof: number): number {
  if (!Number.isFinite(amountXof) || amountXof <= 0) return 0;
  return amountXof / XOF_PER_EUR;
}

export function formatEurValue(amountEur: number): string {
  if (!Number.isFinite(amountEur) || amountEur <= 0) {
    return '0,00 EUR';
  }
  return `${amountEur.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} EUR`;
}

/**
 * Formate un prix en FCFA suivi de son équivalent en Euro entre parenthèses :
 * Exemple : "2 000 FCFA (3,05 EUR)"
 * Si un prix en Euro explicite (> 0) est fourni (ex. packs de coins ou articles boutique),
 * il est utilisé ; sinon la conversion officielle (1 EUR = 655,957 FCFA) est appliquée.
 */
export function formatPriceXofWithEur(amountXof: number, explicitEur?: number): string {
  const safeXof = Number.isFinite(amountXof) && amountXof > 0 ? Math.round(amountXof) : 0;
  const eurValue =
    typeof explicitEur === 'number' && Number.isFinite(explicitEur) && explicitEur > 0
      ? explicitEur
      : convertXofToEur(safeXof);

  return `${safeXof.toLocaleString('fr-FR')} FCFA (${formatEurValue(eurValue)})`;
}
