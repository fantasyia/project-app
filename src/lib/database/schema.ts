import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// =======================
// ENUMS
// =======================
export const roleEnum = pgEnum("user_role", ["admin", "creator", "subscriber", "affiliate", "writer"]);
export const postTypeEnum = pgEnum("post_type", ["video", "image", "article"]);
export const accessTierEnum = pgEnum("access_tier", ["free", "premium"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "past_due", "canceled", "trialing"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["pending", "completed", "failed"]);
export const chatMessageTypeEnum = pgEnum("chat_message_type", ["text", "media", "ppv_locked"]);

// =======================
// USERS & PROFILES TABLE
// =======================
// In Supabase, this typically connects 1:1 with auth.users via id
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: roleEnum("role").default("subscriber").notNull(),
  displayName: varchar("display_name", { length: 150 }).notNull(),
  handle: varchar("handle", { length: 50 }).notNull().unique(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_users_role").on(table.role),
  index("idx_users_handle").on(table.handle),
]);

export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  likes: many(likes),
  comments: many(comments),
  chatsAsParticipant1: many(chats, { relationName: "chat_p1" }),
  chatsAsParticipant2: many(chats, { relationName: "chat_p2" }),
  sentChatMessages: many(chatMessages, { relationName: "sender" }),
  affiliateLinks: many(affiliateLinks),
  creatorProfile: one(creatorProfiles, {
    fields: [users.id],
    references: [creatorProfiles.userId]
  }),
  subscriberProfile: one(subscriberProfiles, {
    fields: [users.id],
    references: [subscriberProfiles.userId]
  }),
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId]
  }),
  subscriptionsAsSubscriber: many(subscriptions, { relationName: "subscriber_subscriptions" }),
  subscriptionsAsCreator: many(subscriptions, { relationName: "creator_subscriptions" }),
  ppvUnlocks: many(ppvUnlocks, { relationName: "subscriber_ppv" })
}));

// =======================
// CREATOR PROFILES
// =======================
export const creatorProfiles = pgTable("creator_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  stripeAccountId: varchar("stripe_account_id", { length: 255 }),
  kycStatus: varchar("kyc_status", { length: 50 }).default("pending").notNull(),
  publicDisplayName: varchar("public_display_name", { length: 150 }),
  publicHandle: varchar("public_handle", { length: 50 }),
  publicBio: text("public_bio"),
  publicAvatarUrl: text("public_avatar_url"),
  subscriptionPrice: text("subscription_price"), 
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  isAcceptingTips: boolean("is_accepting_tips").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriberProfiles = pgTable("subscriber_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  displayName: varchar("display_name", { length: 150 }),
  handle: varchar("handle", { length: 50 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subscriber_profiles_user_id").on(table.userId),
]);

export const creatorProfilesRelations = relations(creatorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [creatorProfiles.userId],
    references: [users.id],
  }),
}));

export const subscriberProfilesRelations = relations(subscriberProfiles, ({ one }) => ({
  user: one(users, {
    fields: [subscriberProfiles.userId],
    references: [users.id],
  }),
}));

// =======================
// WALLETS
// =======================
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  balance: text("balance").default("0").notNull(), 
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

// =======================
// MONETIZATION (SUBS & PPV)
// =======================

export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  price: text("price").notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionPlansRelations = relations(subscriptionPlans, ({ one, many }) => ({
  creator: one(users, {
    fields: [subscriptionPlans.creatorId],
    references: [users.id],
  }),
  subscriptions: many(subscriptions),
}));

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  creatorId: uuid("creator_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  planId: uuid("plan_id")
    .references(() => subscriptionPlans.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_subscriptions_status_end").on(table.status, table.currentPeriodEnd),
  index("idx_subscriptions_users").on(table.subscriberId, table.creatorId),
]);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  subscriber: one(users, {
    fields: [subscriptions.subscriberId],
    references: [users.id],
    relationName: "subscriber_subscriptions"
  }),
  creator: one(users, {
    fields: [subscriptions.creatorId],
    references: [users.id],
    relationName: "creator_subscriptions"
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const ppvUnlocks = pgTable("ppv_unlocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriberId: uuid("subscriber_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  creatorId: uuid("creator_id") 
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "set null" }),
  messageId: uuid("message_id")
    .references(() => chatMessages.id, { onDelete: "set null" }),
  amountPaid: text("amount_paid").notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_ppv_subscriber").on(table.subscriberId),
]);

export const ppvUnlocksRelations = relations(ppvUnlocks, ({ one }) => ({
  subscriber: one(users, {
    fields: [ppvUnlocks.subscriberId],
    references: [users.id],
    relationName: "subscriber_ppv"
  }),
  creator: one(users, {
    fields: [ppvUnlocks.creatorId],
    references: [users.id],
  }),
  post: one(posts, {
    fields: [ppvUnlocks.postId],
    references: [posts.id],
  }),
  message: one(chatMessages, {
    fields: [ppvUnlocks.messageId],
    references: [chatMessages.id],
  }),
}));

// =======================
// POSTS (Feed Content)
// =======================
export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content"),
  postType: postTypeEnum("post_type").notNull(),
  accessTier: accessTierEnum("access_tier").default("free").notNull(),
  price: text("price"), // Used for PPV
  mediaUrl: text("media_url"), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("idx_posts_author_id").on(table.authorId),
  index("idx_posts_created_at").on(table.createdAt),
]);

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  likes: many(likes),
  comments: many(comments),
  affiliateLinks: many(affiliateLinks),
}));

