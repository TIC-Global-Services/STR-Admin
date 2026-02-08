import { RoleType } from '@prisma/client';

export const ROLES: RoleType[] = [
  RoleType.SUPER_ADMIN,
  RoleType.ADMIN,
  RoleType.MODERATOR,
  RoleType.PR,
];

export const PERMISSIONS = [
  // Users
  'USER_CREATE',
  'USER_UPDATE',
  'USER_DELETE',
  'USER_VIEW',

  // Roles
  'ROLE_ASSIGN',
  'ROLE_REVOKE',

  // Content
  'NEWS_CREATE',
  'NEWS_UPDATE',
  'NEWS_PUBLISH',
  'NEWS_DELETE',

  // Social
  'SOCIAL_EMBED_UPDATE',

  // Membership
  'MEMBERSHIP_APPROVE',
  'MEMBERSHIP_REJECT',

  // Analytics
  'ANALYTICS_VIEW',
] as const;

/**
 * Role → Permission mapping
 */
export const ROLE_PERMISSIONS: Record<RoleType, readonly string[]> = {
  SUPER_ADMIN: PERMISSIONS,

  ADMIN: [
    'USER_CREATE',
    'USER_UPDATE',
    'USER_VIEW',
    'ROLE_ASSIGN',

    'NEWS_CREATE',
    'NEWS_UPDATE',
    'NEWS_PUBLISH',

    'SOCIAL_EMBED_UPDATE',

    'MEMBERSHIP_APPROVE',
    'MEMBERSHIP_REJECT',

    'ANALYTICS_VIEW',
  ],

  MODERATOR: [
    'NEWS_CREATE',
    'NEWS_UPDATE',
    'SOCIAL_EMBED_UPDATE',
    'MEMBERSHIP_APPROVE',
    'MEMBERSHIP_REJECT',
  ],

  PR: ['NEWS_CREATE', 'SOCIAL_EMBED_UPDATE'],
};
