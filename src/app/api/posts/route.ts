import { PageSize, PostType } from "@lens-protocol/client";
import { deletePost, fetchPosts, post } from "@lens-protocol/client/actions";
import { type NextRequest, NextResponse } from "next/server";
import { lensItemToPost } from "~/components/post/Post";
import { getServerAuth } from "~/utils/getServerAuth";
import { storageClient } from "~/utils/lens/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor") || undefined;
  const type = searchParams.get("type") || "post";
  const address = searchParams.get("address") || undefined;

  try {
    const { client, sessionClient, isAuthenticated, profileId } = await getServerAuth();

    let postTypes: PostType[];

    switch (type) {
      case "comment":
        postTypes = [PostType.Comment];
        break;
      case "repost":
        postTypes = [PostType.Repost];
        break;
      case "quote":
        postTypes = [PostType.Quote];
        break;
      case "main":
        postTypes = [PostType.Root, PostType.Repost, PostType.Quote];
        break;
      case "all":
        postTypes = [PostType.Root, PostType.Comment, PostType.Repost, PostType.Quote];
        break;
      default:
        postTypes = [PostType.Root];
    }

    const filter: any = { postTypes };
    if (address) {
      filter.authors = [address];
    } else {
      filter.feeds = [{ globalFeed: true }];
    }

    const data = await fetchPosts(client, {
      filter,
      cursor,
      pageSize: PageSize.Ten,
    });

    if (data.isErr()) {
      return NextResponse.json({ error: data.error.message }, { status: 500 });
    }

    const posts = data.value.items
      .map((item) => lensItemToPost(item))
      .filter((post) => {
        if (!post) return false;
        if (searchParams.get("media") !== "true") return true;
        const type = post.metadata?.__typename;
        return type === "ImageMetadata" || type === "VideoMetadata";
      });

    return NextResponse.json({ data: posts, nextCursor: data.value.pageInfo.next }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch feed: ", error);
    return NextResponse.json({ error: `Failed to fetch feed: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = searchParams.get("id") || undefined;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const { client, isAuthenticated, profileId } = await getServerAuth();

    if (!isAuthenticated) {
      throw new Error("Not authenticated");
    }

    if (!client.isSessionClient()) {
      throw new Error("Not authenticated with a session client");
    }

    const result = await deletePost(client, { post: id });

    if (result && typeof result.unwrapOr === "function") {
      const unwrapped = result.unwrapOr(null);
      if (!unwrapped) {
        throw new Error("Failed to delete post");
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: `Failed to delete post: ${error.message}` }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const replyingTo = searchParams.get("replyingTo") || undefined;

    const data = await parseRequestBody(req);

    const { client, handle, profileId } = await getServerAuth();

    if (!profileId) {
      throw new Error("Not authenticated");
    }

    if (!client.isSessionClient()) {
      throw new Error("Not authenticated with a session client");
    }

    const contentUri = await uploadMetadata(data, handle);
    const postResult = await createPost(client, contentUri, replyingTo);

    if (postResult && typeof postResult.unwrapOr === "function") {
      const unwrapped = postResult.unwrapOr(null);
      if (!unwrapped) {
        throw new Error("Failed to create post");
      }

      if (unwrapped.__typename === "LensProfileManagerRelayError") {
        throw new Error(unwrapped.reason);
      }

      if (unwrapped.__typename === "RelaySuccess") {
        const { txId: id, txHash: hash } = unwrapped;
        const date = new Date().toISOString();
        console.log(`${handle} created a post: ${id}, hash: ${hash}, ipfs: ${contentUri}, date: ${date}`);
        return NextResponse.json({ id, hash }, { status: 200, statusText: "Success" });
      }

      return NextResponse.json({ id: unwrapped.id }, { status: 200, statusText: "Success" });
    }

    throw new Error("Unknown error occurred");
  } catch (error) {
    console.error("Failed to create a post: ", error);
    return NextResponse.json({ error: `Failed to create a post: ${error.message}` }, { status: 500 });
  }
}

async function parseRequestBody(req: NextRequest) {
  const data = await req.json().catch(() => null);
  if (!data) {
    throw new Error("Bad Request: Invalid JSON body");
  }
  return data;
}

async function uploadMetadata(data: any, handle: string) {
  try {
    const metadataFile = new File([JSON.stringify(data)], "metadata.json", { type: "application/json" });

    const { uri } = await storageClient.uploadFile(metadataFile);

    if (!uri) {
      throw new Error("Failed to upload metadata");
    }

    console.log(`Uploaded metadata for ${handle} to ${uri}`);
    return uri;
  } catch (error) {
    console.error("Error uploading metadata:", error);
    throw new Error(`Failed to upload metadata: ${error.message}`);
  }
}

async function createPost(client, contentUri, replyingTo) {
  if (replyingTo) {
    return await post(client, {
      contentUri,
      commentOn: {
        post: replyingTo,
      },
    });
  }
  return await post(client, { contentUri });
}
