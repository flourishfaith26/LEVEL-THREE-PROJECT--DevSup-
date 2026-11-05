export const DEFAULT_AVATAR = '/default-avatar.svg';

export const getAvatarUrl = (url, name = 'User') => {
  if (url && typeof url === 'string' && url.trim() && !url.includes('placeholder.com')) {
    return url.trim();
  }
  return DEFAULT_AVATAR;
};

