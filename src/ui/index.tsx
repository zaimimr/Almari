import { type PropsWithChildren, type ReactNode } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextProps,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  type Piece,
  type Category,
  categories,
  categoryLabel,
} from "../domain/closet";
import { photoUri } from "../storage/local";
import { theme } from "./theme";

export function AppText({
  variant = "body",
  muted,
  style,
  ...props
}: TextProps & { variant?: keyof typeof theme.typography; muted?: boolean }) {
  return (
    <Text
      {...props}
      style={[
        { color: muted ? theme.colors.muted : theme.colors.ink },
        theme.typography[variant],
        style,
      ]}
    />
  );
}

export function Screen({
  children,
  centered = false,
}: PropsWithChildren<{ centered?: boolean }>) {
  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safe}>
      <View style={[styles.content, centered && styles.centered]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function FormScreen({ children }: PropsWithChildren) {
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      style={styles.safe}
      contentContainerStyle={styles.form}
    >
      {children}
    </ScrollView>
  );
}

export function Button({
  label,
  onPress,
  secondary,
  danger,
  disabled,
  busy,
  compact,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  disabled?: boolean;
  busy?: boolean;
  compact?: boolean;
}) {
  const unavailable = disabled || busy;
  const color = danger
    ? theme.colors.error
    : secondary
      ? theme.colors.accent
      : theme.colors.accentText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(unavailable), busy }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        (secondary || danger) && styles.secondaryButton,
        compact && styles.compactButton,
        unavailable && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {busy ? <ActivityIndicator color={color} /> : null}
      <AppText style={{ color, fontWeight: "600", textAlign: "center" }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function HeaderAction({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.headerAction}
    >
      <AppText style={styles.link}>{label}</AppText>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.field}>
      <AppText style={styles.label}>{label}</AppText>
      <TextInput
        {...props}
        accessibilityLabel={label}
        selectionColor={theme.colors.accent}
        placeholderTextColor={theme.colors.muted}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

export function ErrorMessage({ message }: { message: string | null }) {
  return message ? (
    <AppText accessibilityRole="alert" style={styles.error}>
      {message}
    </AppText>
  ) : null;
}

export function Message({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.message}>
      <AppText variant="heading">{title}</AppText>
      <AppText muted>{description}</AppText>
      {action}
    </View>
  );
}

export function Filters({
  value,
  onChange,
  all = true,
}: {
  value: Category | "all" | null;
  onChange: (value: Category | "all") => void;
  all?: boolean;
}) {
  const options = all
    ? [{ id: "all" as const, label: "All pieces" }, ...categories]
    : categories;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
    >
      {options.map((category) => (
        <Pressable
          key={category.id}
          accessibilityRole="button"
          accessibilityState={{ selected: category.id === value }}
          onPress={() => onChange(category.id)}
          style={[styles.chip, category.id === value && styles.chipSelected]}
        >
          <AppText
            variant="caption"
            style={[
              styles.chipLabel,
              category.id === value && styles.chipLabelSelected,
            ]}
          >
            {category.label}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function PiecePhoto({
  piece,
  style,
}: {
  piece: Piece;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.photo, style]}>
      <Image
        source={{ uri: photoUri(piece.photo) }}
        accessibilityLabel={piece.name}
        style={styles.image}
        contentFit="contain"
        recyclingKey={piece.id}
      />
    </View>
  );
}

export function PieceTile({
  piece,
  onPress,
  selected,
}: {
  piece: Piece;
  onPress: () => void;
  selected?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${piece.name}, ${categoryLabel(piece.category)}${selected ? ", selected" : ""}`}
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={[styles.tilePhoto, selected && styles.selectedPhoto]}>
        <PiecePhoto piece={piece} />
        {selected ? (
          <View style={styles.selectedBadge}>
            <AppText variant="caption" style={styles.selectedLabel}>
              Selected
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText style={styles.pieceName} numberOfLines={2}>
        {piece.name}
      </AppText>
      <AppText variant="caption" muted>
        {categoryLabel(piece.category)}
      </AppText>
    </Pressable>
  );
}

export function OutfitCollage({
  pieces,
  compact = false,
}: {
  pieces: Piece[];
  compact?: boolean;
}) {
  return (
    <View style={[styles.collage, compact && styles.collageCompact]}>
      {pieces.map((piece) => (
        <PiecePhoto
          key={piece.id}
          piece={piece}
          style={[
            styles.collagePiece,
            {
              width: pieces.length === 1 ? "100%" : "50%",
              height: compact ? 120 : pieces.length < 3 ? 270 : 180,
            },
          ]}
        />
      ))}
      {pieces.length === 0 ? (
        <AppText muted style={styles.collagePlaceholder}>
          Your pieces will appear here.
        </AppText>
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: theme.space.xl,
    flex: 1,
    gap: theme.space.xl,
  },
  centered: { justifyContent: "center" },
  form: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    padding: theme.space.xl,
    paddingBottom: 48,
    gap: theme.space.xl,
  },
  button: {
    minHeight: 52,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    backgroundColor: theme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  compactButton: { minHeight: 44, paddingVertical: 8, paddingHorizontal: 14 },
  secondaryButton: { backgroundColor: theme.colors.accentSoft },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  headerAction: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  link: { color: theme.colors.accent, fontWeight: "600" },
  field: { gap: theme.space.sm },
  label: { fontWeight: "600" },
  input: {
    minHeight: 52,
    padding: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    color: theme.colors.ink,
    fontSize: 17,
    ...Platform.select({ web: { outlineColor: theme.colors.accent } }),
  },
  error: { color: theme.colors.error },
  message: {
    gap: theme.space.lg,
    maxWidth: 460,
    width: "100%",
    alignSelf: "center",
  },
  filters: { gap: 8, paddingVertical: 4 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 22,
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  chipSelected: { backgroundColor: theme.colors.accent },
  chipLabel: { color: theme.colors.ink, fontWeight: "500" },
  chipLabelSelected: { color: theme.colors.accentText },
  photo: {
    backgroundColor: theme.colors.background,
    flex: 1,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  tile: { flex: 1, gap: 4, paddingBottom: 12 },
  tilePhoto: {
    aspectRatio: 0.82,
    padding: 8,
    borderRadius: theme.radius,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: theme.colors.line,
    overflow: "hidden",
  },
  selectedPhoto: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
    padding: 7,
  },
  selectedBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.accent,
  },
  selectedLabel: { color: theme.colors.accentText, fontWeight: "600" },
  pieceName: { marginTop: 6, fontWeight: "500", fontSize: 15, lineHeight: 21 },
  collage: {
    width: "100%",
    backgroundColor: theme.colors.background,
    flexDirection: "row",
    flexWrap: "wrap",
    minHeight: 180,
    justifyContent: "center",
    alignItems: "center",
  },
  collageCompact: { minHeight: 120 },
  collagePiece: { flex: undefined, padding: 8 },
  collagePlaceholder: { padding: 24, textAlign: "center" },
});
