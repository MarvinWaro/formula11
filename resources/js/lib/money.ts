/**
 * Format a numeric fee as Philippine pesos. Null or zero → "Free".
 */
export function formatPeso(fee: number | null): string {
    if (fee === null || fee === 0) {
        return 'Free';
    }

    return `₱${fee.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
