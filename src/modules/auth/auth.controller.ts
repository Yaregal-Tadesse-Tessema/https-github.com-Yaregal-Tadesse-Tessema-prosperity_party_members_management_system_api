import { Controller, Post, Body, Get, Patch, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthService, LoginDto, RegisterDto, AuthResponse, FindUsersQuery } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../../entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req): Promise<any> {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async findAllUsers(
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
    @Query('includePassword') includePassword?: string,
  ) {
    const query: FindUsersQuery = {};
    if (search) query.search = search;
    if (role) query.role = role;
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }
    return this.authService.findAll(query, includePassword === 'true');
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/:id')
  async findOneUser(@Param('id') id: string, @Query('includePassword') includePassword?: string) {
    return this.authService.findOne(id, includePassword === 'true');
  }

  @UseGuards(JwtAuthGuard)
  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('users/:id')
  async removeUser(@Param('id') id: string, @Request() req) {
    await this.authService.remove(id, req.user.id);
  }
}







