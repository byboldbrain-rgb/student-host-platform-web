"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export type ShareChannel =
  | "native"
  | "copy_link"
  | "facebook"
  | "whatsapp"
  | "instagram"
  | "x"
  | "other";

export type CommunityPostCommentItem = {
  id: number;
  post_id: number;
  user_id: string;
  body: string;
  created_at: string;
  user_profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}

export async function toggleCommunityPostLike(postId: number) {
  const supabase = await getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: "LOGIN_REQUIRED",
    };
  }

  const { data: existingLike, error: existingLikeError } = await supabase
    .from("community_post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLikeError) {
    return {
      ok: false,
      error: existingLikeError.message,
    };
  }

  if (existingLike) {
    const { error } = await supabase
      .from("community_post_likes")
      .delete()
      .eq("id", existingLike.id);

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    revalidatePath("/community");

    return {
      ok: true,
      liked: false,
    };
  }

  const { error } = await supabase.from("community_post_likes").insert({
    post_id: postId,
    user_id: user.id,
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  revalidatePath("/community");

  return {
    ok: true,
    liked: true,
  };
}

export async function getCommunityPostComments(postId: number) {
  const supabase = await getSupabase();

  const { data: commentsData, error: commentsError } = await supabase
    .from("community_post_comments")
    .select("id, post_id, user_id, body, created_at")
    .eq("post_id", postId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (commentsError) {
    return {
      ok: false,
      error: commentsError.message,
      comments: [] as CommunityPostCommentItem[],
    };
  }

  const comments = commentsData ?? [];
  const userIds = Array.from(
    new Set(
      comments
        .map((comment) => comment.user_id)
        .filter((userId): userId is string => Boolean(userId))
    )
  );

  let profilesByUserId = new Map<
    string,
    {
      full_name: string | null;
      avatar_url: string | null;
    }
  >();

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("user_profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    profilesByUserId = new Map(
      (profilesData ?? []).map((profile) => [
        profile.id,
        {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        },
      ])
    );
  }

  const normalizedComments: CommunityPostCommentItem[] = comments.map(
    (comment) => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      body: comment.body,
      created_at: comment.created_at,
      user_profile: profilesByUserId.get(comment.user_id) ?? null,
    })
  );

  return {
    ok: true,
    comments: normalizedComments,
  };
}

export async function createCommunityPostComment(postId: number, body: string) {
  const supabase = await getSupabase();

  const cleanBody = body.trim();

  if (!cleanBody) {
    return {
      ok: false,
      error: "EMPTY_COMMENT",
    };
  }

  if (cleanBody.length > 2000) {
    return {
      ok: false,
      error: "COMMENT_TOO_LONG",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: "LOGIN_REQUIRED",
    };
  }

  const { data: insertedComment, error } = await supabase
    .from("community_post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      body: cleanBody,
    })
    .select("id, post_id, user_id, body, created_at")
    .single();

  if (error || !insertedComment) {
    return {
      ok: false,
      error: error?.message || "FAILED_TO_CREATE_COMMENT",
    };
  }

  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  revalidatePath("/community");

  return {
    ok: true,
    comment: {
      id: insertedComment.id,
      post_id: insertedComment.post_id,
      user_id: insertedComment.user_id,
      body: insertedComment.body,
      created_at: insertedComment.created_at,
      user_profile: profileData
        ? {
            full_name: profileData.full_name,
            avatar_url: profileData.avatar_url,
          }
        : null,
    } satisfies CommunityPostCommentItem,
  };
}

export async function recordCommunityPostShare(
  postId: number,
  shareChannel: ShareChannel = "native"
) {
  const supabase = await getSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      ok: false,
      error: "LOGIN_REQUIRED",
    };
  }

  const { error } = await supabase.from("community_post_shares").insert({
    post_id: postId,
    user_id: user.id,
    share_channel: shareChannel,
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  revalidatePath("/community");

  return {
    ok: true,
  };
}