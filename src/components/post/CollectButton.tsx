"use client";

import type { Post } from "@cartel-sh/ui";
import { SparklesIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useUser } from "~/components/user/UserContext";
import { useExplosion } from "../ExplosionPortal";
import { ReactionButton } from "../ReactionButton";
import { CollectModal } from "./CollectModal";

interface CollectButtonProps {
  post: Post;
  variant?: "post" | "comment";
}

export function CollectButton({ post, variant = "post" }: CollectButtonProps) {
  const { requireAuth } = useUser();
  const { triggerExplosion } = useExplosion();
  const collectButtonRef = useRef<HTMLSpanElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  // Check if post has collect action enabled
  const hasCollectAction = (post as any).actions?.canCollect || false;
  const collectStats = (post as any).stats?.collects || 0;
  const hasCollected = (post as any).actions?.hasCollected || false;

  if (!hasCollectAction) {
    return null;
  }

  const handleCollectClick = async () => {
    if (!requireAuth()) return;
    
    // Show modal for collect confirmation
    setIsModalOpen(true);
  };

  const handleCollect = async () => {
    setIsCollecting(true);
    
    try {
      const response = await fetch(`/api/posts/${post.id}/collect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.result) {
        throw new Error(data.message || data.error || "Failed to collect");
      }

      // Only trigger animation and success if actually collected
      if (data.result && collectButtonRef.current && !hasCollected) {
        triggerExplosion("collect", collectButtonRef.current);
        toast.success("Post collected successfully!");
        setIsModalOpen(false);
      }
    } catch (error: any) {
      console.error("Failed to collect:", error);
      toast.error(error.message || "Failed to collect post");
    } finally {
      setIsCollecting(false);
    }
  };

  return (
    <>
      <span ref={collectButtonRef}>
        <ReactionButton
          variant={variant}
          reactionType="Collect"
          reaction={{
            count: collectStats,
            isActive: hasCollected,
          }}
          icon={<SparklesIcon className="w-4 h-4" />}
          onClick={handleCollectClick}
        />
      </span>
      
      {isModalOpen && (
        <CollectModal
          post={post}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCollect={handleCollect}
          isCollecting={isCollecting}
          hasCollected={hasCollected}
        />
      )}
    </>
  );
}