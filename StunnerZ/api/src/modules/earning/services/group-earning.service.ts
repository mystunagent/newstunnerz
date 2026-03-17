/* eslint-disable no-nested-ternary */
/* eslint-disable no-param-reassign */
import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { Model } from "mongoose";
import { uniq } from "lodash";
import { PageableData } from "src/kernel";
import { toObjectId } from "src/kernel/helpers/string.helper";
import { SubPerformerService, UserService } from "src/modules/user/services";
import { UserDto } from "src/modules/user/dtos";
import { PerformerDto } from "src/modules/performer/dtos";
import { PERFORMER_MODEL_PROVIDER } from "src/modules/performer/providers";
import { PerformerModel } from "src/modules/performer/models";
import { GroupEarningModel } from "../models/group-earning.model";
import { EarningModel } from "../models/earning.model";
import { ReferralEarningModel } from "../models/referral-earning.model";
import {
  EARNING_MODEL_PROVIDER,
  REFERRAL_EARNING_MODEL_PROVIDER,
  GROUP_EARNING_MODEL_PROVIDER,
} from "../providers/earning.provider";
import {
  GroupEarningSearchRequestPayload,
  GroupEarningUpdateStatusPayload,
} from "../payloads/group-earning-search.payload";
import { PerformerService } from "../../performer/services";
import {
  GroupEarningDto,
  IGroupEarningStatResponse,
} from "../dtos/group-earning.dto";
import { EarningDto } from "../dtos/earning.dto";
import { ReferralEarningDto } from "../dtos/referral-earning.dto";

