import { useCallback, useEffect, useState } from "react";
import api from "../api/api.js";

export function useVendors() {
  const [vendors,  setVendors]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    api.get("/api/vendors")
      .then((res) => setVendors(res.data?.data || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  return { vendors, loading, reload };
}
