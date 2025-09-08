import { lensAccountToUser } from "~/utils/lens/converters/userConverter";
import { useAccounts as useLensAccounts } from "@lens-protocol/react";

export function useAccountSearch(query?: string) {
  const result = useLensAccounts({
    filter: query
      ? {
          searchBy: { localNameQuery: query },
        }
      : undefined,
  });

  return {
    ...result,
    data: result.data?.items?.map(lensAccountToUser),
  };
}
