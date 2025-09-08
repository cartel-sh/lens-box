import type { Account, AccountStats as LensAccountStats } from "@lens-protocol/client";
import type { User, UserStats, UserInterests } from "@cartel-sh/ui";

export function lensAccountToUser(account: Account): User {
  if (!account) return {} as unknown as User;

  const imageUrl = account?.metadata?.picture;

  const actions = {
    followed: account?.operations?.isFollowedByMe,
    following: account?.operations?.isFollowingMe,
    blocked: account?.operations?.isBlockedByMe,
    muted: account?.operations?.isMutedByMe,
  };

  const attributes = account?.metadata?.attributes?.map((attr) => ({
    key: attr.key,
    value: attr.value,
  }));

  return {
    id: account.address,
    profilePictureUrl: imageUrl,
    address: account.address,
    createdAt: account.createdAt,
    description: account?.metadata?.bio ?? undefined,
    actions: {
      followed: actions.followed ?? false,
      following: actions.following ?? false,
      blocked: actions.blocked ?? false,
      muted: actions.muted ?? false,
    },
    name: account?.metadata?.name ?? undefined,
    username: account.username?.localName || "",
    namespace: account.username?.namespace?.address || "",
    metadata: {
      attributes,
    },
  };
}

export function lensAccountStatsToUserStats(
  stats: LensAccountStats | null | undefined,
): UserStats | undefined {
  if (!stats) return undefined;

  return {
    following: stats.graphFollowStats.following ?? 0,
    followers: stats.graphFollowStats.followers ?? 0,
  };
}

export function capitalize(label: string): string {
  return label.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export function parseInterests(categories: string[]): UserInterests[] {
  return categories.map((item) => {
    const [category, subcategory] = item.split("__");
    const label = capitalize(
      subcategory
        ? subcategory.replace(/_/g, " ")
        : category.replace(/_/g, " "),
    );
    return { category, value: item, label };
  });
}