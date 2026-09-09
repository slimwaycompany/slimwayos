import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('profile')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  me(@CurrentUser() user: Record<string, unknown>) {
    return this.profileService.getFullProfile(user.id as string);
  }

  @Patch()
  update(@CurrentUser() user: Record<string, unknown>, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.id as string, dto);
  }
}
