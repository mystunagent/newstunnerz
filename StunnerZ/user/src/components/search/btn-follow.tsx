import { followService } from '@services/follow.service';
import { Button, message } from 'antd';
import { useState } from 'react';

type IProps = {
  performer: any;
  user: any;
}

export default function BtnFollow({ user, performer }: IProps) {
  const [isFollowed, setIsFollowed] = useState(performer?.isFollowed);
  const handleFollow = async (event: any) => {
    event.stopPropagation();
    if (user.isPerformer) return;
    if (!user._id) {
      message.error('Please log in or register!');
      return;
    }
    try {
      if (!isFollowed) {
        await followService.create(performer?._id);
        setIsFollowed(true);
        message.success('Followed successfully');
      } else {
        await followService.delete(performer?._id);
        setIsFollowed(false);
        message.success('Unfollowed successfully');
      }
    } catch (e) {
      const error = await e;
      message.error(error.message || 'Error occurred, please try again later');
    }
  };
  return (
    <div>
      <Button onClick={handleFollow} className="live-status-card">
        {isFollowed ? 'Unfollow' : 'Follow'}
      </Button>
    </div>
  );
}
