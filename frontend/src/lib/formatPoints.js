export const formatPoints = (value) => {
    if (value === null || value === undefined || value === '') return '—';

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return '—';

    if (Number.isInteger(numeric)) return String(numeric);

    return numeric.toFixed(2).replace(/\.?0+$/, '');
};
