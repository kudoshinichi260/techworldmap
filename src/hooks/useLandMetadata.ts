import { useEffect, useState } from "react";
import { fetchLandMetadata, type SheetRow } from "../api/landMetadata";

export function useLandMetadata() {
  const [data, setData] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLandMetadata()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}

