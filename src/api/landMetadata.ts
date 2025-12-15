const API_URL =
  "https://opensheet.elk.sh/1DcpcSHAbXDvCdXF42lqrAVx2Sn3U07YYwtaffaX2iKo/MamauHTSDdat";

export type SheetRow = {
  "Mã"?: string;
  "Loại đất"?: string;
  "undefined"?: string; // màu
};

export async function fetchLandMetadata(): Promise<SheetRow[]> {
  const res = await fetch(API_URL);

  if (!res.ok) {
    throw new Error("Failed to fetch land metadata");
  }
  return res.json();
}
