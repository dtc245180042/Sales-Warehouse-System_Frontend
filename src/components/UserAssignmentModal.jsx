import { useState, useMemo } from 'react';
import RoleSelector from './RoleSelector';
import WarehouseSelector from './WarehouseSelector';
import TerritorySelector from './TerritorySelector';
import BusinessRuleAlert from './BusinessRuleAlert';
import { validateUserAssignment } from '../utils/validation';
import { WAREHOUSES_LIST, TERRITORIES_LIST } from '../utils/assignmentData';

export default function UserAssignmentModal({
  isOpen = false,
  onClose,
  user,
  onSave,
}) {
  const [draftRoles, setDraftRoles] = useState(user?.roles || []);
  const [draftWarehouses, setDraftWarehouses] = useState(user?.warehouses || []);
  const [draftPrimaryWarehouse, setDraftPrimaryWarehouse] = useState(user?.primaryWarehouse || null);
  const [draftTerritories, setDraftTerritories] = useState(user?.territories || []);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  const validation = useMemo(() => {
    return validateUserAssignment({
      roles: draftRoles,
      warehouses: draftWarehouses,
      territories: draftTerritories,
    });
  }, [draftRoles, draftWarehouses, draftTerritories]);

  if (!isOpen || !user) return null;

  const handleToggleRole = (roleId) => {
    setDraftRoles((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const handleToggleWarehouse = (whName) => {
    setDraftWarehouses((prev) => {
      const isExist = prev.includes(whName);
      const next = isExist ? prev.filter((w) => w !== whName) : [...prev, whName];
      if (isExist && draftPrimaryWarehouse === whName) {
        setDraftPrimaryWarehouse(next[0] || null);
      }
      if (!isExist && prev.length === 0) {
        setDraftPrimaryWarehouse(whName);
      }
      return next;
    });
  };

  const handleToggleTerritory = (terName) => {
    setDraftTerritories((prev) =>
      prev.includes(terName) ? prev.filter((t) => t !== terName) : [...prev, terName]
    );
  };

  const handleSaveModal = () => {
    setHasAttemptedSave(true);
    if (!validation.isValid) return;
    if (onSave) {
      onSave({
        userId: user.id,
        roles: draftRoles,
        warehouses: draftWarehouses,
        primaryWarehouse: draftPrimaryWarehouse,
        territories: draftTerritories,
      });
    }
    if (onClose) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Gán vai trò & Kho/Địa bàn</h3>
            <p className="modal-subtitle">Người dùng: {user.name} ({user.email})</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <RoleSelector
            selectedRoles={draftRoles}
            onToggleRole={handleToggleRole}
          />
          <WarehouseSelector
            selectedWarehouses={draftWarehouses}
            primaryWarehouse={draftPrimaryWarehouse}
            onToggleWarehouse={handleToggleWarehouse}
            onSelectAll={() => setDraftWarehouses(WAREHOUSES_LIST.map((w) => w.name))}
            onClearAll={() => {
              setDraftWarehouses([]);
              setDraftPrimaryWarehouse(null);
            }}
            onSetPrimaryWarehouse={setDraftPrimaryWarehouse}
            isRequired={draftRoles.includes('Quản lý kho')}
            hasError={hasAttemptedSave && draftRoles.includes('Quản lý kho') && draftWarehouses.length === 0}
          />
          <TerritorySelector
            selectedTerritories={draftTerritories}
            onToggleTerritory={handleToggleTerritory}
            onSelectAll={() => setDraftTerritories(TERRITORIES_LIST.map((t) => t.name))}
            onClearAll={() => setDraftTerritories([])}
            isRequired={draftRoles.includes('Nhân viên bán hàng')}
            hasError={hasAttemptedSave && draftRoles.includes('Nhân viên bán hàng') && draftTerritories.length === 0}
          />
          <BusinessRuleAlert
            errors={hasAttemptedSave ? validation.errors : []}
            isValid={validation.isValid}
          />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>Hủy bỏ</button>
          <button type="button" className="btn-primary" onClick={handleSaveModal}>Lưu phân quyền</button>
        </div>
      </div>
    </div>
  );
}
