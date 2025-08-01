import { PostReferenceType } from "@lens-protocol/client";
import { fetchPost, fetchPostReferences } from "@lens-protocol/client/actions";
import type { Metadata } from "next";
import { PostThread } from "~/components/post/PostThread";
import { getServerAuth } from "~/utils/getServerAuth";
import { lensItemToPost } from "~/utils/lens/converters/postConverter";

/**
 * This route resolves to universal id of the post passed in the [slug]
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { client } = await getServerAuth();

  const id = params.slug;
  const post = await fetchPost(client, {
    post: id,
  })
    .unwrapOr(null)
    .then((data) => lensItemToPost(data))
    .catch(() => {
      throw new Error("(╥_╥) Post not found");
    });

  const handle = post.author.username;
  const content = "content" in post.metadata ? (post.metadata.content as string) : "";
  const title = `${handle}'s post`;
  const ending = content.length > 300 ? "..." : "";

  let image: string | undefined;
  const metadata = post.metadata as any;
  switch (metadata?.__typename) {
    case "ImageMetadata":
      image = metadata?.image?.item;
      break;
    case "VideoMetadata":
      image = metadata?.video?.cover;
      break;
    case "AudioMetadata":
      image = metadata?.audio?.cover;
      break;
    default:
      image = undefined;
  }

  const profilePictureUrl = post.author.profilePictureUrl;

  const ogImageURL = `${process.env.NEXT_PUBLIC_SITE_URL}og/post?handle=${handle}&content=${encodeURIComponent(
    content,
  )}${image ? `&image=${encodeURIComponent(image)}` : ""}${profilePictureUrl ? `&profilePictureUrl=${encodeURIComponent(profilePictureUrl)}` : ""}`;

  return {
    title,
    description: `${content.slice(0, 300)}${ending}`,
    openGraph: {
      type: "article",
      title,
      description: `${content.slice(0, 300)}${ending}`,
      images: [
        {
          url: ogImageURL,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

const post = async ({ params }: { params: { slug: string } }) => {
  const { client } = await getServerAuth();

  const id = params.slug;
  const lensPost = await fetchPost(client, {
    post: id,
  })
    .unwrapOr(null)
    .then((data) => lensItemToPost(data))
    .catch(() => {
      throw new Error("(╥_╥) Post not found");
    });

  if (!lensPost) throw new Error("(╥_╥) Post not found");

  const lensComments = await fetchPostReferences(client, {
    referenceTypes: [PostReferenceType.CommentOn],
    referencedPost: id,
  })
    .unwrapOr(null)
    .then((data) => data.items.map((item) => lensItemToPost(item)))
    .catch(() => {
      throw new Error("(╥_╥) Comments not found");
    });

  lensPost.comments = lensComments;

  return <PostThread post={lensPost} />;
};

export default post;
