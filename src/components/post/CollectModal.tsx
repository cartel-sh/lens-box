"use client";

import type { Post } from "@cartel-sh/ui";
import { CalendarIcon, CoinsIcon, CopyIcon, HashIcon, SparklesIcon, TrendingUpIcon, UsersIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  insufficientBalance?: boolean;
}

export function CollectModal({
  post,
  isOpen,
  onClose,
  onCollect,
  isCollecting,
  hasCollected,
  insufficientBalance = false,
}: CollectModalProps) {
  const collectDetails = (post as any).actions?.collectDetails || {};
  
  const price = collectDetails.price;
  const collectLimit = collectDetails.collectLimit;
  const endsAt = collectDetails.endsAt;
  const followersOnly = collectDetails.followersOnly;
  const totalCollected = (post as any).stats?.collects || 0;
  const collectNftAddress = collectDetails.collectNftAddress;
  
  const getPostMedia = () => {
    const metadata = post.metadata as any;
    if (!metadata) return null;
    
    if (metadata.__typename === "ImageMetadata" && metadata.image?.item) {
      return metadata.image.item;
    }
    
    if (metadata.__typename === "VideoMetadata" && metadata.video?.cover) {
      return metadata.video.cover;
    }
    
    if (metadata.attachments && Array.isArray(metadata.attachments)) {
      const imageAttachment = metadata.attachments.find((att: any) => 
        att.item && att.type && att.type.startsWith("image/")
      );
      if (imageAttachment) {
        return imageAttachment.item;
      }
    }
    
    return null;
  };
  
  const postImage = getPostMedia();

  const formatPrice = (price: any) => {
    if (!price || !price.amount) return "Free";
    const currency = price.currency || "GHO";
    return `${price.amount} ${currency}`;
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

  const calculateRevenue = () => {
    if (!price || !price.amount || totalCollected === 0) return null;
    const revenue = (parseFloat(price.amount) * totalCollected).toFixed(2);
    return `${revenue} ${price.currency || "GHO"}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard");
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Collect Post
          </DialogTitle>
          <DialogDescription>
            Add this post to your collection and support the creator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              <UserAvatar user={post.author} link={false} card={false} />
            </div>
            <div className="flex-1">
              <p className="font-bold">{post.author.username}</p>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {post.metadata?.content || ""}
              </p>
            </div>
          </div>

          {postImage && (
            <div className="relative w-full rounded-lg overflow-hidden bg-muted">
              <img
                src={postImage}
                alt="Post media"
                className="w-full h-auto max-h-[200px] object-cover"
              />
            </div>
          )}

          <div className="space-y-3 rounded-lg border p-4">
            <h4 className="font-medium text-sm">Collection Details</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <UsersIcon className="w-4 h-4" />
                  Collectors
                </span>
                <span className="font-medium">{totalCollected}</span>
              </div>

              {collectLimit && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <SparklesIcon className="w-4 h-4" />
                    Edition
                  </span>
                  <span className="font-medium">
                    {totalCollected} / {collectLimit}
                  </span>
                </div>
              )}

              {calculateRevenue() && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <TrendingUpIcon className="w-4 h-4" />
                    Revenue
                  </span>
                  <span className="font-medium">{calculateRevenue()}</span>
                </div>
              )}

              {collectNftAddress && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HashIcon className="w-4 h-4" />
                    Token Address
                  </span>
                  <button
                    onClick={() => copyToClipboard(collectNftAddress)}
                    className="flex items-center gap-1 font-mono text-xs hover:text-primary transition-colors"
                  >
                    <span>{formatAddress(collectNftAddress)}</span>
                    <CopyIcon className="w-3 h-3" />
                  </button>
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
                  A 1.5% protocol fee will be applied to the collection
                </p>
              </div>
            )}
          </div>

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

          {insufficientBalance && !hasCollected && (
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Insufficient balance. You need {formatPrice(price)} to collect this post.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onCollect} disabled={!canCollect || isCollecting || insufficientBalance} className="w-full">
            {isCollecting ? (
              <>
                <LoadingSpinner />
                <span>Collecting...</span>
              </>
            ) : hasCollected ? (
              "Already Collected"
            ) : insufficientBalance ? (
              "Insufficient Balance"
            ) : (
              `Collect ${price?.amount ? `for ${formatPrice(price)}` : "for Free"}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}