import { useEffect, useRef } from 'react';
import {
  endScreenTrace,
  markScreenDataReady,
  markScreenFirstContent,
  startScreenTrace,
} from '../services/perfMonitor';

export const useScreenPerf = ({
  screenName,
  transitionName = null,
  hasFirstContent = true,
  isDataReady = true,
}) => {
  const traceIdRef = useRef(null);
  const firstContentMarkedRef = useRef(false);
  const dataReadyMarkedRef = useRef(false);

  useEffect(() => {
    traceIdRef.current = startScreenTrace({
      screen: screenName,
      transition: transitionName,
    });

    return () => {
      if (traceIdRef.current) {
        endScreenTrace(traceIdRef.current);
      }
      traceIdRef.current = null;
      firstContentMarkedRef.current = false;
      dataReadyMarkedRef.current = false;
    };
  }, [screenName, transitionName]);

  useEffect(() => {
    if (firstContentMarkedRef.current || !hasFirstContent || !traceIdRef.current) return;
    firstContentMarkedRef.current = true;
    markScreenFirstContent(traceIdRef.current);
  }, [hasFirstContent]);

  useEffect(() => {
    if (dataReadyMarkedRef.current || !isDataReady || !traceIdRef.current) return;
    dataReadyMarkedRef.current = true;
    markScreenDataReady(traceIdRef.current);
  }, [isDataReady]);
};
