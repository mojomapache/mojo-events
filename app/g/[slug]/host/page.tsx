import HostClient from "./HostClient";

export default function HostPage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { key?: string };
}) {
  return <HostClient slug={params.slug} hostKey={searchParams.key ?? ""} />;
}
