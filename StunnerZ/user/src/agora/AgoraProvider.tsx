import AgoraRTC, { ClientConfig, IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useSelector } from 'react-redux';
import Router from 'next/router';
import { VideoJsPlayer } from 'video.js';

type Props = {
  config: ClientConfig;
};

type AgoraRTCProviderState = {
  client: IAgoraRTCClient;
  appConfiguration: AppConfiguration;
  config: ClientConfig;
  setPublishRef: (player: VideoJsPlayer) => void;
  getPublishRef: () => VideoJsPlayer;
  setPlayRef: (player: VideoJsPlayer) => void;
  getPlayRef: () => VideoJsPlayer;
};

type AppConfiguration = {
  agoraAppId: string;
  agoraEnable: boolean;
};

const AgoraContext = createContext<AgoraRTCProviderState>(null);

export const AgoraProvider: React.FC<Props> = ({
  config,
  children
}: React.PropsWithChildren<Props>) => {
  const [client, setClient] = useState<IAgoraRTCClient>();
  const [appConfiguration, setAppConfiguration] = useState<AppConfiguration>(
    {} as any
  );
  const settings = useSelector((state: any) => state.streaming.settings);

  const publishRef = useRef<VideoJsPlayer>();
  const playRef = useRef<VideoJsPlayer>();

  const onbeforeunload = () => {
    if (client) {
      client.removeAllListeners();
    }
  };

  useEffect(() => {
    if (!process.browser) return;

    Router.events.on('routeChangeStart', onbeforeunload);
    window && window.addEventListener('beforeunload', onbeforeunload);

    const _client = AgoraRTC.createClient(config);
    if (_client) {
      setClient(_client);
    }

    // eslint-disable-next-line consistent-return
    return () => {
      window && window.removeEventListener('beforeunload', onbeforeunload);
      Router.events.off('routeChangeStart', onbeforeunload);
    };
  }, []);

  useEffect(() => {
    if (settings) setAppConfiguration(settings);
  }, [settings]);

  const setPublishRef = (player) => {
    publishRef.current = player;
  };

  const getPublishRef = () => publishRef.current;

  const setPlayRef = (player) => {
    playRef.current = player;
  };

  const getPlayRef = () => playRef.current;

  const value = useMemo(
    () => ({
      client,
      appConfiguration,
      config,
      setPublishRef,
      getPublishRef,
      setPlayRef,
      getPlayRef
    }),
    [
      client,
      appConfiguration,
      config,
      setPublishRef,
      getPublishRef,
      setPlayRef,
      getPlayRef
    ]
  );

  return React.createElement(AgoraContext.Provider, { value }, children);
};

AgoraProvider.displayName = 'AgoraProvider';

export const useAgora = () => useContext(AgoraContext);

export default AgoraProvider;
