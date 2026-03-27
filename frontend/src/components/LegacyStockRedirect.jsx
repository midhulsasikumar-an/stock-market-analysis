import React from "react";
import { Navigate, useParams } from "react-router-dom";

export default function LegacyStockRedirect() {
  const { symbol } = useParams();
  return <Navigate to={`/stock/${symbol}`} replace />;
}
