const ACCESSORY_RULES = [
  {
    match: /(phone|mobile|smartphone|iphone|android)/i,
    suggest: /(charger|cable|case|cover|tempered|screen guard|earbuds|power bank)/i,
  },
  {
    match: /(laptop|notebook|macbook)/i,
    suggest: /(bag|sleeve|mouse|keyboard|stand|adapter|dock)/i,
  },
  {
    match: /(camera)/i,
    suggest: /(tripod|sd card|memory card|lens|bag|battery)/i,
  },
  {
    match: /(shoe|sneaker|footwear)/i,
    suggest: /(socks|insole|cleaner|laces)/i,
  },
];

const textOf = (product) =>
  [
    product?.title,
    product?.name,
    product?.category,
    product?.categoryId,
    product?.subcategory,
    product?.tags?.join?.(" "),
    product?.description,
  ]
    .filter(Boolean)
    .join(" ");

export const scoreRelatedProduct = (base, candidate) => {
  if (!base || !candidate || base.id === candidate.id) return -1;
  let score = 0;
  const baseCat = String(base.categoryId || base.category || "").toLowerCase();
  const cCat = String(candidate.categoryId || candidate.category || "").toLowerCase();
  if (baseCat && cCat && baseCat === cCat) score += 25;
  if (
    String(base.subcategory || "").toLowerCase() &&
    String(base.subcategory || "").toLowerCase() ===
      String(candidate.subcategory || "").toLowerCase()
  ) {
    score += 20;
  }

  const baseText = textOf(base);
  const candidateText = textOf(candidate);
  ACCESSORY_RULES.forEach((rule) => {
    if (rule.match.test(baseText) && rule.suggest.test(candidateText)) {
      score += 40;
    }
  });

  score += Math.min(15, Number(candidate.orderedCount || 0) / 25);
  score += Math.min(10, Number(candidate.ratingCount || 0) / 20);
  score += Math.min(5, Number(candidate.rating || 0));
  return score;
};

export const frequentlyBoughtTogether = (base, allProducts, limit = 4) => {
  const list = (allProducts || [])
    .filter((p) => p?.id && p.id !== base?.id)
    .map((p) => ({ ...p, __score: scoreRelatedProduct(base, p) }))
    .filter((p) => p.__score > 0)
    .sort((a, b) => b.__score - a.__score)
    .slice(0, limit)
    .map(({ __score, ...rest }) => rest);
  return list;
};
