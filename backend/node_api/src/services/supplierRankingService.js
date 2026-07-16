class SupplierRankingService {
    calculateAHPWeights(pairwiseMatrix) {
        const n = pairwiseMatrix.length;
        
        // Validation ma trận đối xứng nghịch đảo
        for (let i = 0; i < n; i++) {
            if (pairwiseMatrix[i].length !== n) throw new Error('Ma trận phải là ma trận vuông n x n');
            for (let j = 0; j < n; j++) {
                // Sử dụng sai số nhỏ để kiểm tra số thập phân
                if (Math.abs(pairwiseMatrix[i][j] * pairwiseMatrix[j][i] - 1) > 0.0001 && i !== j) {
                    throw new Error('Ma trận không đối xứng nghịch đảo');
                }
            }
        }
        
        const colSums = Array(n).fill(0);
        for (let j = 0; j < n; j++) {
            for (let i = 0; i < n; i++) {
                colSums[j] += pairwiseMatrix[i][j];
            }
        }

        const normalizedMatrix = pairwiseMatrix.map((row, i) =>
            row.map((val, j) => val / colSums[j])
        );

        const weights = normalizedMatrix.map(row =>
            row.reduce((sum, val) => sum + val, 0) / n
        );

        const cr = this._calculateConsistencyRatio(pairwiseMatrix, weights, n);

        return {
            weights,
            consistency_ratio: Math.round(cr * 10000) / 10000,
            is_consistent: cr < 0.1
        };
    }

    _calculateConsistencyRatio(matrix, weights, n) {
        const RI_TABLE = { 1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41 };
        const Aw = matrix.map(row =>
            row.reduce((sum, val, j) => sum + val * weights[j], 0)
        );
        const lambdaMax = Aw.reduce((sum, val, i) => sum + val / weights[i], 0) / n;
        const CI = (lambdaMax - n) / (n - 1);
        const RI = RI_TABLE[n] || 1.41;
        return RI === 0 ? 0 : CI / RI;
    }

    runTOPSIS(suppliers, weights, criteriaTypes) {
        const m = suppliers.length; 
        const n = weights.length;   
        
        if (m === 0) return [];

        const matrix = suppliers.map(s => [s.price, s.defect_rate, s.lead_time, s.reliability_score]);
        const normalized = this._vectorNormalize(matrix, m, n);
        const weighted = normalized.map(row =>
            row.map((val, j) => val * weights[j])
        );
        const { pis, nis } = this._findIdealSolutions(weighted, criteriaTypes, m, n);
        const distances = this._calculateDistances(weighted, pis, nis, m, n);

        const results = suppliers.map((supplier, i) => ({
            ...supplier,
            topsis_score: Math.round(distances[i].closeness * 10000) / 10000,
            distance_to_ideal: Math.round(distances[i].dPlus * 10000) / 10000,
            distance_to_anti_ideal: Math.round(distances[i].dMinus * 10000) / 10000
        }));

        results.sort((a, b) => b.topsis_score - a.topsis_score);
        results.forEach((item, index) => { item.rank = index + 1; });
        return results;
    }

    _vectorNormalize(matrix, m, n) {
        const normalized = Array.from({ length: m }, () => Array(n).fill(0));
        for (let j = 0; j < n; j++) {
            const colSumSquares = matrix.reduce((sum, row) => sum + Math.pow(row[j], 2), 0);
            const sqrtSum = Math.sqrt(colSumSquares);
            for (let i = 0; i < m; i++) {
                normalized[i][j] = sqrtSum === 0 ? 0 : matrix[i][j] / sqrtSum;
            }
        }
        return normalized;
    }

    _findIdealSolutions(weighted, criteriaTypes, m, n) {
        const pis = Array(n);
        const nis = Array(n);
        for (let j = 0; j < n; j++) {
            const colValues = weighted.map(row => row[j]);
            if (criteriaTypes[j] === 'cost') {
                pis[j] = Math.min(...colValues);
                nis[j] = Math.max(...colValues);
            } else { 
                pis[j] = Math.max(...colValues);
                nis[j] = Math.min(...colValues);
            }
        }
        return { pis, nis };
    }

    _calculateDistances(weighted, pis, nis, m, n) {
        return weighted.map(row => {
            const dPlus = Math.sqrt(row.reduce((sum, val, j) => sum + Math.pow(val - pis[j], 2), 0));
            const dMinus = Math.sqrt(row.reduce((sum, val, j) => sum + Math.pow(val - nis[j], 2), 0));
            const closeness = (dPlus + dMinus) === 0 ? 0 : dMinus / (dPlus + dMinus);
            return { dPlus, dMinus, closeness };
        });
    }
}
module.exports = new SupplierRankingService();
