import { Metadata } from "next";
import { Suspense } from "react";
import { FeedSuspense } from "~/components/FeedSuspense";
import Groups from "~/components/Groups";

export const metadata: Metadata = {
  title: "Communities",
  description: "Discover and join communities on Box",
};

export default function GroupsPage({ searchParams }: { searchParams?: { q?: string } }) {
  const query = searchParams?.q || "";

  return (
    <div className="p-4">
      <Suspense fallback={<FeedSuspense />}>
        <Groups initialQuery={query} />
      </Suspense>
    </div>
  );
}
