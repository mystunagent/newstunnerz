import { Injectable, Inject, forwardRef } from "@nestjs/common";
import { Model } from "mongoose";
import { PageableData } from "src/kernel/common";
import * as moment from "moment";
import { FollowService } from "src/modules/follow/services/follow.service";
import { UserDto } from "src/modules/user/dtos";
import { SettingService } from "src/modules/settings";
import { SETTING_KEYS } from "src/modules/settings/constants";
import { EarningService } from "src/modules/earning/services/earning.service";
import { OFFLINE } from "src/modules/stream/constant";
import { StreamService } from "src/modules/stream/services";
import { PerformerModel, BankingModel } from "../models";
import {
  PERFORMER_MODEL_PROVIDER,
  PERFORMER_BANKING_SETTING_MODEL_PROVIDER,
} from "../providers";
import { PerformerDto, IPerformerResponse } from "../dtos";
import {
  PerformerSearchPayload,
  AdminSearchBankingPayload,
  SearchInfoPerformerInsertedPayload,
} from "../payloads";
import { PERFORMER_STATUSES } from "../constants";
import { SubscriptionService } from "src/modules/subscription/services/subscription.service";
import { UserModel } from "src/modules/user/models";
import { USER_MODEL_PROVIDER } from "src/modules/user/providers";
import { PerformerService } from "./performer.service";

@Injectable()
export class PerformerSearchService {
  constructor(
    @Inject(forwardRef(() => FollowService))
    private readonly followService: FollowService,
    @Inject(PERFORMER_MODEL_PROVIDER)
    private readonly performerModel: Model<PerformerModel>,
    @Inject(PERFORMER_BANKING_SETTING_MODEL_PROVIDER)
    private readonly bankingSettingModel: Model<BankingModel>,
    @Inject(USER_MODEL_PROVIDER)
    private readonly userModel: Model<UserModel>,
    @Inject(forwardRef(() => EarningService))
    private readonly earningService: EarningService,
    @Inject(forwardRef(() => StreamService))
    private readonly streamService: StreamService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService
  ) {}

