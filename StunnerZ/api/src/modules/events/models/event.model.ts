export class EventScheduleModel extends Document {
  performerIds: Array<string>;

  name: string;

  email: string;

  mobile: string;

  fileId: string;

  info: string;

  address: string;

  hosted: string;

  availability: number;

  isPrivate: boolean;

  price: number;

  status: string;

  startAt: Date;

  endAt: Date;

  createdAt: Date;

  updatedAt: Date;
}
