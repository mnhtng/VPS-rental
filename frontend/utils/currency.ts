/**
 * Format price to Vietnamese Dong (VND) currency
 * @param price - The price in VND (number)
 * @returns Formatted price string with VND currency symbol
 */
export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
};

/**
 * Format price without currency symbol
 * @param price - The price in VND (number)
 * @returns Formatted price string without currency symbol
 */
export const formatPriceNumber = (price: number): string => {
    return new Intl.NumberFormat('vi-VN').format(price);
};

/**
 * Convert USD to VND (example conversion rate - should be dynamic in real app)
 * @param usdPrice - Price in USD
 * @param exchangeRate - USD to VND exchange rate (default: 24000)
 * @returns Price in VND
 */
export const convertUSDToVND = (usdPrice: number, exchangeRate: number = 24000): number => {
    return Math.round(usdPrice * exchangeRate);
};

/**
 * Format price range (min - max)
 * @param minPrice - Minimum price in VND
 * @param maxPrice - Maximum price in VND
 * @returns Formatted price range string
 */
export const formatPriceRange = (minPrice: number, maxPrice: number): string => {
    return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
};