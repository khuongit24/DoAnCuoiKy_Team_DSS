const axios = require('axios');
const mlClient = require('../../../src/services/mlClient');

jest.mock('axios');

describe('MLClient', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Override sleep to avoid actual waiting in tests
        mlClient._sleep = jest.fn().mockResolvedValue(true);
    });

    describe('forecast', () => {
        it('should return data when request is successful', async () => {
            const mockResponse = { data: { forecast: [1, 2, 3] } };
            axios.mockResolvedValueOnce(mockResponse);

            const result = await mlClient.forecast('P001', 30, 'xgboost');
            
            expect(result).toEqual(mockResponse.data);
            expect(axios).toHaveBeenCalledWith(expect.objectContaining({
                method: 'POST',
                url: expect.stringContaining('/forecast'),
                data: { product_id: 'P001', horizon: 30, model_type: 'xgboost' }
            }));
        });
    });

    describe('retry mechanism', () => {
        it('should retry on failure and succeed eventually', async () => {
            const mockResponse = { data: { success: true } };
            axios
                .mockRejectedValueOnce(new Error('Network Error'))
                .mockRejectedValueOnce(new Error('Timeout'))
                .mockResolvedValueOnce(mockResponse);

            const result = await mlClient.healthCheck();
            
            expect(result).toEqual(mockResponse.data);
            expect(axios).toHaveBeenCalledTimes(3);
            expect(mlClient._sleep).toHaveBeenCalledTimes(2);
        });

        it('should throw error after max retries', async () => {
            axios.mockRejectedValue(new Error('Fatal Error'));

            await expect(mlClient.triggerETL()).rejects.toThrow(/ML Service error after 3 attempts/);
            expect(axios).toHaveBeenCalledTimes(3);
        });
    });
    
    describe('other methods', () => {
        it('trainModel should call /train', async () => {
            axios.mockResolvedValueOnce({ data: { success: true } });
            await mlClient.trainModel('xgboost', 100);
            expect(axios).toHaveBeenCalledWith(expect.objectContaining({
                url: expect.stringContaining('/train')
            }));
        });

        it('getModelInfo should call /model-info', async () => {
            axios.mockResolvedValueOnce({ data: { info: true } });
            await mlClient.getModelInfo('xgboost');
            expect(axios).toHaveBeenCalledWith(expect.objectContaining({
                url: expect.stringContaining('/model-info')
            }));
        });
    });
});
