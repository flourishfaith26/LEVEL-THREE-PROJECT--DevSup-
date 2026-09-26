export const detectEcosystemLink = (text) => {
    if (!text || typeof text !== 'string') return null;

    const githubMatch = text.match(/https?:\/\/(www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/);
    if (githubMatch) {
        return { type: 'github', url: githubMatch[0], owner: githubMatch[2], repo: githubMatch[3] };
    }

    const figmaMatch = text.match(/https?:\/\/(www\.)?figma\.com\/(file|design)\/([a-zA-Z0-9_-]+)/);
    if (figmaMatch) {
        return { type: 'figma', url: figmaMatch[0], fileId: figmaMatch[3] };
    }

    const notionMatch = text.match(/https?:\/\/(www\.)?notion\.so\/([a-zA-Z0-9_-]+)/);
    if (notionMatch) {
        return { type: 'notion', url: notionMatch[0] };
    }

    return null;
};