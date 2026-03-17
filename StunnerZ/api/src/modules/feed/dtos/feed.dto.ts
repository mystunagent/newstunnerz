import { ObjectId } from 'mongodb';
import { pick } from 'lodash';
import { IPerformerResponse } from 'src/modules/performer/dtos';

export class FeedDto {
  _id: ObjectId | string;

  type: string;

  fromSourceId: ObjectId | string;

  fromSource: string;

  title: string;

  slug: string;

  text: string;

  pollDescription: string;

  fileIds: Array<string | ObjectId>;

  pollIds: Array<string | ObjectId>;

  pollExpiredAt: Date;

  totalLike: number;

  totalComment: number;

  createdAt: Date;

  updatedAt: Date;

  isLiked: boolean;

  isSubscribed: boolean;

  isFullAccess: boolean;

  isBought: boolean;

  performer: IPerformerResponse;

  files: any;

  polls: any;

  // 3 case here:
  // 1.: free for all: isFreeContent = true, don't care about isSale and price
  // 2.: Free for Subscriber: isFreeContent = false, isSale = true, don't care abour price
  // 3.: Per per view: isFreeContent = false, isSale = false, price > 0
  isFreeContent: boolean;

  isSale: boolean;

  price: number;

  isBookMarked: boolean;

  orientation: string;

  teaserId: ObjectId;

  teaser: any;

  thumbnailId: ObjectId;

  thumbnail: any;

  isPinned: boolean;

  pinnedAt: Date;

  status: string;

  isSchedule: boolean;

  scheduleFrom: Date;

  scheduleTo: Date;

  targetId: ObjectId;

  isFollowed: boolean;

  constructor(data: Partial<FeedDto>) {
    Object.assign(
      this,
      pick(data, [
        '_id',
        'type',
        'fromRef',
        'refId',
        'fromSourceId',
        'fromSource',
        'title',
        'slug',
        'text',
        'pollDescription',
        'fileIds',
        'pollIds',
        'totalLike',
        'totalComment',
        'createdAt',
        'updatedAt',
        'isLiked',
        'isBookMarked',
        'performer',
        'files',
        'polls',
        'isFreeContent',
        'isSale',
        'price',
        'isSubscribed',
        'isFullAccess',
        'isBought',
        'pollExpiredAt',
        'orientation',
        'teaserId',
        'teaser',
        'thumbnailId',
        'thumbnail',
        'isPinned',
        'pinnedAt',
        'status',
        'isSchedule',
        'scheduleFrom',
        'scheduleTo',
        'targetId',
        'isFollowed'
      ])
    );
  }
}
