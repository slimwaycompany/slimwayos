export class CreateShiftDto {
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}
