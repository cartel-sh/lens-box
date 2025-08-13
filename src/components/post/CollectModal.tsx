"use client";

import type { Post } from "@cartel-sh/ui";
import { CalendarIcon, CoinsIcon, SparklesIcon, UsersIcon } from "lucide-react";
import { LoadingSpinner } from "../LoadingSpinner";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { UserAvatar } from "../user/UserAvatar";

interface CollectModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onCollect: () => void;
  isCollecting: boolean;
  hasCollected: boolean;
}

export function CollectModal({
  post,
  isOpen,
  onClose,
  onCollect,
  isCollecting,
  hasCollected,
}: CollectModalProps) {
  // Extract collect details from post (this would come from the post data)
  const collectDetails = (post as any).actions?.collectDetails || {};
  const price = collectDetails.price;
  const collectLimit = collectDetails.collectLimit;
  const endsAt = collectDetails.endsAt;
  const followersOnly = collectDetails.followersOnly;
  const totalCollected = (post as any).stats?.collects || 0;

  const formatPrice = (price: any) => {
    if (!price) return "Free";
    return `${price.amount} ${price.currency}`;
  };

  const formatEndDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isLimitReached = collectLimit && totalCollected >= collectLimit;
  const isExpired = endsAt && new Date(endsAt) < new Date();
  const canCollect = !hasCollected && !isLimitReached && !isExpired;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            Collect Post
          </DialogTitle>
          <DialogDescription>
            Collect this post as an NFT to support the creator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <UserAvatar user={post.author} />
            <div className="flex-1">
              <p className="font-medium">@{post.author.username}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {post.metadata?.content || ""}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <h4 className="font-medium text-sm">Collection Details</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <CoinsIcon className="w-4 h-4" />
                  Price
                </span>
                <span className="font-medium">{formatPrice(price)}</span>
              </div>

              {collectLimit && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <SparklesIcon className="w-4 h-4" />
                    Edition
                  </span>
                  <span className="font-medium">
                    {totalCollected} / {collectLimit} collected
                  </span>
                </div>
              )}

              {endsAt && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    Ends
                  </span>
                  <span className="font-medium text-xs">{formatEndDate(endsAt)}</span>
                </div>
              )}

              {followersOnly && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <UsersIcon className="w-4 h-4" />
                  <span className="text-xs">Followers only</span>
                </div>
              )}
            </div>

            {price && price.amount && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  A 1.5% protocol fee will be applied to the collection price
                </p>
              </div>
            )}
          </div>

          {hasCollected && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ You've already collected this post
              </p>
            </div>
          )}

          {isLimitReached && !hasCollected && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Collection limit reached
              </p>
            </div>
          )}

          {isExpired && !hasCollected && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                Collection period has ended
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isCollecting}>
            Cancel
          </Button>
          <Button onClick={onCollect} disabled={!canCollect || isCollecting}>
            {isCollecting ? (
              <>
                <LoadingSpinner />
                <span>Collecting...</span>
              </>
            ) : hasCollected ? (
              "Already Collected"
            ) : (
              <>
                <SparklesIcon className="w-4 h-4 mr-1" />
                Collect {price?.amount ? `for ${formatPrice(price)}` : "for Free"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}