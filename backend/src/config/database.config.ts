import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get<string>('DATABASE_URL'),
  autoLoadEntities: true,
  synchronize: config.get('NODE_ENV') === 'development',
  logging: config.get('LOG_LEVEL') === 'debug',
  ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});
