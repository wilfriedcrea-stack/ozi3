import { Request, Response, NextFunction } from 'express';
import { hasValidAccess } from '../services/subscriptionService';

export interface AuthenticatedPremiumRequest extends Request {
  readerUid?: string;
  subscription?: any;
}

/**
 * Autonomous Server Middleware: requirePremiumAccess
 * Verifies that the requester has an active, unexpired 30-day Premium subscription for the specified work.
 * 
 * @param getWorkId Extractor function to obtain the workId from request parameters, body, or query
 */
export function requirePremiumAccess(getWorkId: (req: Request) => string | undefined) {
  return async (req: AuthenticatedPremiumRequest, res: Response, next: NextFunction) => {
    try {
      // Extract reader UID from headers or authentication session
      const uid = (req.headers['x-reader-uid'] as string) || 
                  (req.headers['x-user-uid'] as string) || 
                  (req.query.uid as string) || 
                  (req.body && req.body.uid);

      const workId = getWorkId(req);

      if (!uid) {
        return res.status(401).json({
          error: 'Authentification requise',
          message: 'Veuillez vous connecter pour vérifier vos droits d\'accès Premium.',
          code: 'auth_required'
        });
      }

      if (!workId) {
        return res.status(400).json({
          error: 'Identifiant d’œuvre manquant',
          message: 'L\'identifiant de l’œuvre (workId) est requis pour valider l\'accès.',
          code: 'missing_work_id'
        });
      }

      // Authoritative server timestamp verification
      const check = await hasValidAccess(uid, workId);

      if (!check.hasAccess) {
        return res.status(403).json({
          error: 'Accès Premium non disponible',
          message: check.reason === 'subscription_expired'
            ? 'Votre abonnement de 30 jours pour cette œuvre a expiré. Veuillez le renouveler pour continuer votre lecture.'
            : 'Un abonnement Premium individuel de 30 jours (via Paystack) est requis pour accéder à cette œuvre.',
          code: check.reason || 'subscription_required',
          workId,
          serverTime: check.serverTime,
          details: check
        });
      }

      // Attach subscription details to request
      req.readerUid = uid;
      req.subscription = check.subscription;

      next();
    } catch (err: any) {
      console.error('[requirePremiumAccess] Middleware error:', err);
      return res.status(500).json({
        error: 'Erreur interne de vérification',
        message: 'Impossible de vérifier vos droits d\'accès pour le moment.',
        code: 'server_error'
      });
    }
  };
}
