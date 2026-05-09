import {
  getPublicSiloMetadata,
  PublicSiloPage,
} from "@/components/blog/public-silo-page";

export async function generateMetadata({ params }: { params: Promise<{ silo: string }> }) {
  const { silo } = await params;
  return getPublicSiloMetadata(silo);
}

export default async function SiloHubPage({ params }: { params: Promise<{ silo: string }> }) {
  const { silo } = await params;
  return <PublicSiloPage siloSlug={silo} />;
}
