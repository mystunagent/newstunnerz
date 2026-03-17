import { useContext, useEffect, useState } from "react";
import "./notify-banking-sub-performer.less";
import { SocketContext } from "src/socket";
import { userService } from "@services/user.service";
import { updateCurrentUser } from "@redux/user/actions";
import { useDispatch } from "react-redux";

type IProps = {
  user: any;
};

function NotificationBankingSubPerformer({ user }: IProps) {
  const socket = useContext(SocketContext);
  const dispatch = useDispatch();
  const [hide, setHide] = useState<boolean>(user && user?.infoSubPerformer && !user?.infoBankSubPerformer ? true : false)

  useEffect(() => {
    socket && socket.on('sub_added_banking', async () => {
      const user = await userService.me();
      dispatch(updateCurrentUser(user.data));
      setHide(false);
    });
  }, [socket])

  return (
    <>
      {hide && (
        <div className="notify-banking-sub-performer">
          <span>Please submit your banking details</span>
        </div>
      )}
    </>
  );
}

NotificationBankingSubPerformer.contextType = SocketContext;
export default NotificationBankingSubPerformer;