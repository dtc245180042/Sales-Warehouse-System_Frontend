// Clear stale mock entity caches from browser localStorage
if (!localStorage.getItem('release_clean_storage_v2')) {
  const keysToPurge = [
    'kv_products', 'kv_orders', 'kv_customers', 'kv_agents', 'kv_suppliers',
    'kv_inventory_stock_in', 'kv_inventory_stock_out', 'kv_inventory_history',
    'salepro_user_products', 'salepro_user_orders', 'salepro_user_notifications'
  ];
  keysToPurge.forEach(k => localStorage.removeItem(k));
  localStorage.setItem('release_clean_storage_v2', 'true');
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
