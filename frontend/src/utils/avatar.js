const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getAvatarImageUrl = (profileImage) => {
    if (!profileImage) return '';
    return profileImage.startsWith('http') ? profileImage : `${API_URL}${profileImage}`;
};

export const getAvatarInitials = (user) => {
    if (!user) return 'U';

    const firstName = (user.firstName || '').trim();
    const lastName = (user.lastName || '').trim();

    if (firstName && lastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (firstName) {
        return firstName.substring(0, 2).toUpperCase();
    }

    const emailPrefix = (user.email || '').split('@')[0].trim();
    return emailPrefix.substring(0, 2).toUpperCase() || 'U';
};
