import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BusinessProcessesService } from './business-processes.service';

@UseGuards(JwtAuthGuard)
@Controller('business-processes')
export class BusinessProcessesController {
  constructor(private readonly service: BusinessProcessesService) {}

  /* ── Attendance ─────────────────────────────────────────────────────────── */

  @Get('attendance')
  getAttendance() {
    return this.service.getAttendance();
  }

  @Post('attendance')
  createAttendance(@Body() body: Record<string, unknown>) {
    return this.service.createAttendance(body);
  }

  @Patch('attendance/:id')
  patchAttendance(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.patchAttendance(id, body);
  }

  /* ── ZRS ────────────────────────────────────────────────────────────────── */

  @Get('zrs')
  getZrs(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('employee') employee?: string,
  ) {
    return this.service.getZrs(dateFrom, dateTo, employee);
  }

  @Post('zrs')
  createZrs(@Body() body: Record<string, unknown>) {
    return this.service.createZrs(body);
  }

  @Patch('zrs/:id')
  patchZrs(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.patchZrs(id, body);
  }

  /* ── Supplies ───────────────────────────────────────────────────────────── */

  @Get('supplies')
  getSupplies() {
    return this.service.getSupplies();
  }

  @Post('supplies')
  createSupplies(@Body() body: Record<string, unknown>) {
    return this.service.createSupplies(body);
  }

  @Patch('supplies/:id')
  patchSupplies(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.patchSupplies(id, body);
  }

  /* ── Shift Open ─────────────────────────────────────────────────────────── */

  @Get('shift-open')
  getShiftOpen() {
    return this.service.getShiftOpen();
  }

  @Post('shift-open')
  createShiftOpen(@Body() body: Record<string, unknown>) {
    return this.service.createShiftOpen(body);
  }

  @Patch('shift-open/:id')
  patchShiftOpen(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.patchShiftOpen(id, body);
  }

  /* ── Shift Close ────────────────────────────────────────────────────────── */

  @Get('shift-close')
  getShiftClose() {
    return this.service.getShiftClose();
  }

  @Post('shift-close')
  createShiftClose(@Body() body: Record<string, unknown>) {
    return this.service.createShiftClose(body);
  }

  @Patch('shift-close/:id')
  patchShiftClose(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.patchShiftClose(id, body);
  }

  /* ── Checklist ──────────────────────────────────────────────────────────── */

  @Get('checklist')
  getChecklist() {
    return this.service.getChecklist();
  }

  @Post('checklist')
  createChecklist(@Body() body: Record<string, unknown>) {
    return this.service.createChecklist(body);
  }

  @Patch('checklist/:id')
  patchChecklist(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.patchChecklist(id, body);
  }
}
