import { v } from "convex/values";
import { isAuthorizedAdminUser } from "./adminAccess";
import { mutation, query, type MutationCtx } from "./_generated/server";

const socialPlatformValidator = v.union(
  v.literal("Instagram"),
  v.literal("Facebook"),
  v.literal("YouTube"),
  v.literal("X"),
  v.literal("TikTok"),
  v.literal("LinkedIn"),
  v.literal("Pinterest"),
  v.literal("WhatsApp"),
);

async function requireAdmin(ctx: MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!isAuthorizedAdminUser(user, identity.email))
    throw new Error("Forbidden");
}

export const getContent = query({
  args: {},
  returns: v.object({
    content: v.union(
      v.object({
        heroEyebrow: v.string(),
        heroTitle: v.string(),
        heroAccent: v.string(),
        heroIntro: v.string(),
        storyEyebrow: v.string(),
        storyTitle: v.string(),
        storyParagraphs: v.array(v.string()),
        storyImageStorageId: v.union(v.id("_storage"), v.null()),
        storyImageUrl: v.union(v.string(), v.null()),
        stats: v.array(
          v.object({
            value: v.string(),
            label: v.string(),
          }),
        ),
        values: v.array(
          v.object({
            title: v.string(),
            description: v.string(),
          }),
        ),
        ctaTitle: v.string(),
        ctaDescription: v.string(),
      }),
      v.null(),
    ),
    teamInitialized: v.boolean(),
  }),
  handler: async (ctx) => {
    const content = await ctx.db
      .query("aboutContent")
      .withIndex("by_key", (q) => q.eq("key", "about"))
      .unique();
    const teamState = await ctx.db
      .query("aboutTeamState")
      .withIndex("by_key", (q) => q.eq("key", "about"))
      .unique();
    if (!content) {
      return {
        content: null,
        teamInitialized: teamState?.teamInitialized ?? false,
      };
    }

    return {
      content: {
        heroEyebrow: content.heroEyebrow,
        heroTitle: content.heroTitle,
        heroAccent: content.heroAccent,
        heroIntro: content.heroIntro,
        storyEyebrow: content.storyEyebrow,
        storyTitle: content.storyTitle,
        storyParagraphs: content.storyParagraphs,
        storyImageStorageId: content.storyImageStorageId ?? null,
        storyImageUrl: content.storyImageStorageId
          ? await ctx.storage.getUrl(content.storyImageStorageId)
          : null,
        stats: content.stats,
        values: content.values,
        ctaTitle: content.ctaTitle,
        ctaDescription: content.ctaDescription,
      },
      teamInitialized: teamState?.teamInitialized ?? false,
    };
  },
});

export const listTeamMembers = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("aboutTeamMembers"),
      name: v.string(),
      role: v.string(),
      bio: v.string(),
      imageStorageId: v.union(v.id("_storage"), v.null()),
      imageUrl: v.union(v.string(), v.null()),
      order: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const members = await ctx.db
      .query("aboutTeamMembers")
      .withIndex("by_order")
      .take(30);
    return await Promise.all(
      members.map(async (member) => ({
        _id: member._id,
        name: member.name,
        role: member.role,
        bio: member.bio,
        imageStorageId: member.imageStorageId ?? null,
        imageUrl: member.imageStorageId
          ? await ctx.storage.getUrl(member.imageStorageId)
          : null,
        order: member.order,
      })),
    );
  },
});

export const saveContent = mutation({
  args: {
    heroEyebrow: v.string(),
    heroTitle: v.string(),
    heroAccent: v.string(),
    heroIntro: v.string(),
    storyEyebrow: v.string(),
    storyTitle: v.string(),
    storyParagraphs: v.array(v.string()),
    stats: v.array(
      v.object({
        value: v.string(),
        label: v.string(),
      }),
    ),
    values: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
      }),
    ),
    ctaTitle: v.string(),
    ctaDescription: v.string(),
    storyImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (
      args.storyParagraphs.length > 12 ||
      args.stats.length > 6 ||
      args.values.length > 8
    ) {
      throw new Error(
        "About content allows at most 12 story paragraphs, 6 stats, and 8 values",
      );
    }

    const current = await ctx.db
      .query("aboutContent")
      .withIndex("by_key", (q) => q.eq("key", "about"))
      .unique();
    const { storyImageStorageId, ...content } = args;

    if (current) {
      await ctx.db.patch(current._id, {
        ...content,
        ...(storyImageStorageId !== undefined
          ? { storyImageStorageId: storyImageStorageId ?? undefined }
          : {}),
      });
    } else {
      await ctx.db.insert("aboutContent", {
        key: "about",
        ...content,
        ...(storyImageStorageId ? { storyImageStorageId } : {}),
      });
    }
    return null;
  },
});

