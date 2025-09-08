import type { Notification, User } from "@cartel-sh/ui";
import type { Notification as LensNotification } from "@lens-protocol/client";
import { lensItemToPost } from "./postConverter";
import { lensAccountToUser } from "./userConverter";

export function lensNotificationToNative(item: LensNotification): Notification {
  // Extract ID properly without any casting
  const base = { id: 'id' in item ? (item as any).id : crypto.randomUUID() };

  switch (item.__typename) {
    case "CommentNotification":
      return {
        ...base,
        who: [lensAccountToUser(item.comment.author)],
        actedOn: lensItemToPost(item.comment) || undefined,
        createdAt: new Date(item.comment.timestamp),
        type: "Comment",
      };

    case "ReactionNotification": {
      const reaction = item.reactions[0]?.reactions[0];
      return {
        ...base,
        who: item.reactions.map((r) => lensAccountToUser(r.account)),
        actedOn: item.post ? lensItemToPost(item.post) || undefined : undefined,
        createdAt: new Date(reaction?.reactedAt ?? Date.now()),
        type: "Reaction",
        reactionType: reaction?.reaction === "UPVOTE" ? "Upvote" : "Downvote",
      };
    }

    case "PostActionExecutedNotification":
      return {
        ...base,
        who: [lensAccountToUser(item.post.author)],
        actedOn: lensItemToPost(item.post) || undefined,
        createdAt: new Date(item.post.timestamp),
        type: "Action",
        actionType: "PostAction",
      };

    case "AccountActionExecutedNotification": {
      const action = item.actions[0];

      if (!action) {
        return {
          ...base,
          who: [],
          createdAt: new Date(),
          type: "Action",
        };
      }

      let who: User[] = [];
      let createdAt = new Date();
      let actionType = "Unknown";

      const actionAny = action as any;

      switch (actionAny.__typename) {
        case "TippingAccountActionExecuted":
          // The account is in executedBy property
          if (actionAny.executedBy) {
            who = [lensAccountToUser(actionAny.executedBy)];
          }
          createdAt = new Date(actionAny.executedAt || Date.now());
          actionType = "Tipping";
          break;

        case "UnknownAccountActionExecuted":
          // Check for executedBy first, then other possible properties
          if (actionAny.executedBy) {
            who = [lensAccountToUser(actionAny.executedBy)];
          } else if (actionAny.account) {
            who = [lensAccountToUser(actionAny.account)];
          }
          createdAt = new Date(actionAny.executedAt || Date.now());
          actionType = "Unknown";
          break;

        default:
          // Check for executedBy first, then other possible properties
          if (actionAny.executedBy) {
            who = [lensAccountToUser(actionAny.executedBy)];
          } else if (actionAny.account) {
            who = [lensAccountToUser(actionAny.account)];
          }
          if (actionAny.executedAt) {
            createdAt = new Date(actionAny.executedAt);
          }
          actionType =
            typeof actionAny.__typename === "string"
              ? actionAny.__typename.replace("AccountActionExecuted", "")
              : "Unknown";
          break;
      }

      return {
        ...base,
        who,
        createdAt,
        type: "Action",
        actionType,
      };
    }

    case "FollowNotification":
      return {
        ...base,
        who: item.followers.map((f) => lensAccountToUser(f.account)),
        createdAt: new Date(item.followers[0]?.followedAt ?? Date.now()),
        type: "Follow",
      };

    case "MentionNotification":
      return {
        ...base,
        who: [lensAccountToUser(item.post.author)],
        actedOn: item.post ? lensItemToPost(item.post) || undefined : undefined,
        createdAt: new Date(item.post.timestamp),
        type: "Mention",
      };

    case "RepostNotification":
      return {
        ...base,
        who: item.reposts.map((r) => lensAccountToUser(r.account)),
        actedOn: item.post ? lensItemToPost(item.post) || undefined : undefined,
        createdAt: new Date(item.post.timestamp),
        type: "Repost",
      };

    case "QuoteNotification":
      return {
        ...base,
        who: [lensAccountToUser(item.quote.author)],
        actedOn: item.quote ? lensItemToPost(item.quote) || undefined : undefined,
        createdAt: new Date(item.quote.timestamp),
        type: "Quote",
      };

    case "GroupMembershipRequestApprovedNotification": {
      const groupNotification = item as any;
      
      return {
        ...base,
        who: [],
        createdAt: groupNotification.approvedAt ? new Date(groupNotification.approvedAt) : null,
        type: "GroupMembershipRequestApproved",
        groupId: groupNotification.group?.id,
        groupName: groupNotification.group?.metadata?.name,
      };
    }

    case "GroupMembershipRequestRejectedNotification": {
      const groupNotification = item as any;
      
      return {
        ...base,
        who: [],
        createdAt: groupNotification.rejectedAt ? new Date(groupNotification.rejectedAt) : null,
        type: "GroupMembershipRequestRejected",
        groupId: groupNotification.group?.id,
        groupName: groupNotification.group?.metadata?.name,
      };
    }

    case "TokenDistributedNotification": {
      const tokenNotification = item as any;
      
      // Parse the amount properly - it's nested in a NativeAmount object
      let tokenAmount: string | undefined;
      let tokenSymbol: string | undefined;
      
      if (tokenNotification.amount) {
        // Handle NativeAmount structure: { __typename: "NativeAmount", asset: {...}, value: "5.239712700523971" }
        if (tokenNotification.amount.value) {
          const value = tokenNotification.amount.value;
          if (typeof value === 'string' && value !== '' && !isNaN(Number(value))) {
            tokenAmount = value;
          }
        }
        
        // Get token symbol from asset
        if (tokenNotification.amount.asset?.symbol) {
          tokenSymbol = tokenNotification.amount.asset.symbol;
        } else if (tokenNotification.amount.asset?.name) {
          tokenSymbol = tokenNotification.amount.asset.name;
        }
      }

      // Use actionDate instead of distributedAt
      const createdAt = tokenNotification.actionDate 
        ? new Date(tokenNotification.actionDate) 
        : (tokenNotification.distributedAt ? new Date(tokenNotification.distributedAt) : null);

      const result = {
        ...base,
        who: tokenNotification.account ? [lensAccountToUser(tokenNotification.account)] : [],
        createdAt,
        type: "TokenDistributed" as const,
        tokenAmount,
        tokenSymbol,
      };

      return result;
    }

    default: {
      const unknownItem = item as any;
      console.warn("🚨 UNHANDLED NOTIFICATION TYPE:", {
        typename: unknownItem.__typename,
        availableKeys: Object.keys(unknownItem),
        fullItem: JSON.stringify(unknownItem, null, 2)
      });

      return {
        ...base,
        who: [],
        createdAt: new Date(),
        type: "Action",
        actionType: typeof unknownItem.__typename === "string" ? unknownItem.__typename : "Unknown",
      };
    }
  }
}
