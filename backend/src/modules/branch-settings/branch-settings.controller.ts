import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { BranchSettingsService } from './branch-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('branch-settings')
@UseGuards(JwtAuthGuard)
export class BranchSettingsController {
  constructor(private readonly branchSettingsService: BranchSettingsService) {}

  @Get()
  getSettings() {
    return this.branchSettingsService.getSettings();
  }

  @Patch()
  updateSettings(@Body() dto: Record<string, unknown>) {
    return this.branchSettingsService.updateSettings(dto);
  }
}
