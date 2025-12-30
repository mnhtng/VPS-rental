// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce<T extends (...args: any[]) => any>(callback: T, delay: number) {
    let timer: number | NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);

        timer = setTimeout(() => {
            callback(...args);
        }, delay) as NodeJS.Timeout;
    };
}

export default debounce;