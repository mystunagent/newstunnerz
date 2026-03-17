export class BookEventScheduleModel extends Document {
  performerId: string;

  eventId: string;

  status: string;

  createdAt: Date;

  updatedAt: Date;
}
