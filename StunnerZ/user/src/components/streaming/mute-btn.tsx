import { Button } from 'antd';
import { useEffect, useState } from 'react';
import { useAgora } from 'src/agora';
import { VolumeIcon, VolumeMutedIcon } from 'src/icons';

type Props = {
    type: any;
    onMute?: Function;
  };
export function MuteButton({
  type, onMute
}: Props) {
  const { getPlayRef, getPublishRef } = useAgora();
  const [muted, setMuted] = useState<boolean>(false);
  const player = type === 'publish' ? getPublishRef() : getPlayRef();

  const handleClick = () => {
    onMute && onMute(!muted);
    player.muted(!muted);
    setMuted(!muted);
  };

  useEffect(() => {
    if (player) {
      setMuted(player.muted());
    }
  }, [player]);

  return (
    <Button aria-hidden onClick={handleClick}>
      {!muted ? <VolumeIcon /> : <VolumeMutedIcon />}
    </Button>
  );
}

MuteButton.defaultProps = {
  onMute: () => {}
};
