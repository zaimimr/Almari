export const categories = [
  { id: "hijab", label: "Hijabs & scarves" },
  { id: "top", label: "Tops" },
  { id: "tunic", label: "Kurtas & tunics" },
  { id: "bottom", label: "Trousers & skirts" },
  { id: "dress", label: "Dresses & abayas" },
  { id: "layer", label: "Layers" },
  { id: "shoes", label: "Shoes" },
  { id: "bag", label: "Bags" },
  { id: "accessory", label: "Accessories" },
] as const;

export type Category = (typeof categories)[number]["id"];

export const styleOptions = [
  { id: "western", label: "Western" },
  { id: "desi", label: "Desi" },
] as const;

export type Style = (typeof styleOptions)[number]["id"];

const desi = ["desi"] as const;
const both = ["western", "desi"] as const;

export const garmentKinds = [
  { id: "hijab", label: "Hijab", category: "hijab", styles: both },
  {
    id: "instant-hijab",
    label: "Instant hijab",
    category: "hijab",
    styles: both,
  },
  { id: "underscarf", label: "Underscarf", category: "hijab", styles: both },
  { id: "shawl", label: "Shawl", category: "hijab", styles: both },
  { id: "blouse", label: "Blouse", category: "top", styles: null },
  { id: "shirt", label: "Shirt", category: "top", styles: null },
  { id: "t-shirt", label: "T-shirt", category: "top", styles: null },
  { id: "sweater", label: "Sweater", category: "top", styles: null },
  { id: "top", label: "Top", category: "top", styles: null },
  { id: "kurta", label: "Kurta", category: "tunic", styles: desi },
  { id: "kurti", label: "Kurti", category: "tunic", styles: desi },
  { id: "kameez", label: "Kameez", category: "tunic", styles: desi },
  { id: "tunic", label: "Tunic", category: "tunic", styles: null },
  { id: "trousers", label: "Trousers", category: "bottom", styles: null },
  { id: "jeans", label: "Jeans", category: "bottom", styles: null },
  { id: "wide-leg", label: "Wide-leg", category: "bottom", styles: null },
  { id: "shalwar", label: "Shalwar", category: "bottom", styles: desi },
  { id: "churidar", label: "Churidar", category: "bottom", styles: desi },
  { id: "sharara", label: "Sharara", category: "bottom", styles: desi },
  { id: "gharara", label: "Gharara", category: "bottom", styles: desi },
  { id: "lehenga", label: "Lehenga", category: "bottom", styles: desi },
  { id: "skirt", label: "Skirt", category: "bottom", styles: null },
  { id: "dress", label: "Dress", category: "dress", styles: null },
  { id: "anarkali", label: "Anarkali", category: "dress", styles: desi },
  { id: "abaya", label: "Abaya", category: "dress", styles: null },
  { id: "kaftan", label: "Kaftan", category: "dress", styles: null },
  { id: "blazer", label: "Blazer", category: "layer", styles: null },
  { id: "cardigan", label: "Cardigan", category: "layer", styles: both },
  { id: "jacket", label: "Jacket", category: "layer", styles: null },
  { id: "coat", label: "Coat", category: "layer", styles: both },
  { id: "waistcoat", label: "Waistcoat", category: "layer", styles: null },
  { id: "sneakers", label: "Sneakers", category: "shoes", styles: both },
  { id: "flats", label: "Flats", category: "shoes", styles: both },
  { id: "loafers", label: "Loafers", category: "shoes", styles: null },
  { id: "heels", label: "Heels", category: "shoes", styles: both },
  { id: "sandals", label: "Sandals", category: "shoes", styles: null },
  { id: "khussa", label: "Khussa", category: "shoes", styles: desi },
  { id: "boots", label: "Boots", category: "shoes", styles: both },
  { id: "handbag", label: "Handbag", category: "bag", styles: both },
  { id: "tote", label: "Tote", category: "bag", styles: both },
  { id: "crossbody", label: "Crossbody", category: "bag", styles: both },
  { id: "clutch", label: "Clutch", category: "bag", styles: both },
  { id: "backpack", label: "Backpack", category: "bag", styles: both },
  { id: "dupatta", label: "Dupatta", category: "accessory", styles: desi },
  { id: "jewellery", label: "Jewellery", category: "accessory", styles: both },
  { id: "belt", label: "Belt", category: "accessory", styles: both },
  { id: "shoes", label: "Shoes", category: "shoes", styles: both },
  { id: "bag", label: "Bag", category: "bag", styles: both },
] as const;

export type GarmentKind = (typeof garmentKinds)[number]["id"];

export const retiredKinds: readonly GarmentKind[] = ["shoes", "bag"];

export const offeredKinds = garmentKinds.filter(
  (kind) => !retiredKinds.includes(kind.id),
);

export const occasions = [
  { id: "work", label: "Work" },
  { id: "everyday", label: "Everyday" },
  { id: "dinner", label: "Dinner" },
  { id: "celebration", label: "Celebration" },
] as const;

export type Occasion = (typeof occasions)[number]["id"];

export type LabelGroup = "kind" | "style";

export type LabelScore = { group: LabelGroup; value: string; score: number };

export const isOffered = (id: GarmentKind) => !retiredKinds.includes(id);

export const kindsIn = (category: Category) =>
  offeredKinds.filter((kind) => kind.category === category);

export const categoryOf = (id: GarmentKind): Category =>
  garmentKinds.find((kind) => kind.id === id)!.category;

export function fixedStyles(id: GarmentKind): Style[] | undefined {
  const styles = garmentKinds.find((kind) => kind.id === id)?.styles;
  return styles ? [...styles] : undefined;
}

export const kindLabel = (id: GarmentKind) =>
  garmentKinds.find((kind) => kind.id === id)?.label ?? id;

export const occasionLabel = (id: Occasion) =>
  occasions.find((item) => item.id === id)?.label ?? id;

export const styleLabel = (id: Style) =>
  styleOptions.find((item) => item.id === id)?.label ?? id;
