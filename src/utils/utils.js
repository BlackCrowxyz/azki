export const formatPrice = (price) => {
    return new Intl.NumberFormat('fa-IR').format(price);
};

export const handleImageError = (e, defaultImage) => {
    e.target.src = defaultImage;
}; 