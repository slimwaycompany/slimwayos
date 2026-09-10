import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { DeveloperGuard } from './guards/developer.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: Record<string, unknown>,
    @Headers('authorization') authorization: string,
    @Body() dto: ChangePasswordDto,
  ) {
    const token = authorization?.replace(/^Bearer\s+/i, '') ?? '';
    return this.authService.changePassword(user.id as string, token, dto);
  }

  @Post('employees')
  @UseGuards(JwtAuthGuard, DeveloperGuard)
  @ApiBearerAuth()
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.authService.createEmployee(dto);
  }

  @Get('employees')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listEmployees() {
    return this.authService.listEmployees();
  }

  @Post('reset-password/:userId')
  @UseGuards(JwtAuthGuard, DeveloperGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  resetPassword(@Param('userId') userId: string) {
    return this.authService.resetPassword(userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '') ?? '';
    return this.authService.logout(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: Record<string, unknown>) {
    return user;
  }
}
