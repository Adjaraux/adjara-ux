/**
 * Extrait l'ID de la vidéo YouTube à partir de n'importe quel format d'URL
 * @param url URL YouTube (standard, raccourcie, embed, etc.)
 * @returns L'ID de la vidéo ou null si invalide
 */
export function getYouTubeId(url: string | null | undefined): string | null {
    if (!url) return null;

    const regex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regex);

    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Génère l'URL d'aperçu de la miniature YouTube (HQ)
 */
export function getYouTubeThumbnail(videoId: string | null): string | null {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Génère l'URL d'intégration YouTube
 */
export function getYouTubeEmbedUrl(videoId: string | null): string {
    if (!videoId) return '';
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1&rel=0`;
}
