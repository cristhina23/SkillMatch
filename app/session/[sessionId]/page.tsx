import { SessionDetailPage } from "./SessionDetailPage";

export default async function SessionPage({
  params,
}: PageProps<"/session/[sessionId]">) {
  const { sessionId } = await params;
  return <SessionDetailPage sessionId={sessionId} />;
}
