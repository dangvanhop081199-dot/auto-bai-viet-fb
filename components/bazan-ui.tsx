import React, { useState, type ReactNode } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

export const C = colors.light;
export const currency = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
export const date = (value: string) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
export const labels: Record<string, string> = {
  UNPROCESSED: "Chưa xử lý", READY_TO_COMMENT: "Chờ duyệt", COMMENTED: "Đã bình luận",
  SKIPPED: "Đã bỏ qua", BLOCKED_AUTHOR: "Tác giả bị chặn", CUSTOMER_NEED_CAR: "Khách tìm xe",
  DRIVER_FIND_PASSENGER: "Tài xế tìm khách", IRRELEVANT: "Không liên quan", UNCERTAIN: "Chưa xác định",
  NEW: "Khách mới", CONTACTED: "Đã liên hệ", CONSULTING: "Đang tư vấn", CLOSED_WON: "Đã chốt",
  CLOSED_LOST: "Không chốt", XE_GHEP: "Xe ghép", BAO_XE: "Bao xe", SAN_BAY: "Sân bay",
  KHAM_BENH: "Khám bệnh", CHUA_RO: "Chưa rõ", HIGH: "Khẩn cấp", MEDIUM: "Trung bình", LOW: "Thấp",
  MANUAL: "Nhập thủ công", AUTHORIZED: "Tự khai đã được cấp quyền", CONNECTED: "Đã cấp quyền",
  DISCONNECTED: "Chưa cấp quyền",
};
export function Body({ children }: { children: ReactNode }) {
  const inset = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  return <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: C.background, ...(Platform.OS === "web" ? { height, width } : {}) }}
    contentContainerStyle={{ padding: 20, gap: 16, paddingTop: Platform.OS === "web" ? 67 : 20, paddingBottom: Math.max(inset.bottom, 34) + 90 }}
    keyboardShouldPersistTaps="handled" bottomOffset={70}>{children}</KeyboardAwareScrollViewCompat>;
}
export const Title = ({ children }: { children: ReactNode }) => <Text style={s.title}>{children}</Text>;
export const Txt = ({ children, muted = false }: { children: ReactNode; muted?: boolean }) => <Text style={[s.text, muted && { color: C.mutedForeground }]}>{children}</Text>;
export const Card = ({ children }: { children: ReactNode }) => <View style={s.card}>{children}</View>;
export function Btn({ title, onPress, disabled, danger = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; danger?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} testID={`button-${title}`} disabled={disabled} onPress={() => { void Haptics.selectionAsync().catch(() => {}); onPress(); }}
    style={({ pressed }) => [s.button, { backgroundColor: danger ? C.warning : secondary ? C.secondary : C.primary, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}>
    <Text style={[s.buttonText, secondary && { color: C.primary }]}>{title}</Text>
  </Pressable>;
}
export function Field({ label, value, onChange, secure = false, multiline = false, numeric = false }: { label: string; value: string; onChange: (v: string) => void; secure?: boolean; multiline?: boolean; numeric?: boolean }) {
  return <View style={{ gap: 7 }}><Text style={s.label}>{label}</Text><TextInput testID={`input-${label}`} accessibilityLabel={label}
    value={value} onChangeText={onChange} secureTextEntry={secure} multiline={multiline} autoCapitalize="none" autoCorrect={false}
    keyboardType={numeric ? "decimal-pad" : "default"} placeholderTextColor={C.mutedForeground}
    style={[s.input, multiline && { minHeight: 100, textAlignVertical: "top" }]} /></View>;
}
export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return <View style={s.row}><View style={{ flex: 1 }}><Txt>{label}</Txt></View><Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: C.primary }} /></View>;
}
export function Choices({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return <View style={s.wrap}>{options.map((option) => <Pressable key={option} accessibilityRole="radio" accessibilityState={{ selected: value === option }} onPress={() => onChange(option)}
    style={[s.chip, value === option && { backgroundColor: C.accent, borderColor: C.primary }]}><Text style={[s.small, { color: value === option ? C.primary : C.mutedForeground }]}>{option === "" ? "Tất cả" : labels[option] ?? option}</Text></Pressable>)}</View>;
}
export function Notice({ text, error = false }: { text: string; error?: boolean }) {
  return <View style={[s.notice, error && { borderColor: C.warning }]}><Text style={[s.text, { color: error ? C.warning : C.primary }]}>{text}</Text></View>;
}
export function QueryState({ loading, error, retry, empty }: { loading: boolean; error: unknown; retry: () => void; empty?: boolean }) {
  if (loading) return <ActivityIndicator accessibilityLabel="Đang tải" color={C.primary} />;
  if (error) return <Card><Notice text={error instanceof Error ? error.message : "Không tải được dữ liệu."} error /><Btn title="Thử tải lại" onPress={retry} secondary /></Card>;
  if (empty) return <Card><Title>Chưa có dữ liệu</Title><Txt muted>Dữ liệu thật sẽ xuất hiện tại đây sau khi bạn thêm mới.</Txt></Card>;
  return null;
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  async function run<T>(action: () => Promise<T>, success = "Đã lưu thay đổi.", after?: (value: T) => void) {
    setBusy(true); setMessage(""); setFailed(false);
    try { const value = await action(); setMessage(success); after?.(value); }
    catch (error) { setFailed(true); setMessage(error instanceof Error ? error.message : "Thao tác chưa thành công. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }
  return { busy, run, feedback: message ? <Notice text={message} error={failed} /> : null };
}
export function confirmDelete(action: () => void) {
  if (Platform.OS === "web") { if (window.confirm("Xóa mục này? Không thể khôi phục dữ liệu đã xóa.")) action(); }
  else Alert.alert("Xác nhận xóa", "Không thể khôi phục dữ liệu đã xóa.", [{ text: "Giữ lại", style: "cancel" }, { text: "Xóa", style: "destructive", onPress: action }]);
}
export const s = StyleSheet.create({
  title: { fontFamily: "BeVietnamPro_700Bold", fontSize: 24, color: C.foreground, lineHeight: 34 },
  text: { fontFamily: "BeVietnamPro_400Regular", fontSize: 14, lineHeight: 23, color: C.foreground },
  label: { fontFamily: "BeVietnamPro_600SemiBold", fontSize: 13, color: C.foreground },
  small: { fontFamily: "BeVietnamPro_500Medium", fontSize: 12, lineHeight: 20 },
  card: { backgroundColor: C.card, padding: 18, borderRadius: colors.radius, borderWidth: 1, borderColor: C.border, gap: 13 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, justifyContent: "space-between" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: C.border },
  input: { minHeight: 48, borderWidth: 1, borderColor: C.input, padding: 12, borderRadius: colors.radius, fontFamily: "BeVietnamPro_400Regular", fontSize: 14, color: C.foreground, backgroundColor: C.card },
  button: { minHeight: 48, padding: 13, borderRadius: colors.radius, alignItems: "center", justifyContent: "center" },
  buttonText: { fontFamily: "BeVietnamPro_600SemiBold", fontSize: 14, color: C.primaryForeground },
  notice: { padding: 14, borderWidth: 1, borderColor: C.border, backgroundColor: C.accent, borderRadius: colors.radius },
});
