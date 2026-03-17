import { videoDuration } from '@lib/duration';
import {
  forwardRef, useEffect, useImperativeHandle, useRef, useState
} from 'react';

interface ICallTimeProps {
  started: any
}

// eslint-disable-next-line react/prop-types
const CallTime = forwardRef(({ started }: ICallTimeProps, ref): any => {
  const [sec, setSec] = useState(0);
  const currentSec = useRef(0);
  const timeout = useRef(null);

  const setTime = () => {
    if (timeout.current) clearTimeout(timeout.current);
    currentSec.current += 1;
    setSec(currentSec.current);
    timeout.current = setTimeout(setTime, 1000);
  };

  const start = () => {
    setTime();
  };

  const reset = () => {
    if (timeout.current) clearTimeout(timeout.current);
    currentSec.current = 0;
    setSec(0);
    setTime();
  };

  const stop = () => {
    if (timeout.current) clearTimeout(timeout.current);
    currentSec.current = 0;
    setSec(0);
  };

  const getCurrent = () => ({
    sec
  });

  useImperativeHandle(ref, () => ({
    start,
    reset,
    stop,
    getCurrent
  }));

  useEffect(() => {
    started && setTime();
    return () => {
      timeout.current && clearTimeout(timeout.current);
    };
  }, [started]);

  return videoDuration(sec);
});

export default CallTime;
