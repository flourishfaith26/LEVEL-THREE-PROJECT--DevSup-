export const DEFAULT_AVATAR = '/default-avatar.svg';

export const isDefaultOrInvalidAvatar = (url) => {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return true;
  if (trimmed.includes('ui-avatars.com')) return true;
  if (trimmed.includes('placeholder.com')) return true;
  if (trimmed.includes('via.placeholder')) return true;
  return false;
};

export const getAvatarUrl = (url) => {
  if (isDefaultOrInvalidAvatar(url)) {
    return DEFAULT_AVATAR;
  }
  return url.trim();
};
