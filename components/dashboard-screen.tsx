import React from "react";
import { router } from "expo-router";
import { useGetDashboard, useGetMe } from "@workspace/api-client-react";
import { Body, Btn, Card, currency, date, Notice, QueryState, Title, Txt } from "./bazan-ui";

export function DashboardScreen() {
  const q = useGetDashboard({ query: { staleTime: 15000, refetchInterval: 30000 } });
  const me = useGetMe({ query: { refetchInterval: 15000 } });
  return <Body><Txt muted>ĐIỀU HÀNH XE GHÉP TÂY NGUYÊN</Txt><Title>Chào {me.data?.fullName ?? "bạn"},</Title><Txt muted>Mọi cơ hội đều bắt đầu từ một nhu cầu thật.</Txt>
    {me.data?.isEmergencyStopped && <Notice text="Hệ thống đang dừng khẩn cấp. Vào Menu để tiếp tục." error />}
    <QueryState loading={q.isLoading} error={q.error} retry={() => { void q.refetch(); }} />
    {q.data && <>
      <Card><Txt muted>BÀI VIẾT ĐÃ TIẾP NHẬN</Txt><Title>{q.data.totalPosts}</Title><Txt>{q.data.customerPosts} khách tìm xe · {q.data.readyPosts} chờ duyệt</Txt><Btn title="Tiếp nhận bài viết" onPress={() => router.push("/ingest")} /></Card>
      <Card><Txt muted>KHÁCH HÀNG TRONG CRM</Txt><Title>{q.data.totalLeads}</Title><Txt>{q.data.closedLeads} đã chốt · {currency(q.data.estimatedRevenue)} giá trị ước tính</Txt><Btn title="Quản lý khách hàng" secondary onPress={() => router.push("/leads")} /></Card>
      <Title>Hoạt động gần đây</Title>
      {!q.data.recentActivity.length && <Txt muted>Chưa có hoạt động. Hãy cấu hình Gemini hoặc nhập bài đầu tiên.</Txt>}
      {q.data.recentActivity.map((a) => <Card key={a.id}><Txt>{a.message}</Txt><Txt muted>{date(a.createdAt)}</Txt></Card>)}
      <Title>Tuyến đang quan tâm</Title>
      {!q.data.routes.length && <Txt muted>Thêm khách vào CRM để theo dõi tuyến đường thực tế.</Txt>}
      {q.data.routes.map((r) => <Card key={r.route}><Txt>{r.route} · {r.count} khách</Txt></Card>)}
    </>}
  </Body>;
}
