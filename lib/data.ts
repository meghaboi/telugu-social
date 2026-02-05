import { NEW_USER_COMMENT_LIMIT, NEW_USER_POST_LIMIT } from '@/lib/constants';
import { restRequest } from '@/lib/supabase-api';

export type Profile = {
  id: string;
  username: string;
  city: string;
  age_range: string | null;
  bio: string;
  created_at: string;
};

export async function getProfileByUserId(accessToken: string, userId: string): Promise<Profile | null> {
  const rows = await restRequest<Profile[]>(`profiles?id=eq.${userId}&select=*`, 'GET', accessToken);
  return rows[0] ?? null;
}

export async function getProfileByUsername(accessToken: string, username: string): Promise<Profile | null> {
  const rows = await restRequest<Profile[]>(`profiles?username=eq.${encodeURIComponent(username)}&select=*`, 'GET', accessToken);
  return rows[0] ?? null;
}

export async function createProfile(accessToken: string, payload: { id: string; username: string; city: string; age_range?: string | null }) {
  return restRequest<Profile[]>('profiles', 'POST', accessToken, {
    id: payload.id,
    username: payload.username,
    city: payload.city,
    age_range: payload.age_range ?? null,
    created_at: new Date().toISOString()
  });
}

export async function getForums(accessToken: string) {
  return restRequest<Array<{ id: string; name: string; category: string }>>('forums?select=id,name,category&order=category.asc,name.asc', 'GET', accessToken);
}

export async function getPosts(accessToken: string, sort: 'new' | 'active') {
  const order = sort === 'active' ? 'updated_at.desc' : 'created_at.desc';
  return restRequest<any[]>(
    `posts?select=id,content,created_at,updated_at,is_hidden,forum_id,author_id,forums(name,category),profiles!posts_author_id_fkey(username,city)&is_hidden=eq.false&order=${order}`,
    'GET',
    accessToken
  );
}

export async function getPost(accessToken: string, postId: string) {
  const rows = await restRequest<any[]>(
    `posts?id=eq.${postId}&select=id,content,created_at,updated_at,is_hidden,forum_id,author_id,forums(name,category),profiles!posts_author_id_fkey(username,city)`,
    'GET',
    accessToken
  );
  return rows[0] ?? null;
}

export async function getComments(accessToken: string, postId: string) {
  return restRequest<any[]>(
    `comments?post_id=eq.${postId}&is_hidden=eq.false&select=id,content,created_at,author_id,profiles!comments_author_id_fkey(username,city)&order=created_at.asc`,
    'GET',
    accessToken
  );
}

export async function getPostReactions(accessToken: string, postId: string) {
  return restRequest<any[]>(`reactions?post_id=eq.${postId}&select=id,emoji,user_id`, 'GET', accessToken);
}

export async function createPost(accessToken: string, payload: { forum_id: string; author_id: string; content: string }) {
  return restRequest<any[]>('posts', 'POST', accessToken, payload);
}

export async function createComment(accessToken: string, payload: { post_id: string; author_id: string; content: string }) {
  return restRequest<any[]>('comments', 'POST', accessToken, payload);
}

export async function upsertReaction(accessToken: string, payload: { user_id: string; post_id?: string; comment_id?: string; emoji: string }) {
  return restRequest<any[]>('reactions', 'POST', accessToken, payload);
}

export async function createReport(accessToken: string, payload: { reporter_id: string; post_id?: string; comment_id?: string; reason: string }) {
  return restRequest<any[]>('reports', 'POST', accessToken, payload);
}

export async function isRateLimited(accessToken: string, profile: Profile, type: 'post' | 'comment') {
  const joinedAt = new Date(profile.created_at);
  const ageInDays = (Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays >= 7) return false;

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const table = type === 'post' ? 'posts' : 'comments';
  const field = type === 'post' ? 'author_id' : 'author_id';
  const rows = await restRequest<any[]>(
    `${table}?${field}=eq.${profile.id}&created_at=gte.${dayStart.toISOString()}&select=id`,
    'GET',
    accessToken
  );

  const limit = type === 'post' ? NEW_USER_POST_LIMIT : NEW_USER_COMMENT_LIMIT;
  return rows.length >= limit;
}

export async function getReports(accessToken: string) {
  return restRequest<any[]>(
    'reports?select=id,reason,created_at,post_id,comment_id,posts(content,is_hidden,profiles!posts_author_id_fkey(username)),comments(content,is_hidden,profiles!comments_author_id_fkey(username))&order=created_at.desc',
    'GET',
    accessToken
  );
}

export async function setPostHidden(accessToken: string, postId: string, hidden: boolean) {
  return restRequest<any[]>(`posts?id=eq.${postId}`, 'PATCH', accessToken, { is_hidden: hidden });
}

export async function setCommentHidden(accessToken: string, commentId: string, hidden: boolean) {
  return restRequest<any[]>(`comments?id=eq.${commentId}`, 'PATCH', accessToken, { is_hidden: hidden });
}

export async function updateBio(accessToken: string, userId: string, bio: string) {
  return restRequest<any[]>(`profiles?id=eq.${userId}`, 'PATCH', accessToken, { bio });
}

export async function getPostsByAuthor(accessToken: string, authorId: string) {
  return restRequest<any[]>(
    `posts?author_id=eq.${authorId}&is_hidden=eq.false&select=id,content,created_at,forums(name,category)&order=created_at.desc`,
    'GET',
    accessToken
  );
}
