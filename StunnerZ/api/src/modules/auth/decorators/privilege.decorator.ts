import { SetMetadata } from '@nestjs/common';

export const Privileges = (...args: string[]) => SetMetadata('privileges', args);
