import GuestClient from "./GuestClient";

export default function GuestPage({ params }: { params: { slug: string } }) {
  return <GuestClient slug={params.slug} />;
}
