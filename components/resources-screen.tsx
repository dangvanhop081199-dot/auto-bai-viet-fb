import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  createLead, updateLead, deleteLead, useListLeads, type LeadInput,
  createGroup, updateGroup, deleteGroup, useListGroups, type GroupInput,
  createTemplate, updateTemplate, deleteTemplate, useListTemplates, type TemplateInput,
  createBlocked, updateBlocked, deleteBlocked, useListBlocked, type BlockedInput,
  createConnection, deleteConnection, useListConnections, type ConnectionInput,
} from "@workspace/api-client-react";
import { Body, Btn, Card, Choices, confirmDelete, Field, labels, Notice, QueryState, Title, Toggle, Txt, useAction } from "./bazan-ui";

type FieldSpec = { key: string; label: string; numeric?: boolean; boolean?: boolean; multiline?: boolean; options?: string[] };
const service = ["CHUA_RO", "XE_GHEP", "BAO_XE", "SAN_BAY", "KHAM_BENH"];
const text = (key: string, label: string, multiline = false): FieldSpec => ({ key, label, multiline });
const specs = {
  leads: { title: "Khách hàng CRM", fields: [
    text("fbName", "Tên khách hàng"), text("fbUserId", "Facebook UID"), text("postUrl", "Bài viết gốc"),
    text("sourceGroupUid", "UID nhóm nguồn"), text("sourceGroupName", "Tên nhóm nguồn"), text("route", "Tuyến đường"),
    text("pickupLocation", "Điểm đón"), text("dropoffLocation", "Điểm đến"), text("travelDate", "Ngày giờ đi"),
    { key: "passengerCount", label: "Số khách", numeric: true }, { key: "serviceType", label: "Dịch vụ", options: service },
    text("phoneNumber", "Điện thoại"), { key: "estimatedPrice", label: "Giá ước tính (VND)", numeric: true },
    { key: "crmStatus", label: "Trạng thái", options: ["NEW", "CONTACTED", "CONSULTING", "CLOSED_WON", "CLOSED_LOST"] },
    text("conversationNotes", "Ghi chú trao đổi", true), text("privateNotes", "Ghi chú riêng", true),
  ] },
  groups: { title: "Nhóm Facebook", fields: [
    text("groupUid", "UID nhóm"), text("groupName", "Tên nhóm"), text("groupUrl", "Liên kết nhóm"), text("routeTag", "Tuyến phục vụ"),
    { key: "accessStatus", label: "Nguồn tiếp nhận", options: ["MANUAL", "AUTHORIZED"] },
    { key: "isMonitored", label: "Theo dõi nhóm", boolean: true }, text("notes", "Ghi chú", true),
  ] },
  templates: { title: "Mẫu bình luận", fields: [
    text("title", "Tên mẫu"), text("content", "Nội dung", true), text("routeTag", "Tuyến đường"),
    { key: "serviceType", label: "Dịch vụ", options: service }, { key: "isActive", label: "Đang sử dụng", boolean: true },
    { key: "isApprovedForAuto", label: "Đã kiểm duyệt mẫu (không tự đăng)", boolean: true },
  ] },
  blocked: { title: "Danh sách chặn", fields: [
    text("displayName", "Tên tác giả"), text("fbUserId", "Facebook UID"), text("profileUrl", "Liên kết trang cá nhân"),
    text("reason", "Lý do", true), { key: "isActive", label: "Bật chặn tác giả", boolean: true },
  ] },
  connections: { title: "Nguồn tiếp nhận", fields: [text("displayName", "Tên nguồn"), text("fbUserId", "Facebook UID (nếu có)")] },
} satisfies Record<string, { title: string; fields: FieldSpec[] }>;
export type ResourceKind = keyof typeof specs;
type Row = Record<string, unknown> & { id: string };
function asRows(rows: { id: string }[]): Row[] {
  return rows.map((row) => ({ ...Object.fromEntries(Object.entries(row)), id: row.id }));
}

