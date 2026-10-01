export const fabrics = [
  { id: "lawn", label: "Lawn" },
  { id: "cotton", label: "Cotton" },
  { id: "linen", label: "Linen" },
  { id: "jersey", label: "Jersey" },
  { id: "modal", label: "Modal" },
  { id: "chiffon", label: "Chiffon" },
  { id: "silk", label: "Silk" },
  { id: "satin", label: "Satin" },
  { id: "velvet", label: "Velvet" },
  { id: "wool", label: "Wool" },
  { id: "knit", label: "Knit" },
  { id: "denim", label: "Denim" },
  { id: "khaddar", label: "Khaddar" },
  { id: "karandi", label: "Karandi" },
  { id: "organza", label: "Organza" },
  { id: "net", label: "Net" },
] as const;

export type Fabric = (typeof fabrics)[number]["id"];
