export const getDailyUserColor = (userId) => {
    if (!userId) return 'var(--colors-accent)';
    
    // Get the current date in YYYY-MM-DD format
    const today = new Date();
    const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    
    // Combine userId and date string to create a seed
    const seedString = userId + dateString;
    
    // Simple string hashing function
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
        hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use the hash to generate an HSL color
    // Hue: 0-360 (full color spectrum)
    const hue = Math.abs(hash % 360);
    // Saturation: 70-100% (vibrant)
    const saturation = 70 + Math.abs(hash % 30);
    // Lightness: 60-80% (looks good in dark mode)
    const lightness = 60 + Math.abs((hash >> 8) % 20);
    
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};
