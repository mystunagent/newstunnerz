/* eslint-disable no-nested-ternary */
import { Injectable, Inject, forwardRef, HttpException } from "@nestjs/common";
import {
  EntityNotFoundException,
  QueueEventService,
  QueueEvent,
} from "src/kernel";
import { EVENT } from "src/kernel/constants";
import { Model } from "mongoose";
import { ObjectId } from "mongodb";
import {
  VideoService,
  ProductService,
  GalleryService,
} from "src/modules/performer-assets/services";
import { FileService } from "src/modules/file/services";
import { GalleryDto, VideoDto } from "src/modules/performer-assets/dtos";
import { PerformerService } from "src/modules/performer/services";
import { PRODUCT_TYPE } from "src/modules/performer-assets/constants";
import { FeedService } from "src/modules/feed/services";
import { FeedDto } from "src/modules/feed/dtos";
import { UserDto } from "src/modules/user/dtos";
import { PerformerDto } from "src/modules/performer/dtos";
import { toObjectId } from "src/kernel/helpers/string.helper";
import { StreamService } from "src/modules/stream/services";
import { StreamModel } from "src/modules/stream/models";
import {
  GROUP_CHAT,
  PRIVATE_CHAT,
  PUBLIC_CHAT,
} from "src/modules/stream/constant";
import { SocketUserService } from "src/modules/socket/services/socket-user.service";

import { MessageService } from "src/modules/message/services";
import { MESSAGE_TYPE } from "src/modules/message/constants";
import { MessageDto } from "src/modules/message/dtos";
import { FileDto } from "src/modules/file";
import { SubPerformerService, UserService } from "src/modules/user/services";
import { BookingStreamService } from "src/modules/booking-stream/services";
import { PAYMENT_TOKEN_MODEL_PROVIDER } from "../providers";
import { TokenTransactionModel } from "../models";
import {
  PURCHASE_ITEM_TYPE,
  PURCHASE_ITEM_TARTGET_TYPE,
  TOKEN_TRANSACTION_SUCCESS_CHANNEL,
  PURCHASE_ITEM_STATUS,
  PURCHASE_ITEM_TARGET_SOURCE,
  PurchaseItemType,
  TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL,
  TOKEN_TRANSACTION_UPDATE_SUCCESS_CHANNEL,
  UPDATE_TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL,
} from "../constants";
import {
  NotEnoughMoneyException,
  OverProductStockException,
} from "../exceptions";
import { PurchaseProductsPayload, SendTipsPayload } from "../payloads";
import { TokenTransactionDto } from "../dtos";
import { ItemHaveBoughtException } from "../exceptions/item-have-bought.exception";
import {
  EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL,
  REJECT_EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL,
} from "src/modules/payment/constants";
import { ACCOUNT_MANAGER } from "src/modules/performer/constants";
import {
  ROLE_SUB_PERFORMER,
  SET_EARNING_AGENCY,
} from "src/modules/user/constants";

