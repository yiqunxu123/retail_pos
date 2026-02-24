/**
 * Products Screen - Redirects to unified Inventory & Stock page
 */

import { Redirect, useLocalSearchParams } from "expo-router";

export default function ProductsScreen() {
  const params = useLocalSearchParams<{ openAddProduct?: string }>();
  const openAddProduct = params.openAddProduct;
  return (
    <Redirect
      href={
        openAddProduct
          ? { pathname: "/inventory/stocks", params: { openAddProduct: String(openAddProduct) } }
          : "/inventory/stocks"
      }
    />
  );
}
