import { useCallback, useEffect, useRef, useState } from "react";
import { distanceMeters } from "@/lib/geo";
import type { Checkpoint } from "@/lib/mockRoutes";

const CHECKPOINT_RADIUS_METERS = 30;

export type GpsTrackerState = {
  isTracking: boolean;
  currentPosition: { lat: number; lng: number } | null;
  completedCheckpoints: Set<string>;
  isRouteComplete: boolean;
  error: string | null;
  permissionDenied: boolean;
};

export function useGpsTracker(checkpoints: Checkpoint[]) {
  const [state, setState] = useState<GpsTrackerState>({
    isTracking: false,
    currentPosition: null,
    completedCheckpoints: new Set(),
    isRouteComplete: false,
    error: null,
    permissionDenied: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "GPS를 지원하지 않는 기기입니다.",
        permissionDenied: true,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true, error: null }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const currentPos = { lat, lng };

        setState((prev) => {
          const newCompleted = new Set(prev.completedCheckpoints);
          let allCompleted = true;

          // 모든 체크포인트 확인
          for (let i = 0; i < checkpoints.length; i++) {
            const cp = checkpoints[i];
            const distance = distanceMeters(lat, lng, cp.lat, cp.lng);

            // 반경 30m 이내면 체크포인트 완료
            if (distance <= CHECKPOINT_RADIUS_METERS && !newCompleted.has(cp.name)) {
              newCompleted.add(cp.name);
            }

            if (!newCompleted.has(cp.name)) {
              allCompleted = false;
            }
          }

          const isRouteComplete = allCompleted && checkpoints.length > 0;

          return {
            ...prev,
            currentPosition: currentPos,
            completedCheckpoints: newCompleted,
            isRouteComplete,
          };
        });
      },
      (error) => {
        let errorMsg = "위치 정보를 가져올 수 없습니다.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "위치 접근 권한을 거부하셨습니다. 설정에서 위치 권한을 허용해주세요.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = "위치 정보를 사용할 수 없습니다.";
        } else if (error.code === error.TIMEOUT) {
          errorMsg = "위치 정보 요청이 시간 초과되었습니다.";
        }

        setState((prev) => ({
          ...prev,
          error: errorMsg,
          permissionDenied: error.code === error.PERMISSION_DENIED,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [checkpoints]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  const resetTracking = useCallback(() => {
    stopTracking();
    setState({
      isTracking: false,
      currentPosition: null,
      completedCheckpoints: new Set(),
      isRouteComplete: false,
      error: null,
      permissionDenied: false,
    });
  }, [stopTracking]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    resetTracking,
  };
}
