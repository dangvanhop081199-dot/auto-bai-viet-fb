import { useLocalSearchParams } from "expo-router";
import { Body, Title } from "@/components/bazan-ui";
import { PostsScreen } from "@/components/posts-screen";
import { BlockedScreen, ConnectionsScreen, GroupsScreen, TemplatesScreen } from "@/components/resources-screen";
import { ActivityScreen, GeminiScreen, ProfileScreen, UsageScreen } from "@/components/system-screens";

export default function Screen() {
  const { screen } = useLocalSearchParams<{ screen: string }>();
  const screens = { posts: PostsScreen, groups: GroupsScreen, templates: TemplatesScreen, blocked: BlockedScreen, connections: ConnectionsScreen, gemini: GeminiScreen, usage: UsageScreen, activity: ActivityScreen, profile: ProfileScreen };
  const Component = screens[screen as keyof typeof screens];
  return Component ? <Component /> : <Body><Title>Không tìm thấy màn hình</Title></Body>;
}
