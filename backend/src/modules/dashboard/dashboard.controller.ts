import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('active-memberships')
  activeMemberships() {
    return this.dashboardService.activeMemberships();
  }

  @Get('sales-summary')
  salesSummary() {
    return this.dashboardService.salesSummary();
  }

  @Get('marketing-summary')
  marketingSummary() {
    return this.dashboardService.marketingSummary();
  }

  @Get('upcoming-events')
  upcomingEvents() {
    return this.dashboardService.upcomingEvents();
  }

  @Get('news')
  news() {
    return this.dashboardService.news();
  }

  @Get('top-seller')
  topSeller() {
    return this.dashboardService.topSeller();
  }

  @Get('birthdays')
  birthdays() {
    return this.dashboardService.birthdays();
  }
}
