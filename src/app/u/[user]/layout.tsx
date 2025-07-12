import { fetchAccountStats } from "@lens-protocol/client/actions";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { UserNavigation } from "~/components/user/UserNavigation";
import { UserProfile } from "~/components/user/UserProfile";
import { getServerAuth } from "~/utils/getServerAuth";
import { getUserByUsername } from "~/utils/getUserByHandle";

export const maxDuration = 60;
export const revalidate = 0;
export const dynamic = "force-dynamic";

async function UserProfileSection({ handle }: { handle: string }) {
  const user = await getUserByUsername(handle);
  if (!user) return notFound();

  const { client } = await getServerAuth();
  const stats = await fetchAccountStats(client, { account: user.address }).unwrapOr(null);

  return (
    <>
      <UserProfile user={user} stats={stats} />
      <UserNavigation handle={handle} />
    </>
  );
}

function UserProfileSkeleton() {
  return (
    <>
      {/* UserProfile skeleton - matching the actual component structure */}
      <div className="p-6 z-20 flex w-full flex-col gap-4 glass drop-shadow-md mt-4 rounded-xl overflow-hidden">
        <div className="flex flex-row gap-4">
          <div className="flex shrink-0 grow-0 w-12 h-12 sm:w-24 sm:h-24 self-start">
            <Skeleton className="w-full h-full rounded-full" />
          </div>

          <div className="flex flex-col gap-2 flex-grow">
            <div className="flex flex-col justify-center gap-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 sm:h-8 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-sm">
                <Skeleton className="h-4 w-full max-w-md" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
              <div className="flex justify-start">
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile or Follow/Mention buttons */}
        <Skeleton className="h-9 w-full" />
      </div>
      {/* UserNavigation skeleton */}
      <nav className="sticky top-3 w-fit max-w-2xl mx-auto glass border border-muted rounded-xl z-[40] flex flex-row justify-start items-start gap-2 p-1">
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-28 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
        <Skeleton className="h-10 w-16 rounded-lg" />
      </nav>
    </>
  );
}

export default function layout({ children, params }: { children: React.ReactNode; params: { user: string } }) {
  return (
    <div className="flex flex-col gap-2 p-4 py-0 overflow-x-hidden">
      <Suspense fallback={<UserProfileSkeleton />}>
        <UserProfileSection handle={params.user} />
      </Suspense>

      <div className="z-[30]">{children}</div>
    </div>
  );
}
