import type { PropsWithChildren } from "react";
import { getCookieAuth } from "~/utils/getCookieAuth";

export async function ServerSignedIn(props: PropsWithChildren) {
  const { isValid: isAuthenticated } = getCookieAuth();

  if (!isAuthenticated) {
    return null;
  }

  return <>{props.children}</>;
}

export async function ServerSignedOut(props: PropsWithChildren) {
  const { isValid: isAuthenticated } = getCookieAuth();

  if (isAuthenticated) {
    return null;
  }

  return <>{props.children}</>;
}
