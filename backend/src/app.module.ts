import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { BranchSettingsModule } from './modules/branch-settings/branch-settings.module';
import { MarketingModule } from './modules/marketing/marketing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    AuthModule,
    CatalogModule,
    ProfileModule,
    ShiftsModule,
    DashboardModule,
    BranchSettingsModule,
    MarketingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