  public async adminSearchBanking(
    req: AdminSearchBankingPayload
  ): Promise<PageableData<IPerformerResponse>> {
    const queryBanking = {
      type: req?.bankingType || "wire",
    } as any;
    if (req?.performerId && req?.performerId !== "") {
      queryBanking.performerId = req.performerId;
    }
    const bankings = await this.bankingSettingModel
      .find(queryBanking)
      .lean()
      .exec();
    const performerIds = bankings.map((b) => b?.performerId);
    if (!performerIds || performerIds?.length === 0) {
      return {
        data: [],
        total: 0,
      };
    }
    const query = {
      _id: { $in: performerIds },
    } as any;

    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
        "i"
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { firstName: searchValue },
        { lastName: searchValue },
        { name: searchValue },
        { username: searchValue },
        { email: searchValue },
      ];
    }
    let sort = {
      isOnline: -1,
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort,
      };
    }
    const [data, total, commissionSetting] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query),
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
    ]);
    const performerStats = await Promise.all(
      performerIds.map(async (performerId) => {
        const contents = await this.earningService.performersStat(
          performerId,
          req
        );
        return contents;
      })
    );
    const performers = data.map((d) => new PerformerDto(d));
    performers.forEach((p) => {
      const bankingInformation = bankings.find(
        (b) => b.performerId.toString() === p._id.toString()
      );
      // eslint-disable-next-line no-param-reassign
      p.bankingInformation = bankingInformation || {};
      // eslint-disable-next-line no-param-reassign
      p.commissionPercentage = p?.commissionPercentage || commissionSetting;
      const stats = performerStats.find(
        (s) => s.performerId.toString() === p._id.toHexString()
      );
      // eslint-disable-next-line no-param-reassign
      p.earnedAmount = stats?.totalEarnedTokens || 0;
      // eslint-disable-next-line no-param-reassign
      p.totalPaidAmount = stats?.totalPaidAmount || 0;
      // eslint-disable-next-line no-param-reassign
      p.totalUnpaidAmount = stats?.totalUnpaidAmount || 0;
      // eslint-disable-next-line no-param-reassign
      p.totalLatestPaymentAmount = stats?.totalLatestPaymentAmount || null;
      // eslint-disable-next-line no-param-reassign
      p.latestPaymentDate = stats?.latestPaymentDate || null;
    });
    const newPerformer = performers.filter((f) => f.latestPaymentDate !== null);
    return {
      data: newPerformer,
      total: newPerformer?.length,
    };
  }

  public async adminSearchSubBanking(
    req: AdminSearchBankingPayload
  ): Promise<PageableData<IPerformerResponse>> {
    const queryBanking = {
      type: req?.bankingType || "wire",
    } as any;
    if (req?.performerId && req?.performerId !== "") {
      queryBanking.performerId = req.performerId;
    }
    const bankings = await this.bankingSettingModel
      .find(queryBanking)
      .lean()
      .exec();
    const performerIds = bankings.map((b) => b?.performerId);
    if (!performerIds || performerIds?.length === 0) {
      return {
        data: [],
        total: 0,
      };
    }
    const query = {
      _id: { $in: performerIds },
    } as any;

    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
        "i"
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { firstName: searchValue },
        { lastName: searchValue },
        { name: searchValue },
        { username: searchValue },
        { email: searchValue },
      ];
    }
    let sort = {
      isOnline: -1,
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort,
      };
    }
    const [data, total, commissionSetting] = await Promise.all([
      this.userModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.userModel.countDocuments(query),
      SettingService.getValueByKey(SETTING_KEYS.PERFORMER_COMMISSION),
    ]);
    const performerStats = await Promise.all(
      performerIds.map(async (performerId) => {
        const contents = await this.earningService.subPerformersStat(
          performerId,
          req
        );
        return contents;
      })
    );
    const performers = data.map((d) => new PerformerDto(d));
    const perSubId = data
      .filter((i) => i.mainSourceId)
      .map((u) => u.mainSourceId);
    const performer = await this.performerService.findByIds(perSubId);
    const per = await performer.map((i) => new PerformerDto(i).toResponse());
    performers.forEach((p) => {
      const bankingInformation = bankings.find(
        (b) => b.performerId.toString() === p._id.toString()
      );
      // eslint-disable-next-line no-param-reassign
      p.bankingInformation = bankingInformation || {};
      // eslint-disable-next-line no-param-reassign
      p.commissionPercentage = p?.commissionPercentage || commissionSetting;
      const stats = performerStats.find(
        (s) => s.performerId.toString() === p._id.toHexString()
      );
      // eslint-disable-next-line no-param-reassign
      p.earnedAmount = stats?.totalEarnedTokens || 0;
      // eslint-disable-next-line no-param-reassign
      p.totalPaidAmount = stats?.totalPaidAmount || 0;
      // eslint-disable-next-line no-param-reassign
      p.totalUnpaidAmount = stats?.totalUnpaidAmount || 0;
      // eslint-disable-next-line no-param-reassign
      p.totalLatestPaymentAmount = stats?.totalLatestPaymentAmount || null;
      // eslint-disable-next-line no-param-reassign
      p.latestPaymentDate = stats?.latestPaymentDate || null;
      p.infoSubPerformer = per.find(
        (b) => b._id.toString() === p.mainSourceId.toString()
      );
    });
    const newPerformer = performers.filter((f) => f.latestPaymentDate !== null);
    return {
      data: newPerformer,
      total: newPerformer?.length,
    };
  }

  public async adminSearch(
    req: PerformerSearchPayload
  ): Promise<PageableData<IPerformerResponse>> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
        "i"
      );
      const searchValue = { $regex: regexp };
      query.$or = [
        { firstName: searchValue },
        { lastName: searchValue },
        { name: searchValue },
        { username: searchValue },
        { email: searchValue },
      ];
    }
    if (req.performerIds) {
      query._id = { $in: req.performerIds };
    }
    [
      "hair",
      "pubicHair",
      "ethnicity",
      "country",
      "bodyType",
      "gender",
      "status",
      "height",
      "weight",
      "eyes",
      "butt",
      "sexualOrientation",
    ].forEach((f) => {
      if (req[f]) {
        query[f] = req[f];
      }
    });
    if (req.verifiedDocument) {
      query.verifiedDocument = req.verifiedDocument === "true";
    }
    if (req.verifiedEmail) {
      query.verifiedEmail = req.verifiedEmail === "true";
    }
    if (req.verifiedAccount) {
      query.verifiedAccount = req.verifiedAccount === "true";
    }
    if (req.fromAge && req.toAge) {
      query.dateOfBirth = {
        $gte: new Date(req.fromAge),
        $lte: new Date(req.toAge),
      };
    }
    if (req.age) {
      const fromAge = req.age.split("_")[0];
      const toAge = req.age.split("_")[1];
      const fromDate = moment()
        .subtract(toAge, "years")
        .startOf("day")
        .toDate();
      const toDate = moment()
        .subtract(fromAge, "years")
        .startOf("day")
        .toDate();
      query.dateOfBirth = {
        $gte: fromDate,
        $lte: toDate,
      };
    }
    if (req.ondatoMetadata) {
      query.ondatoMetadata = { $exists: true, $ne: null };
    }
    let sort = {
      isOnline: -1,
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort,
      };
    }
    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query),
    ]);
    const performers = data.map((d) =>
      new PerformerDto(d).toResponse(true)
    ) as any;
    const performerIds = data.map((d) => d._id);
    const bankings = await this.bankingSettingModel
      .find({
        performerId: { $in: performerIds },
      })
      .lean()
      .exec();

    performers.forEach((p) => {
      const bankingInformation = bankings.find(
        (b) => b.performerId.toString() === p._id.toString()
      );
      // eslint-disable-next-line no-param-reassign
      p.bankingInformation = bankingInformation || null;
    });
    const performerReferred = data.map((d) => d.referrerId);
    const per = await this.performerModel
      .find({
        _id: { $in: performerReferred },
      })
      .lean()
      .exec();

    performers.forEach((p) => {
      const referrerInfo = per.find(
        (b) => b._id.toString() === p.referrerId.toString()
      );
      // eslint-disable-next-line no-param-reassign
      p.referrerInfo = referrerInfo || {};
    });

    return {
      data: performers,
      total,
    };
  }

  public async search(
    req: PerformerSearchPayload,
    user: UserDto
  ): Promise<PageableData<any>> {
    const query = {
      status: PERFORMER_STATUSES.ACTIVE,
      completedAccount: true,
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
        "i"
      );
      const searchValue = { $regex: regexp };
      query.$or = [{ name: searchValue }, { username: searchValue }];
    }
    if (req.performerIds) {
      query._id = { $in: req.performerIds };
    }
    [
      "hair",
      "pubicHair",
      "ethnicity",
      "country",
      "bodyType",
      "gender",
      "breastSize",
      "height",
      "weight",
      "eyes",
      "butt",
      "sexualOrientation",
    ].forEach((f) => {
      if (req[f]) {
        query[f] = req[f];
      }
    });
    if (req.fromAge && req.toAge) {
      query.dateOfBirth = {
        $gte: moment(req.fromAge)
          .startOf("day")
          .toDate(),
        $lte: new Date(req.toAge),
      };
    }
    if (req.age) {
      const fromAge = req.age.split("_")[0];
      const toAge = req.age.split("_")[1];
      const fromDate = moment()
        .subtract(toAge, "years")
        .startOf("day");
      const toDate = moment()
        .subtract(fromAge, "years")
        .startOf("day");
      query.dateOfBirth = {
        $gte: fromDate,
        $lte: toDate,
      };
    }
    if (user && user?._id && req.followed === "true") {
      const follows = await this.followService.find({
        followerId: user._id,
      });
      const perIds = follows.map((f) => f.followingId);
      query._id = { $in: perIds };
    }
    if (user && user?._id && req.followed === "false") {
      const follows = await this.followService.find({
        followerId: user._id,
      });
      const perIds = follows.map((f) => f.followingId);
      query._id = { $nin: perIds };
    }
    if (req.type === "live") {
      query.streamingStatus = {
        $ne: OFFLINE,
      };
    }
    let sort = {
      isOnline: -1,
      createdAt: -1,
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort,
      };
    }
    if (req.sortBy === "online") {
      sort = "-isOnline";
    }
    if (req.sortBy === "live") {
      sort = "-live";
    }
    if (req.sortBy === "latest") {
      sort = "-createdAt";
    }
    if (req.sortBy === "oldest") {
      sort = "createdAt";
    }
    if (req.sortBy === "popular") {
      sort = "-score";
    }
    if (req.sortBy === "subscriber") {
      sort = "-stats.subscribers";
    }
    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query),
    ]);

    const items = data.map((item) => new PerformerDto(item).toSearchResponse());
    let follows = [];
    const performerIds = data.map((d) => d._id);
    const perStreamId = data.filter((e) => e.streamId).map((d) => d.streamId);
    const stream = await this.streamService.findByIds(perStreamId);

    if (user) {
      follows = await this.followService.find({
        followerId: user._id,
        followingId: { $in: performerIds },
      });
    }
    items.forEach((performer) => {
      const followed = follows.find(
        (f) => `${f.followingId}` === `${performer._id}`
      );
      // eslint-disable-next-line no-param-reassign
      performer.isFollowed = !!followed;
    });

    items.forEach((performer) => {
      const streamInfo = stream.find(
        (t) => t?._id?.toString() === performer?.streamId?.toString()
      );
      // eslint-disable-next-line no-param-reassign
      performer.liveInfo = streamInfo || {};
    });
    const subscriptions = user
      ? await this.subscriptionService.findSubscriptionList({
          performerId: { $in: performerIds },
          userId: user._id,
          expiredAt: { $gt: new Date() },
        })
      : [];

    items.forEach((a) => {
      const subscription = subscriptions.find(
        (s) => `${s.performerId}` === `${a._id}`
      );
      if (subscription) {
        a.isSubscribed = !!subscription;
      }
    });

    return {
      data: items,
      total,
    };
  }

  public async searchByKeyword(req: PerformerSearchPayload): Promise<any> {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
        "i"
      );
      query.$or = [
        {
          name: { $regex: regexp },
        },
        {
          username: { $regex: regexp },
        },
      ];
    }
    const [data] = await Promise.all([this.performerModel.find(query).lean()]);
    return data;
  }

  public async topPerformers(
    req: PerformerSearchPayload
  ): Promise<PageableData<IPerformerResponse>> {
    const query = {} as any;
    query.status = "active";
    if (req.gender) {
      query.gender = req.gender;
    }
    const sort = {
      score: -1,
      "stats.subscribers": -1,
      "stats.views": -1,
    };
    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query),
    ]);
    return {
      data: data.map((item) => new PerformerDto(item).toSearchResponse()),
      total,
    };
  }

  public async randomSearch(
    req: PerformerSearchPayload,
    user: UserDto
  ): Promise<any> {
    const query = {
      status: PERFORMER_STATUSES.ACTIVE,
      completedAccount: true,
    } as any;
    if (req.gender) {
      query.gender = req.gender;
    }
    if (req.country) {
      query.country = { $regex: req.country };
    }
    const data = await this.performerModel.aggregate([
      { $match: query },
      { $sample: { size: 50 } },
    ]);
    const items = data.map((item) => new PerformerDto(item).toSearchResponse());
    let follows = [];
    if (user) {
      const performerIds = data.map((d) => d._id);
      follows = await this.followService.find({
        followerId: user._id,
        followingId: { $in: performerIds },
      });
    }
    items.forEach((performer) => {
      const followed = follows.find(
        (f) => `${f.followingId}` === `${performer._id}`
      );
      // eslint-disable-next-line no-param-reassign
      performer.isFollowed = !!followed;
    });

    return {
      data: items,
    };
  }

  public async getNamesPerformer(req: PerformerSearchPayload) {
    const query = {} as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
        "i"
      );
      const searchValue = { $regex: regexp };
      query.$or = [{ name: searchValue }, { username: searchValue }];
    }
    query.status = "active";
    const sort = {
      createdAt: -1,
    };
    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query),
    ]);
    return {
      data: data.map((item) =>
        new PerformerDto(item).toSearchUsernameResponse()
      ),
      total,
    };
  }

  public async getInfoPerformerInserted(
    req: SearchInfoPerformerInsertedPayload
  ) {
    const typeInserted = req?.type;
    const query = {} as any;

    if (typeInserted && !req.q) {
      query[typeInserted] = { $exists: true };
    }

    if (req.q && typeInserted) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ""),
        "i"
      );
      const searchValue = { $regex: regexp };
  
      if (typeInserted) {
        query.$or = [{ [typeInserted]: searchValue }];
      }
    }

    query.status = "active";
    const sort = {
      createdAt: -1,
    };

    const [data, total] = await Promise.all([
      this.performerModel
        .find(query)
        .lean()
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.performerModel.countDocuments(query),
    ]);

    return {
      data: data.map((item) =>
        new PerformerDto(item).toSearchInfoInsertedResponse()
      ),
      total,
    };
  }
}
