import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteGeminiKey, saveGemini, testGemini, updateMe, useGetGemini, useGetMe, useGetUsage, useListActivity, type GeminiConfig, type GeminiInput, type Profile } from "@workspace/api-client-react";
import { Body, Btn, Card, Choices, confirmDelete, date, Field, Notice, QueryState, Title, Toggle, Txt, useAction } from "./bazan-ui";

function GeminiForm({ config }: { config: GeminiConfig }) {
  const client = useQueryClient();
  const [apiKey, setKey] = useState("");
  const [modelName, setModel] = useState(config.modelName);
  const [maxOutputTokens, setTokens] = useState(String(config.maxOutputTokens));
  const [temperature, setTemp] = useState(String(config.temperature));
  const [minConfidenceAuto, setConfidence] = useState(String(config.minConfidenceAuto));
  const [maxCommentsPerHour, setLimit] = useState(String(config.maxCommentsPerHour));
  const [autoModeEnabled, setAuto] = useState(config.autoModeEnabled);
  const action = useAction();
  return <Card><Notice text={config.hasApiKey ? "Đã lưu khóa được mã hóa AES-256-GCM. Khóa không được trả về ứng dụng." : "Chưa có khóa Gemini. Nhập khóa của bạn tại đây."} />
    <Field label="Khóa Gemini mới (để trống nếu giữ nguyên)" value={apiKey} onChange={setKey} secure />
    <Txt>Model Gemini</Txt><Choices value={modelName} options={["gemini-2.5-flash", "gemini-2.5-pro"]} onChange={setModel} />
    <Field label="Token đầu ra tối đa (256–8192)" value={maxOutputTokens} onChange={setTokens} numeric />
    <Field label="Nhiệt độ (0–1)" value={temperature} onChange={setTemp} numeric />
    <Field label="Ngưỡng cảnh báo tin cậy (0–1)" value={minConfidenceAuto} onChange={setConfidence} numeric />
    <Field label="Giới hạn xác nhận bình luận/giờ (1–100)" value={maxCommentsPerHour} onChange={setLimit} numeric />
    <Toggle label="Tự phân tích bài nhập file" value={autoModeEnabled} onChange={setAuto} />
    <Txt muted>Khi tắt, bài nhập file chờ phân tích thủ công. Bài dán nhanh vẫn phân tích khi đã có khóa. Không tự đăng bình luận; ngưỡng tin cậy chỉ để cảnh báo.</Txt>
    {action.feedback}
    <Btn title="Lưu cấu hình" disabled={action.busy} onPress={() => { void action.run(async () => {
      const data: GeminiInput = { modelName: modelName as GeminiInput["modelName"], maxOutputTokens: Number(maxOutputTokens), temperature: Number(temperature), minConfidenceAuto: Number(minConfidenceAuto), maxCommentsPerHour: Number(maxCommentsPerHour), autoModeEnabled, ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}) };
      if (![data.maxOutputTokens, data.temperature, data.minConfidenceAuto, data.maxCommentsPerHour].every((v) => typeof v === "number" && Number.isFinite(v))) throw new Error("Các tham số phải là số hợp lệ.");
      await saveGemini(data); setKey(""); await client.invalidateQueries();
    }); }} />
    <Btn title="Kiểm tra kết nối (có thể tính token)" secondary disabled={action.busy || !config.hasApiKey} onPress={() => { void action.run(async () => { const result = await testGemini(); await client.invalidateQueries(); return result; }, "Kết nối Gemini thành công."); }} />
    <Btn title="Xóa khóa đã lưu" danger disabled={action.busy || !config.hasApiKey} onPress={() => confirmDelete(() => { void action.run(async () => { await deleteGeminiKey(); setKey(""); await client.invalidateQueries(); }, "Đã xóa khóa Gemini."); })} />
  </Card>;
}
export function GeminiScreen() {
  const q = useGetGemini({ query: { staleTime: 15000 } });
  return <Body><Title>Cấu hình Gemini</Title><Txt muted>Khóa được truyền qua HTTPS đến backend và mã hóa trong PostgreSQL; không lưu trong APK hay bộ nhớ ứng dụng.</Txt><QueryState loading={q.isLoading} error={q.error} retry={() => { void q.refetch(); }} />{q.data && <GeminiForm key={JSON.stringify(q.data)} config={q.data} />}</Body>;
}
function ProfileForm({ profile }: { profile: Profile }) {
  const client = useQueryClient();
  const [name, setName] = useState(profile.fullName);
  const action = useAction();
  return <Card><Field label="Tên hiển thị" value={name} onChange={setName} />
    <Btn title="Lưu hồ sơ" disabled={action.busy || !name.trim()} onPress={() => { void action.run(async () => { await updateMe({ fullName: name }); await client.invalidateQueries(); }); }} />
    {action.feedback}
  </Card>;
}
export function ProfileScreen() {
  const q = useGetMe();
  return <Body><Title>Hồ sơ điều hành</Title><QueryState loading={q.isLoading} error={q.error} retry={() => { void q.refetch(); }} />{q.data && <ProfileForm key={q.data.id} profile={q.data} />}</Body>;
}
export function UsageScreen() {
  const q = useGetUsage({ query: { staleTime: 15000, refetchInterval: 30000 } });
  return <Body><Title>Sử dụng AI</Title><Txt muted>Chi phí ước tính USD, không phải hóa đơn. Đơn giá và token thực tính có thể khác theo Google.</Txt><QueryState loading={q.isLoading} error={q.error} retry={() => { void q.refetch(); }} />
    {q.data && <><Card><Title>{q.data.totalRequests} yêu cầu</Title><Txt>{q.data.totalInputTokens} token vào · {q.data.totalOutputTokens} token ra</Txt><Txt>Chi phí ước tính: ${q.data.estimatedCost.toFixed(6)}</Txt></Card>
      {!q.data.logs.length && <Notice text="Chưa có lượt gọi Gemini. Kiểm tra kết nối hoặc phân tích bài viết để bắt đầu." />}
      {q.data.logs.map((log) => <Card key={log.id}><Txt>{log.modelName} · {log.success ? "Thành công" : "Không thành công"}</Txt><Txt muted>{date(log.createdAt)}</Txt><Txt>{log.inputTokens} vào / {log.outputTokens} ra · ${log.estimatedCost.toFixed(6)}</Txt></Card>)}</>}
  </Body>;
}
export function ActivityScreen() {
  const q = useListActivity({ query: { staleTime: 15000, refetchInterval: 30000 } });
  return <Body><Title>Nhật ký hoạt động</Title><QueryState loading={q.isLoading} error={q.error} retry={() => { void q.refetch(); }} empty={q.data?.length === 0} />{q.data?.map((log) => <Card key={log.id}><Txt>{log.message}</Txt><Txt muted>{date(log.createdAt)}</Txt></Card>)}</Body>;
}
