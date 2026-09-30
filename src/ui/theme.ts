export const theme = {
  colors: {
    background: "#FFFFFF",
    surface: "#FBF9F7",
    ink: "#322E28",
    muted: "#706963",
    accent: "#675469",
    accentText: "#FFFFFF",
    accentSoft: "#F3EEF4",
    line: "#E6E0DC",
    error: "#96354A",
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, section: 48 },
  radius: 14,
  typography: {
    title: {
      fontFamily: "Georgia",
      fontSize: 38,
      lineHeight: 44,
      letterSpacing: -0.8,
    },
    heading: { fontFamily: "Georgia", fontSize: 27, lineHeight: 34 },
    body: { fontSize: 17, lineHeight: 25 },
    caption: { fontSize: 13, lineHeight: 19 },
  },
} as const;
