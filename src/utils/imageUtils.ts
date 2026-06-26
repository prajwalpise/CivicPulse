import React from "react";

// Reliable fallback image for municipal issues (e.g. city community, clean construction, etc.)
export const FALLBACK_ISSUE_IMAGE = "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&auto=format&fit=crop&q=60";

// Reliable fallback avatar for users
export const FALLBACK_USER_IMAGE = "https://api.dicebear.com/7.x/initials/svg?seed=User&backgroundColor=f59e0b,3b82f6,10b981,ef4444";

/**
 * Fallback handler for issue/content images
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl = FALLBACK_ISSUE_IMAGE) => {
  const target = e.currentTarget;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
};

/**
 * Fallback handler for user profile pictures / avatars
 */
export const handleUserImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name = "User") => {
  const target = e.currentTarget;
  const fallbackUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=f59e0b,3b82f6,10b981,ef4444`;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
};
