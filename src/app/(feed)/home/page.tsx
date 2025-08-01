import type { Metadata } from "next";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";

export const metadata: Metadata = {
  title: "Home",
  description: "Box feed",
  openGraph: {
    title: "Home",
    description: "Box feed",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const endpoint = "api/posts/feed";

const home = async () => {
  return <Feed ItemView={PostView} endpoint={endpoint} />;
};

export default home;
