import type { Group as LensGroup } from "@lens-protocol/client";
import type { Group, GroupOperations, GroupMetadata, GroupRules } from "@cartel-sh/ui";

export function lensGroupToGroup(lensGroup: LensGroup): Group {
  if (!lensGroup) return {} as unknown as Group;

  const operations: GroupOperations = {
    isBanned: lensGroup.operations?.isBanned || false,
    canJoin:
      lensGroup.operations?.canJoin?.__typename ===
        "GroupOperationValidationPassed" || false,
    canLeave:
      lensGroup.operations?.canLeave?.__typename ===
        "GroupOperationValidationPassed" || false,
    canPost:
      lensGroup.feed?.operations?.canPost?.__typename ===
        "FeedOperationValidationPassed" || false,
  };

  const metadata: GroupMetadata = {
    name: lensGroup.metadata?.name || "",
    slug: (lensGroup.metadata as any)?.slug || "",
    description: lensGroup.metadata?.description || undefined,
    icon: lensGroup.metadata?.icon || undefined,
    coverPicture: lensGroup.metadata?.coverPicture || undefined,
  };

  const rules = (lensGroup.metadata as any).rules?.map((rule: any) => ({
    title: rule.title,
    description: rule.description,
  }));

  return {
    id: lensGroup.address,
    address: lensGroup.address,
    timestamp: lensGroup.timestamp,
    metadata,
    operations,
    rules,
    owner: (lensGroup as any).owner || undefined,
    feed: lensGroup.feed ? { address: lensGroup.feed.address } : undefined,
    isBanned: operations.isBanned,
    canJoin: operations.canJoin,
    canLeave: operations.canLeave,
    canPost: operations.canPost,
  };
}