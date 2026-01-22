export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdDate: string;
  lastModified: string;
}

export const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Admin',
    description: 'Full system access and all permissions',
    permissions: [
      'manage_users',
      'manage_roles',
      'manage_auctions',
      'view_analytics',
      'manage_settings',
      'manage_payments',
      'view_reports',
    ],
    usersCount: 2,
    status: 'ACTIVE',
    createdDate: '2024-01-01',
    lastModified: '2024-01-10',
  },
  {
    id: '2',
    name: 'Moderator',
    description: 'Can moderate auctions and view analytics',
    permissions: [
      'manage_auctions',
      'view_analytics',
      'manage_disputes',
      'send_notifications',
      'view_reports',
    ],
    usersCount: 3,
    status: 'ACTIVE',
    createdDate: '2024-01-05',
    lastModified: '2024-01-20',
  },
];
