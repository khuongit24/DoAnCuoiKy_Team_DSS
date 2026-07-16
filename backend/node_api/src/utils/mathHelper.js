const roundToDecimals = (num, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
};

const calculateSum = (array) => {
    return array.reduce((acc, curr) => acc + curr, 0);
};

const calculateAverage = (array) => {
    if (array.length === 0) return 0;
    return calculateSum(array) / array.length;
};

const calculateStdDev = (array) => {
    if (array.length === 0) return 0;
    const avg = calculateAverage(array);
    const squareDiffs = array.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
};

module.exports = {
    roundToDecimals,
    calculateSum,
    calculateAverage,
    calculateStdDev
};
