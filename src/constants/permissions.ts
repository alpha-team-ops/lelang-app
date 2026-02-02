/**
 * Permission Constants
 * Define all available permissions in the system
 */

export const PERMISSIONS = {
  // Auction Permissions
  MANAGE_AUCTIONS: 'manage_auctions',
  VIEW_AUCTIONS: 'view_auctions',

  // Bid Permissions
  MANAGE_BIDS: 'manage_bids',
  VIEW_BIDS: 'view_bids',

  // Staff Permissions
  MANAGE_STAFF: 'manage_staff',
  VIEW_STAFF: 'view_staff',

  // Role Permissions
  MANAGE_ROLES: 'manage_roles',
  VIEW_ROLES: 'view_roles',

  // Organization Permissions
  MANAGE_ORGANIZATION: 'manage_organization',
  VIEW_SETTINGS: 'view_settings',

  // Analytics Permissions
  VIEW_ANALYTICS: 'view_analytics',
  VIEW_OVERVIEW: 'view_overview',
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;
