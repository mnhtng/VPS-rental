export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

export const formatPriceNumber = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
};

export const convertUSDToVND = (usdPrice: number, exchangeRate: number = 24000): number => {
    return Math.round(usdPrice * exchangeRate);
};

export const formatPriceRange = (minPrice: number, maxPrice: number): string => {
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};
