import React, { useState } from "react";
import { router } from "expo-router";
import { useListPosts } from "@workspace/api-client-react";
import { Body, Btn, Card, Choices, date, Field, labels, QueryState, Title, Txt } from "./bazan-ui";

export function PostsScreen({ review = false }: { review?: boolean }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const q = useListPosts({ search, ...(review ? { status: "READY_TO_COMMENT" } : {}), ...(category ? { category } : {}) }, { query: { refetchInterval: 30000, staleTime: 15000 } });
  return <Body><Title>{review ? "Duyệt bình luận" : "Bài viết đã nhận"}</Title><Txt muted>{review ? "Kiểm tra gợi ý trước khi tự gửi trên Facebook." : "Tìm kiếm, phân loại và xử lý bài viết thật."}</Txt>
    <Field label="Tìm nội dung, tác giả, tuyến đường" value={search} onChange={setSearch} />
    <Choices value={category} options={["", "CUSTOMER_NEED_CAR", "DRIVER_FIND_PASSENGER", "IRRELEVANT", "UNCERTAIN"]} onChange={setCategory} />
    <QueryState loading={q.isLoading} error={q.error} retry={() => { void q.refetch(); }} empty={q.data?.length === 0} />
    {q.data?.map((post) => <Card key={post.id}><Txt>{post.authorName || "Chưa rõ tác giả"} · {post.groupNameRaw || "Nhập thủ công"}</Txt><Txt muted>{date(post.createdAt)}</Txt>
      <Txt>{post.content.slice(0, 320) || "Bài viết bằng hình ảnh hoặc liên kết"}</Txt>
      <Txt>{labels[post.aiCategory] ?? post.aiCategory} · {post.leadScore}/100</Txt>
      <Txt muted>{labels[post.processStatus]} · {post.routeSummary || "Chưa xác định tuyến"}</Txt>
      <Btn title={review ? "Xem và duyệt" : "Chi tiết bài viết"} secondary onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })} />
    </Card>)}
  </Body>;
}
