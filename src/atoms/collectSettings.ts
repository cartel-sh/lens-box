import { atomWithStorage } from "jotai/utils";

export interface PersistedCollectConfig {
  enabled: boolean;
  collectLimit?: number;
  endsAt?: string;
  followersOnly?: boolean;
  price?: {
    amount: string;
    currency: "GHO" | "WGHO";
  };
}

// Default: limit 1, price 1 GHO, deadline 1 week from now
const oneWeekFromNowIso = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
};

const defaultCollectConfig: PersistedCollectConfig = {
  enabled: true,
  collectLimit: 1,
  endsAt: oneWeekFromNowIso(),
  followersOnly: false,
  price: {
    amount: "1",
    currency: "GHO",
  },
};

export const collectSettingsAtom = atomWithStorage<PersistedCollectConfig>(
  "collect-settings",
  defaultCollectConfig,
);


