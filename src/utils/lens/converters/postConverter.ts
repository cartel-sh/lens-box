import type { Post, PostMention, PostReactions } from "@cartel-sh/ui";
import type { AnyPost, Post as LensPost, TimelineItem } from "@lens-protocol/client";
import { lensAccountToUser } from "./userConverter";

export function lensItemToPost(item: AnyPost | TimelineItem): Post | null {
  if (!item) return null;

  if (item.__typename === "Repost") {
    const repostItem = item as any;
    const originalPost = lensItemToPost(repostItem.repostOf);
    if (!originalPost) return null;

    return {
      ...originalPost,
      isRepost: true,
      repostedBy: lensAccountToUser(repostItem.author),
      repostedAt: new Date(repostItem.timestamp),
    };
  }

  if (item.__typename === "TimelineItem") {
    return lensItemToPost(item.primary);
  }

  let post: Post;
  try {
    const author = item.author;
    const timestamp = item.timestamp;

    post = {
      id: item.slug ?? item.id,
      author: lensAccountToUser(author),
      reactions: getReactions(item),
      comments: getCommentsFromItem(item),
      reply: getReplyFromItem(item),
      commentOn: getCommentOnFromItem(item),
      quoteOn: getQuoteOnFromItem(item),
      metadata: item.metadata,
      mentions: getMentionsFromItem(item),
      createdAt: new Date(timestamp),
      updatedAt: new Date(timestamp),
      isEdited: item.isEdited || false,
      platform: "lens",
      __typename: "Post",
      ...{ 
        actions: getPostActions(item),
        stats: {
          collects: item.stats?.collects || 0,
          comments: item.stats?.comments || 0,
          reposts: item.stats?.reposts || 0,
          quotes: item.stats?.quotes || 0,
          reactions: item.stats?.upvotes || 0,
          bookmarks: item.stats?.bookmarks || 0,
        },
      },
    } as any;
  } catch (error) {
    console.error(error);
    return null;
  }

  return post;
}

function getPostActions(post: LensPost): any {
  const actions: any = {
    canCollect: post.operations?.canSimpleCollect?.__typename === "SimpleCollectValidationPassed" || false,
    hasCollected: post.operations?.hasSimpleCollected || false,
    canComment: post.operations?.canComment?.__typename === "PostOperationValidationPassed" || false,
    canRepost: post.operations?.canRepost?.__typename === "PostOperationValidationPassed" || false,
    canQuote: post.operations?.canQuote?.__typename === "PostOperationValidationPassed" || false,
    canEdit: post.operations?.canEdit?.__typename === "PostOperationValidationPassed" || false,
  };
  
  // Debug logging to find where collect module data is
  console.log("[COLLECT_DEBUG] === Checking all post fields for collect data ===");
  console.log("[COLLECT_DEBUG] post.openActionModules:", (post as any).openActionModules);
  console.log("[COLLECT_DEBUG] post.collectModule:", (post as any).collectModule);
  console.log("[COLLECT_DEBUG] post.collectNftAddress:", (post as any).collectNftAddress);
  console.log("[COLLECT_DEBUG] post.operations:", post.operations);

  // Extract collect details if available
  if (post.actions && Array.isArray(post.actions)) {
    console.log("[COLLECT_DEBUG] Post actions array:", JSON.stringify(post.actions, null, 2));
    
    const collectAction = post.actions.find((action: any) => action.__typename === "SimpleCollectAction");
    if (collectAction) {
      const collect = collectAction as any;
      
      // Log the entire collect action to see its structure
      console.log("[COLLECT_DEBUG] Found SimpleCollectAction:", collect);
      console.log("[COLLECT_DEBUG] SimpleCollectAction stringified:", JSON.stringify(collect, null, 2));
      
      // Log all fields of the collect action
      console.log("[COLLECT_DEBUG] Collect action fields:", Object.keys(collect));
      
      // Check for various possible price field locations
      console.log("[COLLECT_DEBUG] collect.payToCollect:", collect.payToCollect);
      console.log("[COLLECT_DEBUG] collect.amount:", collect.amount);
      console.log("[COLLECT_DEBUG] collect.fee:", collect.fee);
      console.log("[COLLECT_DEBUG] collect.baseCollectFee:", collect.baseCollectFee);
      console.log("[COLLECT_DEBUG] collect.simpleCollectLimit:", collect.simpleCollectLimit);
      
      // Extract price from payToCollect field
      let price = null;
      if (collect.payToCollect) {
        if (collect.payToCollect.native) {
          // Native GHO payment
          price = {
            amount: collect.payToCollect.native,
            currency: "GHO",
          };
        } else if (collect.payToCollect.erc20) {
          // ERC-20 payment (WGHO or other tokens)
          price = {
            amount: collect.payToCollect.erc20.value,
            currency: collect.payToCollect.erc20.currency === "0x6bDc36E20D267Ff0dd6097799f82e78907105e2F" ? "WGHO" : "ERC20",
          };
        }
      }
      
      // Check for price in the format fountain-app uses: payToCollect.amount
      if (!price && collect.payToCollect?.amount) {
        console.log("[COLLECT_DEBUG] Found payToCollect.amount:", collect.payToCollect.amount);
        const amount = collect.payToCollect.amount;
        price = {
          amount: amount.value,
          currency: amount.asset?.symbol || amount.asset?.currency || "GHO",
        };
      }
      
      console.log("[COLLECT_DEBUG] Extracted price:", price);
      console.log("[COLLECT_DEBUG] Full payToCollect structure:", JSON.stringify(collect.payToCollect, null, 2));
      
      actions.collectDetails = {
        collectLimit: collect.collectLimit,
        endsAt: collect.endsAt,
        followersOnly: collect.followerOnly,
        price: price,
        recipients: collect.payToCollect?.recipients,
        collectNftAddress: collect.collectNftAddress,
      };
      
      console.log("[COLLECT_DEBUG] Final collectDetails:", actions.collectDetails);
    } else {
      console.log("[COLLECT_DEBUG] No SimpleCollectAction found in actions");
    }
  } else {
    console.log("[COLLECT_DEBUG] No actions array on post or not an array");
  }

  return actions;
}

