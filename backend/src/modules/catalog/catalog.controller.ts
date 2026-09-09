import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get(':entity')
  list(@Param('entity') entity: string) {
    return this.catalogService.list(entity);
  }

  @Post(':entity')
  create(@Param('entity') entity: string, @Body() body: Record<string, unknown>) {
    return this.catalogService.create(entity, body);
  }

  @Patch(':entity/:id')
  update(
    @Param('entity') entity: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.catalogService.update(entity, id, body);
  }

  @Delete(':entity/:id')
  remove(@Param('entity') entity: string, @Param('id') id: string) {
    return this.catalogService.remove(entity, id);
  }
}
