import { useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useDispatch } from "react-redux";

import { fetchAsyncParties } from "../redux/features/parties/partiesSlice";
import { applySyncedVoterUpdate } from "../redux/features/representative/representativeSlice";
import { flushOutbox } from "./syncOutbox";

export function useOutboxSyncWorker(enabled = true) {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    const run = async () => {
      const res = await flushOutbox({
        onVoterUpdated: ({ voterId, updated }) => {
          if (!mounted) return;
          dispatch(applySyncedVoterUpdate({ voterId, updated }));
        },
      });
      // For party vote/white vote, we refresh parties list silently after any outbox processing.
      if (mounted && res?.processed > 0) dispatch(fetchAsyncParties());
    };

    // Kick once on mount (if online)
    run();

    const unsub = NetInfo.addEventListener((state) => {
      const online = Boolean(state?.isConnected && state?.isInternetReachable !== false);
      if (online) run();
    });

    return () => {
      mounted = false;
      unsub?.();
    };
  }, [dispatch, enabled]);
}

