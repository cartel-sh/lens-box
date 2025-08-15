"use client";

import type { Post } from "@cartel-sh/ui";
import { chains } from "@lens-chain/sdk/viem";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { postId } from "@lens-protocol/client";
import { executePostAction } from "@lens-protocol/client/actions";
import { ExternalLinkIcon, ShoppingBag } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useAccount, useSwitchChain, useWalletClient } from "wagmi";
import { useUser } from "~/components/user/UserContext";
import { useExplosion } from "../ExplosionPortal";
import { ReactionButton } from "../ReactionButton";
import { CollectModal } from "./CollectModal";
import { getLensClient } from "~/utils/lens/getLensClient";
import { Button } from "../ui/button";

interface CollectButtonProps {
  post: Post;
  variant?: "post" | "comment";
}

export function CollectButton({ post, variant = "post" }: CollectButtonProps) {
  const { requireAuth } = useUser();
  const { triggerExplosion } = useExplosion();
  const { data: walletClient } = useWalletClient();
  const { chain, isConnected } = useAccount();
  const { switchChainAsync, chains: availableChains } = useSwitchChain();
  const collectButtonRef = useRef<HTMLSpanElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

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
      // Check if we're on the correct chain (Lens Mainnet: 232)
      const LENS_CHAIN_ID = chains.mainnet.id; // 232

      // Get current chain from wallet client if chain from useAccount is undefined
      let currentChainId = chain?.id;
      if (!currentChainId && walletClient) {
        currentChainId = await walletClient.getChainId();
      }

      // Check if we need to switch chains
      if (isConnected && currentChainId && currentChainId !== LENS_CHAIN_ID) {
        try {
          toast.info("Switching to Lens Network...");
          await switchChainAsync({ chainId: LENS_CHAIN_ID });
          // Wait longer for the switch to fully complete and wallet client to update
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (switchError: any) {
          console.error("Chain switch error:", switchError);
          // User rejected the chain switch
          if (switchError?.code === 4001 || switchError?.message?.includes("User rejected")) {
            toast.error("Please switch to Lens Network to collect");
            setIsCollecting(false);
            return;
          }
          // Chain not added to wallet
          if (switchError?.code === 4902 || switchError?.message?.includes("Unrecognized chain")) {
            toast.error("Please add Lens Network to your wallet");
            setIsCollecting(false);
            return;
          }
          // Other errors
          toast.error("Failed to switch network. Please switch manually to Lens Network.");
          setIsCollecting(false);
          return;
        }
      }

      const client = await getLensClient();
      if (!client || !client.isSessionClient()) {
        toast.error("Not authenticated");
        setIsCollecting(false);
        return;
      }

      if (!walletClient) {
        toast.error("Connect your wallet to collect");
        setIsCollecting(false);
        return;
      }

      const postIdForCollect = (post as any).numericId || post.id;
      const result = await executePostAction(client, {
        post: postId(postIdForCollect),
        action: {
          simpleCollect: {
            selected: true,
          },
        },
      });

      if (result.isErr()) {
        const errorMessage = result.error.message || "Failed to execute collect action";
        if (errorMessage.includes("Not enough balance") || errorMessage.includes("insufficient")) {
          setInsufficientBalance(true);
          toast.error("Insufficient balance", {
            description: "You don't have enough funds to collect this post. Please add funds to your wallet and try again.",
          });
          setIsCollecting(false);
          return;
        }
        throw new Error(errorMessage);
      }

      const txResult = await handleOperationWith(walletClient as any)(result.value);

      if (txResult.isErr()) {
        throw new Error(txResult.error.message || "Transaction failed");
      }

      if (collectButtonRef.current && !hasCollected) {
        triggerExplosion("collect", collectButtonRef.current);
      }

      const txHash = txResult.value;
      const explorerUrl = `https://lenscan.io/tx/${txHash}`;

      toast.success(
        <div className="flex items-center gap-2">
          <span>Post collected successfully!</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <span>View</span>
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>
      );

      setIsModalOpen(false);
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
        {/* <ReactionButton
          variant={variant}
          reactionType="Collect"
          reaction={{
            count: collectStats,
            isActive: hasCollected,
          }}
          icon={
            <ShoppingBag
              size={variant === "post" ? 18 : 16}
              strokeWidth={2.0}
              stroke={hasCollected ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
              fill="none"
              className="transition-all duration-200"
            />
          }
          onClick={handleCollectClick}
        /> */}
        <Button size="sm" className="text-sm h-8 font-medium" onClick={handleCollectClick}>
          Collect
        </Button>
      </span>

      {isModalOpen && (
        <CollectModal
          post={post}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setInsufficientBalance(false);
          }}
          onCollect={handleCollect}
          isCollecting={isCollecting}
          hasCollected={hasCollected}
          insufficientBalance={insufficientBalance}
        />
      )}
    </>
  );
}