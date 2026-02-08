import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        isActive: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                permissions: {
                  select: {
                    permission: {
                      select: {
                        key: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  findByIdForView(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  // CREATE USER
  createUser(data: { email: string; password: string }) {
    return this.prisma.user.create({
      data,
      select: {
        id: true,
      },
    });
  }

  // UPDATE USER
  updateUser(id: string, data: Partial<{ password: string; isActive: boolean }>) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
      },
    });
  }

  // ROLE MANAGEMENT
  deleteUserRoles(userId: string) {
    return this.prisma.userRole.deleteMany({
      where: { userId },
    });
  }

  assignRoles(userId: string, roleIds: string[]) {
    return this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({
        userId,
        roleId,
      })),
      skipDuplicates: true,
    });
  }

  // LIST USERS 
  findManyForList(skip = 0, take = 20) {
    return this.prisma.user.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }
}