function ResourceView({ kind, rows, loading, error, refresh, save, remove }: {
  kind: ResourceKind; rows: Row[]; loading: boolean; error: unknown; refresh: () => void;
  save: (data: Record<string, unknown>, id?: string) => Promise<unknown>; remove: (id: string) => Promise<unknown>;
}) {
  const client = useQueryClient();
  const config = specs[kind];
  const [edit, setEdit] = useState<string | null | false>(false);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState("");
  const action = useAction();
  function start(row?: Row) {
    setValues(Object.fromEntries(config.fields.map((f: FieldSpec) => [f.key, row?.[f.key] ?? (f.boolean ? ["isActive", "isMonitored"].includes(f.key) : f.options?.[0] ?? "")])));
    setEdit(row?.id ?? null);
  }
  const filtered = rows.filter((row) => [row.fbName, row.groupName, row.title, row.displayName, row.phoneNumber, row.route].filter(Boolean).join(" ").toLocaleLowerCase("vi").includes(search.toLocaleLowerCase("vi")));
  return <Body><Title>{config.title}</Title>
    {kind === "connections" && <Notice text="Chỉ đăng ký thông tin nguồn. Chưa kết nối Facebook OAuth, không có luồng tự động. Không nhập mật khẩu hoặc token Facebook." />}
    {kind === "groups" && <Txt muted>Theo dõi giúp tổ chức bài viết do bạn nhập. Không tự đọc hoặc cào bài từ nhóm.</Txt>}
    <Btn title="Thêm mới" disabled={action.busy} onPress={() => start()} />
    <Field label="Tìm kiếm" value={search} onChange={setSearch} />
    {action.feedback}
    {edit !== false && <Card><Title>{edit ? "Chỉnh sửa" : "Thêm mới"}</Title>{config.fields.map((field: FieldSpec) => {
      const value = values[field.key];
      const change = (value: unknown) => setValues((prev) => ({ ...prev, [field.key]: value }));
      if (field.boolean) return <Toggle key={field.key} label={field.label} value={Boolean(value)} onChange={change} />;
      if (field.options) return <Card key={field.key}><Txt>{field.label}</Txt><Choices value={String(value ?? "")} options={field.options} onChange={change} /></Card>;
      return <Field key={field.key} label={field.label} value={String(value ?? "")} onChange={change} numeric={field.numeric} multiline={field.multiline} />;
    })}
      <Btn title="Lưu" disabled={action.busy} onPress={() => { void action.run(async () => {
        const data = Object.fromEntries(config.fields.map((field: FieldSpec) => {
          const value = values[field.key];
          if (field.numeric) {
            if ((value === "" || value == null) && field.key === "passengerCount") return [field.key, null];
            const number = Number(value);
            if (!Number.isFinite(number) || number < 0 || (field.key === "passengerCount" && (!Number.isInteger(number) || number < 1))) throw new Error(`${field.label} không hợp lệ.`);
            return [field.key, number];
          }
          return [field.key, value];
        }));
        await save(data, edit || undefined); await client.invalidateQueries(); setEdit(false);
      }); }} />
      <Btn title="Đóng biểu mẫu" secondary disabled={action.busy} onPress={() => setEdit(false)} />
    </Card>}
    <QueryState loading={loading} error={error} retry={refresh} empty={!rows.length} />
    {filtered.map((row) => <Card key={row.id}><Title>{String(row.fbName || row.groupName || row.title || row.displayName || row.fbUserId || "Mục đã lưu")}</Title>
      {config.fields.filter((f) => !f.boolean).map((f) => row[f.key] !== undefined && row[f.key] !== "" && <Txt key={f.key}>{f.label}: {labels[String(row[f.key])] ?? String(row[f.key] ?? "Chưa rõ")}</Txt>)}
      {kind === "groups" && <Txt muted>{String(row.totalPostsReceived)} bài · {String(row.totalLeadsFound)} cơ hội · {String(row.totalLeadsClosed)} đã chốt</Txt>}
      {kind === "templates" && <Txt muted>Phiên bản {String(row.version)} · {String(row.usageCount)} lượt dùng</Txt>}
      {kind === "connections" && <Notice text="Chưa cấp quyền · Chỉ đăng ký nguồn thủ công" />}
      {config.fields.filter((f: FieldSpec) => f.boolean).map((f) => <Txt key={f.key}>{f.label}: {row[f.key] ? "Bật" : "Tắt"}</Txt>)}
      {kind !== "connections" && <Btn title="Chỉnh sửa" secondary disabled={action.busy} onPress={() => start(row)} />}
      <Btn title="Xóa" danger disabled={action.busy} onPress={() => confirmDelete(() => { void action.run(async () => { await remove(row.id); await client.invalidateQueries(); }, "Đã xóa mục."); })} />
    </Card>)}
  </Body>;
}
export function LeadsScreen() {
  const q = useListLeads({ query: { staleTime: 15000, refetchInterval: 30000 } });
  return <ResourceView kind="leads" rows={asRows(q.data ?? [])} loading={q.isLoading} error={q.error} refresh={() => { void q.refetch(); }}
    save={(data, id) => id ? updateLead(id, data as LeadInput) : createLead(data as LeadInput)} remove={deleteLead} />;
}
export function GroupsScreen() {
  const q = useListGroups({ query: { staleTime: 15000, refetchInterval: 30000 } });
  return <ResourceView kind="groups" rows={asRows(q.data ?? [])} loading={q.isLoading} error={q.error} refresh={() => { void q.refetch(); }}
    save={(data, id) => id ? updateGroup(id, data as GroupInput) : createGroup(data as GroupInput)} remove={deleteGroup} />;
}
export function TemplatesScreen() {
  const q = useListTemplates({ query: { staleTime: 15000 } });
  return <ResourceView kind="templates" rows={asRows(q.data ?? [])} loading={q.isLoading} error={q.error} refresh={() => { void q.refetch(); }}
    save={(data, id) => id ? updateTemplate(id, data as TemplateInput) : createTemplate(data as TemplateInput)} remove={deleteTemplate} />;
}
export function BlockedScreen() {
  const q = useListBlocked({ query: { staleTime: 15000 } });
  return <ResourceView kind="blocked" rows={asRows(q.data ?? [])} loading={q.isLoading} error={q.error} refresh={() => { void q.refetch(); }}
    save={(data, id) => id ? updateBlocked(id, data as BlockedInput) : createBlocked(data as BlockedInput)} remove={deleteBlocked} />;
}
export function ConnectionsScreen() {
  const q = useListConnections({ query: { staleTime: 15000 } });
  return <ResourceView kind="connections" rows={asRows(q.data ?? [])} loading={q.isLoading} error={q.error} refresh={() => { void q.refetch(); }}
    save={(data) => createConnection({ displayName: String(data.displayName ?? ""), fbUserId: String(data.fbUserId ?? "") })} remove={deleteConnection} />;
}
