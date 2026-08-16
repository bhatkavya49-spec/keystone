export const ROLES = {
  MANAGER: "MANAGER",
  DISPATCHER: "DISPATCHER",
  TECHNICIAN: "TECHNICIAN",
  CUSTOMER: "CUSTOMER",
};

export function isManager(role) {
  return role === ROLES.MANAGER;
}

export function canWriteCustomers(role) {
  return role === ROLES.MANAGER || role === ROLES.DISPATCHER;
}

export function canWriteSites(role) {
  return role === ROLES.MANAGER || role === ROLES.DISPATCHER;
}

export function canDeleteCustomers(role) {
  return role === ROLES.MANAGER;
}

export function canDeleteSites(role) {
  return role === ROLES.MANAGER;
}

export function canCreateWorkOrders(role) {
  return role === ROLES.MANAGER || role === ROLES.DISPATCHER;
}

export function canAssignWorkOrders(role) {
  return role === ROLES.MANAGER || role === ROLES.DISPATCHER;
}

export function canDeleteWorkOrders(role) {
  return role === ROLES.MANAGER;
}

export function canDeleteParts(role) {
  return role === ROLES.MANAGER;
}

export function canDeleteTimeEntries(role) {
  return role === ROLES.MANAGER;
}

export function canRefreshSla(role) {
  return role === ROLES.MANAGER || role === ROLES.DISPATCHER;
}

export function canUseCustomerApis(role) {
  return role !== ROLES.CUSTOMER;
}

export function filterAccessibleWorkOrders(workOrders, role, username) {
  if (role !== ROLES.TECHNICIAN) {
    return workOrders || [];
  }
  return (workOrders || []).filter((wo) => wo.assignedTechnician?.username === username);
}