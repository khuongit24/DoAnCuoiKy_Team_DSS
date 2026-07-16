import { useState, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { error: notifyError } = useNotification();

  const execute = useCallback(
    async (...args) => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiFunc(...args);
        // Handle axios response structure or direct data
        const responseData = response?.data !== undefined ? response.data : response;
        setData(responseData);
        return responseData;
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err.message || 'Có lỗi xảy ra, vui lòng thử lại';
        setError(errorMessage);
        notifyError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunc, notifyError]
  );

  return { data, loading, error, execute, setData };
};
