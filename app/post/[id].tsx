import React, { useState } from "react";
import { Image, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { analyzePost, createBlocked, createLead, recordPostAction, updatePost, useGetGemini, useGetMe, useGetPost, useListTemplates, type Post } from "@workspace/api-client-react";
import * as Clipboard from "expo-clipboard";
import { Body, Btn, Card, Field, labels, Notice, QueryState, Title, Txt, useAction } from "@/components/bazan-ui";

function PostDetail({ post }: { post: Post }) {
  const client = useQueryClient();
  const me = useGetMe({ query: { refetchInterval: 10000 } });
  const config = useGetGemini();
  const templates = useListTemplates();
  const [comment, setComment] = useState(post.suggestedComment ?? "");
  const action = useAction();
  const disabled = action.busy || me.data?.isEmergencyStopped !== false;
  async function mutate(call: () => Promise<unknown>, message = "Đã cập nhật bài viết.") {
    await action.run(async () => { await call(); await client.invalidateQueries(); }, message);
  }
  return <Body><Title>{post.authorName || "Chi tiết bài viết"}</Title><Txt muted>{post.groupNameRaw || "Nhập thủ công"}</Txt>
    <Card><Txt>{post.content || "Bài viết không có nội dung văn bản."}</Txt>{post.imageUrls?.map((uri, index) => <Image key={index} source={{ uri }} style={{ width: "100%", height: 180 }} resizeMode="contain" />)}<Txt>{labels[post.processStatus]} · {labels[post.aiCategory]}</Txt>
      <Txt>{post.routeSummary || "Chưa rõ tuyến"} · {labels[post.serviceType]} · {labels[post.urgencyLevel]}</Txt><Txt>Điểm đón: {post.pickupLocation || "Chưa rõ"}</Txt><Txt>Điểm đến: {post.dropoffLocation || "Chưa rõ"}</Txt><Txt>Thời gian: {post.travelDateTime || "Chưa rõ"} · {post.passengerCount ?? "?"} khách</Txt><Txt>Điện thoại: {post.extractedPhone || "Chưa có"}</Txt><Txt>Điểm cơ hội {post.leadScore}/100 · Tin cậy {Math.round(post.confidenceScore * 100)}%</Txt><Txt muted>{post.aiReasoning || "Chưa phân tích bằng Gemini."}</Txt>
      {config.data && post.confidenceScore < config.data.minConfidenceAuto && <Notice text="Độ tin cậy thấp hơn ngưỡng. Kiểm tra kỹ trước khi liên hệ." />}
      {post.processingError && <Notice text={post.processingError} error />}
      <Btn title="Phân tích bằng Gemini" disabled={disabled || ["COMMENTED", "SKIPPED"].includes(post.processStatus)} onPress={() => { void mutate(async () => { const updated = await analyzePost(post.id); setComment(updated.suggestedComment ?? ""); }, "Đã phân tích bài viết."); }} />
    </Card>
    <Card><Title>Bình luận gợi ý</Title><Field label="Nội dung đã kiểm tra" value={comment} onChange={setComment} multiline />
      {templates.data?.filter((t) => t.isActive).map((t) => <Btn key={t.id} title={`Dùng mẫu: ${t.title}`} secondary disabled={disabled} onPress={() => { void mutate(async () => { const updated = await updatePost(post.id, { templateId: t.id }); setComment(updated.suggestedComment ?? ""); }); }} />)}
      <Btn title="Lưu bình luận" disabled={disabled || !comment.trim()} onPress={() => { void mutate(() => updatePost(post.id, { suggestedComment: comment })); }} />
      <Btn title="Sao chép bình luận" secondary disabled={disabled || !comment.trim()} onPress={() => { void mutate(async () => {
        await updatePost(post.id, { suggestedComment: comment }); await recordPostAction(post.id, { action: "COPY_COMMENT" }); await Clipboard.setStringAsync(comment);
      }, "Đã sao chép. Bạn tự dán và gửi trên Facebook."); }} />
      <Btn title="Mở bài viết gốc" secondary disabled={disabled || !post.normalizedUrl} onPress={() => { void mutate(async () => { const result = await recordPostAction(post.id, { action: "OPEN_ORIGINAL" }); if (result.url) await Linking.openURL(result.url); }, "Đã mở bài gốc. Chỉ xác nhận sau khi bạn gửi bình luận."); }} />
      <Btn title="Tôi đã gửi bình luận" disabled={disabled || !comment.trim() || post.processStatus === "COMMENTED"} onPress={() => { void mutate(() => updatePost(post.id, { suggestedComment: comment, processStatus: "COMMENTED" }), "Đã ghi nhận bạn xác nhận bình luận; không gửi tự động."); }} />
      <Btn title="Bỏ qua bài viết" secondary disabled={disabled || post.processStatus === "SKIPPED"} onPress={() => { void mutate(() => updatePost(post.id, { processStatus: "SKIPPED" })); }} />
    </Card>
    <Btn title="Thêm khách vào CRM" disabled={action.busy} onPress={() => { void mutate(() => createLead({ postId: post.id }), "Đã thêm khách hàng vào CRM."); }} />
    <Btn title="Chặn tác giả này" secondary disabled={action.busy || ![post.authorFbId, post.authorName, post.authorProfileUrl].some(Boolean)} onPress={() => { void mutate(() => createBlocked({ fbUserId: post.authorFbId, displayName: post.authorName, profileUrl: post.authorProfileUrl, reason: "Chặn từ bài viết", isActive: true }), "Đã chặn tác giả. Bài được ẩn khỏi danh sách."); }} />
    {action.feedback}
  </Body>;
}
export default function PostPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useGetPost(id, { query: { enabled: Boolean(id), staleTime: 10000 } });
  if (!q.data) return <Body><QueryState loading={q.isLoading} error={q.error} retry={() => { void q.refetch(); }} /></Body>;
  return <PostDetail key={q.data.id} post={q.data} />;
}
