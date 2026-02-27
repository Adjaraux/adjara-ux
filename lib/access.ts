import { differenceInDays, isAfter } from 'date-fns';

export type PackType = 'essentiel' | 'expert' | 'master' | null;

export type AccessStatus =
    | { allowed: true; reason: 'trial' | 'subscription' | 'admin' }
    | { allowed: false; reason: 'expired' | 'locked_pack' | 'not_logged_in' };

interface UserProfile {
    id: string;
    role?: string;
    created_at: string;
    pack_type?: PackType;
    subscription_end?: string | null;
    specialty?: string;
}

/**
 * Determines if a user has access to a specific course category.
 * Now supports Specialty Gating.
 */
export function checkAccess(user: UserProfile | null, courseCategory: string, courseSpecialty?: string): AccessStatus {
    if (!user) return { allowed: false, reason: 'not_logged_in' };

    // 1. Admin Override
    if (user.role === 'admin') return { allowed: true, reason: 'admin' };

    const now = new Date();
    const createdAt = new Date(user.created_at);

    // 2. Check Subscription
    const hasActiveSubscription = user.subscription_end && isAfter(new Date(user.subscription_end), now);

    if (hasActiveSubscription) {
        // Check Pack Level
        const pack = user.pack_type;

        if (pack === 'master') return { allowed: true, reason: 'subscription' };

        // Essentiel & Expert: Single Specialty Logic
        if (pack === 'expert' || pack === 'essentiel') {
            if (courseCategory === 'tronc_commun') return { allowed: true, reason: 'subscription' };

            if (courseCategory === 'specialite') {
                // If user hasn't chosen a specialty yet, we allow browsing (to make a choice)
                // In Phase 2, we will likely force a selection modal.
                if (!user.specialty) return { allowed: true, reason: 'subscription' };

                // If user HAS a specialty, they can only access that one
                if (courseSpecialty && user.specialty === courseSpecialty) {
                    return { allowed: true, reason: 'subscription' };
                }

                // If no match
                return { allowed: false, reason: 'locked_pack' };
            }
        }
    }

    // 3. Check Free Trial (7 Days)
    const daysSinceCreation = differenceInDays(now, createdAt);
    const isInTrial = daysSinceCreation < 7;

    if (isInTrial) {
        if (courseCategory === 'tronc_commun') {
            return { allowed: true, reason: 'trial' };
        } else {
            return { allowed: false, reason: 'locked_pack' }; // Trial only opens Tronc Commun
        }
    }

    // 4. Fallback: Expired Trial & No Subscription
    return { allowed: false, reason: 'expired' };
}

/**
 * Returns the remaining trial days (or 0 if expired/subscribed).
 */
export function getTrialDaysRemaining(user: UserProfile): number {
    if (user.pack_type) return 0; // Already subscribed

    const now = new Date();
    const createdAt = new Date(user.created_at);
    const daysSinceCreation = differenceInDays(now, createdAt);

    const remaining = 7 - daysSinceCreation;
    return remaining > 0 ? remaining : 0;
}
