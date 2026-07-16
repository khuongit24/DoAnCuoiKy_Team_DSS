const supplierRankingService = require('../../src/services/supplierRankingService');

describe('Supplier Ranking Service', () => {
    describe('calculateAHPWeights', () => {
        it('should calculate weights correctly for a consistent matrix', () => {
            const matrix = [
                [1, 2, 3, 4],
                [1/2, 1, 2, 3],
                [1/3, 1/2, 1, 2],
                [1/4, 1/3, 1/2, 1]
            ];
            const result = supplierRankingService.calculateAHPWeights(matrix);
            expect(result.is_consistent).toBe(true);
            expect(result.weights.length).toBe(4);
        });

        it('should throw error for non-symmetric reciprocal matrix', () => {
            const matrix = [
                [1, 2, 3, 4],
                [1/2, 1, 2, 3],
                [1/3, 1/2, 1, 5], // 5
                [1/4, 1/3, 1/4, 1] // 1/4 is not reciprocal of 5
            ];
            expect(() => supplierRankingService.calculateAHPWeights(matrix)).toThrow('Ma trận không đối xứng nghịch đảo');
        });
        
        it('should return is_consistent false if CR >= 0.1', () => {
             const matrix = [
                [1, 9, 1, 1],
                [1/9, 1, 9, 1],
                [1, 1/9, 1, 9],
                [1, 1, 1/9, 1]
             ];
             const result = supplierRankingService.calculateAHPWeights(matrix);
             expect(result.is_consistent).toBe(false);
             expect(result.consistency_ratio).toBeGreaterThanOrEqual(0.1);
        });
    });

    describe('runTOPSIS', () => {
        it('should rank suppliers correctly', () => {
            const suppliers = [
                { id: 1, name: 'NCC A', price: 8500000, defect_rate: 0.02, lead_time: 3, reliability_score: 92.5 },
                { id: 2, name: 'NCC B', price: 8800000, defect_rate: 0.03, lead_time: 5, reliability_score: 85.0 },
                { id: 3, name: 'NCC C', price: 9200000, defect_rate: 0.01, lead_time: 7, reliability_score: 95.0 },
                { id: 4, name: 'NCC D', price: 7900000, defect_rate: 0.05, lead_time: 4, reliability_score: 78.0 }
            ];
            const weights = [0.4, 0.3, 0.2, 0.1];
            const criteriaTypes = ['cost', 'cost', 'cost', 'benefit'];
            
            const results = supplierRankingService.runTOPSIS(suppliers, weights, criteriaTypes);
            expect(results.length).toBe(4);
            expect(results[0].rank).toBe(1);
            expect(results[3].rank).toBe(4);
            
            // Just verifying it sorts correctly
            expect(results[0].topsis_score).toBeGreaterThanOrEqual(results[1].topsis_score);
        });
        
        it('should return empty array if no suppliers', () => {
             const results = supplierRankingService.runTOPSIS([], [0.25, 0.25, 0.25, 0.25], ['cost','cost','cost','benefit']);
             expect(results).toEqual([]);
        });
    });
});
