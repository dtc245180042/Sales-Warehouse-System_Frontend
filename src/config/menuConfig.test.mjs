import assert from 'node:assert';
import { MENU_CONFIG, filterMenuByRole, getRoleDisplayName, ROLE_TRANSLATIONS } from './menuConfig.js';

console.log('--- RUNNING SCRUM-302 & SCRUM-203 TEST SUITE ---');

// Test 1: getRoleDisplayName translations
assert.strictEqual(getRoleDisplayName('admin'), 'Quản trị viên');
assert.strictEqual(getRoleDisplayName('ADMIN'), 'Quản trị viên');
assert.strictEqual(getRoleDisplayName('staff'), 'Nhân viên bán hàng');
assert.strictEqual(getRoleDisplayName('customer'), 'Đại lý');
assert.strictEqual(getRoleDisplayName('unknown_role'), 'unknown_role');
assert.strictEqual(getRoleDisplayName(''), 'Người dùng');
assert.strictEqual(getRoleDisplayName(null), 'Người dùng');
console.log('✓ Test 1: Role translations and fallback passed.');

// Test 2: filterMenuByRole for "customer"
const customerMenu = filterMenuByRole(MENU_CONFIG, 'customer');
assert.strictEqual(customerMenu.length, 2, 'Customer should only see 2 functional groups');

const customerGroupIds = customerMenu.map(g => g.id);
assert.deepStrictEqual(customerGroupIds, ['sales-group', 'debt-credit-group']);
assert(!customerGroupIds.includes('warehouse-group'), 'Warehouse group must NOT exist for customer');
assert(!customerGroupIds.includes('system-group'), 'System group must NOT exist for customer');

const salesGroupCustomer = customerMenu.find(g => g.id === 'sales-group');
const salesItemIdsCustomer = salesGroupCustomer.items.map(i => i.id);
assert.deepStrictEqual(salesItemIdsCustomer, ['order-portal', 'order-history']);
assert(!salesItemIdsCustomer.includes('pos-sales'), 'pos-sales must NOT exist for customer');

const debtGroupCustomer = customerMenu.find(g => g.id === 'debt-credit-group');
const debtItemIdsCustomer = debtGroupCustomer.items.map(i => i.id);
assert.deepStrictEqual(debtItemIdsCustomer, ['agency-debt']);
assert(!debtItemIdsCustomer.includes('credit-limit-approval'), 'credit-limit-approval must NOT exist for customer');
console.log('✓ Test 2: Customer absolute hiding and menu grouping verified.');

// Test 3: filterMenuByRole for "staff"
const staffMenu = filterMenuByRole(MENU_CONFIG, 'staff');
assert.strictEqual(staffMenu.length, 2, 'Staff should only see 2 functional groups');

const staffGroupIds = staffMenu.map(g => g.id);
assert.deepStrictEqual(staffGroupIds, ['sales-group', 'warehouse-group']);
assert(!staffGroupIds.includes('debt-credit-group'), 'Debt/credit group must NOT exist for staff');
assert(!staffGroupIds.includes('system-group'), 'System group must NOT exist for staff');

const salesGroupStaff = staffMenu.find(g => g.id === 'sales-group');
const salesItemIdsStaff = salesGroupStaff.items.map(i => i.id);
assert.deepStrictEqual(salesItemIdsStaff, ['pos-sales', 'order-history']);
assert(!salesItemIdsStaff.includes('order-portal'), 'order-portal must NOT exist for staff');

const warehouseGroupStaff = staffMenu.find(g => g.id === 'warehouse-group');
const warehouseItemIdsStaff = warehouseGroupStaff.items.map(i => i.id);
assert.deepStrictEqual(warehouseItemIdsStaff, ['inventory-check', 'stock-transfer']);
assert(!warehouseItemIdsStaff.includes('supplier-import'), 'supplier-import must NOT exist for staff');
console.log('✓ Test 3: Staff absolute hiding and menu grouping verified.');

// Test 4: filterMenuByRole for "admin"
const adminMenu = filterMenuByRole(MENU_CONFIG, 'admin');
assert.strictEqual(adminMenu.length, 4, 'Admin must see all 4 functional groups');
const adminGroupIds = adminMenu.map(g => g.id);
assert.deepStrictEqual(adminGroupIds, ['sales-group', 'warehouse-group', 'debt-credit-group', 'system-group']);

const systemGroupAdmin = adminMenu.find(g => g.id === 'system-group');
assert.strictEqual(systemGroupAdmin.items.length, 3, 'Admin must see all system items');
console.log('✓ Test 4: Admin full access to all groups verified.');

// Test 5: Recursive filtering test with nested items
const nestedMockConfig = [
  {
    id: 'parent-group',
    title: 'Nhóm Cha',
    items: [
      {
        id: 'parent-item-1',
        label: 'Mục Cha 1 (Customer & Admin)',
        roles: ['customer', 'admin'],
        children: [
          {
            id: 'child-1-1',
            label: 'Mục Con 1.1 (Admin only)',
            roles: ['admin']
          },
          {
            id: 'child-1-2',
            label: 'Mục Con 1.2 (Customer & Admin)',
            roles: ['customer', 'admin']
          }
        ]
      },
      {
        id: 'parent-item-2',
        label: 'Mục Cha 2 (Admin only)',
        roles: ['admin'],
        children: [
          {
            id: 'child-2-1',
            label: 'Mục Con 2.1 (Admin only)',
            roles: ['admin']
          }
        ]
      }
    ]
  },
  {
    id: 'empty-group-for-customer',
    title: 'Nhóm Rỗng',
    items: [
      {
        id: 'staff-only-item',
        label: 'Chỉ cho Staff',
        roles: ['staff']
      }
    ]
  }
];

const customerNestedResult = filterMenuByRole(nestedMockConfig, 'customer');
assert.strictEqual(customerNestedResult.length, 1, 'Empty group must be completely omitted');
assert.strictEqual(customerNestedResult[0].items.length, 1, 'Only parent-item-1 should be included');
assert.strictEqual(customerNestedResult[0].items[0].children.length, 1, 'Only child-1-2 should be included');
assert.strictEqual(customerNestedResult[0].items[0].children[0].id, 'child-1-2');
console.log('✓ Test 5: Deep recursive filtering with child-level absolute hiding verified.');

// Test 6: Invalid / Guest roles
const guestResult = filterMenuByRole(MENU_CONFIG, 'guest');
assert.strictEqual(guestResult.length, 0, 'Guest with no permissions gets empty array');

const nullResult = filterMenuByRole(null, 'admin');
assert.strictEqual(nullResult.length, 0, 'Null menu config returns empty array');

const nullRoleResult = filterMenuByRole(MENU_CONFIG, null);
assert.strictEqual(nullRoleResult.length, 0, 'Null user role returns empty array');
console.log('✓ Test 6: Edge cases & safe fallbacks verified.');

console.log('--- ALL SCRUM-302 TESTS PASSED PERFECTLY! ---');
