export const parseRoles = (roleData) => {
  if (!roleData) return ['MEMBER-1'];
  if (Array.isArray(roleData)) return roleData;
  if (typeof roleData === 'string') {
    // If it's a Postgres array literal e.g. "{MEMBER-1, ADMIN}"
    if (roleData.startsWith('{') && roleData.endsWith('}')) {
      const inner = roleData.slice(1, -1);
      if (!inner) return ['MEMBER-1'];
      return inner.split(',').map(s => s.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''));
    }
    try {
      const parsed = JSON.parse(roleData);
      if (Array.isArray(parsed)) return parsed;
    } catch(e) {}
    return roleData.split(',').map(s => s.trim());
  }
  return ['MEMBER-1'];
};

export const hasAdminAccess = (roles) => {
  const parsedRoles = parseRoles(roles);
  return parsedRoles.includes('ADMIN') || parsedRoles.includes('COMPLETE_ACCESS');
};
