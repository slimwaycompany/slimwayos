import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WeightService } from './weight.service';
import { CreateWeightDto } from './dto/create-weight.dto';
import { User } from '../users/user.entity';

@ApiTags('weight')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('weight')
export class WeightController {
  constructor(private readonly weightService: WeightService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.weightService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() dto: CreateWeightDto) {
    return this.weightService.create(user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.weightService.delete(id, user.id);
  }
}
