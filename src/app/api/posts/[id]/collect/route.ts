import { postId } from "@lens-protocol/client";
import { executePostAction, fetchPost } from "@lens-protocol/client/actions";
import { handleOperationWith } from "@lens-protocol/client/viem";
import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "~/utils/getServerAuth";
import { getLensClient } from "~/utils/lens/getLensClient";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "Missing publication id" }, { status: 400 });
  }

  try {
    const { sessionClient } = await getServerAuth();

    if (!sessionClient) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const postResult = await fetchPost(sessionClient, {
      post: postId(id),
    });

    if (postResult.isErr()) {
      return NextResponse.json({ error: "Failed to fetch post", result: false }, { status: 500 });
    }

    const publication = postResult.value;

    // Check if the post is a repost (previously called Mirror)
    if (publication.__typename === "Repost") {
      return NextResponse.json({ error: "Cannot collect a repost publication", result: false }, { status: 400 });
    }

    // Check if the post has collect enabled
    const collectDetails = publication.actions?.find(
      (action: any) => action.__typename === "SimpleCollectAction"
    ) as any;
    
    if (!collectDetails) {
      console.log("Post actions:", publication.actions);
      console.log("Post operations:", publication.operations);
      return NextResponse.json({ error: "This post cannot be collected. The author has not enabled collect on this post.", result: false }, { status: 400 });
    }

    // Check if user has already collected
    if (publication.operations?.hasSimpleCollected) {
      return NextResponse.json({ error: "You have already collected this post", result: false }, { status: 400 });
    }

    // Check if collect limit is reached
    if (collectDetails?.collectLimit && publication.stats?.collects >= collectDetails.collectLimit) {
      return NextResponse.json({ error: "Collect limit reached", result: false }, { status: 400 });
    }

    // Check if collect period has ended
    if (collectDetails?.endsAt && new Date(collectDetails.endsAt) < new Date()) {
      return NextResponse.json({ error: "Collect period has ended", result: false }, { status: 400 });
    }

    // Execute the collect action
    try {
      const result = await executePostAction(sessionClient, {
        post: postId(id),
        action: {
          simpleCollect: {
            selected: true,
          },
        },
      });

      if (result.isErr()) {
        console.error("Failed to execute collect action:", result.error);
        
        // Check if it's an insufficient balance error
        const errorMessage = result.error.message || "Failed to execute collect action";
        if (errorMessage.includes("Not enough balance") || errorMessage.includes("insufficient")) {
          return NextResponse.json(
            { 
              error: errorMessage,
              insufficientBalance: true,
              result: false 
            }, 
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { 
            error: errorMessage,
            result: false 
          }, 
          { status: 500 }
        );
      }

      // Return the transaction result for the client to handle with wallet
      return NextResponse.json(
        {
          result: result.value,
          message: "Collect action initiated successfully",
          needsWalletSignature: true,
          collectDetails: {
            price: collectDetails?.payToCollect?.amount,
            collectLimit: collectDetails?.collectLimit,
            endsAt: collectDetails?.endsAt,
            followersOnly: collectDetails?.followerOnly,
            totalCollected: publication.stats?.collects || 0,
          },
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error executing collect action:", error);
      return NextResponse.json(
        { 
          error: error.message || "Failed to execute collect action",
          result: false 
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Failed to collect post: ", error.message);
    return NextResponse.json({ error: `${error.message}`, result: false }, { status: 500 });
  }
}
