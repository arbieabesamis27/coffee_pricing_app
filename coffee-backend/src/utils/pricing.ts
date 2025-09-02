export const unitPrice = (price: number, contentSize: number) => {
  if (!contentSize || contentSize <= 0) return 0; // avoid division by zero
  return price / contentSize;
};

export const computeVariantPricing = (variant: any) => {
  const baseCost = (variant.ingredients ?? []).reduce(
    (total: number, ing: any) => {
      const up = unitPrice(ing.ingredient.price, ing.ingredient.contentSize);
      return total + ing.quantity * up;
    },
    0
  );

  const finalPrice = baseCost + (variant.profit ?? 0);
  return { baseCost, finalPrice };
};
