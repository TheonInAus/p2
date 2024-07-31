/**
 * Helper class to calculate adjusted gas value that is higher than estimate
 */
export class GasHelper {
    static gasMulptiplier = 10 // Increase by 25%

    /**
     * @param {string} gas Gas limit
     * @return {string} Adjusted gas limit
     */
    static gasPay(gasLimit: string) {
        return Math.ceil(Number(gasLimit) * GasHelper.gasMulptiplier).toString()
    }
}