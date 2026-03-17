import { flatten, pick } from "lodash";
import { put } from "redux-saga/effects";
import { createSagas } from "@lib/redux";
import Router from "next/router";
import { authService, subAccountService, userService } from "src/services";
import { ILogin, IFanRegister, IForgot } from "src/interfaces";
import { message } from "antd";
import { updateCurrentUser } from "../user/actions";
import {
  loginSocial,
  login,
  loginSuccess,
  logout,
  loginFail,
  registerFanFail,
  registerFan,
  registerFanSuccess,
  registerPerformerFail,
  registerPerformer,
  registerPerformerSuccess,
  forgot,
  forgotSuccess,
  forgotFail,
  getCurrentUser,
  updatePrivileges,
} from "./actions";

const authSagas = [
  {
    on: login,
    *worker(data: any) {
      try {
        const payload = data.payload as ILogin;
        const resp = (yield authService.login(payload)).data;
        if(resp?.token === null && resp?.link) {
          Router.push(resp?.link);
          return;
        }
        // store token, update store and redirect to dashboard page
        // register and resp token to login
        yield authService.setToken(resp.token, payload?.remember);
        const userResp = yield userService.me();
        yield put(updateCurrentUser(userResp.data));
        yield put(loginSuccess());
        if (!userResp?.data?.isPerformer) {
          Router.push("/");
        }
        if (userResp?.data?.isPerformer) {
          const privileges = yield subAccountService.getMyPrivilege();
          yield put(updatePrivileges(privileges.data));
          !userResp.data.completedAccount || userResp.data?.infoSubPerformer
            ? Router.push(
                {
                  pathname: "/creator/profile",
                  query: {
                    username: userResp.data.username || userResp.data._id,
                  },
                },
                `/${userResp.data.username || userResp.data._id}`
              )
            : Router.push("/dashboard");
        }
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(error?.message || "Incorrect credentials!");
        yield put(loginFail(error));
      }
    },
  },
  {
    on: loginSocial,
    *worker(data: any) {
      try {
        const payload = data.payload as any;
        const { token } = payload;
        yield authService.setToken(token);
        const userResp = yield userService.me();
        yield put(updateCurrentUser(userResp.data));
        yield put(loginSuccess());
        if (!userResp?.data?.isPerformer) {
          Router.push(
            !userResp.data.email || !userResp.data.username
              ? "/user/account"
              : "/"
          );
        }
        if (userResp?.data?.isPerformer) {
          !userResp.data.email || !userResp.data.username
            ? Router.push("/creator/account")
            : Router.push(
                {
                  pathname: "/creator/profile",
                  query: {
                    username: userResp.data.username || userResp.data._id,
                  },
                },
                `/${userResp.data.username || userResp.data._id}`
              );
        }
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(error?.message || "Incorrect credentials!");
        yield put(loginFail(error));
      }
    },
  },
  {
    on: registerFan,
    *worker(data: any) {
      try {
        const payload = data.payload as IFanRegister;
        const resp = (yield authService.register(payload)).data;
        message.success(resp?.message || "Sign up success!", 10);
        Router.push("/");
        yield put(registerFanSuccess(resp));
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(
          error?.message ||
            "This Username or email address has been already taken.",
          5
        );
        yield put(registerFanFail(error));
      }
    },
  },
  {
    on: registerPerformer,
    *worker(data: any) {
      try {
        const payload = pick(data.payload, [
          "name",
          "username",
          "password",
          "rel",
          "gender",
          "email",
          "firstName",
          "lastName",
          "country",
          "dateOfBirth",
        ]);
        const { data: tokenData } = yield authService.registerPerformer(
          payload
        );
        yield put(registerPerformerSuccess());

        // auto login
        yield authService.setToken(tokenData.token, true);
        const userResp = yield userService.me();
        yield put(updateCurrentUser(userResp.data));
        yield put(loginSuccess());
        if (!userResp?.data?.isPerformer) {
          Router.push(!userResp.data.verifiedAccount ? "/user/account" : '"/"');
        }
        if (userResp?.data?.isPerformer) {
          !userResp.data.verifiedAccount
            ? Router.push("/creator/account")
            : Router.push(
                {
                  pathname: "/creator/profile",
                  query: {
                    username: userResp.data.username || userResp.data._id,
                  },
                },
                `/${userResp.data.username || userResp.data._id}`
              );
        }
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(
          error.message || "An error occured, please try again later"
        );
        yield put(registerPerformerFail(error));
      }
    },
  },
  {
    on: logout,
    *worker() {
      yield authService.removeToken();
      Router.replace("/auth/login");
    },
  },
  {
    on: forgot,
    *worker(data: any) {
      try {
        const payload = data.payload as IForgot;
        const resp = (yield authService.resetPassword(payload)).data;
        message.success(
          "We've sent an email to reset your password, please check your inbox.",
          10
        );
        yield put(forgotSuccess(resp));
      } catch (e) {
        const error = yield Promise.resolve(e);
        message.error(
          (error && error.message) ||
            "Something went wrong. Please try again later",
          5
        );
        yield put(forgotFail(error));
      }
    },
  },
  {
    on: getCurrentUser,
    *worker() {
      try {
        const userResp = yield userService.me();
        yield put(updateCurrentUser(userResp.data));
      } catch (e) {
        const error = yield Promise.resolve(e);
        // eslint-disable-next-line no-console
        console.log(error);
      }
    },
  },
];

export default flatten([createSagas(authSagas)]);