@Injectable()
export class TokenTransactionService {
  constructor(
    @Inject(PAYMENT_TOKEN_MODEL_PROVIDER)
    private readonly TokenPaymentModel: Model<TokenTransactionModel>,
    private readonly queueEventService: QueueEventService,
    private readonly socketService: SocketUserService,
    @Inject(forwardRef(() => VideoService))
    private readonly videoService: VideoService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(forwardRef(() => GalleryService))
    private readonly galleryService: GalleryService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => FeedService))
    private readonly feedService: FeedService,
    @Inject(forwardRef(() => StreamService))
    private readonly streamService: StreamService,
    @Inject(forwardRef(() => MessageService))
    private readonly messageService: MessageService,
    @Inject(forwardRef(() => SubPerformerService))
    private readonly subPerformerService: SubPerformerService,
    @Inject(forwardRef(() => BookingStreamService))
    private readonly bookingStreamService: BookingStreamService,
    @Inject(forwardRef(() => FileService))
    private readonly fileService: FileService
  ) {}

  public async findById(id: string | ObjectId) {
    return this.TokenPaymentModel.findById(id);
  }

  public async checkBought(item: any, type: PurchaseItemType, user: UserDto) {
    if (!user) return false;
    if (
      `${user._id}` === `${item.performerId}` ||
      `${user._id}` === `${item.fromSourceId}`
    ) {
      return true;
    }
    const transaction = await this.TokenPaymentModel.findOne({
      type,
      targetId: item._id,
      sourceId: user._id,
      status: PURCHASE_ITEM_STATUS.SUCCESS,
    });
    return !!transaction;
  }

  public async purchaseProduct(
    id: string,
    user: PerformerDto,
    payload: PurchaseProductsPayload
  ) {
    const product = await this.productService.findById(id);
    if (!product) throw new EntityNotFoundException();
    if (user.balance < product.price) throw new NotEnoughMoneyException();
    const quantity = payload.quantity || 1;
    if (product.type === PRODUCT_TYPE.PHYSICAL && quantity > product.stock) {
      throw new OverProductStockException();
    }
    let subPerformerId;
    let commissionPrivilege;
    if (product.performerId) {
      const performer = await this.performerService.findById(
        product.performerId
      );
      if (performer?.accountManager === ACCOUNT_MANAGER.AGENCY_MANAGED) {
        if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
          const data = await this.userService.findOne({
            mainSourceId: performer._id,
            roles: ROLE_SUB_PERFORMER,
            status: "active",
            usingSubAccount: true,
          });
          subPerformerId = !!data ? data?._id : null;
          commissionPrivilege = performer?.commissionExternalAgency;
        } else {
          const data = await this.subPerformerService.getMyListForFind(
            performer._id,
            "all",
            "products"
          );
          subPerformerId = data.length > 0 ? data[0]?._id : null;
          commissionPrivilege =
            data.length > 0 ? data[0]?.commissionPrivilege : null;
        }
      }
    }
    const storeProducts = [];
    let totalPrice = 0;
    totalPrice += quantity * product.price;
    storeProducts.push({
      quantity,
      price: quantity * product.price,
      name: product.name,
      description: `purchase product ${product.name} x${quantity}`,
      productId: product._id,
      productType: product.type,
      performerId: product.performerId,
    });
    const transaction = await this.createPaymentTokenProduct(
      storeProducts,
      totalPrice,
      user
    );
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: !!subPerformerId
          ? {
              ...new TokenTransactionDto(transaction),
              subPerformerId,
              commissionPrivilege,
              ...{ shippingInfo: payload },
            }
          : {
              ...new TokenTransactionDto(transaction),
              ...{ shippingInfo: payload },
            },
      })
    );
    return transaction;
  }

  public async createPaymentTokenProduct(
    products: any[],
    totalPrice: number,
    user: PerformerDto
  ) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = totalPrice;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.PRODUCT;
    paymentTransaction.targetId = products[0] && products[0].productId;
    paymentTransaction.performerId = products[0] && products[0].performerId;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.PRODUCT;
    paymentTransaction.totalPrice = totalPrice;
    paymentTransaction.products = products;
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  public async purchaseStream(streamId: string, user: UserDto) {
    const stream = await this.streamService.findOne({ _id: streamId });
    if (stream.isFree) {
      return { success: true };
    }
    const performer = await this.performerService.findById(stream.performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }
    let purchaseItemType = "";
    switch (stream.type) {
      case PUBLIC_CHAT:
        purchaseItemType = PURCHASE_ITEM_TYPE.PUBLIC_CHAT;
        break;
      case GROUP_CHAT:
        purchaseItemType = PURCHASE_ITEM_TYPE.GROUP_CHAT;
        break;
      case PRIVATE_CHAT:
        purchaseItemType = PURCHASE_ITEM_TYPE.PRIVATE_CHAT;
        break;
      default:
        break;
    }

    if (user.balance < stream.price) throw new NotEnoughMoneyException();

    let subPerformerId;
    let commissionPrivilege;
    if (performer?.accountManager === ACCOUNT_MANAGER.AGENCY_MANAGED) {
      if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
        const data = await this.userService.findOne({
          mainSourceId: performer._id,
          roles: ROLE_SUB_PERFORMER,
          status: "active",
          usingSubAccount: true,
        });
        subPerformerId = !!data ? data?._id : null;
        commissionPrivilege = performer?.commissionExternalAgency;
      } else {
        const data = await this.subPerformerService.getMyListForFind(
          performer._id,
          "all",
          "streaming"
        );
        subPerformerId = data.length > 0 ? data[0]?._id : null;
        commissionPrivilege =
          data.length > 0 ? data[0]?.commissionPrivilege : null;
      }
    }

    const checkTransactionExists = await this.TokenPaymentModel.findOne({
      targetId: stream._id,
      sessionId: stream.sessionId,
      sourceId: user?._id,
      type: PURCHASE_ITEM_TYPE.PUBLIC_CHAT,
    });
    let transaction;
    if (checkTransactionExists) {
      await this.updatePaymentTokenStream(
        checkTransactionExists,
        stream,
        purchaseItemType,
        performer,
        user
      );

      transaction = await this.TokenPaymentModel.findOne({
        targetId: stream._id,
        sessionId: stream.sessionId,
        sourceId: user._id,
        type: PURCHASE_ITEM_TYPE.PUBLIC_CHAT,
      });
      // TODO - earning listener, order listener
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TOKEN_TRANSACTION_UPDATE_SUCCESS_CHANNEL,
          eventName: EVENT.UPDATED,
          data: !!subPerformerId
            ? {
                ...new TokenTransactionDto(transaction),
                subPerformerId,
                commissionPrivilege,
              }
            : {
                ...new TokenTransactionDto(transaction),
              },
        })
      );
    } else {
      transaction = await this.createPaymentTokenStream(
        stream,
        purchaseItemType,
        performer,
        user
      );
      // TODO - earning listener, order listener
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: !!subPerformerId
            ? {
                ...new TokenTransactionDto(transaction),
                subPerformerId,
                commissionPrivilege,
              }
            : {
                ...new TokenTransactionDto(transaction),
              },
        })
      );
    }

    await this.streamService.updateTotalPurchasedStream(streamId, performer);
    return transaction;
  }

  public async purchasePrivateStream(
    streamId: string,
    payload: any,
    user: UserDto
  ) {
    const stream = await this.streamService.findOne({ _id: streamId });
    if (!stream) {
      throw new EntityNotFoundException();
    }
    const performer = await this.performerService.findById(stream.performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    let subPerformerId;
    let commissionPrivilege;
    if (performer?.accountManager === ACCOUNT_MANAGER.AGENCY_MANAGED) {
      if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
        const data = await this.userService.findOne({
          mainSourceId: performer._id,
          roles: ROLE_SUB_PERFORMER,
          status: "active",
          usingSubAccount: true,
        });
        subPerformerId = !!data ? data?._id : null;
        commissionPrivilege = performer?.commissionExternalAgency;
      } else {
        const data = await this.subPerformerService.getMyListForFind(
          performer._id,
          "all",
          "booking_stream"
        );
        subPerformerId = data.length > 0 ? data[0]?._id : null;
        commissionPrivilege =
          data.length > 0 ? data[0]?.commissionPrivilege : null;
      }
    }

    const checkTransactionExists = await this.TokenPaymentModel.findOne({
      targetId: stream._id,
      sessionId: stream.sessionId,
      sourceId: user._id,
      type: PURCHASE_ITEM_TYPE.PRIVATE_CHAT,
    });
    let transaction;
    if (checkTransactionExists) {
      transaction = await this.TokenPaymentModel.updateOne(
        { _id: checkTransactionExists._id },
        {
          sourceId: stream?.includeIds[0],
          source: PURCHASE_ITEM_TARGET_SOURCE.USER,
          originalPrice:
            Number(checkTransactionExists.originalPrice) +
            Number(payload.price),
          target: PURCHASE_ITEM_TARTGET_TYPE.STREAM,
          targetId: stream?._id,
          sessionId: stream?.sessionId,
          performerId: stream?.performerId,
          type: PURCHASE_ITEM_TYPE.PRIVATE_CHAT,
          totalPrice:
            Number(checkTransactionExists.totalPrice) + Number(payload.price),
          products: [
            {
              name: `private paid stream ${performer?.name ||
                performer?.username ||
                "N/A"}`,
              description: `private paid stream ${performer?.name ||
                performer?.username ||
                "N/A"}`,
              price: Number(checkTransactionExists.totalPrice),
              productId: stream._id,
              productType: PURCHASE_ITEM_TARTGET_TYPE.STREAM,
              performerId: stream.performerId,
              quantity: 1,
            },
          ],
          status: PURCHASE_ITEM_STATUS.SUCCESS,
        }
      );
      transaction = await this.TokenPaymentModel.findOne({
        targetId: stream._id,
        sessionId: stream.sessionId,
        sourceId: user._id,
        type: PURCHASE_ITEM_TYPE.PRIVATE_CHAT,
      });

      // TODO - earning listener
      await this.queueEventService.publish(
        new QueueEvent({
          channel: UPDATE_TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL,
          eventName: EVENT.UPDATED,
          data: !!subPerformerId
            ? {
                ...new TokenTransactionDto(transaction),
                subPerformerId,
                commissionPrivilege,
              }
            : {
                ...new TokenTransactionDto(transaction),
              },
        })
      );
    } else {
      transaction = await this.TokenPaymentModel.create({
        sourceId: stream?.includeIds[0],
        source: PURCHASE_ITEM_TARGET_SOURCE.USER,
        originalPrice: payload.price,
        target: PURCHASE_ITEM_TARTGET_TYPE.STREAM,
        targetId: stream?._id,
        sessionId: stream?.sessionId,
        performerId: stream?.performerId,
        type: PURCHASE_ITEM_TYPE.PRIVATE_CHAT,
        totalPrice: payload.price,
        products: [
          {
            name: `private paid stream ${performer?.name ||
              performer?.username ||
              "N/A"}`,
            description: `private paid stream ${performer?.name ||
              performer?.username ||
              "N/A"}`,
            price: payload.price,
            productId: stream._id,
            productType: PURCHASE_ITEM_TARTGET_TYPE.STREAM,
            performerId: stream.performerId,
            quantity: 1,
          },
        ],
        status: PURCHASE_ITEM_STATUS.SUCCESS,
      });

      // TODO - earning listener
      await this.queueEventService.publish(
        new QueueEvent({
          channel: TOKEN_TRANSACTION_PRIVATE_STREAM_SUCCESS_CHANNEL,
          eventName: EVENT.CREATED,
          data: !!subPerformerId
            ? {
                ...new TokenTransactionDto(transaction),
                subPerformerId,
                commissionPrivilege,
              }
            : {
                ...new TokenTransactionDto(transaction),
              },
        })
      );
    }

    await this.streamService.updateTotalPurchasedStream(streamId, performer);
    return transaction;
  }

  public async createPaymentTokenStream(
    stream: StreamModel,
    purchaseItemType: string,
    performer: any,
    user: UserDto
  ) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = stream.price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.STREAM;
    paymentTransaction.targetId = stream._id;
    paymentTransaction.sessionId = stream.sessionId;
    paymentTransaction.performerId = stream.performerId;
    paymentTransaction.type = purchaseItemType;
    paymentTransaction.totalPrice = stream.price;
    let nameItemType = "";
    switch (stream.type) {
      case PURCHASE_ITEM_TYPE.PUBLIC_CHAT:
        nameItemType = "public paid stream";
        break;
      case PURCHASE_ITEM_TYPE.GROUP_CHAT:
        nameItemType = "group paid stream";
        break;
      case PURCHASE_ITEM_TYPE.GROUP_CHAT:
        nameItemType = "private paid stream";
        break;
      default:
        break;
    }
    paymentTransaction.products = [
      {
        name: `${nameItemType} ${performer?.name ||
          performer?.username ||
          "N/A"}`,
        description: `${nameItemType} ${performer?.name ||
          performer?.username ||
          "N/A"}`,
        price: stream.price,
        productId: stream._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.STREAM,
        performerId: stream.performerId,
        quantity: 1,
      },
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  public async updatePaymentTokenStream(
    paymentTransaction: any,
    stream: StreamModel,
    purchaseItemType: string,
    performer: any,
    user: UserDto
  ) {
    paymentTransaction.originalPrice =
      Number(paymentTransaction.originalPrice) + Number(stream.price);
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.STREAM;
    paymentTransaction.targetId = stream._id;
    paymentTransaction.sessionId = stream.sessionId;
    paymentTransaction.performerId = stream.performerId;
    paymentTransaction.type = purchaseItemType;
    paymentTransaction.totalPrice =
      Number(paymentTransaction.totalPrice) + Number(stream.price);
    paymentTransaction.updatedAt = new Date();
    let nameItemType = "";
    switch (stream.type) {
      case PURCHASE_ITEM_TYPE.PUBLIC_CHAT:
        nameItemType = "public paid stream";
        break;
      case PURCHASE_ITEM_TYPE.GROUP_CHAT:
        nameItemType = "group paid stream";
        break;
      case PURCHASE_ITEM_TYPE.GROUP_CHAT:
        nameItemType = "private paid stream";
        break;
      default:
        break;
    }
    paymentTransaction.products = [
      {
        name: `${nameItemType} ${performer?.name ||
          performer?.username ||
          "N/A"}`,
        description: `${nameItemType} ${performer?.name ||
          performer?.username ||
          "N/A"}`,
        price: Number(paymentTransaction.totalPrice),
        productId: stream._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.STREAM,
        performerId: stream.performerId,
        quantity: 1,
      },
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  public async purchaseVideo(id: string, user: PerformerDto) {
    const video = await this.videoService.findById(id);
    if (!video || (video && !video.isSale) || (video && !video.price)) {
      throw new EntityNotFoundException();
    }
    if (user.balance < video.price) throw new NotEnoughMoneyException();
    const transaction = await this.createPaymentTokenVideo(video, user);
    let subPerformerId;
    let commissionPrivilege;
    if (video.performerId) {
      const performer = await this.performerService.findById(video.performerId);
      if (performer?.accountManager !== "self-managed") {
        if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
          const data = await this.userService.findOne({
            mainSourceId: performer._id,
            roles: ROLE_SUB_PERFORMER,
            status: "active",
            usingSubAccount: true,
          });
          subPerformerId = !!data ? data?._id : null;
          commissionPrivilege = performer?.commissionExternalAgency;
        } else {
          const data = await this.subPerformerService.getMyListForFind(
            performer._id,
            "all",
            "videos"
          );
          subPerformerId = data.length > 0 ? data[0]?._id : null;
          commissionPrivilege =
            data.length > 0 ? data[0]?.commissionPrivilege : null;
        }
      }
    }
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: !!subPerformerId
          ? {
              ...new TokenTransactionDto(transaction),
              subPerformerId,
              commissionPrivilege,
            }
          : {
              ...new TokenTransactionDto(transaction),
            },
      })
    );
    return transaction;
  }

  public async createPaymentTokenVideo(video: VideoDto, user: PerformerDto) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = video.price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.VIDEO;
    paymentTransaction.targetId = video._id;
    paymentTransaction.performerId = video.performerId;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.VIDEO;
    paymentTransaction.totalPrice = video.price;
    paymentTransaction.products = [
      {
        name: video.title,
        description: `purchase video ${video.title}`,
        price: video.price,
        productId: video._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.VIDEO,
        performerId: video.performerId,
        quantity: 1,
      },
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  public async purchaseGallery(id: string | ObjectId, user: PerformerDto) {
    const gallery = await this.galleryService.findById(id);
    if (!gallery || (gallery && !gallery.price)) {
      throw new EntityNotFoundException();
    }
    if (user.balance < gallery.price) throw new NotEnoughMoneyException();
    const transaction = await this.createPaymentTokenPhotoGallery(
      gallery,
      user
    );
    let subPerformerId;
    let commissionPrivilege;
    if (gallery.performerId) {
      const performer = await this.performerService.findById(
        gallery.performerId
      );
      if (performer?.accountManager !== "self-managed") {
        if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
          const data = await this.userService.findOne({
            mainSourceId: performer._id,
            roles: ROLE_SUB_PERFORMER,
            status: "active",
            usingSubAccount: true,
          });
          subPerformerId = !!data ? data?._id : null;
          commissionPrivilege = performer?.commissionExternalAgency;
        } else {
          const data = await this.subPerformerService.getMyListForFind(
            performer._id,
            "all",
            "gallery"
          );
          subPerformerId = data.length > 0 ? data[0]?._id : null;
          commissionPrivilege =
            data.length > 0 ? data[0]?.commissionPrivilege : null;
        }
      }
    }
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: !!subPerformerId
          ? {
              ...new TokenTransactionDto(transaction),
              subPerformerId,
              commissionPrivilege,
            }
          : {
              ...new TokenTransactionDto(transaction),
            },
      })
    );
    return transaction;
  }

  public async createPaymentTokenPhotoGallery(
    gallery: GalleryDto,
    user: PerformerDto
  ) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = gallery.price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.GALLERY;
    paymentTransaction.targetId = gallery._id;
    paymentTransaction.performerId = gallery.performerId;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.GALLERY;
    paymentTransaction.totalPrice = gallery.price;
    paymentTransaction.products = [
      {
        name: gallery.title,
        description: `purchase gallery ${gallery.title}`,
        price: gallery.price,
        productId: gallery._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.GALLERY,
        performerId: gallery.performerId,
        quantity: 1,
      },
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  async sendTips(user: UserDto, performerId: string, payload: SendTipsPayload) {
    const { price, conversationId, streamType, sessionId } = payload;
    const performer = await this.performerService.findById(performerId);
    if (!performer) {
      throw new EntityNotFoundException();
    }

    if (!price || user.balance < price) {
      throw new NotEnoughMoneyException();
    }

    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = price;
    paymentTransaction.totalPrice = price;
    paymentTransaction.source = "user";
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target =
      conversationId && streamType
        ? PURCHASE_ITEM_TARTGET_TYPE.STREAM
        : PURCHASE_ITEM_TARTGET_TYPE.PERFORMER;
    paymentTransaction.targetId = performer._id;
    paymentTransaction.performerId = performer._id;
    paymentTransaction.sessionId = sessionId;
    paymentTransaction.type =
      conversationId && streamType
        ? PURCHASE_ITEM_TYPE.STREAM_TIP
        : PURCHASE_ITEM_TYPE.TIP;
    paymentTransaction.products = [
      {
        name: `Tip to ${performer.name || performer.username || performer._id}`,
        description: `Tip $${price} to ${performer.name ||
          performer.username ||
          performer._id}`,
        price,
        productId: performer._id,
        productType: PURCHASE_ITEM_TARTGET_TYPE.PERFORMER,
        performerId: performer._id,
        quantity: 1,
      },
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    await paymentTransaction.save();
    let subPerformerId;
    let commissionPrivilege;
    if (performer?.accountManager === "agency-managed") {
      if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
        const data = await this.userService.findOne({
          mainSourceId: performer._id,
          roles: ROLE_SUB_PERFORMER,
          status: "active",
          usingSubAccount: true,
        });
        subPerformerId = !!data ? data?._id : null;
        commissionPrivilege = performer?.commissionExternalAgency;
      } else {
        const data = await this.subPerformerService.getMyListForFind(
          performer._id,
          "all",
          "tip"
        );

        subPerformerId = data.length > 0 ? data[0]?._id : null;
        commissionPrivilege =
          data.length > 0 ? data[0]?.commissionPrivilege : null;
      }
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: subPerformerId
          ? {
              ...new TokenTransactionDto(paymentTransaction),
              subPerformerId,
              commissionPrivilege,
            }
          : {
              ...new TokenTransactionDto(paymentTransaction),
            },
      })
    );
    if (conversationId && streamType) {
      // send notification to room chat
      await this.messageService.createStreamMessageFromConversation(
        conversationId,
        {
          type: MESSAGE_TYPE.TIP,
          text: `${user?.name || user?.username} tipped $${price.toFixed(2)}`,
          price: 0,
        },
        {
          source: paymentTransaction.source,
          sourceId: paymentTransaction.sourceId,
        },
        user
      );
    }
    return paymentTransaction;
  }

  // async sendGift(user: PerformerDto, giftId: string, payload: SendGiftPayload) {
  //   const { performerId, conversationId } = payload;
  //   const performer = await this.performerService.findById(performerId);
  //   if (!performer) {
  //     throw new EntityNotFoundException();
  //   }
  //   const gift = await this.giftService.findById(giftId);
  //   if (!gift) {
  //     throw new EntityNotFoundException();
  //   }
  //   if (!gift || user.balance < gift.price) {
  //     throw new NotEnoughMoneyException();
  //   }

  //   const paymentTransaction = new this.TokenPaymentModel();
  //   paymentTransaction.originalPrice = gift.price;
  //   paymentTransaction.totalPrice = gift.price;
  //   paymentTransaction.source = ROLE.PERFORMER;
  //   paymentTransaction.sourceId = user._id;
  //   paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.PERFORMER;
  //   paymentTransaction.performerId = performer._id;
  //   paymentTransaction.targetId = performer._id;
  //   paymentTransaction.type = PURCHASE_ITEM_TYPE.GIFT;
  //   paymentTransaction.products = [
  //     {
  //       name: `Send ${gift.title} to ${performer?.name || performer?.username || 'N/A'}`,
  //       description: `Send a ${gift.price.toFixed(2)} tokens gift to ${performer?.name || performer?.username || 'N/A'}`,
  //       price: gift.price,
  //       productId: performer._id,
  //       productType: PURCHASE_ITEM_TARTGET_TYPE.PERFORMER,
  //       performerId: performer._id,
  //       quantity: 1
  //     }
  //   ];
  //   paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
  //   await paymentTransaction.save();
  //   await this.queueEventService.publish(
  //     new QueueEvent({
  //       channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
  //       eventName: EVENT.CREATED,
  //       data: new PaymentDto(paymentTransaction)
  //     })
  //   );
  //   if (conversationId) {
  //     const conversation = await this.conversationService.findById(conversationId);
  //     const stream = conversation.streamId && await this.streamService.findOne({ _id: conversation.streamId });
  //     // send notification to room chat
  //     if (stream) {
  //       const roomName = this.streamService.getRoomName(conversationId, `stream_${stream.type}`);
  //       const file = gift.fileId && await this.fileService.findById(gift.fileId);
  //       if (file) {
  //         const thumbs = new FileDto(file).getThumbnails();
  //         await this.socketService.emitToRoom(
  //           roomName,
  //           `message_created_conversation_${conversationId}`,
  //           {
  //             text: `${user?.name || user?.username} send a ${gift.title.toUpperCase()} <img src="${thumbs[0]}" alt="gift-img" />`,
  //             _id: generateUuid(),
  //             conversationId,
  //             isGift: true
  //           }
  //         );
  //       } else {
  //         await this.socketService.emitToRoom(
  //           roomName,
  //           `message_created_conversation_${conversationId}`,
  //           {
  //             text: `${user?.name || user?.username} send a ${gift.title} ${gift.price.toFixed(2)}`,
  //             _id: generateUuid(),
  //             conversationId,
  //             isGift: true
  //           }
  //         );
  //       }
  //     }
  //   }
  //   return paymentTransaction;
  // }

  public async purchasePostFeed(id: string | ObjectId, user: PerformerDto) {
    const feed = await this.feedService.findById(id);
    if (!feed || (feed && !feed.price)) {
      throw new EntityNotFoundException();
    }
    if (user.balance < feed.price) throw new NotEnoughMoneyException();
    const transaction = await this.createPaymentTokenFeed(
      new FeedDto(feed),
      user
    );
    let subPerformerId;
    let commissionPrivilege;
    if (feed.fromSourceId) {
      const performer = await this.performerService.findById(feed.fromSourceId);
      if (performer?.accountManager !== "self-managed") {
        if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
          const data = await this.userService.findOne({
            mainSourceId: performer._id,
            roles: ROLE_SUB_PERFORMER,
            status: "active",
            usingSubAccount: true,
          });
          subPerformerId = !!data ? data?._id : null;
          commissionPrivilege = performer?.commissionExternalAgency;
        } else {
          const data = await this.subPerformerService.getMyListForFind(
            performer._id,
            "all",
            "posting"
          );
          subPerformerId = data.length > 0 ? data[0]?._id : null;
          commissionPrivilege =
            data.length > 0 ? data[0]?.commissionPrivilege : null;
        }
      }
    }
    // TODO - earning listener, order listener
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: !!subPerformerId
          ? {
              ...new TokenTransactionDto(transaction),
              subPerformerId,
              commissionPrivilege,
            }
          : {
              ...new TokenTransactionDto(transaction),
            },
      })
    );
    return transaction;
  }

  public async createPaymentTokenFeed(feed: FeedDto, user: PerformerDto) {
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = feed.price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.FEED;
    paymentTransaction.targetId = toObjectId(feed._id);
    paymentTransaction.performerId = toObjectId(feed.fromSourceId);
    paymentTransaction.type = PURCHASE_ITEM_TYPE.FEED;
    paymentTransaction.totalPrice = feed.price;
    paymentTransaction.products = [
      {
        name: "Purchase post feed",
        description: feed.text,
        price: feed.price,
        productId: toObjectId(feed._id),
        productType: PURCHASE_ITEM_TARTGET_TYPE.FEED,
        performerId: toObjectId(feed.fromSourceId),
        quantity: 1,
      },
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  public async purchaseMessage(messageId: string | ObjectId, user: UserDto) {
    const message = await this.messageService.findById(messageId);
    if (message.type !== MESSAGE_TYPE.PAID_CONTENT) {
      throw new HttpException("Can not purchase free message!", 400);
    }
    const file = await this.fileService.findById(message.fileId);

    if (user.balance < message.price) throw new NotEnoughMoneyException();
    const transaction = await this.createPaymentTokenMessage(
      message,
      user,
      file
    );

    // update message's paid status
    if (transaction && transaction.status === PURCHASE_ITEM_STATUS.SUCCESS) {
      await this.messageService.updatePaidMessage(messageId, true);
    }
    let subPerformerId;
    let commissionPrivilege;
    if (message.senderId) {
      const performer = await this.performerService.findById(message.senderId);
      if (performer?.accountManager !== "self-managed") {
        if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
          const data = await this.userService.findOne({
            mainSourceId: performer._id,
            roles: ROLE_SUB_PERFORMER,
            status: "active",
            usingSubAccount: true,
          });
          subPerformerId = !!data ? data?._id : null;
          commissionPrivilege = performer?.commissionExternalAgency;
        } else {
          const data = await this.subPerformerService.getMyListForFind(
            performer._id,
            "all",
            "messages"
          );
          subPerformerId = data.length > 0 ? data[0]?._id : null;
          commissionPrivilege =
            data.length > 0 ? data[0]?.commissionPrivilege : null;
        }
      }
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: !!subPerformerId
          ? {
              ...new TokenTransactionDto(transaction),
              subPerformerId,
              commissionPrivilege,
            }
          : {
              ...new TokenTransactionDto(transaction),
            },
      })
    );
    return transaction;
  }

  public async createPaymentTokenMessage(
    message: MessageDto,
    user: UserDto,
    file: FileDto
  ) {
    const typePhoto = file?.mimeType.includes("image") && "photo";
    const typeVideo = file?.mimeType.includes("video") && "video";
    const paymentTransaction = new this.TokenPaymentModel();
    paymentTransaction.originalPrice = message.price;
    paymentTransaction.source = PURCHASE_ITEM_TARGET_SOURCE.USER;
    paymentTransaction.sourceId = user._id;
    paymentTransaction.target = PURCHASE_ITEM_TARTGET_TYPE.MESSAGE;
    paymentTransaction.targetId = message._id;
    paymentTransaction.performerId = message.senderId;
    paymentTransaction.type = PURCHASE_ITEM_TYPE.MESSAGE;
    paymentTransaction.totalPrice = message.price;
    paymentTransaction.products = [
      {
        name: "Unlock messageeeee",
        description: message.text,
        price: message.price,
        productId: message._id,
        productType: `${PURCHASE_ITEM_TARTGET_TYPE.MESSAGE} ${typePhoto ||
          typeVideo}`,
        performerId: message.senderId,
        quantity: 1,
        fileId: message?.fileId,
      },
    ];
    paymentTransaction.status = PURCHASE_ITEM_STATUS.SUCCESS;
    return paymentTransaction.save();
  }

  findOne(filter) {
    return this.TokenPaymentModel.findOne(filter);
  }

  public async processBookingPrivateStream(data: any) {
    let transaction = await this.TokenPaymentModel.findOne({
      sourceId: data.userId,
      targetId: data._id,
      status: PURCHASE_ITEM_STATUS.SUCCESS,
    });

    if (transaction) {
      throw new ItemHaveBoughtException();
    }

    const user = await this.userService.findById(data.userId);
    if (!user) {
      throw new EntityNotFoundException();
    }

    if (user.balance < data.token) throw new NotEnoughMoneyException();
    transaction = new this.TokenPaymentModel({
      source: "user",
      sourceId: user._id,
      target: PURCHASE_ITEM_TARTGET_TYPE.BOOKING_STREAM,
      targetId: data._id,
      performerId: data.performerId,
      type: PURCHASE_ITEM_TYPE.BOOKING_STREAM,
      name: "Booking Stream",
      description: `Booking stream with ${data.performerId}`,
      totalPrice: data.token,
      originalPrice: data.token,
      quantity: 1,
      payBy: "token",
      status: PURCHASE_ITEM_STATUS.SUCCESS,
    });
    await transaction.save();

    let subPerformerId;
    let commissionPrivilege;
    if (data.performerId) {
      const performer = await this.performerService.findById(data.performerId);
      if (performer?.accountManager !== "self-managed") {
        if (performer?.setEarningAgency === SET_EARNING_AGENCY.TOTAL) {
          const data = await this.userService.findOne({
            mainSourceId: performer._id,
            roles: ROLE_SUB_PERFORMER,
            status: "active",
            usingSubAccount: true,
          });
          subPerformerId = !!data ? data?._id : null;
          commissionPrivilege = performer?.commissionExternalAgency;
        } else {
          const per = await this.subPerformerService.getMyListForFind(
            performer._id,
            "all",
            "booking_stream"
          );
          subPerformerId = per.length > 0 ? per[0]?._id : null;
          commissionPrivilege =
            data.length > 0 ? data[0]?.commissionPrivilege : null;
        }
      }
    }
    await this.queueEventService.publish(
      new QueueEvent({
        channel: TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: !!subPerformerId
          ? {
              ...new TokenTransactionDto(transaction),
              subPerformerId,
              commissionPrivilege,
            }
          : {
              ...new TokenTransactionDto(transaction),
            },
      })
    );
    return transaction;
  }

  public async processBookingEvent(data: any) {
    let transaction = await this.TokenPaymentModel.findOne({
      sourceId: data.performerId,
      targetId: data._id,
      status: PURCHASE_ITEM_STATUS.SUCCESS,
    });

    if (transaction) {
      throw new ItemHaveBoughtException();
    }

    const user = await this.performerService.findById(data.performerId);
    if (!user) {
      throw new EntityNotFoundException();
    }

    if (user.balance < data.price) throw new NotEnoughMoneyException();
    transaction = new this.TokenPaymentModel({
      source: "performer",
      sourceId: null,
      target: PURCHASE_ITEM_TARTGET_TYPE.EVENT,
      targetId: data._id,
      performerId: user._id,
      type: PURCHASE_ITEM_TYPE.EVENT,
      name: "Booking Event",
      description: `Booking event with ${data.performerId}`,
      totalPrice: data.price,
      originalPrice: data.price,
      quantity: 1,
      payBy: "token",
      status: PURCHASE_ITEM_STATUS.SUCCESS,
    });
    await transaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          ...new TokenTransactionDto(transaction),
        },
      })
    );
    return transaction;
  }

  public async processRejectBookingEvent(data: any) {
    let transaction = await this.TokenPaymentModel.findOne({
      sourceId: data.performerId,
      targetId: data._id,
      status: PURCHASE_ITEM_STATUS.SUCCESS,
    });

    if (transaction) {
      throw new ItemHaveBoughtException();
    }

    const user = await this.performerService.findById(data.performerId);
    if (!user) {
      throw new EntityNotFoundException();
    }

    transaction = new this.TokenPaymentModel({
      source: "admin",
      sourceId: null,
      target: PURCHASE_ITEM_TARTGET_TYPE.EVENT,
      targetId: data._id,
      performerId: user._id,
      type: PURCHASE_ITEM_TYPE.EVENT,
      name: "Payout Booking Event",
      description: `Payout token event for ${data.performerId}`,
      totalPrice: data.price,
      originalPrice: data.price,
      quantity: 1,
      payBy: "token",
      status: PURCHASE_ITEM_STATUS.SUCCESS,
    });
    await transaction.save();
    await this.queueEventService.publish(
      new QueueEvent({
        channel: REJECT_EVENT_TOKEN_TRANSACTION_SUCCESS_CHANNEL,
        eventName: EVENT.CREATED,
        data: {
          ...new TokenTransactionDto(transaction),
        },
      })
    );
    return transaction;
  }
}
