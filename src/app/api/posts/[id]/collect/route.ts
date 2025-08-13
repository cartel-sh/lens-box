import { fetchPost } from "@lens-protocol/client/actions";
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
      post: id,
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
      return NextResponse.json({ error: "Post does not have collect enabled", result: false }, { status: 400 });
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

    // TODO: When the Lens SDK supports executePostAction/actOn, replace this with actual implementation
    // For now, we'll return a success response for testing the UI
    
    // In production, this would be:
    // const result = await executePostAction(sessionClient, {
    //   action: { simpleCollect: true },
    //   post: id,
    // });
    // 
    // if (result.isErr()) {
    //   return NextResponse.json({ error: result.error.message }, { status: 500 });
    // }
    // 
    // const txResult = await handleOperationWith(walletClient)(result.value);
    // await sessionClient.waitForTransaction(txResult.value);

    return NextResponse.json(
      {
        result: false,
        error: "Collect functionality is pending Lens SDK executePostAction support",
        message: "The collect feature is not yet functional. Waiting for Lens Protocol SDK update.",
        collectDetails: {
          price: collectDetails?.payToCollect?.native || collectDetails?.payToCollect?.erc20,
          collectLimit: collectDetails?.collectLimit,
          endsAt: collectDetails?.endsAt,
          followersOnly: collectDetails?.followerOnly,
          totalCollected: publication.stats?.collects || 0,
        },
      },
      { status: 501 }, // 501 Not Implemented
    );
  } catch (error) {
    console.error("Failed to collect post: ", error.message);
    return NextResponse.json({ error: `${error.message}`, result: false }, { status: 500 });
  }
}
