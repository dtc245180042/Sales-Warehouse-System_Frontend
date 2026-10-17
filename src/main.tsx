// Clear all stale demo/mock entity caches from browser localStorage
const keysToPurge = [
  'kv_products', 'kv_orders', 'kv_customers', 'kv_agents', 'kv_suppliers',
  'kv_inventory_stock_in', 'kv_inventory_stock_out', 'kv_inventory_history',
  'kv_product_lots', 'kv_stock_dispatches', 'kv_credit_notes', 'kv_payments',
  'kv_return_orders', 'kv_stock_adjustments', 'kv_stock_transfers', 'kv_invoices',
  'kv_agency_debt', 'kv_debt_aging', 'salepro_user_products', 'salepro_user_orders',
  'salepro_user_notifications'
];
if (!localStorage.getItem('release_clean_storage_v4')) {
  keysToPurge.forEach(k => localStorage.removeItem(k));
  localStorage.setItem('release_clean_storage_v4', 'true');
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
