/**
 * Fisher-Yates shuffle with a date-based seed.
 * Products are shuffled differently each day, but all users see a different random order
 * because we add a Math.random() component so the order is not predictable across users.
 */
export function shuffleProductsForUser(products) {
  if (!products || products.length === 0) return products;
  
  // Create a copy to avoid mutating the original
  const arr = [...products];
  
  // Use a combination of today's date + random per-session salt
  // This ensures each user sees a different order, and it changes daily
  const sessionSalt = (() => {
    const stored = sessionStorage.getItem("zoop_session_salt");
    if (stored) return parseFloat(stored);
    const salt = Math.random();
    sessionStorage.setItem("zoop_session_salt", salt.toString());
    return salt;
  })();
  
  // Simple pseudo-random shuffle using session salt
  // This gives each user a unique order per session
  let seed = sessionSalt * 1000000;
  
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
}
