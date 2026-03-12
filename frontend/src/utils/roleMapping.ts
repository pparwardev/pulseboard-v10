const ROLE_MAP: Record<string, { manager: string; member: string }> = {
  LESC: { manager: 'SPS Team Manager [LESC]', member: 'Account Manager' },
};

export function getInternalTitle(role: string, teamName?: string): string {
  const team = ROLE_MAP[teamName || ''];
  if (!team) return role === 'manager' ? 'Team Manager' : 'Team Member';
  return role === 'manager' ? team.manager : team.member;
}

export function getManagerTitle(teamName?: string): string {
  return ROLE_MAP[teamName || '']?.manager || 'Team Manager';
}

export function getMemberTitle(teamName?: string): string {
  return ROLE_MAP[teamName || '']?.member || 'Team Member';
}

export default ROLE_MAP;
