import React from "react";
import { router } from "expo-router";
import { useClerk } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { updateMe, useGetMe } from "@workspace/api-client-react";
import { Body, Btn, Card, Notice, QueryState, Title, Txt, useAction } from "@/components/bazan-ui";

const screens = [
  ["posts", "Bài viết đã nhận"], ["groups", "Nhóm Facebook"], ["templates", "Mẫu bình luận"],
  ["blocked", "Danh sách chặn"], ["connections", "Nguồn tiếp nhận"], ["gemini", "Cấu hình Gemini"],
  ["usage", "Sử dụng AI"], ["activity", "Nhật ký hoạt động"], ["profile", "Hồ sơ điều hành"],
] as const;
export default function MenuScreen() {
  const { signOut } = useClerk();
  const client = useQueryClient();
  const q = useGetMe({ query: { refetchInterval: 10000 } });
  const action = useAction();
  return <Body><Title>Điều hành BAZAN</Title><Txt muted>Đầy đủ chức năng, cùng dữ liệu với bản web.</Txt>
    <QueryState loading={q.isLoading} error={q.error} retry={() => { void q.refetch(); }} />
    <Card><Txt>{q.data?.fullName ?? "Đang tải hồ sơ"}</Txt><Notice text={q.data?.isEmergencyStopped ? "Đang dừng khẩn cấp. CRM và cấu hình vẫn sử dụng được." : "Nhập và phân tích bài viết đang được cho phép."} />
      <Btn title={q.data?.isEmergencyStopped ? "Tiếp tục hệ thống" : "Dừng khẩn cấp"} danger disabled={action.busy || !q.data} onPress={() => { void action.run(async () => {
        await updateMe({ isEmergencyStopped: !q.data?.isEmergencyStopped }); await client.invalidateQueries();
      }, q.data?.isEmergencyStopped ? "Đã tiếp tục hệ thống." : "Đã dừng hệ thống."); }} />
      {action.feedback}
    </Card>
    {screens.map(([screen, title]) => <Btn key={screen} title={title} secondary onPress={() => router.push({ pathname: "/screens/[screen]", params: { screen } })} />)}
    <Btn title="Đăng xuất" secondary disabled={action.busy} onPress={() => { void action.run(async () => { await signOut(); client.clear(); }, "Đã đăng xuất."); }} />
  </Body>;
}
