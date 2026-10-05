import { SchedulePage } from "./SchedulePage";

export default async function Page({
  params,
}: PageProps<"/sessions/schedule/[exchangeRequestId]">) {
  const { exchangeRequestId } = await params;
  return <SchedulePage exchangeRequestId={exchangeRequestId} />;
}
