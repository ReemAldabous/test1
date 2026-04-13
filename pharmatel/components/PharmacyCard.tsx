import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import Colors from "@/constants/colors";
import type { Pharmacy } from "@/models";

interface PharmacyCardProps {
  pharmacy: Pharmacy;
  isSelected?: boolean;
  onPress?: () => void;
}

export function PharmacyCard({
  pharmacy,
  isSelected,
  onPress,
}: PharmacyCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === "dark" ? "dark" : "light"];

  const handleCall = () => {
    if (!pharmacy.phone) return;
    Linking.openURL(`tel:${pharmacy.phone}`);
  };

  const handleDirections = () => {
    if (pharmacy.lat == null || pharmacy.lng == null) return;
    const url = `https://www.openstreetmap.org/directions?to=${pharmacy.lat},${pharmacy.lng}`;
    Linking.openURL(url);
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: isSelected ? colors.primary + "08" : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
          opacity: pressed ? 0.93 : 1,
        },
      ]}
    >
      {/* Stock indicator strip */}
      <View
        style={[
          styles.strip,
          { backgroundColor: pharmacy.inStock ? colors.success : colors.error },
        ]}
      />

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <View style={styles.nameGroup}>
            <Text
              style={[styles.name, { color: colors.text }]}
              numberOfLines={1}
            >
              {pharmacy.name}
            </Text>
            {pharmacy.distance && (
              <Text style={[styles.distance, { color: colors.textMuted }]}>
                {pharmacy.distance} away
              </Text>
            )}
          </View>
          <View style={styles.badges}>
            <View
              style={[
                styles.stockBadge,
                {
                  backgroundColor: pharmacy.inStock
                    ? colors.takenBg
                    : colors.missedBg,
                },
              ]}
            >
              <Feather
                name={pharmacy.inStock ? "check" : "x"}
                size={10}
                color={pharmacy.inStock ? colors.taken : colors.missed}
              />
              <Text
                style={[
                  styles.stockText,
                  { color: pharmacy.inStock ? colors.taken : colors.missed },
                ]}
              >
                {pharmacy.inStock ? "In Stock" : "Out of Stock"}
              </Text>
            </View>
            {pharmacy.price && pharmacy.inStock && (
              <View
                style={[
                  styles.priceBadge,
                  { backgroundColor: colors.primary + "15" },
                ]}
              >
                <Text style={[styles.priceText, { color: colors.primary }]}>
                  {pharmacy.price}
                </Text>
              </View>
            )}
            {typeof pharmacy.quantity === "number" && (
              <View
                style={[
                  styles.priceBadge,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Text
                  style={[styles.priceText, { color: colors.textSecondary }]}
                >
                  Qty: {pharmacy.quantity}
                </Text>
              </View>
            )}
          </View>
        </View>

        {pharmacy.pharmacistName && (
          <View style={styles.infoRow}>
            <Feather name="user" size={12} color={colors.textMuted} />
            <Text
              style={[styles.infoText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {pharmacy.pharmacistName}
            </Text>
          </View>
        )}

        {pharmacy.address && (
          <View style={styles.infoRow}>
            <Feather name="map-pin" size={12} color={colors.textMuted} />
            <Text
              style={[styles.infoText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {pharmacy.address}
            </Text>
          </View>
        )}

        {pharmacy.openHours && (
          <View style={styles.infoRow}>
            <Feather name="clock" size={12} color={colors.textMuted} />
            <Text
              style={[styles.infoText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {pharmacy.openHours}
            </Text>
          </View>
        )}

        {/* Rating & actions */}
        <View style={styles.footer}>
          {typeof pharmacy.rating === "number" ? (
            <View style={styles.rating}>
              <Feather name="star" size={12} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {pharmacy.rating.toFixed(1)}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.actions}>
            {pharmacy.phone && (
              <Pressable
                onPress={handleCall}
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Feather name="phone" size={14} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  Call
                </Text>
              </Pressable>
            )}
            {pharmacy.lat != null && pharmacy.lng != null && (
              <Pressable
                onPress={handleDirections}
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather name="navigation" size={14} color="#fff" />
                <Text style={[styles.actionText, { color: "#fff" }]}>
                  Directions
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  strip: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  nameGroup: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  distance: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  badges: {
    alignItems: "flex-end",
    gap: 4,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  stockText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
