import {
  ForbiddenException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { EntityNotFoundException } from "src/kernel";
import { PerformerDto } from "src/modules/performer/dtos";
import { ACCOUNT_MANAGER } from "src/modules/performer/constants";
import { PerformerService } from "src/modules/performer/services";
import { SubPerformerPrivilege } from "../models";
import { UserService } from "./user.service";
import {
  GrantPrivilegePayload,
  SearchPrivilegePayload,
  SubPerformerAuthCreatePayload,
  SubPerformerAuthUpdatePayload,
} from "../payloads";
import {
  PERFORMER_PRIVILEGES,
  ROLE_SUB_PERFORMER,
  SET_EARNING_AGENCY,
} from "../constants";
import { SUB_PERFORMER_PRIVILEGE_PROVIDER } from "../providers";
import { UserDto } from "../dtos";
import { omit } from "lodash";
import { UPDATE_SUB_ACCOUNT_EXCLUSIVE_FIELDS } from "src/modules/auth";
import { AuthService } from "src/modules/auth/services";
import { MailerService } from "src/modules/mailer";
import { SettingService } from "src/modules/settings";
import { SETTING_KEYS } from "src/modules/settings/constants";

@Injectable()
export class SubPerformerService {
  constructor(
    @Inject(SUB_PERFORMER_PRIVILEGE_PROVIDER)
    private readonly subPerformerPrivilegeModel: Model<SubPerformerPrivilege>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
    @Inject(forwardRef(() => MailerService))
    private readonly mailerService: MailerService
  ) {}

  public async create(
    mainSourceId: string | ObjectId,
    data: SubPerformerAuthCreatePayload,
    performer?: any
  ): Promise<any> {
    // const checkExist = await this.userService.find({
    //   mainSourceId,
    //   status: 'active',
    //   usingSubAccount: true
    // });

    // if (checkExist.length >= 1) {
    //   throw new HttpException('You just can create only a account external agency', 400);
    // }
    const user = await this.userService.create(
      {
        ...data,
        verifiedEmail: false,
        mainSourceId,
        commissionExternalAgency: Number(data.commissionExternalAgency) || 0,
        status:
          performer?.accountManager !== ACCOUNT_MANAGER.AGENCY_MANAGED
            ? "inactive"
            : "active",
      } as any,
      {
        roles: [ROLE_SUB_PERFORMER],
        verifiedEmail: false,
      }
    );
    if (data.setTypeCommissionAgency === SET_EARNING_AGENCY.TOTAL) {
      await this.subPerformerPrivilegeModel.create({
        userId: user._id,
        privilege: "all",
        commission: 0,
        showCommission: false,
      });
    }
    const siteName =
      (await SettingService.getValueByKey(SETTING_KEYS.SITE_NAME)) ||
      process.env.DOMAIN;
    await this.authService.sendVerificationEmail(new UserDto(user));
    await this.mailerService.send({
      to: data.email,
      template: "account-agency-informations",
      subject: "Agency Account Information",
      data: {
        ...new UserDto(user),
        siteName,
        password: data.password,
      },
    });
    await this.performerService.updateOne(
      { _id: mainSourceId },
      {
        commissionExternalAgency: Number(data.commissionExternalAgency),
        setEarningAgency: data.setTypeCommissionAgency,
      },
      {}
    );
    return new UserDto(user);
  }

  public async updateCommissionAgency(payload: any, performer: any) {
    const { id, commission } = payload;
    if (!id || !commission) {
      throw new HttpException("Missing fields", 400);
    }
    const user = await this.userService.findById(id);

    if (!user) {
      throw new EntityNotFoundException();
    }

    if (user.mainSourceId.toString() !== performer._id.toString()) {
      throw new HttpException(
        "You can not change commission this account",
        400
      );
    }

    await this.userService.updateOne(
      { _id: user._id },
      {
        $set: {
          commissionExternalAgency: Number(commission),
          setTypeCommissionAgency: "total",
        },
      },
      {}
    );

    await this.performerService.updateOne(
      { _id: performer._id },
      {
        $set: {
          commissionExternalAgency: Number(commission),
        },
      },
      {}
    );

    const checkPrivilege = await this.subPerformerPrivilegeModel.findOne({
      userId: user._id,
      privilege: 'all',
    });
    if (!checkPrivilege) {
      await this.subPerformerPrivilegeModel.create({
        userId: user._id,
        privilege: 'all',
        commission: 0
      })
    }

    return true;
  }

  public async updateProfile(
    updater: PerformerDto,
    userId: string | ObjectId,
    payload: SubPerformerAuthUpdatePayload
  ): Promise<any> {
    const user = await this.userService.findById(userId);
    if (!user) throw new EntityNotFoundException();
    if (user.mainSourceId.toString() !== updater._id.toString()){
      throw new ForbiddenException();
    }
    await this.userService.adminUpdate(userId, { ...payload } as any);
    if (payload.status === "inactive") {
      await this.performerService.updateOne(
        { _id: updater._id },
        {
          commissionExternalAgency: Number(payload.commissionExternalAgency),
          accountManager: ACCOUNT_MANAGER.SELF_MANAGED,
          setEarningAgency: payload.setTypeCommissionAgency,
        },
        {}
      );
    } else {
      await this.performerService.updateOne(
        { _id: updater._id },
        {
          commissionExternalAgency: Number(payload.commissionExternalAgency),
          setEarningAgency: payload.setTypeCommissionAgency,
        },
        {}
      );
    }
    if (payload.setTypeCommissionAgency === SET_EARNING_AGENCY.INDIVIDUAL) {
      const result = await this.subPerformerPrivilegeModel.findOne({
        userId,
        privilege: "all"
      });

      if (result) {
        await this.subPerformerPrivilegeModel.deleteOne({
          userId,
          privilege: "all"
        });
      }
    } else {
      const result = await this.subPerformerPrivilegeModel.findOne({ userId, privilege: "all" });
      if (result) {
        await this.subPerformerPrivilegeModel.updateOne(
          { _id: result?._id },
          { userId, privilege: "all", commission: 0, showCommission: false }
        );
      } else {
        await this.subPerformerPrivilegeModel.create(
          { userId, privilege: "all", commission: 0, showCommission: false },
        );
      }
    }
    return true;
  }

  public async grant(updater: UserDto, payload: GrantPrivilegePayload) {
    const { privilege, userId, commission } = payload;
    const user = await this.userService.findById(userId);
    if (!user) throw new EntityNotFoundException();
    if (
      !user.mainSourceId ||
      user.mainSourceId.toString() !== updater._id.toString()
    ) {
      throw new ForbiddenException();
    }

    const data = await this.subPerformerPrivilegeModel.findOne({
      userId,
      privilege,
    });

    if (user.setTypeCommissionAgency === "total") {
      await this.userService.updateOne(
        { _id: user._id },
        {
          $set: {
            setTypeCommissionAgency: "individual",
          }
        },
        {}
      );
    }
    await this.subPerformerPrivilegeModel.deleteOne({
      userId,
      privilege: 'all'
    });

    if (data) {
      return await this.subPerformerPrivilegeModel.updateOne(
        { _id: data._id },
        {
          $set: {
            commission: commission || 0,
            privilege,
          },
        }
      );
    }
    const arrayPrivilege = [
      PERFORMER_PRIVILEGES.EDIT_PROFILE,
      PERFORMER_PRIVILEGES.BLACK_LIST,
      PERFORMER_PRIVILEGES.BLOCK_COUNTRIES,
      PERFORMER_PRIVILEGES.REFERRAL,
      PERFORMER_PRIVILEGES.WELCOME_MESSAGE,
      PERFORMER_PRIVILEGES.AVAILABLE_TIME,
      PERFORMER_PRIVILEGES.SUBSCRIPTION_LIST,
    ];
    let status = true;
    if (arrayPrivilege.includes(privilege)) {
      status = false;
    }

    const result = await this.subPerformerPrivilegeModel.create({
      userId,
      privilege,
      commission,
      showCommission: status,
    });

    return result;
  }

  public async remove(id: string | ObjectId) {
    const data = await this.subPerformerPrivilegeModel.findById(id);
    if (!data) throw new EntityNotFoundException();
    await data.remove();
    return true;
  }

  public async findById(id: string | ObjectId) {
    const data = await this.userService.findById(id);
    return data;
  }

  public async findOne(payload) {
    const data = await this.userService.findOne(payload);
    return data;
  }

  public async search(req: SearchPrivilegePayload) {
    const query = {} as any;
    if (req.userId) {
      query.userId = req.userId;
    }
    let sort = {
      createdAt: -1,
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort,
      };
    }
    const [data, total] = await Promise.all([
      this.subPerformerPrivilegeModel
        .find(query)
        .sort(sort)
        .limit(+req.limit)
        .skip(Number(+req.offset)),
      this.subPerformerPrivilegeModel.countDocuments(query),
    ]);
    return {
      data,
      total,
    };
  }

  public async myList(user: UserDto, req: SearchPrivilegePayload) {
    const query = {
      userId: user._id,
      usingSubAccount: true,
    } as any;
    let sort = {
      createdAt: -1,
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort,
      };
    }
    const [data, total] = await Promise.all([
      this.subPerformerPrivilegeModel
        .find(query)
        .sort(sort)
        .limit(+req.limit)
        .skip(+req.offset),
      this.subPerformerPrivilegeModel.countDocuments(query),
    ]);
    return {
      data,
      total,
    };
  }

  public async getMyPrivileges(userId: string | ObjectId) {
    const data = await this.subPerformerPrivilegeModel.find({ userId });
    return data.map((d) => d.privilege);
  }

  public async getMyListForFind(
    userId: string | ObjectId,
    filter1?: string,
    filter2?: string
  ) {
    const users = await this.userService.find({
      mainSourceId: userId,
      roles: ROLE_SUB_PERFORMER,
      status: "active",
      usingSubAccount: true,
    });

    const findDataUsers = await Promise.all(
      users.map(async (user) => {
        const userPrivileges = await this.getMyPrivileges(user._id.toString());
        if (
          userPrivileges.includes(filter1) ||
          (filter2 && userPrivileges.includes(filter2))
        ) {
          let commission;
          if (filter2) {
            const data = await this.subPerformerPrivilegeModel.findOne({
              userId: user._id,
              privilege: filter2,
            });
            commission = data?.commission || 0;
          }
          return {
            ...new UserDto(user),
            commissionPrivilege: commission,
          };
        }
        return null;
      })
    );

    return findDataUsers.filter((userInfo) => !!userInfo);
  }
  public async getMyListForTip(userId: string | ObjectId) {
    const users = await this.userService.find({
      mainSourceId: userId,
      roles: ROLE_SUB_PERFORMER,
      status: "active",
      usingSubAccount: true,
    });

    const findDataUsers = await Promise.all(
      users.map(async (user) => {
        return new UserDto(user);
      })
    );

    return findDataUsers.filter((userInfo) => !!userInfo);
  }

  public async switchAccountSubPerformer(
    performer: PerformerDto,
    payload: SubPerformerAuthCreatePayload
  ) {
    const findOldYourAccount = await this.userService.findOne({
      username: payload.username,
      mainSourceId: performer._id,
    });
    if (findOldYourAccount) {
      await this.updateProfile(performer, findOldYourAccount._id, payload);

      await this.userService.updateMany(
        {
          mainSourceId: performer._id,
          _id: { $ne: findOldYourAccount._id },
        },
        {
          $set: {
            status: "inactive",
            usingSubAccount: false,
          },
        },
        {}
      );
      return true;
    }

    const findExistsUser = await this.userService.findOne({
      username: payload.username,
    });
    if (findExistsUser) {
      throw new HttpException(
        "Account exists, please choose different username",
        400
      );
    }

    const findExistsPerformer = await this.performerService.findOne({
      username: payload.username,
    });
    if (findExistsPerformer) {
      throw new HttpException(
        "Account exists, please choose different username",
        400
      );
    }

    const dataAdded = (await omit(
      payload,
      UPDATE_SUB_ACCOUNT_EXCLUSIVE_FIELDS
    )) as any;
    const sub = await this.create(performer._id, dataAdded, performer);
    if (payload.password) {
      // generate auth if have pw, otherwise will create random and send to user email?
      await this.authService.update({
        type: "password",
        value: payload.password,
        source: "sub_performer",
        key: payload.email,
        sourceId: sub._id,
        mainSourceId: performer._id, // use when account is sub account
      });
    }
    await this.userService.updateMany(
      {
        mainSourceId: performer._id,
        _id: { $ne: sub._id },
      },
      {
        $set: {
          status: "inactive",
          usingSubAccount: false,
        },
      },
      {}
    );
    return true;
  }
}
