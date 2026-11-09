import React, { useState } from "react";
import { Image, Platform, View } from "react-native";
import { router } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { ingestPost, importPosts, useGetMe, type ImportResult, type IngestResult } from "@workspace/api-client-react";
import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { Body, Btn, Card, Choices, Field, Notice, Title, Txt, useAction } from "./bazan-ui";

export function IngestScreen() {
  const client = useQueryClient();
  const me = useGetMe({ query: { refetchInterval: 15000 } });
  const [content, setContent] = useState("");
  const [normalizedUrl, setUrl] = useState("");
  const [authorName, setName] = useState("");
  const [authorFbId, setAuthorId] = useState("");
  const [authorProfileUrl, setProfile] = useState("");
  const [groupUidRaw, setGroupUid] = useState("");
  const [groupNameRaw, setGroupName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [mode, setMode] = useState("Dán bài viết");
  const [format, setFormat] = useState("txt");
  const [fileContent, setFileContent] = useState("");
  const [result, setResult] = useState<IngestResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const action = useAction();
  const stopped = me.data?.isEmergencyStopped ?? true;
  const pickImages = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: 4 - images.length, base64: true, quality: 0.7 });
    if (picked.canceled) return;
    const next = picked.assets.map((asset) => {
      if (!asset.base64 || asset.base64.length > 4_000_000) throw new Error("Ảnh quá lớn hoặc không đọc được. Mỗi ảnh tối đa 3 MB.");
      return `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`;
    });
    setImages((prev) => [...prev, ...next].slice(0, 4));
  };
  const pickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ["text/*", "application/json", "application/octet-stream"], copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0]!;
    if ((asset.size ?? 0) > 1_000_000) throw new Error("File tối đa 1 MB.");
    const extension = asset.name.split(".").pop()?.toLowerCase();
    if (!["csv", "txt", "json"].includes(extension ?? "")) throw new Error("Chỉ hỗ trợ CSV, TXT, JSON.");
    const text = Platform.OS === "web" && asset.file ? await asset.file.text() : await new File(asset.uri).text();
    setFileContent(text); setFormat(extension!);
  };
  return <Body><Title>Tiếp nhận bài viết</Title><Txt muted>Chỉ nhập bài viết bạn có quyền sử dụng. Liên kết không được cào tự động.</Txt>
    <Choices value={mode} options={["Dán bài viết", "Nhập file"]} onChange={setMode} />
    {stopped && <Notice text={me.isLoading ? "Đang kiểm tra trạng thái hệ thống…" : "Hệ thống đang dừng hoặc chưa tải được trạng thái. Mở Menu để kiểm tra."} error />}
    {mode === "Dán bài viết" ? <Card>
      <Btn title="Dán từ bộ nhớ tạm" secondary disabled={action.busy || stopped} onPress={() => { void action.run(async () => { setContent(await Clipboard.getStringAsync()); }, "Đã dán nội dung; kiểm tra trước khi lưu."); }} />
      <Field label="Nội dung bài viết" value={content} onChange={setContent} multiline />
      <Field label="Liên kết bài viết gốc" value={normalizedUrl} onChange={setUrl} />
      <Field label="Tên tác giả" value={authorName} onChange={setName} />
      <Field label="Facebook UID tác giả" value={authorFbId} onChange={setAuthorId} />
      <Field label="Trang cá nhân tác giả" value={authorProfileUrl} onChange={setProfile} />
      <Field label="UID nhóm" value={groupUidRaw} onChange={setGroupUid} />
      <Field label="Tên nhóm" value={groupNameRaw} onChange={setGroupName} />
      <Btn title="Đính kèm ảnh (tối đa 4)" secondary disabled={action.busy || images.length >= 4} onPress={() => { void action.run(pickImages, "Đã chọn ảnh."); }} />
      {images.map((image, index) => <View key={index} style={{ gap: 8 }}><Image source={{ uri: image }} style={{ width: "100%", height: 140, borderRadius: 10 }} resizeMode="contain" /><Btn title={`Bỏ ảnh ${index + 1}`} secondary onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))} /></View>)}
      <Btn title={action.busy ? "Đang tiếp nhận…" : "Lưu và phân tích"} disabled={action.busy || stopped || !(content.trim() || normalizedUrl.trim() || images.length)} onPress={() => { void action.run(async () => {
        const value = await ingestPost({ content, normalizedUrl, authorName, authorFbId, authorProfileUrl, groupUidRaw, groupNameRaw, imageUrls: images });
        await client.invalidateQueries(); return value;
      }, "Đã tiếp nhận yêu cầu.", setResult); }} />
    </Card> : <Card>
      <Btn title="Chọn file CSV / TXT / JSON" secondary disabled={action.busy} onPress={() => { void action.run(pickFile, "Đã đọc file. Kiểm tra nội dung trước khi nhập."); }} />
      <Choices value={format} options={["csv", "txt", "json"]} onChange={setFormat} />
      <Txt muted>CSV: dòng tiêu đề content,authorName,normalizedUrl. JSON: mảng các bài viết. TXT: mỗi bài cách nhau một dòng trống. Tối đa 100 bài/file.</Txt>
      <Field label="Nội dung file" value={fileContent} onChange={setFileContent} multiline />
      <Btn title="Nhập vào hệ thống" disabled={action.busy || stopped || !fileContent.trim()} onPress={() => { void action.run(async () => {
        const value = await importPosts({ format: format as "csv" | "txt" | "json", content: fileContent });
        await client.invalidateQueries(); return value;
      }, "Đã xử lý file.", setImportResult); }} />
    </Card>}
    {action.feedback}
    {result && <Card><Title>{result.duplicate ? "Bài viết đã tồn tại" : "Đã lưu bài viết"}</Title><Notice text={result.message} /><Btn title="Xem bài viết" secondary onPress={() => router.push({ pathname: "/post/[id]", params: { id: result.post.id } })} /></Card>}
    {importResult && <Card><Txt>{importResult.imported} mới · {importResult.duplicates} trùng · {importResult.errors} lỗi</Txt>{importResult.results.map((r) => <Txt key={r.row}>Dòng {r.row}: {r.message}</Txt>)}</Card>}
  </Body>;
}
