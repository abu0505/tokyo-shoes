export const getRandomColor = (seed: string) => {
    const colors = [
        'bg-red-100 text-red-700',
        'bg-green-100 text-green-700',
        'bg-blue-100 text-blue-700',
        'bg-yellow-100 text-yellow-700',
        'bg-purple-100 text-purple-700',
        'bg-pink-100 text-pink-700',
        'bg-orange-100 text-orange-700',
        'bg-cyan-100 text-cyan-700',
    ];

    // Simple hash function for the seed
    const normalizedSeed = seed.trim().toLowerCase();
    let hash = 0;
    for (let i = 0; i < normalizedSeed.length; i++) {
        hash = normalizedSeed.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
};
