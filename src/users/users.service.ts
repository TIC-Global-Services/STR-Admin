import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  // CREATE USER
  async createUser(dto: CreateUserDto) {
    const existing = await this.usersRepo.findByEmailForAuth(dto.email);
    if (existing) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepo.createUser({
      email: dto.email,
      password: hashedPassword,
    });

    if (dto.roleIds?.length) {
      await this.usersRepo.assignRoles(user.id, dto.roleIds);
    }

    return this.getUserById(user.id);
  }

  // UPDATE USER
  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findByIdForView(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    await this.usersRepo.updateUser(userId, updateData);

    return this.getUserById(userId);
  }

  // ASSIGN ROLES
  async assignRoles(userId: string, roleIds: string[]) {
    const user = await this.usersRepo.findByIdForView(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.usersRepo.deleteUserRoles(userId);
    await this.usersRepo.assignRoles(userId, roleIds);

    return this.getUserById(userId);
  }

  
  // READ (public service methods)
  getUserForAuth(email: string) {
    return this.usersRepo.findByEmailForAuth(email);
  }
  getUserByIdForAuth(email: string) {
    return this.usersRepo.findByIdForAuth(email);
  }

  getAllUsers(){
    return this.usersRepo.findManyForList()
  }

  getUserById(id: string) {
    return this.usersRepo.findByIdForView(id);
  }
}
