import React from "react";
import { Platform, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { C } from "@/components/bazan-ui";

const tabs = [
  { name: "index", title: "Tổng quan", icon: "grid" as const, symbol: "house.fill" as const },
  { name: "ingest", title: "Nhập bài", icon: "plus-square" as const, symbol: "plus.app.fill" as const },
  { name: "review", title: "Duyệt", icon: "check-square" as const, symbol: "checkmark.bubble.fill" as const },
  { name: "leads", title: "Khách", icon: "users" as const, symbol: "person.2.fill" as const },
  { name: "menu", title: "Menu", icon: "menu" as const, symbol: "line.3.horizontal" as const },
];
function NativeLayout() {
  return <NativeTabs>{tabs.map((tab) => <NativeTabs.Trigger key={tab.name} name={tab.name}><NativeTabs.Trigger.Icon sf={tab.symbol} /><NativeTabs.Trigger.Label>{tab.title}</NativeTabs.Trigger.Label></NativeTabs.Trigger>)}</NativeTabs>;
}
export default function TabsLayout() {
  if (isLiquidGlassAvailable()) return <NativeLayout />;
  return <Tabs screenOptions={{
    tabBarActiveTintColor: C.primary, tabBarInactiveTintColor: C.mutedForeground,
    tabBarStyle: { backgroundColor: Platform.OS === "ios" ? "transparent" : C.card, borderTopColor: C.border, ...(Platform.OS === "web" ? { height: 84 } : {}) },
    tabBarBackground: Platform.OS === "ios" ? () => <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} /> : undefined,
    headerStyle: { backgroundColor: C.card }, headerTintColor: C.primary, headerTitleStyle: { fontFamily: "BeVietnamPro_600SemiBold" },
    tabBarHideOnKeyboard: true,
  }}>{tabs.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ focused }) => <Feather name={tab.icon} size={22} color={focused ? C.primary : C.mutedForeground} /> }} />)}</Tabs>;
}
