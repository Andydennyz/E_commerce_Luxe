import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { ImagePlus, Plus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import GlassCard from "@/components/glass-card.tsx";
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_TEAM_MEMBERS,
} from "@/lib/about-defaults.ts";

const fieldClass =
  "w-full bg-secondary border border-border rounded-sm px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary transition-all";
const labelClass =
  "text-xs uppercase tracking-widest text-muted-foreground mb-1 block";

const SOCIAL_PLATFORMS = [
  "Instagram",
  "Facebook",
  "YouTube",
  "X",
  "TikTok",
  "LinkedIn",
  "Pinterest",
  "WhatsApp",
] as const;

type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];
type TeamMemberDraft = {
  name: string;
  role: string;
  bio: string;
  imageStorageId?: Id<"_storage">;
  imageUrl?: string;
};
type SocialLinkDraft = {
  platform: SocialPlatform;
  url: string;
  active: boolean;
};

function PhotoUpload({
  imageUrl,
  onUploaded,
}: {
  imageUrl?: string;
  onUploaded: (storageId: Id<"_storage">, url: string) => void;
}) {
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getStorageUrl = useMutation(api.files.getStorageUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file");
      return;
    }

    setUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!response.ok)
        throw new Error(`Image upload failed (${response.status})`);
      const { storageId } = (await response.json()) as {
        storageId: Id<"_storage">;
      };
      const url = await getStorageUrl({ storageId });
      if (!url) throw new Error("The uploaded image could not be loaded");
      onUploaded(storageId, url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Preview"
          className="h-16 w-16 rounded-sm object-cover border border-border"
        />
      ) : (
        <div className="h-16 w-16 rounded-sm border border-dashed border-border flex items-center justify-center text-muted-foreground">
          <ImagePlus className="h-5 w-5" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => void handleUpload(event.target.files?.[0])}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest border border-primary/40 text-primary rounded-sm hover:bg-primary/10 disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? "Uploading..." : "Upload photo"}
      </button>
    </div>
  );
}

