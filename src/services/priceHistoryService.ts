import { ProductPriceHistory } from '../types/PriceHistory';
import { initialPriceHistories } from '../mock/priceHistory';
import { getStorageItem, setStorageItem } from './storage';

const STORAGE_KEY = 'kv_product_price_histories';

export const priceHistoryService = {
  getAll: async (): Promise<ProductPriceHistory[]> => {
    return getStorageItem<ProductPriceHistory[]>(STORAGE_KEY, initialPriceHistories);
  },

  getByProductId: async (productId: string): Promise<ProductPriceHistory[]> => {
    const list = getStorageItem<ProductPriceHistory[]>(STORAGE_KEY, initialPriceHistories);
    return list.filter((item) => item.productId === productId);
  },

  recordPriceChange: async (
    entry: Omit<ProductPriceHistory, 'id' | 'effectiveDate'> & { effectiveDate?: string }
  ): Promise<ProductPriceHistory> => {
    const list = getStorageItem<ProductPriceHistory[]>(STORAGE_KEY, initialPriceHistories);
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: ProductPriceHistory = {
      ...entry,
      id: `PH-${String(list.length + 1).padStart(3, '0')}`,
      effectiveDate: entry.effectiveDate || formattedDate,
    };

    setStorageItem(STORAGE_KEY, [newRecord, ...list]);
    return newRecord;
  },
};
