// Permission Templates - Reusable permission sets
const PERMISSION_TEMPLATES = {
  // User Management Templates
  USER_READ_ONLY: [
    { resource: 'users', action: 'read' }
  ],
  
  USER_MANAGER: [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'create' }
  ],
  
  USER_ADMIN: [
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'delete' }
  ],

  // KYC Management Templates
  KYC_REVIEWER: [
    { resource: 'kyc_verifications', action: 'read' },
    { resource: 'kyc_verifications', action: 'approve' },
    { resource: 'kyc_verifications', action: 'reject' }
  ],

  KYC_ADMIN: [
    { resource: 'kyc_verifications', action: 'read' },
    { resource: 'kyc_verifications', action: 'approve' },
    { resource: 'kyc_verifications', action: 'reject' },
    { resource: 'kyc_verifications', action: 'delete' }
  ],

  // Role Management Templates
  ROLE_MANAGER: [
    { resource: 'roles', action: 'read' },
    { resource: 'roles', action: 'create' },
    { resource: 'roles', action: 'update' },
    { resource: 'permissions', action: 'read' },
    { resource: 'permissions', action: 'create' },
    { resource: 'permissions', action: 'update' }
  ],

  // Reporting Templates
  REPORT_VIEWER: [
    { resource: 'reports', action: 'read' }
  ],

  REPORT_MANAGER: [
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'export' }
  ],

  // System Administration Templates
  SYSTEM_VIEWER: [
    { resource: 'system_settings', action: 'read' },
    { resource: 'audit_logs', action: 'read' }
  ],

  SYSTEM_ADMIN: [
    { resource: 'system_settings', action: 'read' },
    { resource: 'system_settings', action: 'update' },
    { resource: 'audit_logs', action: 'read' },
    { resource: 'audit_logs', action: 'export' }
  ],

  // Combined Templates
  MODERATOR: [
    ...PERMISSION_TEMPLATES.USER_READ_ONLY,
    ...PERMISSION_TEMPLATES.REPORT_VIEWER
  ],

  MANAGER: [
    ...PERMISSION_TEMPLATES.USER_MANAGER,
    ...PERMISSION_TEMPLATES.REPORT_MANAGER,
    ...PERMISSION_TEMPLATES.SYSTEM_VIEWER
  ],

  ADMIN: [
    ...PERMISSION_TEMPLATES.USER_ADMIN,
    ...PERMISSION_TEMPLATES.ROLE_MANAGER,
    ...PERMISSION_TEMPLATES.REPORT_MANAGER,
    ...PERMISSION_TEMPLATES.SYSTEM_ADMIN
  ]
};

/**
 * Get permission template by name
 * @param {string} templateName - Name of the template
 * @returns {Array} Array of permission objects
 */
function getPermissionTemplate(templateName) {
  return PERMISSION_TEMPLATES[templateName] || [];
}

/**
 * Get all available template names
 * @returns {Array} Array of template names
 */
function getAvailableTemplates() {
  return Object.keys(PERMISSION_TEMPLATES);
}

/**
 * Combine multiple templates
 * @param {Array} templateNames - Array of template names to combine
 * @returns {Array} Combined permissions array
 */
function combineTemplates(templateNames) {
  const combinedPermissions = [];
  const seen = new Set();

  templateNames.forEach(templateName => {
    const template = getPermissionTemplate(templateName);
    template.forEach(permission => {
      const key = `${permission.resource}:${permission.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        combinedPermissions.push(permission);
      }
    });
  });

  return combinedPermissions;
}

/**
 * Create a custom permission set
 * @param {Array} permissions - Array of permission objects
 * @returns {Array} Unique permissions array
 */
function createCustomPermissions(permissions) {
  const uniquePermissions = [];
  const seen = new Set();

  permissions.forEach(permission => {
    const key = `${permission.resource}:${permission.action}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniquePermissions.push(permission);
    }
  });

  return uniquePermissions;
}

module.exports = {
  PERMISSION_TEMPLATES,
  getPermissionTemplate,
  getAvailableTemplates,
  combineTemplates,
  createCustomPermissions
};
