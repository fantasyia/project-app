import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Grid3X3, Lock, MessageCircle, Heart, ArrowLeft } from "lucide-react";
import { createServiceClient } from "@/lib/supabase/service";
import { getCurrentUser } from "@/lib/actions/auth";
import { getSubscriptionAccess } from "@/lib/auth/entitlement";
import { getCreatorIdentityMap } from "@/lib/identity/context-profiles";
import { parsePostMediaAsset, sanitizePersistedAvatarUrl } from "@/lib/media/post-media";
import { FollowCreatorButton } from "./follow-creator-button";
import { PpvUnlockButton } from "./ppv-unlock-button";

const roleRoutes: Record<string, string> = {
  subscriber: "/dashboard/user/feed",
  creator: "/dashboard/creator/studio",
  affiliate: "/dashboard/affiliate/overview",
  admin: "/dashboard/admin/overview",
  editor: "/dashboard/blog",
};

type CreatorProfileDetails = {
  kyc_status?: string | null;
  subscription_price?: string | null;
  is_accepting_tips?: boolean | null;
};

type CreatorRecord = {
  id: string;
  display_name: string | null;
  handle: string | null;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  website_url: string | null;
};

type CreatorPostRecord = {
  id: string;
  content: string | null;
  media_url: string | null;
  access_tier: string;
  post_type: string;
  price: string | null;
  created_at: string;
  likes?: Array<{ user_id: string }> | null;
  comments?: Array<{ id: string }> | null;
};

type CreatorPlan = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string | null;
};

