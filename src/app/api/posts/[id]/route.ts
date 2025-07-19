import { fetchPost } from "@lens-protocol/client/actions";
import { type NextRequest, NextResponse } from "next/server";
import { getServerAuth } from "~/utils/getServerAuth";
import { lensItemToPost } from "~/utils/lens/converters/postConverter";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    const { client } = await getServerAuth();

    const result = await fetchPost(client, {
      post: id,
    });

    if (result.isErr()) {
      return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
    }

    const lensPost = result.value;
    const nativePost = lensItemToPost(lensPost);

    return NextResponse.json({ lensPost, nativePost }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch post: ", error);
    return NextResponse.json({ error: `Failed to fetch post: ${error.message}` }, { status: 500 });
  }
}