export default function AboutSocialsTab() {
  const storedContent = useQuery(api.about.getContent);
  const storedTeam = useQuery(api.about.listTeamMembers);
  const storedSocials = useQuery(api.about.listSocialLinks);
  const saveContent = useMutation(api.about.saveContent);
  const replaceTeamMembers = useMutation(api.about.replaceTeamMembers);
  const saveSocialLink = useMutation(api.about.saveSocialLink);
  const removeSocialLink = useMutation(api.about.removeSocialLink);

  const [content, setContent] = useState({ ...DEFAULT_ABOUT_CONTENT });
  const [storyImageStorageId, setStoryImageStorageId] = useState<
    Id<"_storage"> | undefined
  >();
  const [storyImageUrl, setStoryImageUrl] = useState<string>();
  const [team, setTeam] = useState<TeamMemberDraft[]>([]);
  const [socials, setSocials] = useState<SocialLinkDraft[]>([]);
  const [savingContent, setSavingContent] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);

  useEffect(() => {
    if (
      storedContent === undefined ||
      storedTeam === undefined ||
      storedSocials === undefined
    )
      return;
    if (storedContent?.content) {
      setContent({
        heroEyebrow: storedContent.content.heroEyebrow,
        heroTitle: storedContent.content.heroTitle,
        heroAccent: storedContent.content.heroAccent,
        heroIntro: storedContent.content.heroIntro,
        stats: storedContent.content.stats,
        storyEyebrow: storedContent.content.storyEyebrow,
        storyTitle: storedContent.content.storyTitle,
        storyParagraphs: storedContent.content.storyParagraphs,
        values: storedContent.content.values,
        ctaTitle: storedContent.content.ctaTitle,
        ctaDescription: storedContent.content.ctaDescription,
      });
      setStoryImageStorageId(
        storedContent.content.storyImageStorageId ?? undefined,
      );
      setStoryImageUrl(storedContent.content.storyImageUrl ?? undefined);
    }
    setTeam(
      storedContent?.teamInitialized
        ? storedTeam.map((member) => ({
            name: member.name,
            role: member.role,
            bio: member.bio,
            imageStorageId: member.imageStorageId ?? undefined,
            imageUrl: member.imageUrl ?? undefined,
          }))
        : DEFAULT_TEAM_MEMBERS.map((member) => ({ ...member })),
    );
    setSocials(
      storedSocials.map((link) => ({
        platform: link.platform,
        url: link.url,
        active: link.active,
      })),
    );
  }, [storedContent, storedTeam, storedSocials]);

  const updateContent = <K extends keyof typeof content>(
    key: K,
    value: (typeof content)[K],
  ) => {
    setContent((current) => ({ ...current, [key]: value }));
  };

  const handleSaveContent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingContent(true);
    try {
      await saveContent({
        ...content,
        ...(storyImageStorageId ? { storyImageStorageId } : {}),
      });
      toast.success("About page content saved");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save About page content",
      );
    } finally {
      setSavingContent(false);
    }
  };

  const handleSaveTeam = async () => {
    if (
      team.some(
        (member) =>
          !member.name.trim() || !member.role.trim() || !member.bio.trim(),
      )
    ) {
      toast.error("Enter a name, role, and bio for every team member");
      return;
    }
    setSavingTeam(true);
    try {
      await replaceTeamMembers({
        members: team.map((member, order) => ({
          name: member.name.trim(),
          role: member.role.trim(),
          bio: member.bio.trim(),
          ...(member.imageStorageId
            ? { imageStorageId: member.imageStorageId }
            : {}),
          order,
        })),
      });
      toast.success("Team members saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save team members",
      );
    } finally {
      setSavingTeam(false);
    }
  };

  const handleSaveSocials = async () => {
    if (socials.some((social) => !social.url.trim())) {
      toast.error(
        "Enter a link for each social platform or remove the unused row",
      );
      return;
    }
    if (
      socials.some((social) => {
        try {
          const url = new URL(social.url.trim());
          return url.protocol !== "https:" && url.protocol !== "http:";
        } catch {
          return true;
        }
      })
    ) {
      toast.error("Social links must be valid http or https URLs");
      return;
    }
    if (
      new Set(socials.map((social) => social.platform)).size !== socials.length
    ) {
      toast.error("Each social platform can only be added once");
      return;
    }

    setSavingSocials(true);
    try {
      const currentPlatforms = new Set(
        (storedSocials ?? []).map((social) => social.platform),
      );
      const nextPlatforms = new Set(socials.map((social) => social.platform));
      await Promise.all([
        ...socials.map((social, order) =>
          saveSocialLink({ ...social, url: social.url.trim(), order }),
        ),
        ...[...currentPlatforms]
          .filter((platform) => !nextPlatforms.has(platform))
          .map((platform) => removeSocialLink({ platform })),
      ]);
      toast.success("Social links saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save social links",
      );
    } finally {
      setSavingSocials(false);
    }
  };

  if (
    storedContent === undefined ||
    storedTeam === undefined ||
    storedSocials === undefined
  ) {
    return (
      <GlassCard className="p-6 text-sm text-muted-foreground">
        Loading About page settings...
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSaveContent} className="space-y-5">
        <GlassCard glow="purple" className="p-6">
          <h3 className="font-black uppercase tracking-widest text-sm mb-5">
            About page content
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label>
              <span className={labelClass}>Hero eyebrow</span>
              <input
                className={fieldClass}
                value={content.heroEyebrow}
                onChange={(event) =>
                  updateContent("heroEyebrow", event.target.value)
                }
              />
            </label>
            <label>
              <span className={labelClass}>Hero title</span>
              <input
                className={fieldClass}
                value={content.heroTitle}
                onChange={(event) =>
                  updateContent("heroTitle", event.target.value)
                }
              />
            </label>
            <label>
              <span className={labelClass}>Hero accent</span>
              <input
                className={fieldClass}
                value={content.heroAccent}
                onChange={(event) =>
                  updateContent("heroAccent", event.target.value)
                }
              />
            </label>
            <label className="md:col-span-2">
              <span className={labelClass}>Introduction</span>
              <textarea
                className={fieldClass}
                rows={3}
                value={content.heroIntro}
                onChange={(event) =>
                  updateContent("heroIntro", event.target.value)
                }
              />
            </label>
            <label>
              <span className={labelClass}>Story eyebrow</span>
              <input
                className={fieldClass}
                value={content.storyEyebrow}
                onChange={(event) =>
                  updateContent("storyEyebrow", event.target.value)
                }
              />
            </label>
            <label>
              <span className={labelClass}>Story heading</span>
              <input
                className={fieldClass}
                value={content.storyTitle.replace("\n", " ")}
                onChange={(event) =>
                  updateContent("storyTitle", event.target.value)
                }
              />
            </label>
            <div className="md:col-span-2">
              <span className={labelClass}>Story photo</span>
              <PhotoUpload
                imageUrl={
                  storyImageUrl ??
                  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=600&fit=crop"
                }
                onUploaded={(storageId, url) => {
                  setStoryImageStorageId(storageId);
                  setStoryImageUrl(url);
                }}
              />
            </div>
            <div className="md:col-span-2 space-y-3">
              <span className={labelClass}>Story paragraphs</span>
              {content.storyParagraphs.map((paragraph, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    className={fieldClass}
                    rows={3}
                    value={paragraph}
                    onChange={(event) => {
                      const storyParagraphs = [...content.storyParagraphs];
                      storyParagraphs[index] = event.target.value;
                      updateContent("storyParagraphs", storyParagraphs);
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Remove story paragraph"
                    onClick={() =>
                      updateContent(
                        "storyParagraphs",
                        content.storyParagraphs.filter((_, i) => i !== index),
                      )
                    }
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-sm self-start"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  updateContent("storyParagraphs", [
                    ...content.storyParagraphs,
                    "",
                  ])
                }
                className="inline-flex items-center gap-2 text-xs text-primary uppercase tracking-widest"
              >
                <Plus className="h-4 w-4" /> Add paragraph
              </button>
            </div>
            <div className="md:col-span-2">
              <span className={labelClass}>Stats</span>
              <div className="space-y-2">
                {content.stats.map((stat, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2"
                  >
                    <input
                      aria-label="Stat value"
                      className={fieldClass}
                      value={stat.value}
                      onChange={(event) => {
                        const stats = [...content.stats];
                        stats[index] = {
                          ...stats[index],
                          value: event.target.value,
                        };
                        updateContent("stats", stats);
                      }}
                    />
                    <input
                      aria-label="Stat label"
                      className={fieldClass}
                      value={stat.label}
                      onChange={(event) => {
                        const stats = [...content.stats];
                        stats[index] = {
                          ...stats[index],
                          label: event.target.value,
                        };
                        updateContent("stats", stats);
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Remove stat"
                      onClick={() =>
                        updateContent(
                          "stats",
                          content.stats.filter((_, i) => i !== index),
                        )
                      }
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateContent("stats", [
                      ...content.stats,
                      { value: "", label: "" },
                    ])
                  }
                  className="inline-flex items-center gap-2 text-xs text-primary uppercase tracking-widest"
                >
                  <Plus className="h-4 w-4" /> Add stat
                </button>
              </div>
            </div>
            <div className="md:col-span-2">
              <span className={labelClass}>Our values</span>
              <div className="space-y-2">
                {content.values.map((value, index) => (
                  <div
                    key={index}
                    className="grid md:grid-cols-[1fr_2fr_auto] gap-2"
                  >
                    <input
                      aria-label="Value title"
                      className={fieldClass}
                      value={value.title}
                      onChange={(event) => {
                        const values = [...content.values];
                        values[index] = {
                          ...values[index],
                          title: event.target.value,
                        };
                        updateContent("values", values);
                      }}
                    />
                    <input
                      aria-label="Value description"
                      className={fieldClass}
                      value={value.description}
                      onChange={(event) => {
                        const values = [...content.values];
                        values[index] = {
                          ...values[index],
                          description: event.target.value,
                        };
                        updateContent("values", values);
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Remove value"
                      onClick={() =>
                        updateContent(
                          "values",
                          content.values.filter((_, i) => i !== index),
                        )
                      }
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    updateContent("values", [
                      ...content.values,
                      { title: "", description: "" },
                    ])
                  }
                  className="inline-flex items-center gap-2 text-xs text-primary uppercase tracking-widest"
                >
                  <Plus className="h-4 w-4" /> Add value
                </button>
              </div>
            </div>
            <label>
              <span className={labelClass}>Call-to-action heading</span>
              <input
                className={fieldClass}
                value={content.ctaTitle}
                onChange={(event) =>
                  updateContent("ctaTitle", event.target.value)
                }
              />
            </label>
            <label>
              <span className={labelClass}>Call-to-action description</span>
              <input
                className={fieldClass}
                value={content.ctaDescription}
                onChange={(event) =>
                  updateContent("ctaDescription", event.target.value)
                }
              />
            </label>
          </div>
          <div className="mt-5">
            <button
              type="submit"
              disabled={savingContent}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              <Save className="h-4 w-4" />{" "}
              {savingContent ? "Saving..." : "Save About content"}
            </button>
          </div>
        </GlassCard>
      </form>

      <GlassCard glow="blue" className="p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-black uppercase tracking-widest text-sm">
              Meet the team
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add profiles and upload a photo for each person.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setTeam((current) => [
                ...current,
                { name: "", role: "", bio: "" },
              ])
            }
            className="inline-flex items-center gap-2 px-3 py-2 border border-primary/40 text-primary rounded-sm text-xs uppercase tracking-widest"
          >
            <Plus className="h-4 w-4" /> Add member
          </button>
        </div>
        <div className="space-y-4">
          {team.map((member, index) => (
            <div
              key={`${member.name}-${index}`}
              className="grid md:grid-cols-[1fr_1fr_auto] gap-3 p-4 border border-border/50 rounded-sm"
            >
              <div className="space-y-3 md:col-span-2">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label>
                    <span className={labelClass}>Name</span>
                    <input
                      className={fieldClass}
                      value={member.name}
                      onChange={(event) =>
                        setTeam((current) =>
                          current.map((entry, i) =>
                            i === index
                              ? { ...entry, name: event.target.value }
                              : entry,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    <span className={labelClass}>Role</span>
                    <input
                      className={fieldClass}
                      value={member.role}
                      onChange={(event) =>
                        setTeam((current) =>
                          current.map((entry, i) =>
                            i === index
                              ? { ...entry, role: event.target.value }
                              : entry,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
                <label>
                  <span className={labelClass}>Bio</span>
                  <textarea
                    className={fieldClass}
                    rows={2}
                    value={member.bio}
                    onChange={(event) =>
                      setTeam((current) =>
                        current.map((entry, i) =>
                          i === index
                            ? { ...entry, bio: event.target.value }
                            : entry,
                        ),
                      )
                    }
                  />
                </label>
                <PhotoUpload
                  imageUrl={member.imageUrl ?? DEFAULT_TEAM_MEMBERS[index]?.imageUrl}
                  onUploaded={(imageStorageId, imageUrl) =>
                    setTeam((current) =>
                      current.map((entry, i) =>
                        i === index
                          ? { ...entry, imageStorageId, imageUrl }
                          : entry,
                      ),
                    )
                  }
                />
              </div>
              <button
                type="button"
                aria-label="Remove team member"
                onClick={() =>
                  setTeam((current) => current.filter((_, i) => i !== index))
                }
                className="p-2 h-fit text-destructive hover:bg-destructive/10 rounded-sm justify-self-end"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={savingTeam}
          onClick={() => void handleSaveTeam()}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-widest disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {savingTeam ? "Saving..." : "Save team"}
        </button>
      </GlassCard>

      <GlassCard glow="pink" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h3 className="font-black uppercase tracking-widest text-sm">
              Social links
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Active links appear as clickable icons in the site footer.
            </p>
          </div>
          <button
            type="button"
            disabled={socials.length >= SOCIAL_PLATFORMS.length}
            onClick={() => {
              const available = SOCIAL_PLATFORMS.find(
                (platform) =>
                  !socials.some((social) => social.platform === platform),
              );
              if (available)
                setSocials((current) => [
                  ...current,
                  { platform: available, url: "", active: true },
                ]);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 border border-primary/40 text-primary rounded-sm text-xs uppercase tracking-widest disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add social
          </button>
        </div>
        <div className="space-y-3">
          {socials.map((social, index) => (
            <div
              key={`${social.platform}-${index}`}
              className="grid sm:grid-cols-[9rem_1fr_auto_auto] items-center gap-3"
            >
              <select
                aria-label="Social platform"
                className={fieldClass}
                value={social.platform}
                onChange={(event) => {
                  const platform = SOCIAL_PLATFORMS.find(
                    (candidate) => candidate === event.target.value,
                  );
                  if (platform) {
                    setSocials((current) =>
                      current.map((entry, i) =>
                        i === index ? { ...entry, platform } : entry,
                      ),
                    );
                  }
                }}
              >
                {SOCIAL_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
              <input
                type="url"
                aria-label={`${social.platform} URL`}
                placeholder="https://..."
                className={fieldClass}
                value={social.url}
                onChange={(event) =>
                  setSocials((current) =>
                    current.map((entry, i) =>
                      i === index
                        ? { ...entry, url: event.target.value }
                        : entry,
                    ),
                  )
                }
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={social.active}
                  onChange={(event) =>
                    setSocials((current) =>
                      current.map((entry, i) =>
                        i === index
                          ? { ...entry, active: event.target.checked }
                          : entry,
                      ),
                    )
                  }
                  className="accent-primary"
                />
                Visible
              </label>
              <button
                type="button"
                aria-label={`Remove ${social.platform}`}
                onClick={() =>
                  setSocials((current) => current.filter((_, i) => i !== index))
                }
                className="p-2 text-destructive hover:bg-destructive/10 rounded-sm"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          disabled={savingSocials}
          onClick={() => void handleSaveSocials()}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-sm text-xs font-bold uppercase tracking-widest disabled:opacity-50"
        >
          <Save className="h-4 w-4" />{" "}
          {savingSocials ? "Saving..." : "Save social links"}
        </button>
      </GlassCard>
    </div>
  );
}