// =======================
// SOCIAL INTERACTIONS
// =======================
export const likes = pgTable("likes", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.postId] }),
  index("idx_likes_post_id").on(table.postId),
]);

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, { fields: [likes.userId], references: [users.id] }),
  post: one(posts, { fields: [likes.postId], references: [posts.id] }),
}));

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_comments_post_id").on(table.postId),
  index("idx_comments_created_at").on(table.createdAt),
]);

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

// =======================
// CHATS & DMs (Canônico)
// =======================
export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  participant1Id: uuid("participant1_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  participant2Id: uuid("participant2_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("idx_chats_participants").on(table.participant1Id, table.participant2Id),
]);

export const chatsRelations = relations(chats, ({ one, many }) => ({
  participant1: one(users, { fields: [chats.participant1Id], references: [users.id], relationName: "chat_p1" }),
  participant2: one(users, { fields: [chats.participant2Id], references: [users.id], relationName: "chat_p2" }),
  messages: many(chatMessages),
}));

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chat_id")
    .references(() => chats.id, { onDelete: "cascade" })
    .notNull(),
  senderId: uuid("sender_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  messageType: chatMessageTypeEnum("message_type").default("text").notNull(),
  content: text("content"),
  mediaUrl: text("media_url"),
  price: text("price"),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_chat_messages_chat").on(table.chatId),
  index("idx_chat_messages_sender").on(table.senderId),
]);

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  chat: one(chats, { fields: [chatMessages.chatId], references: [chats.id] }),
  sender: one(users, { fields: [chatMessages.senderId], references: [users.id], relationName: "sender" }),
  ppvUnlocks: many(ppvUnlocks),
}));

// =======================
// AFFILIATE TRACKING
// =======================
export const affiliateLinks = pgTable("affiliate_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  affiliateId: uuid("affiliate_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  creatorId: uuid("creator_id")
    .references(() => users.id, { onDelete: "set null" }),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "set null" }), 
  utmCode: varchar("utm_code", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_affiliates_utm").on(table.utmCode),
]);

export const affiliateLinksRelations = relations(affiliateLinks, ({ one, many }) => ({
  affiliate: one(users, {
    fields: [affiliateLinks.affiliateId],
    references: [users.id],
    relationName: "affiliate_user"
  }),
  creator: one(users, {
    fields: [affiliateLinks.creatorId],
    references: [users.id],
    relationName: "affiliate_creator"
  }),
  post: one(posts, {
    fields: [affiliateLinks.postId],
    references: [posts.id],
  }),
  trackingEvents: many(affiliateTracking),
  commissions: many(affiliateCommissions),
}));

export const affiliateTracking = pgTable("affiliate_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  linkId: uuid("link_id")
    .references(() => affiliateLinks.id, { onDelete: "cascade" })
    .notNull(),
  ipHash: varchar("ip_hash", { length: 255 }), // Hash IP for privacy
  userAgent: text("user_agent"),
  convertedUserId: uuid("converted_user_id")
    .references(() => users.id, { onDelete: "set null" }), 
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isConversion: boolean("is_conversion").default(false).notNull(),
}, (table) => [
  index("idx_affiliate_tracking_link").on(table.linkId),
]);

export const affiliateTrackingRelations = relations(affiliateTracking, ({ one }) => ({
  link: one(affiliateLinks, {
    fields: [affiliateTracking.linkId],
    references: [affiliateLinks.id],
  }),
  convertedUser: one(users, {
    fields: [affiliateTracking.convertedUserId],
    references: [users.id],
  }),
}));

// =======================
// AFFILIATE COMMISSIONS
// =======================
export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  affiliateId: uuid("affiliate_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  linkId: uuid("link_id")
    .references(() => affiliateLinks.id, { onDelete: "set null" }),
  subscriptionId: uuid("subscription_id")
    .references(() => subscriptions.id, { onDelete: "set null" }),
  amount: text("amount").notNull(),
  commissionRate: text("commission_rate").notNull(),
  currency: varchar("currency", { length: 10 }).default("BRL").notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_affiliate_commissions_affiliate").on(table.affiliateId),
]);

export const affiliateCommissionsRelations = relations(affiliateCommissions, ({ one }) => ({
  affiliate: one(users, {
    fields: [affiliateCommissions.affiliateId],
    references: [users.id],
  }),
  link: one(affiliateLinks, {
    fields: [affiliateCommissions.linkId],
    references: [affiliateLinks.id],
  }),
  subscription: one(subscriptions, {
    fields: [affiliateCommissions.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// =======================
// ADDITIONAL SOCIAL & BLOG
// =======================
export const follows = pgTable("follows", {
  followerId: uuid("follower_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  followingId: uuid("following_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.followerId, table.followingId] }),
  index("idx_follows_following_id").on(table.followingId),
]);

export const favorites = pgTable("favorites", {
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  postId: uuid("post_id")
    .references(() => posts.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.postId] }),
]);

export const blogArticles = pgTable("blog_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  coverImageUrl: text("cover_image_url"),
  status: varchar("status", { length: 50 }).default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});