export const saveTeamMember = mutation({
  args: {
    id: v.optional(v.id("aboutTeamMembers")),
    name: v.string(),
    role: v.string(),
    bio: v.string(),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    order: v.number(),
  },
  returns: v.id("aboutTeamMembers"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, imageStorageId, ...fields } = args;

    if (id) {
      await ctx.db.patch(id, {
        ...fields,
        ...(imageStorageId !== undefined
          ? { imageStorageId: imageStorageId ?? undefined }
          : {}),
      });
      return id;
    }

    const currentMembers = await ctx.db
      .query("aboutTeamMembers")
      .withIndex("by_order")
      .take(30);
    if (currentMembers.length >= 30) {
      throw new Error("About team can contain at most 30 members");
    }

    return await ctx.db.insert("aboutTeamMembers", {
      ...fields,
      ...(imageStorageId ? { imageStorageId } : {}),
    });
  },
});

export const replaceTeamMembers = mutation({
  args: {
    members: v.array(
      v.object({
        name: v.string(),
        role: v.string(),
        bio: v.string(),
        imageStorageId: v.optional(v.id("_storage")),
        order: v.number(),
      }),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.members.length > 30) {
      throw new Error("About team can contain at most 30 members");
    }

    const currentMembers = await ctx.db
      .query("aboutTeamMembers")
      .withIndex("by_order")
      .take(31);
    if (currentMembers.length > 30) {
      throw new Error("Existing About team exceeds the replacement limit");
    }

    for (const member of currentMembers) {
      await ctx.db.delete(member._id);
    }
    for (const member of args.members) {
      await ctx.db.insert("aboutTeamMembers", member);
    }
    const state = await ctx.db
      .query("aboutTeamState")
      .withIndex("by_key", (q) => q.eq("key", "about"))
      .unique();
    if (state) {
      await ctx.db.patch(state._id, { teamInitialized: true });
    } else {
      await ctx.db.insert("aboutTeamState", {
        key: "about",
        teamInitialized: true,
      });
    }
    return null;
  },
});

export const removeTeamMember = mutation({
  args: { id: v.id("aboutTeamMembers") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
    return null;
  },
});

export const listSocialLinks = query({
  args: {},
  returns: v.array(
    v.object({
      platform: socialPlatformValidator,
      url: v.string(),
      order: v.number(),
      active: v.boolean(),
    }),
  ),
  handler: async (ctx) => {
    return await ctx.db.query("aboutSocialLinks").withIndex("by_order").take(8);
  },
});

export const saveSocialLink = mutation({
  args: {
    platform: socialPlatformValidator,
    url: v.string(),
    order: v.number(),
    active: v.boolean(),
  },
  returns: v.id("aboutSocialLinks"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(args.url);
    } catch {
      throw new Error("Social link URL must be an absolute HTTP or HTTPS URL");
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Social link URL must use the http: or https: protocol");
    }

    const current = await ctx.db
      .query("aboutSocialLinks")
      .withIndex("by_platform", (q) => q.eq("platform", args.platform))
      .unique();
    if (current) {
      await ctx.db.patch(current._id, args);
      return current._id;
    }
    return await ctx.db.insert("aboutSocialLinks", args);
  },
});

export const removeSocialLink = mutation({
  args: { platform: socialPlatformValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const current = await ctx.db
      .query("aboutSocialLinks")
      .withIndex("by_platform", (q) => q.eq("platform", args.platform))
      .unique();
    if (current) await ctx.db.delete(current._id);
    return null;
  },
});
