import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Model } from 'mongoose';
import { PageableData } from 'src/kernel/common';
import { PerformerBlockService } from 'src/modules/block/services';
import { UserModel } from '../models';
import { USER_MODEL_PROVIDER } from '../providers';
import { UserDto, IUserResponse } from '../dtos';
import { UserSearchRequestPayload } from '../payloads';
import { ROLE_ADMIN, STATUS_ACTIVE, ROLE_SUB_PERFORMER } from '../constants';
import { PerformerService } from 'src/modules/performer/services';
import { PerformerDto } from 'src/modules/performer/dtos';

@Injectable()
export class UserSearchService {
  constructor(
    @Inject(forwardRef(() => PerformerBlockService))
    private readonly performerBlockService:PerformerBlockService,
    @Inject(USER_MODEL_PROVIDER)
    private readonly userModel: Model<UserModel>,
    @Inject(forwardRef(() => PerformerService))
    private readonly performerService: PerformerService
  ) {}

  // TODO - should create new search service?
  public async search(
    req: UserSearchRequestPayload
  ): Promise<PageableData<IUserResponse>> {
    const query = {
      roles: { $nin: ['performer', ROLE_SUB_PERFORMER] }
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        },
        {
          email: { $regex: regexp }
        }
      ];
    }
    if (req.verifiedEmail) {
      query.verifiedEmail = req.verifiedEmail === 'true';
    }
    if (req.role) {
      query.roles = { $in: [req.role] };
    }
    if (req.status) {
      query.status = req.status;
    }
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.userModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new UserDto(item).toResponse(true)),
      total
    };
  }

  public async performerSearch(
    req: UserSearchRequestPayload
  ): Promise<PageableData<IUserResponse>> {
    const query = {
      status: STATUS_ACTIVE,
      roles: { $nin: [ROLE_ADMIN, ROLE_SUB_PERFORMER, 'performer'] }
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        }
      ];
    }
    let sort = {};
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? parseInt(req.limit as string, 10) : 10)
        .skip(parseInt(req.offset as string, 10)),
      this.userModel.countDocuments(query)
    ]);

    const users = data.map((d) => new UserDto(d).toResponse());
    return {
      data: users,
      total
    };
  }

  public async searchByKeyword(
    req: UserSearchRequestPayload,
    roles = { $nin: ['performer', ROLE_SUB_PERFORMER] }
  ): Promise<any> {
    const query = {
      roles
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          email: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        }
      ];
    }
    const [data] = await Promise.all([
      this.userModel
        .find(query)
    ]);
    return data;
  }

  public async searchPerformerSubAccount(
    user: UserDto,
    req: UserSearchRequestPayload
  ): Promise<PageableData<IUserResponse>> {
    const query = {
      roles: ROLE_SUB_PERFORMER,
      mainSourceId: user._id,
      usingSubAccount: true
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        },
        {
          email: { $regex: regexp }
        }
      ];
    }
    if (req.status) {
      query.status = req.status;
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? Number(req.limit) : 10)
        .skip(Number(req.offset)),
      this.userModel.countDocuments(query)
    ]);
    return {
      data: data.map((item) => new UserDto(item).toResponse(true)),
      total
    };
  }
  public async adminSearchPerformerSubAccount(
    req: UserSearchRequestPayload
  ): Promise<PageableData<IUserResponse>> {
    const query = {
      roles: ROLE_SUB_PERFORMER
    } as any;
    if (req.q) {
      const regexp = new RegExp(
        req.q.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ''),
        'i'
      );
      query.$or = [
        {
          name: { $regex: regexp }
        },
        {
          username: { $regex: regexp }
        },
        {
          email: { $regex: regexp }
        }
      ];
    }
    if (req.performerId) {
      query.mainSourceId = req.performerId;
    }
    if (req.status) {
      query.status = req.status;
    }
    let sort = {
      createdAt: -1
    } as any;
    if (req.sort && req.sortBy) {
      sort = {
        [req.sortBy]: req.sort
      };
    }
    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .sort(sort)
        .limit(req.limit ? Number(req.limit) : 10)
        .skip(Number(req.offset)),
      this.userModel.countDocuments(query)
    ]);
    const result = data.map((d) => new UserDto(d));
    const performerIds = result.filter((e) => e.mainSourceId).map((d) => d.mainSourceId);
    const performers = await this.performerService.findByIds(performerIds);
    result.forEach((item) => {
      const performer = performers.find((p) => p._id.toString() === item.mainSourceId.toString());
      if (performer) {
        item.infoPerformer = new PerformerDto(performer).toSearchResponse();
      };
    })
    return {
      data: result,
      total
    };
  }
}
