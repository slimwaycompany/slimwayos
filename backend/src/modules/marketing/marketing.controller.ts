import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('client-sources')
  getClientSources() {
    return this.marketingService.getClientSources();
  }

  @Get('conversions')
  getConversions() {
    return this.marketingService.getConversions();
  }

  @Get('spend')
  getSpend() {
    return this.marketingService.getSpend();
  }

  @Post('spend')
  saveSpend(@Body() body: { channel: string; amount: number; leads?: number }) {
    return this.marketingService.saveSpend(body.channel, body.amount, body.leads ?? 0);
  }

  @Get('sales-by-period')
  getSalesByPeriod(
    @Query('from') from: string,
    @Query('to')   to:   string,
  ) {
    return this.marketingService.getSalesByPeriod(from, to);
  }
}