function normalizePublicHandle(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getPlanPriceSuffix(plan: CreatorPlan) {
  const source = `${plan.name} ${plan.description || ""}`.toLowerCase();

  if (/(anual|annual|yearly|12\s*mes|12x)/.test(source)) return "/ano";
  if (/(trimestral|quarter|quarterly|3\s*mes|3x)/.test(source)) return "/trim";

  return "/mês";
}

function toRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readCreatorMetadataIdentity(metadata: unknown) {
  const creatorProfile = toRecord(toRecord(metadata).creator_profile);
  if (Object.keys(creatorProfile).length === 0) return null;

  return {
    display_name: readText(creatorProfile.display_name),
    handle: readText(creatorProfile.handle),
    bio: readText(creatorProfile.bio),
    avatar_url: sanitizePersistedAvatarUrl(readText(creatorProfile.avatar_url)),
  };
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return { title: `@${handle} | Fantasyia` };
}

export default async function CreatorPublicProfile({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/${handle}`);
  if (user.role !== "subscriber") redirect(roleRoutes[user.role] || "/dashboard/user/feed");

  const publicCatalog = createServiceClient();
  const normalizedRequestedHandle = normalizePublicHandle(handle);

  const { data: creatorUsers, error } = await publicCatalog
    .from("users")
    .select("id, display_name, handle, role, bio, avatar_url, website_url")
    .limit(500);

  if (error || !creatorUsers?.length) return notFound();

  const rawCreators = creatorUsers as CreatorRecord[];
  const creatorIdentityMap = await getCreatorIdentityMap(
    publicCatalog,
    rawCreators.map((creator) => creator.id)
  );
  const creators = await Promise.all(rawCreators.map(async (creator) => {
    const identity = creatorIdentityMap.get(creator.id);
    const metadataIdentity = identity
      ? null
      : await publicCatalog.auth.admin
          .getUserById(creator.id)
          .then(({ data }) => readCreatorMetadataIdentity(data.user?.user_metadata))
          .catch(() => null);
    const resolvedIdentity = identity || metadataIdentity;

    return {
      ...creator,
      display_name: resolvedIdentity?.display_name || creator.display_name,
      handle: resolvedIdentity?.handle || creator.handle,
      bio: resolvedIdentity?.bio ?? creator.bio,
      avatar_url: sanitizePersistedAvatarUrl(resolvedIdentity?.avatar_url || creator.avatar_url),
    };
  }));

  const creatorRecord =
    creators.find((candidate) => candidate.handle === handle) ||
    creators.find((candidate) => (candidate.handle || "").toLowerCase() === handle.toLowerCase()) ||
    creators.find((candidate) => {
      const normalizedCandidateHandle = normalizePublicHandle(candidate.handle || "");
      const normalizedDisplayName = normalizePublicHandle(candidate.display_name || "");

      return (
        normalizedCandidateHandle === normalizedRequestedHandle ||
        normalizedDisplayName === normalizedRequestedHandle
      );
    });

  if (!creatorRecord) return notFound();

  const [creatorProfileSignal, creatorPostsSignal, creatorPlansSignal] = await Promise.all([
    publicCatalog
      .from("creator_profiles")
      .select("user_id")
      .eq("user_id", creatorRecord.id)
      .maybeSingle(),
    publicCatalog
      .from("posts")
      .select("id", { head: true, count: "exact" })
      .eq("author_id", creatorRecord.id),
    publicCatalog
      .from("subscription_plans")
      .select("id", { head: true, count: "exact" })
      .eq("creator_id", creatorRecord.id),
  ]);

  const hasCreatorSignal =
    creatorRecord.role === "creator" ||
    creatorRecord.role === "admin" ||
    Boolean(creatorProfileSignal.data) ||
    (creatorPostsSignal.count || 0) > 0 ||
    (creatorPlansSignal.count || 0) > 0;

  if (!hasCreatorSignal) return notFound();
  let profileDetails: CreatorProfileDetails | null = null;

  const creatorProfileQuery = await publicCatalog
    .from("creator_profiles")
    .select("*")
    .eq("user_id", creatorRecord.id)
    .maybeSingle();

  if (!creatorProfileQuery.error && creatorProfileQuery.data) {
    const rawProfile = creatorProfileQuery.data as Record<string, unknown>;
    profileDetails = {
      kyc_status:
        typeof rawProfile.kyc_status === "string"
          ? rawProfile.kyc_status
          : null,
      subscription_price:
        typeof rawProfile.subscription_price === "string"
          ? rawProfile.subscription_price
          : typeof rawProfile.price === "string"
            ? rawProfile.price
            : null,
      is_accepting_tips:
        typeof rawProfile.is_accepting_tips === "boolean"
          ? rawProfile.is_accepting_tips
          : null,
    };
  }

  const subscriptionAccess = user
    ? await getSubscriptionAccess(user.id, creatorRecord.id)
    : { hasAccess: false, status: null };
  const isSubscribed = subscriptionAccess.hasAccess;
  const isTrialing = subscriptionAccess.status === "trialing";
  const isPrivilegedViewer = user.id === creatorRecord.id;

  const { data: plansData } = await publicCatalog
    .from("subscription_plans")
    .select("id, name, description, price, currency")
    .eq("creator_id", creatorRecord.id)
    .eq("is_active", true)
    .order("price", { ascending: true });
  const plans = (plansData || []) as CreatorPlan[];

  const { data: posts } = await publicCatalog
    .from("posts")
    .select("id, content, media_url, access_tier, post_type, price, created_at, likes(user_id), comments(id)")
    .eq("author_id", creatorRecord.id)
    .order("created_at", { ascending: false })
    .limit(30);

  const postIds = ((posts || []) as CreatorPostRecord[]).map((post) => post.id);
  const [unlockSignal, followSignal] = await Promise.all([
    postIds.length > 0
      ? publicCatalog
          .from("ppv_unlocks")
          .select("post_id")
          .eq("subscriber_id", user.id)
          .in("post_id", postIds)
      : Promise.resolve({ data: [] }),
    publicCatalog
      .from("follows")
      .select("follower_id")
      .eq("follower_id", user.id)
      .eq("following_id", creatorRecord.id)
      .maybeSingle(),
  ]);
  const unlockedPostIds = new Set(
    ((unlockSignal.data || []) as Array<{ post_id: string | null }>).flatMap((unlock) =>
      unlock.post_id ? [unlock.post_id] : []
    )
  );
  const isFollowing = Boolean(followSignal.data);

  const enhancedPosts = ((posts || []) as CreatorPostRecord[]).map((p) => {
    const isPpv = Number.parseFloat(p.price || "0") > 0;
    const hasAccess =
      isPrivilegedViewer ||
      p.access_tier === "free" ||
      (p.access_tier === "premium" && !isPpv && isSubscribed) ||
      (isPpv && unlockedPostIds.has(p.id));
    const mediaAsset = parsePostMediaAsset(p.media_url);

    return {
      ...p,
      isLocked: !hasAccess,
      isPpv,
      content: hasAccess ? p.content : "Conteúdo Exclusivo",
      media_url: hasAccess ? mediaAsset.mediaUrl : null,
      preview_media_url: mediaAsset.posterUrl || mediaAsset.mediaUrl,
      is_video: p.post_type === "video" || mediaAsset.isVideo,
      poster_url: mediaAsset.posterUrl,
    };
  });

  const totalPosts = enhancedPosts.length;
  const totalPhotos = enhancedPosts.filter((p) => p.preview_media_url).length;
  const totalLikes = enhancedPosts.reduce(
    (sum, p) => sum + (p.likes?.length || 0),
    0
  );
  const bannerMediaUrl =
    enhancedPosts.find((post) => post.preview_media_url)?.preview_media_url ||
    creatorRecord.avatar_url;

  return (
    <div className="flex flex-col bg-black pb-20">
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-b from-brand-700/40 to-black">
        {bannerMediaUrl ? (
          <Image
            src={bannerMediaUrl}
            alt={`Banner de ${creatorRecord.display_name || "creator"}`}
            fill
            unoptimized
            priority
            className="scale-110 object-cover opacity-55 blur-sm"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,255,156,0.16),_transparent_42%),linear-gradient(180deg,_rgba(0,0,0,0.08),_#000_92%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        <Link
          href="/dashboard/user/feed"
          className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm"
          aria-label="Voltar para o feed"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="absolute bottom-8 left-4 right-4 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-300">
            Perfil do creator
          </p>
          <p className="mt-2 text-xs leading-5 text-brand-text-muted">
            Conteudos livres aparecem abertos. Assinatura e PPV continuam protegidos.
          </p>
        </div>
      </div>

      {/* Profile Info */}
      <div className="relative px-4">
        {/* Avatar */}
        <div className="-mt-14 mb-3 flex justify-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-black bg-brand-surface-high">
            {creatorRecord.avatar_url ? (
              <Image
                src={creatorRecord.avatar_url}
                alt={creatorRecord.display_name || "Creator"}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-brand-500/20 text-2xl font-bold text-brand-500">
                {creatorRecord.display_name?.[0]?.toUpperCase() || "C"}
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">{creatorRecord.display_name || "Creator"}</h1>
          <p className="mt-0.5 text-sm text-brand-text-muted">@{creatorRecord.handle || "creator"}</p>
        </div>

        {/* Bio */}
        {creatorRecord.bio && (
          <p className="mt-3 text-center text-sm leading-relaxed text-brand-text-base">{creatorRecord.bio}</p>
        )}

        {/* Subscription Badge */}
        {isSubscribed && (
          <div className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-400">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
            {isTrialing ? "Trial Ativo" : "Assinatura Ativa"}
          </div>
        )}

        {/* Action Buttons */}
        {user.id !== creatorRecord.id && (
          <div className="mt-4 flex gap-2">
            <FollowCreatorButton creatorId={creatorRecord.id} initialFollowing={isFollowing} />
            <Link
              href={`/dashboard/user/messages?with=${creatorRecord.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"
            >
              <MessageCircle size={16} />
              Direct
            </Link>
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {!isSubscribed && user?.id !== creatorRecord.id && plans.length > 0 ? (
            <Link
              href={`/checkout/${plans[0].id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-black transition hover:bg-brand-400"
            >
              Assinar · R$ {plans[0].price}{getPlanPriceSuffix(plans[0])}
            </Link>
          ) : null}
        </div>

        {/* More Plans */}
        {!isSubscribed && user?.id !== creatorRecord.id && plans.length > 1 && (
          <div className="mt-2 space-y-1.5">
            {plans.slice(1).map((plan) => (
              <Link key={plan.id} href={`/checkout/${plan.id}`}
                className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] px-4 py-2.5 text-sm transition hover:bg-white/[0.03]"
              >
                <span className="text-white">{plan.name}</span>
                <span className="font-semibold text-brand-400">R$ {plan.price}{getPlanPriceSuffix(plan)}</span>
              </Link>
            ))}
          </div>
        )}

        {!isSubscribed && user?.id !== creatorRecord.id && plans.length === 0 && profileDetails?.subscription_price && (
          <p className="mt-3 text-center text-xs text-brand-text-muted">
            Plano base: R$ {profileDetails.subscription_price}/mês
          </p>
        )}
      </div>

      {/* Stats Row */}
      <div className="mt-5 flex items-center justify-center gap-8 border-y border-white/[0.06] py-3">
        <div className="text-center">
          <p className="text-base font-bold text-white">{totalPosts}</p>
          <p className="text-[10px] text-brand-text-muted">Posts</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-white">{totalPhotos}</p>
          <p className="text-[10px] text-brand-text-muted">Fotos</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-white">{totalLikes}</p>
          <p className="text-[10px] text-brand-text-muted">Curtidas</p>
        </div>
      </div>

      {/* Content Tabs */}
      <div className="flex border-b border-white/[0.06]">
        <button className="flex flex-1 items-center justify-center gap-1.5 border-b-2 border-white py-3 text-xs font-semibold text-white">
          <Grid3X3 size={16} />
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 py-3 text-xs text-brand-text-muted">
          <Heart size={16} />
        </button>
      </div>

      {/* Media Grid (3 columns) */}
      {enhancedPosts.length === 0 ? (
        <div className="py-16 text-center text-sm text-brand-text-muted">Nada publicado ainda.</div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5">
          {enhancedPosts.map((post) => (
            <div key={post.id} className="group relative aspect-square overflow-hidden bg-brand-surface-lowest">
              {post.isLocked ? (
                <div className="relative h-full w-full">
                  {post.preview_media_url ? (
                    post.is_video && (post.media_url || post.preview_media_url) ? (
                      <video
                        src={post.media_url || post.preview_media_url || undefined}
                        poster={post.poster_url || undefined}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full scale-105 object-cover blur-md"
                      />
                    ) : (
                      <Image
                        src={post.preview_media_url}
                        alt="Preview bloqueado"
                        fill
                        unoptimized
                        className="scale-105 object-cover blur-md"
                      />
                    )
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-brand-surface-low to-black/80" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 px-2 text-center">
                    <Lock size={18} className="mb-1 text-brand-text-muted" />
                    <span className="text-[9px] font-semibold text-brand-text-muted">
                      {post.isPpv ? `PPV R$ ${post.price}` : "Conteudo para assinantes"}
                    </span>
                    {post.isPpv ? (
                      user ? (
                        <PpvUnlockButton postId={post.id} price={post.price ?? "0"} />
                      ) : (
                        <Link href="/login" className="mt-1.5 text-[10px] text-brand-400 hover:underline">
                          Entrar
                        </Link>
                      )
                    ) : null}
                  </div>
                </div>
              ) : post.media_url ? (
                post.is_video ? (
                  <video
                    src={post.media_url}
                    poster={post.poster_url || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Image src={post.media_url} alt="Post" fill unoptimized className="object-cover" />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-brand-surface-low">
                  <p className="line-clamp-3 px-2 text-center text-[10px] text-brand-text-muted">
                    {post.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}


    </div>
  );
}
