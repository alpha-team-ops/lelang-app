export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
  status: 'ACTIVE' | 'INACTIVE';
  joinDate: string;
  lastActivity: string;
  organizationCode: string;
}

export const mockStaff: Staff[] = [
  {
    id: '1',
    name: 'Alpha Dev',
    email: 'alpha.dev@deraly.id',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinDate: '2024-01-10',
    lastActivity: '2026-01-22',
    organizationCode: 'ORG-DERALY-001',
  },
  {
    id: '2',
    name: 'Admin User',
    email: 'admin@lelang.com',
    role: 'ADMIN',
    status: 'ACTIVE',
    joinDate: '2024-01-15',
    lastActivity: '2026-01-22',
    organizationCode: 'ORG-DERALY-001',
  },
  {
    id: '3',
    name: 'Moderator One',
    email: 'moderator@lelang.com',
    role: 'MODERATOR',
    status: 'ACTIVE',
    joinDate: '2024-02-20',
    lastActivity: '2026-01-21',
    organizationCode: 'ORG-DERALY-001',
  },
  {
    id: '4',
    name: 'Moderator Two',
    email: 'moderator2@lelang.com',
    role: 'MODERATOR',
    status: 'ACTIVE',
    joinDate: '2024-03-10',
    lastActivity: '2026-01-22',
    organizationCode: 'ORG-DERALY-001',
  },
  {
    id: '5',
    name: 'Moderator Inactive',
    email: 'moderator.inactive@lelang.com',
    role: 'MODERATOR',
    status: 'INACTIVE',
    joinDate: '2024-04-05',
    lastActivity: '2025-12-20',
    organizationCode: 'ORG-DERALY-001',
  },
];
