import * as sharp from 'sharp';
import axios from 'axios';

export class ImageService {
  public async createThumbnail(filePath: string, options?: {
    width?: number;
    height?: number;
    toPath?: string;
  }) {
    // eslint-disable-next-line no-param-reassign
    options = options || {
      width: 200, // TODO - from config
      height: 200
    };

    if (options.toPath) {
      return sharp(filePath)
        .jpeg({
          quality: 70
        })
        .resize(options.width, options.height, { fit: 'inside' })
        .rotate()
        .toFile(options.toPath);
    }

    return sharp(filePath)
      .resize(options.width, options.height, { fit: 'inside' })
      .toBuffer();
  }

  public async convertToJpeg(
    filePath: string,
    options?: {
      toPath?: string,
      resizeWidth?: boolean,
      resizeHeight?: boolean
    }
  ) {
    if (options?.toPath) {
      if (options?.resizeHeight) {
        return sharp(filePath)
          .jpeg({ quality: 70 })
          .resize({ height: 2500, fit: 'inside' })
          .rotate()
          .toFile(options?.toPath);
      }
      if (options?.resizeWidth) {
        return sharp(filePath)
          .jpeg({ quality: 70 })
          .resize({ width: 2500, fit: 'inside' })
          .rotate()
          .toFile(options?.toPath);
      }
      return sharp(filePath)
        .jpeg({ quality: 70 })
        .rotate()
        .toFile(options?.toPath);
    }
    if (options?.resizeHeight) {
      return sharp(filePath)
        .jpeg({ quality: 70 })
        .resize({ height: 2500, fit: 'inside' })
        .rotate()
        .toBuffer();
    }
    if (options?.resizeWidth) {
      return sharp(filePath)
        .jpeg({ quality: 70 })
        .resize({ width: 2500, fit: 'inside' })
        .rotate()
        .toBuffer();
    }
    return sharp(filePath)
      .jpeg({ quality: 70 })
      .rotate()
      .toBuffer();
  }

  public async compressFileByUrl(url: string) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    // converts the arraybuffer to base64
    const buffer = Buffer.from(response.data, 'base64');
    return sharp(buffer)
      .jpeg({ quality: 70 })
      .rotate()
      .toBuffer();
  }

  public async getMetaData(filePath: any) {
    return sharp(filePath).metadata();
  }

  public async replaceWithoutExif(filePath: string) {
    return sharp(filePath)
      .rotate()
      .toBuffer();
  }
}