@Injectable()
export class GroupEarningService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(EARNING_MODEL_PROVIDER)
    private readonly earningModel: Model<EarningModel>,
    @Inject(REFERRAL_EARNING_MODEL_PROVIDER)
    private readonly referralEarningModel: Model<ReferralEarningModel>,
    @Inject(GROUP_EARNING_MODEL_PROVIDER)
    private readonly groupEarningModel: Model<GroupEarningModel>,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>
  ) {}

  public async adminSearch(
    req: GroupEarningSearchRequestPayload
  ): Promise<PageableData<GroupEarningDto>> {
    if (req.fromDate === "undefined") req.fromDate = null;
    if (req.toDate === "undefined") req.toDate = null;
    const query: any = {};
    if (req.performerId) {
      query.performerId = req.performerId;
    }
    if (req.latestPayment) {
      query.latestPayment = req.latestPayment;
    }
    if (req.subPerformerId) {
      query.subPerformerId = req.subPerformerId;
    }
    if (req.sourceId) {
      query.sourceId = req.sourceId;
    }
    if (req.type) {
      query.sourceType = req.type;
    }
    if (req.isPaid) {
      query.isPaid = req.isPaid;
    }
    const sort = {
      [req.sortBy || "updateAt"]: req.sort || "desc",
    };

    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
    }
    const [data, total] = await Promise.all([
      this.groupEarningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 0) // get all data
        .skip(parseInt(req.offset as string, 10)),
      this.groupEarningModel.countDocuments(query),
    ]);
    const groupEarnings = data.map((d) => new GroupEarningDto(d));
    const groupPerformerIds = groupEarnings.map((d) => d.performerId);
    // find earning and referral earning
    const earningIds = data
      .filter((d) => d.sourceType !== "referral")
      .map((d) => d.sourceId);
    const referralEarningIds = data
      .filter((d) => d.sourceType === "referral")
      .map((d) => d.sourceId);
    const [earnings, referralEarnings] = await Promise.all([
      this.earningModel
        .find({ _id: { $in: earningIds } })
        .lean()
        .exec() || [],
      this.referralEarningModel
        .find({ _id: { $in: referralEarningIds } })
        .lean()
        .exec() || [],
    ]);
    // user and performer of original earning
    const userIds = earnings.map((d) => d.userId);
    const performerIds = earnings.map((d) => d.performerId);
    const subPerformerIds = earnings
      .filter((e) => e.subPerformerId)
      .map((d) => d.subPerformerId);
    // user and performer of referral earning
    const registerIds = referralEarnings.map((d) => d.registerId);
    const referralIds = referralEarnings.map((d) => d.referralId);

    // uniq user / performer id
    const Ids = uniq([
      ...groupPerformerIds,
      ...userIds,
      ...performerIds,
      ...registerIds,
      ...referralIds,
    ]);
    const [users, performers, subPerformers] = await Promise.all([
      this.userService.findByIds(Ids) || [],
      this.performerService.findByIds(Ids) || [],
      this.userService.findByIds(subPerformerIds) || [],
    ]);
    groupEarnings.forEach(async (group: GroupEarningDto) => {
      const source: any =
        group.sourceType === "referral"
          ? referralEarnings.find(
              (e) => e._id.toString() === group.sourceId.toString()
            )
          : earnings.find(
              (e) => e._id.toString() === group.sourceId.toString()
            );

      if (source) {
        group.source =
          group.sourceType === "referral"
            ? new ReferralEarningDto(source)
            : new EarningDto(source);
      } else {
        group.source = null;
      }

      const performer =
        group.performerId &&
        performers.find(
          (p) => p._id.toString() === group.performerId.toString()
        );
      group.performerInfo = performer
        ? new PerformerDto(performer).toResponse(true)
        : null;

      if (group.sourceType === "referral") {
        const user =
          source?.registerId &&
          source.registerSource === "user" &&
          users.find((p) => p._id.toString() === source?.registerId.toString());
        const model =
          source?.registerId &&
          source.registerSource === "performer" &&
          performers.find(
            (p) => p._id.toString() === source?.registerId.toString()
          );
        group.userId = source?.registerId || null;
        if (source.registerSource === "performer") {
          group.userInfo = model ? new PerformerDto(model).toResponse() : null;
        }
        if (source.registerSource === "user") {
          group.userInfo = user ? new UserDto(user).toResponse() : null;
        }
      } else {
        const user =
          source?.userId &&
          users.find((p) => p._id.toString() === source?.userId.toString());
        group.userId = source?.userId || null;
        group.userInfo = user
          ? user?.isPerformer
            ? new PerformerDto(user).toResponse()
            : new UserDto(user).toResponse()
          : null;
      }

      if (subPerformers) {
        const dataSub = subPerformers.find(
          (p) => p._id.toString() === source.subPerformerId?.toString()
        );
        if (dataSub) {
          group.subPerformerInfo = new UserDto(dataSub).toResponse();
        }
      }
    });

    return {
      data: groupEarnings,
      total,
    };
  }

  public async adminStats(
    req: GroupEarningSearchRequestPayload
  ): Promise<IGroupEarningStatResponse> {
    if (req.fromDate === "undefined") req.fromDate = null;
    if (req.toDate === "undefined") req.toDate = null;
    const query: any = {};
    const refQuery: any = {
      referralSource: "performer",
    };
    if (req.performerId) {
      query.performerId = toObjectId(req.performerId);
      refQuery.referralId = toObjectId(req.performerId);
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
      refQuery.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
    }
    const refPaidQuery = { ...refQuery, isPaid: true };
    const refUnpaidQuery = { ...refQuery, isPaid: false };

    const paidQuery = { ...query, isPaid: true };
    const unPaidQuery = { ...query, isPaid: false };

    const [
      totalGrossPrice,
      totalNetPrice,
      totalRefNetPrice,
      totalRefPaidPrice,
      totalRefUnpaidPrice,
      totalPaidToken,
      totalUnpaidToken,
      totalSubToken,
    ] = await Promise.all([
      this.earningModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$grossPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refPaidQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refUnpaidQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: paidQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: unPaidQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
      ]),
    ]);

    const totalGross =
      (totalGrossPrice && totalGrossPrice.length && totalGrossPrice[0].total) ||
      0;
    const totalNet =
      (totalNetPrice && totalNetPrice.length && totalNetPrice[0].total) || 0;
    const totalSub =
      (totalSubToken && totalSubToken.length && totalSubToken[0].total) || 0;
    const totalSiteCommission =
      totalGross && totalNet ? totalGross - totalNet - totalSub : 0;

    const totalRefNet =
      (totalRefNetPrice &&
        totalRefNetPrice.length &&
        totalRefNetPrice[0].total) ||
      0;

    const totalRefPaid =
      (totalRefPaidPrice &&
        totalRefPaidPrice.length &&
        totalRefPaidPrice[0].total) ||
      0;
    const totalRefUnpaid =
      (totalRefUnpaidPrice &&
        totalRefUnpaidPrice.length &&
        totalRefUnpaidPrice[0].total) ||
      0;

    const totalPaidAmountNotRef =
      (totalPaidToken && totalPaidToken.length && totalPaidToken[0].total) || 0;
    const totalUnpaidAmountNotRef =
      (totalUnpaidToken &&
        totalUnpaidToken.length &&
        totalUnpaidToken[0].total) ||
      0;
    /**
     * Admin will spend for referral earning
     * Eg: Total price is $10
     * Performer earned $8
     * Referral earned $0.2
     * Admin earned $2 (commission 20%) - $0.2 (paid for referral) = $1.8
     */
    return {
      totalGrossPrice: totalGross,
      totalNetPrice: Math.abs(totalNet) + Math.abs(totalRefNet),
      totalSiteCommission:
        Math.abs(totalSiteCommission) - Math.abs(totalRefNet),
      totalPaidAmount: Math.abs(totalPaidAmountNotRef) + Math.abs(totalRefPaid),
      totalUnpaidAmount:
        Math.abs(totalUnpaidAmountNotRef) + Math.abs(totalRefUnpaid),
      totalSubAmount: Math.abs(totalSub),
    };
  }

  public async search(
    req: GroupEarningSearchRequestPayload,
    currentUser: PerformerDto
  ): Promise<PageableData<GroupEarningDto>> {
    if (req.fromDate === "undefined") req.fromDate = null;
    if (req.toDate === "undefined") req.toDate = null;
    const query: any = {
      performerId: currentUser._id,
    };
    if (req.type) {
      query.sourceType = req.type;
    }
    if (req.subPerformerId) {
      query.subPerformerId = req.subPerformerId;
    }
    if (req.isPaid) {
      query.isPaid =
        req.isPaid === "true" ? true : req.isPaid === "false" && false;
    }
    const sort: any = {
      createdAt: -1,
    };
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
    }
    const [data, total] = await Promise.all([
      this.groupEarningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.groupEarningModel.countDocuments(query),
    ]);
    const groupEarnings = data.map((d) => new GroupEarningDto(d));
    const groupPerformerIds = groupEarnings.map((d) => d.performerId);

    // find earning and referral earning
    const earningIds = data
      .filter((d) => d.sourceType !== "referral")
      .map((d) => d.sourceId);
    const referralEarningIds = data
      .filter((d) => d.sourceType === "referral")
      .map((d) => d.sourceId);
    const [earnings, referralEarnings] = await Promise.all([
      this.earningModel
        .find({ _id: { $in: earningIds } })
        .lean()
        .exec() || [],
      this.referralEarningModel
        .find({ _id: { $in: referralEarningIds } })
        .lean()
        .exec() || [],
    ]);

    // user and performer of original earning
    const userIds = earnings.map((d) => d.userId);
    const performerIds = earnings.map((d) => d.performerId);
    const subPerformerIds = earnings
      .filter((e) => e.subPerformerId)
      .map((d) => d.subPerformerId);
    // user and performer of referral earning
    const registerIds = referralEarnings.map((d) => d.registerId);
    const referralIds = referralEarnings.map((d) => d.referralId);

    // uniq user / performer id
    const Ids = uniq([
      ...groupPerformerIds,
      ...userIds,
      ...performerIds,
      ...registerIds,
      ...referralIds,
    ]);
    const [users, performers, subPerformers] = await Promise.all([
      this.userService.findByIds(Ids) || [],
      this.performerService.findByIds(Ids) || [],
      this.userService.findByIds(subPerformerIds) || [],
    ]);

    groupEarnings.forEach(async (group: GroupEarningDto) => {
      const source: any =
        group.sourceType === "referral"
          ? referralEarnings.find(
              (e) => e._id.toString() === group.sourceId.toString()
            )
          : earnings.find(
              (e) => e._id.toString() === group.sourceId.toString()
            );

      if (source) {
        group.source =
          group.sourceType === "referral"
            ? new ReferralEarningDto(source)
            : new EarningDto(source);
      } else {
        group.source = null;
      }

      const performer =
        group.performerId &&
        performers.find(
          (p) => p._id.toString() === group.performerId.toString()
        );
      group.performerInfo = performer
        ? new PerformerDto(performer).toResponse(true)
        : null;

      // if (group.sourceType === 'referral') {
      //   const user = source?.registerId
      //     && users.find((p) => p._id.toString() === source?.registerId.toString());
      //   group.userId = source?.registerId || null;
      //   group.userInfo = user
      //     ? user?.isPerformer
      //       ? new PerformerDto(user).toResponse()
      //       : new UserDto(user).toResponse()
      //     : null;

      if (group.sourceType === "referral") {
        const user =
          source?.registerId &&
          source.registerSource === "user" &&
          users.find((p) => p._id.toString() === source?.registerId.toString());
        const model =
          source?.registerId &&
          source.registerSource === "performer" &&
          performers.find(
            (p) => p._id.toString() === source?.registerId.toString()
          );
        group.userId = source?.registerId || null;
        if (source.registerSource === "performer") {
          group.userInfo = model ? new PerformerDto(model).toResponse() : null;
        }
        if (source.registerSource === "user") {
          group.userInfo = user ? new UserDto(user).toResponse() : null;
        }
      } else {
        const user =
          source?.userId &&
          users.find((p) => p._id.toString() === source?.userId.toString());
        group.userId = source.userId || null;
        group.userInfo = user
          ? user?.isPerformer
            ? new PerformerDto(user).toResponse()
            : new UserDto(user).toResponse()
          : null;
      }

      if (subPerformers) {
        const dataSub = subPerformers.find(
          (p) => p._id.toString() === source.subPerformerId.toString()
        );
        if (dataSub) {
          group.subPerformerInfo = new UserDto(dataSub).toResponse();
        }
      }
    });

    return {
      data: groupEarnings,
      total,
    };
  }

  public async subPerformerSearch(
    req: GroupEarningSearchRequestPayload
  ): Promise<PageableData<GroupEarningDto>> {
    if (req.fromDate === "undefined") req.fromDate = null;
    if (req.toDate === "undefined") req.toDate = null;
    const query: any = {};
    if (req.type) {
      query.sourceType = req.type;
    }
    if (req.subPerformerId) {
      query.subPerformerId = req.subPerformerId;
    }
    if (req.isPaid) {
      query.isPaid =
        req.isPaid === "true" ? true : req.isPaid === "false" && false;
    }
    const sort = {
      [req.sortBy || "updatedAt"]: req.sort || "desc",
    };
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
    }
    const [data, total] = await Promise.all([
      this.groupEarningModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.groupEarningModel.countDocuments(query),
    ]);
    const groupEarnings = data.map((d) => new GroupEarningDto(d));
    const groupPerformerIds = groupEarnings.map((d) => d.performerId);

    // find earning and referral earning
    const earningIds = data
      .filter((d) => d.sourceType !== "referral")
      .map((d) => d.sourceId);
    const referralEarningIds = data
      .filter((d) => d.sourceType === "referral")
      .map((d) => d.sourceId);
    const [earnings, referralEarnings] = await Promise.all([
      this.earningModel
        .find({ _id: { $in: earningIds } })
        .lean()
        .exec() || [],
      this.referralEarningModel
        .find({ _id: { $in: referralEarningIds } })
        .lean()
        .exec() || [],
    ]);

    // user and performer of original earning
    const userIds = earnings.map((d) => d.userId);
    const performerIds = earnings.map((d) => d.performerId);
    const subPerformerIds = earnings
      .filter((e) => e.subPerformerId)
      .map((d) => d.subPerformerId);
    // user and performer of referral earning
    const registerIds = referralEarnings.map((d) => d.registerId);
    const referralIds = referralEarnings.map((d) => d.referralId);

    // uniq user / performer id
    const Ids = uniq([
      ...groupPerformerIds,
      ...userIds,
      ...performerIds,
      ...registerIds,
      ...referralIds,
    ]);
    const [users, performers, subPerformers] = await Promise.all([
      this.userService.findByIds(Ids) || [],
      this.performerService.findByIds(Ids) || [],
      this.userService.findByIds(subPerformerIds) || [],
    ]);

    groupEarnings.forEach(async (group: GroupEarningDto) => {
      const source: any =
        group.sourceType === "referral"
          ? referralEarnings.find(
              (e) => e._id.toString() === group.sourceId.toString()
            )
          : earnings.find(
              (e) => e._id.toString() === group.sourceId.toString()
            );

      if (source) {
        group.source =
          group.sourceType === "referral"
            ? new ReferralEarningDto(source)
            : new EarningDto(source);
      } else {
        group.source = null;
      }

      const performer =
        group.performerId &&
        performers.find(
          (p) => p._id.toString() === group.performerId.toString()
        );
      group.performerInfo = performer
        ? new PerformerDto(performer).toResponse(true)
        : null;

      // if (group.sourceType === 'referral') {
      //   const user = source?.registerId
      //     && users.find((p) => p._id.toString() === source?.registerId.toString());
      //   group.userId = source?.registerId || null;
      //   group.userInfo = user
      //     ? user?.isPerformer
      //       ? new PerformerDto(user).toResponse()
      //       : new UserDto(user).toResponse()
      //     : null;

      if (group.sourceType === "referral") {
        const user =
          source?.registerId &&
          source.registerSource === "user" &&
          users.find((p) => p._id.toString() === source?.registerId.toString());
        const model =
          source?.registerId &&
          source.registerSource === "performer" &&
          performers.find(
            (p) => p._id.toString() === source?.registerId.toString()
          );
        group.userId = source?.registerId || null;
        if (source.registerSource === "performer") {
          group.userInfo = model ? new PerformerDto(model).toResponse() : null;
        }
        if (source.registerSource === "user") {
          group.userInfo = user ? new UserDto(user).toResponse() : null;
        }
      } else {
        const user =
          source?.userId &&
          users.find((p) => p._id.toString() === source?.userId.toString());
        group.userId = source.userId || null;
        group.userInfo = user
          ? user?.isPerformer
            ? new PerformerDto(user).toResponse()
            : new UserDto(user).toResponse()
          : null;
      }

      if (subPerformers) {
        const dataSub = subPerformers.find(
          (p) => p._id.toString() === source.subPerformerId.toString()
        );
        if (dataSub) {
          group.subPerformerInfo = new UserDto(dataSub).toResponse();
        }
      }
    });

    return {
      data: groupEarnings,
      total,
    };
  }

  public async performerStats(
    req: GroupEarningSearchRequestPayload
  ): Promise<IGroupEarningStatResponse> {
    if (req.fromDate === "undefined") req.fromDate = null;
    if (req.toDate === "undefined") req.toDate = null;

    const query: any = {};
    const refQuery: any = {
      referralSource: "performer",
    };
    if (req.performerId) {
      query.performerId = toObjectId(req.performerId);
      refQuery.referralId = toObjectId(req.performerId);
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
      refQuery.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
    }

    const refPaidQuery = { ...refQuery, isPaid: true };
    const refUnpaidQuery = { ...refQuery, isPaid: false };

    const paidQuery = { ...query, isPaid: true };
    const unPaidQuery = { ...query, isPaid: false };

    const [
      totalGrossPrice,
      totalNetPrice,
      totalRefNetPrice,
      totalRefPaidPrice,
      totalRefUnpaidPrice,
      totalPaidToken,
      totalUnpaidToken,
    ] = await Promise.all([
      this.earningModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$grossPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refPaidQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refUnpaidQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: paidQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: unPaidQuery },
        { $group: { _id: null, total: { $sum: "$netPrice" } } },
      ]),
    ]);
    const totalGross =
      (totalGrossPrice && totalGrossPrice.length && totalGrossPrice[0].total) ||
      0;
    const totalNet =
      (totalNetPrice && totalNetPrice.length && totalNetPrice[0].total) || 0;
    const totalSiteCommission =
      totalGross && totalNet ? totalGross - totalNet : 0;

    const totalRefNet =
      (totalRefNetPrice &&
        totalRefNetPrice.length &&
        totalRefNetPrice[0].total) ||
      0;

    const totalRefPaid =
      (totalRefPaidPrice &&
        totalRefPaidPrice.length &&
        totalRefPaidPrice[0].total) ||
      0;
    const totalRefUnpaid =
      (totalRefUnpaidPrice &&
        totalRefUnpaidPrice.length &&
        totalRefUnpaidPrice[0].total) ||
      0;

    const totalPaidAmountNotRef =
      (totalPaidToken && totalPaidToken.length && totalPaidToken[0].total) || 0;
    const totalUnpaidAmountNotRef =
      (totalUnpaidToken &&
        totalUnpaidToken.length &&
        totalUnpaidToken[0].total) ||
      0;

    return {
      totalGrossPrice: totalGross,
      totalNetPrice: totalNet + totalRefNet,
      totalSiteCommission: totalSiteCommission - totalRefNet,
      totalPaidAmount: totalPaidAmountNotRef + totalRefPaid,
      totalUnpaidAmount: totalUnpaidAmountNotRef + totalRefUnpaid,
    };
  }

  public async subPerformerStats(
    req: GroupEarningSearchRequestPayload
  ): Promise<IGroupEarningStatResponse> {
    if (req.fromDate === "undefined") req.fromDate = null;
    if (req.toDate === "undefined") req.toDate = null;

    const query: any = {};
    const refQuery: any = {
      referralSource: "performer",
    };
    if (req.subPerformerId) {
      query.subPerformerId = toObjectId(req.subPerformerId);
      refQuery.referralId = toObjectId(req.subPerformerId);
    }
    if (req.type) {
      query.type = req.type;
    }
    if (req.fromDate && req.toDate) {
      query.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
      refQuery.createdAt = {
        $gt: new Date(req.fromDate),
        $lte: new Date(req.toDate),
      };
    }

    const refPaidQuery = { ...refQuery, isPaid: true };
    const refUnpaidQuery = { ...refQuery, isPaid: false };

    const paidQuery = { ...query, isPaid: true };
    const unPaidQuery = { ...query, isPaid: false };

    const [
      totalGrossPrice,
      totalNetPrice,
      totalRefNetPrice,
      totalRefPaidPrice,
      totalRefUnpaidPrice,
      totalPaidToken,
      totalUnpaidToken,
    ] = await Promise.all([
      this.earningModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refQuery },
        { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refPaidQuery },
        { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
      ]),
      this.referralEarningModel.aggregate([
        { $match: refUnpaidQuery },
        { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: paidQuery },
        { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
      ]),
      this.earningModel.aggregate([
        { $match: unPaidQuery },
        { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
      ]),
    ]);
    const totalGross =
      (totalGrossPrice && totalGrossPrice.length && totalGrossPrice[0].total) ||
      0;
    const totalNet =
      (totalNetPrice && totalNetPrice.length && totalNetPrice[0].total) || 0;
    const totalSiteCommission =
      totalGross && totalNet ? totalGross - totalNet : 0;

    const totalRefNet =
      (totalRefNetPrice &&
        totalRefNetPrice.length &&
        totalRefNetPrice[0].total) ||
      0;

    const totalRefPaid =
      (totalRefPaidPrice &&
        totalRefPaidPrice.length &&
        totalRefPaidPrice[0].total) ||
      0;
    const totalRefUnpaid =
      (totalRefUnpaidPrice &&
        totalRefUnpaidPrice.length &&
        totalRefUnpaidPrice[0].total) ||
      0;

    const totalPaidAmountNotRef =
      (totalPaidToken && totalPaidToken.length && totalPaidToken[0].total) || 0;
    const totalUnpaidAmountNotRef =
      (totalUnpaidToken &&
        totalUnpaidToken.length &&
        totalUnpaidToken[0].total) ||
      0;

    return {
      totalGrossPrice: totalGross,
      totalNetPrice: totalNet + totalRefNet,
      totalSiteCommission: totalSiteCommission - totalRefNet,
      totalPaidAmount: totalPaidAmountNotRef + totalRefPaid,
      totalUnpaidAmount: totalUnpaidAmountNotRef + totalRefUnpaid,
    };
  }

  public async updateStatusGroupEarning(
    payload: GroupEarningUpdateStatusPayload
  ): Promise<any> {
    const groupEarningIds = payload.groupEarningIds
      ? payload.groupEarningIds
      : [];
    if (!groupEarningIds.length) return;
    // await this.earningModel.updateMany(
    //   { performerId: payload?.performerId, isPaid: true },
    //   { $set: { latestPayment: false } }
    // );
    // await this.referralEarningModel.updateMany(
    //   { performerId: payload?.performerId, isPaid: true },
    //   { $set: { latestPayment: false } }
    // );
    // await this.groupEarningModel.updateMany(
    //   { performerId: payload?.performerId, isPaid: true },
    //   { $set: { latestPayment: false } }
    // );

    await groupEarningIds.reduce(async (lp, groupEarningId) => {
      await lp;
      const groupEarning = await this.groupEarningModel.findById({
        _id: groupEarningId,
      });
      if (!groupEarning) return;
      await this.groupEarningModel.updateOne(
        { _id: groupEarning._id },
        {
          $set: {
            isPaid: true,
            latestPayment: true,
          },
          updateAt: new Date(),
        }
      );
      if (groupEarning.sourceType !== "referral") {
        const earningId = groupEarning?.sourceId
          ? groupEarning?.sourceId
          : null;
        if (!earningId) return;

        const earningItem = await this.earningModel.findById({
          _id: earningId,
        });
        if (!earningItem) return;

        await this.earningModel.updateOne(
          { _id: earningId },
          {
            $set: {
              isPaid: true,
              latestPayment: true,
            },
            paidAt: new Date(),
            updateAt: new Date(),
          }
        );
      }
      if (groupEarning.sourceType === "referral") {
        const referralEarningId = groupEarning?.sourceId
          ? groupEarning?.sourceId
          : null;
        if (!referralEarningId) return;

        const referralEarningItem = await this.referralEarningModel.findById({
          _id: referralEarningId,
        });
        if (!referralEarningItem) return;
        await this.referralEarningModel.updateOne(
          { _id: referralEarningId },
          {
            $set: {
              isPaid: true,
              latestPayment: true,
            },
            paidAt: new Date(),
            updateAt: new Date(),
          }
        );
      }

      const performerId = groupEarning?.performerId
        ? groupEarning?.performerId
        : null;
      if (!performerId) return;

      const query = {
        performerId: toObjectId(performerId),
      };

      const subPerformerId = groupEarning?.subPerformerId
        ? groupEarning?.subPerformerId
        : null;

      const refQuery = {
        referralId: toObjectId(performerId),
        referralSource: "performer",
      };

      const refPaidQuery = { ...refQuery, isPaid: true };

      const paidQuery = { ...query, isPaid: true };

      const [
        totalNetPrice,
        totalRefNetPrice,
        totalRefPaidPrice,
        totalPaidToken,
      ] = await Promise.all([
        this.earningModel.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: "$netPrice" } } },
        ]),
        this.referralEarningModel.aggregate([
          { $match: refQuery },
          { $group: { _id: null, total: { $sum: "$netPrice" } } },
        ]),
        this.referralEarningModel.aggregate([
          { $match: refPaidQuery },
          { $group: { _id: null, total: { $sum: "$netPrice" } } },
        ]),
        this.earningModel.aggregate([
          { $match: paidQuery },
          { $group: { _id: null, total: { $sum: "$netPrice" } } },
        ]),
      ]);
      const totalGross =
        (totalNetPrice && totalNetPrice.length && totalNetPrice[0].total) || 0;

      const totalRefNet =
        (totalRefNetPrice &&
          totalRefNetPrice.length &&
          totalRefNetPrice[0].total) ||
        0;

      const totalRefPaid =
        (totalRefPaidPrice &&
          totalRefPaidPrice.length &&
          totalRefPaidPrice[0].total) ||
        0;

      const totalPaidAmountNotRef =
        (totalPaidToken && totalPaidToken.length && totalPaidToken[0].total) ||
        0;

      const totalPaid = totalPaidAmountNotRef + totalRefPaid;
      const totalEarn = totalGross + totalRefNet;
      const newBalance = totalEarn - totalPaid;

      await this.performerModel.updateOne(
        {
          _id: performerId,
        },
        {
          balance: newBalance || 0,
        }
      );

      //  update for sub
      if (subPerformerId) {
        const refSubQuery = {
          subPerformerId: toObjectId(subPerformerId),
        };

        const querySub = {
          subPerformerId: toObjectId(subPerformerId),
        };

        const refSubPaidQuery = { ...refSubQuery, isPaid: true };
        const paidSubQuery = { ...querySub, isPaid: true };
        const [
          totalSubNetPrice,
          totalSubRefNetPrice,
          totalSubRefPaidPrice,
          totalSubPaidToken,
        ] = await Promise.all([
          this.earningModel.aggregate([
            { $match: querySub },
            { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
          ]),
          this.referralEarningModel.aggregate([
            { $match: refSubQuery },
            { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
          ]),
          this.referralEarningModel.aggregate([
            { $match: refSubPaidQuery },
            { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
          ]),
          this.earningModel.aggregate([
            { $match: paidSubQuery },
            { $group: { _id: null, total: { $sum: "$subPerformerPrice" } } },
          ]),
        ]);
        const totalSubGross =
          (totalSubNetPrice &&
            totalSubNetPrice.length &&
            totalSubNetPrice[0].total) ||
          0;

        const totalSubRefNet =
          (totalSubRefNetPrice &&
            totalSubRefNetPrice.length &&
            totalSubRefNetPrice[0].total) ||
          0;

        const totalSubRefPaid =
          (totalSubRefPaidPrice &&
            totalSubRefPaidPrice.length &&
            totalSubRefPaidPrice[0].total) ||
          0;

        const totalSubPaidAmountNotRef =
          (totalSubPaidToken &&
            totalSubPaidToken.length &&
            totalSubPaidToken[0].total) ||
          0;

        const totalSubPaid = totalSubPaidAmountNotRef + totalSubRefPaid;
        const totalSubEarn = totalSubGross + totalSubRefNet;
        const newSubBalance = totalSubEarn - totalSubPaid;

        await this.userService.updatePayoutBalance(
          subPerformerId,
          newSubBalance || 0,
          totalSubPaid
        );
      }
    }, Promise.resolve());
  }
}