function getReactions(post: LensPost): Partial<PostReactions> {
  return {
    Bookmark: post.stats?.bookmarks || 0,
    Collect: post.stats?.collects || 0,
    Comment: post.stats?.comments || 0,
    Repost: post.stats?.reposts || 0,
    upvotes: post.stats?.upvotes || 0,
    isUpvoted: post.operations?.hasUpvoted || false,
    isBookmarked: post.operations?.hasBookmarked || false,
    isCollected: post.operations?.hasSimpleCollected || false,
    isReposted: post.operations?.hasReposted
      ? typeof post.operations.hasReposted === "boolean"
        ? post.operations.hasReposted
        : post.operations.hasReposted.optimistic || post.operations.hasReposted.onChain
      : false,
    canCollect: post.operations?.canSimpleCollect.__typename === "SimpleCollectValidationPassed" || false,
    canComment: post.operations?.canComment.__typename === "PostOperationValidationPassed" || false,
    canRepost: post.operations?.canRepost.__typename === "PostOperationValidationPassed" || false,
    canQuote: post.operations?.canQuote.__typename === "PostOperationValidationPassed" || false,
    canDecrypt: false,
    canEdit: post.operations?.canEdit.__typename === "PostOperationValidationPassed" || false,
    totalReactions:
      post.stats?.upvotes + post.stats?.bookmarks + post.stats?.collects + post.stats?.comments + post.stats?.reposts ||
      0,
  };
}

function getCommentsFromItem(post: any) {
  const comments = [];

  if (post.__typename === "TimelineItem" && post.comments) {
    return post.comments.map(processComment);
  }

  if (post.__typename === "FeedItem" && post.comments) {
    return post.comments.filter((comment: any) => comment.commentOn?.id === post.root?.id).map(processComment);
  }

  return comments;
}

function processComment(comment: any) {
  return {
    id: comment.slug ?? comment.id,
    author: comment.by ? lensAccountToUser(comment.by) : null,
    createdAt: new Date(comment.createdAt),
    updatedAt: new Date(comment.createdAt),
    comments: [],
    reactions: getReactions(comment),
    metadata: comment.metadata,
    isEdited: comment.isEdited || false,
    platform: "lens",
    __typename: "Post" as const,
  };
}

function getCommentOnFromItem(origin: LensPost) {
  if (!origin) return undefined;
  if (origin.__typename === "Post" && (origin as any).commentOn) {
    return lensItemToPost((origin as any).commentOn);
  }
  return undefined;
}

function getQuoteOnFromItem(origin: LensPost) {
  if (!origin) return undefined;
  if (origin.__typename === "Post" && origin.quoteOf) {
    return lensItemToPost(origin.quoteOf);
  }
  return undefined;
}

function getReplyFromItem(origin: LensPost) {
  if (!origin) return undefined;

  const commentOn = getCommentOnFromItem(origin);
  if (commentOn) return commentOn;

  const quoteOn = getQuoteOnFromItem(origin);
  if (quoteOn) return quoteOn;

  return undefined;
}

function getMentionsFromItem(post: any): PostMention[] | undefined {
  if (!post.mentions || !Array.isArray(post.mentions)) return undefined;

  return post.mentions
    .map((mention: any) => {
      if (mention.__typename === "AccountMention") {
        return {
          __typename: "AccountMention",
          account: mention.account,
          namespace: mention.namespace,
          localName: mention.localName,
          replace: mention.replace,
        };
      }
      if (mention.__typename === "GroupMention") {
        return {
          __typename: "GroupMention",
          group: mention.group,
        };
      }
      return null;
    })
    .filter(Boolean);
}
