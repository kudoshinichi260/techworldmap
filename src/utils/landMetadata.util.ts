import type { SheetRow } from "../api/landMetadata";

export function findMetadataByCode(
  maloaidat: string,
  data: SheetRow[]
) {
  if (!maloaidat) return;

  const code = maloaidat.trim().toLowerCase();
  return data.find(
    row => row["Mã"]?.trim().toLowerCase() === code
  )?.["Loại đất"];
}
