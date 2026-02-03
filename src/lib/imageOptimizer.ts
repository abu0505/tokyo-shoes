
export const getOptimizedImageUrl = (url: string, width: number, quality: number = 80): string => {
    const supabaseDomain = "qdbvxznnzukdwooziqmd.supabase.co";

    if (!url || !url.includes(supabaseDomain)) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set("width", width.toString());
        urlObj.searchParams.set("format", "webp");
        urlObj.searchParams.set("quality", quality.toString());
        urlObj.searchParams.set("resize", "contain");
        return urlObj.toString();
    } catch (e) {
        return url;
    }
};
