import { useEffect } from 'react';

/**
 * Custom hook to set the document title
 * @param {string} title - The title of the page
 * @param {boolean} retainOnUnmount - If true, the title will not be reverted when the component unmounts
 */
const useDocumentTitle = (title, retainOnUnmount = false) => {
  useEffect(() => {
    const defaultTitle = document.title;
    
    // Set the new title
    document.title = `${title} | Hệ thống Quản lý`;

    return () => {
      if (!retainOnUnmount) {
        document.title = defaultTitle;
      }
    };
  }, [title, retainOnUnmount]);
};

export default useDocumentTitle;
