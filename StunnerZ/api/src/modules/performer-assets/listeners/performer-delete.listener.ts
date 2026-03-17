import { Injectable, Inject } from '@nestjs/common';
import { QueueEvent, QueueEventService } from 'src/kernel';
import { Model } from 'mongoose';
import { EVENT } from 'src/kernel/constants';
import { DELETE_PERFORMER_CHANNEL } from 'src/modules/performer/constants';
import { PerformerDto } from 'src/modules/performer/dtos';
import {
  GalleryModel, PhotoModel, ProductModel, VideoModel
} from '../models';
import {
  PERFORMER_GALLERY_MODEL_PROVIDER, PERFORMER_PHOTO_MODEL_PROVIDER, PERFORMER_PRODUCT_MODEL_PROVIDER, PERFORMER_VIDEO_MODEL_PROVIDER
} from '../providers';

const DELETE_PERFORMER_ASSETS_TOPIC = 'DELETE_PERFORMER_ASSETS_TOPIC';

@Injectable()
export class DeletePerformerAssetListener {
  constructor(
    private readonly queueEventService: QueueEventService,
    @Inject(PERFORMER_VIDEO_MODEL_PROVIDER)
    private readonly videoModel: Model<VideoModel>,
    @Inject(PERFORMER_PHOTO_MODEL_PROVIDER)
    private readonly photoModel: Model<PhotoModel>,
    @Inject(PERFORMER_GALLERY_MODEL_PROVIDER)
    private readonly galleryModel: Model<GalleryModel>,
    @Inject(PERFORMER_PRODUCT_MODEL_PROVIDER)
    private readonly productModel: Model<ProductModel>
  ) {
    this.queueEventService.subscribe(
      DELETE_PERFORMER_CHANNEL,
      DELETE_PERFORMER_ASSETS_TOPIC,
      this.handleDeleteData.bind(this)
    );
  }

  private async handleDeleteData(event: QueueEvent): Promise<void> {
    if (event.eventName !== EVENT.DELETED) return;
    const performer = event.data as PerformerDto;
    try {
      await Promise.all([
        this.galleryModel.deleteMany({ performerId: performer._id }),
        this.photoModel.deleteMany({ performerId: performer._id }),
        this.videoModel.deleteMany({ performerId: performer._id }),
        this.productModel.deleteMany({ performerId: performer._id }),
        this.videoModel.updateMany(
          { participantIds: performer._id.toString() },
          {
            $pull: {
              participantIds: performer._id
            }
          }
        )
      ]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  }
}
