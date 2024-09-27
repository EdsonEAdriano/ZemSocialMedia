import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const API_URL = config.apiUrl;
const PUBLIC_ANON_KEY = config.apiPublicAnonKey;

const supabase = createClient(API_URL, PUBLIC_ANON_KEY);

const add = async (data, tableName) => {
  const { data: result, error } = await supabase
    .from(tableName)
    .insert(data)
    .single();

  if (error) throw new Error(`Erro ao adicionar dados: ${error.message}`);
  return result;
};

const get = async (id, tableName) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`Erro ao obter dados: ${error.message}`);
  return data;
};

const update = async (data, tableName) => {
  const { data: result, error } = await supabase
    .from(tableName)
    .update(data)
    .eq('id', data.id)
    .single();

  if (error) throw new Error(`Erro ao atualizar dados: ${error.message}`);
  return result;
};

const remove = async (id, tableName) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Erro ao excluir dados: ${error.message}`);
  return "Dados excluídos com sucesso";
};

const getAlls = async (tableName) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) throw new Error(`Erro ao obter todos os dados: ${error.message}`);
  return data;
};

const getAllsWithUserInfo = async () => {
  try {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*');

    if (postsError) throw new Error(`Erro ao obter posts: ${postsError.message}`);

    const postsWithUserInfo = await Promise.all(posts.map(async (post) => {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('username, email')
        .eq('id', post.userId)
        .single();

      if (userError) throw new Error(`Erro ao obter usuário: ${userError.message}`);

      const { data: comments, error: commentsError } = await supabase
        .from('post_comments')
        .select('*, users(username)')
        .eq('post_id', post.id);

      if (commentsError) throw new Error(`Erro ao obter comentários: ${commentsError.message}`);

      const { data: likes, error: likesError } = await supabase
        .from('post_likes')
        .select('user_id')
        .eq('post_id', post.id);

      if (likesError) throw new Error(`Erro ao obter likes: ${likesError.message}`);

      const { data: shares, error: sharesError } = await supabase
        .from('post_shares')
        .select('user_id')
        .eq('post_id', post.id);

      if (sharesError) throw new Error(`Erro ao obter compartilhamentos: ${sharesError.message}`);

      return {
        ...post,
        username: user.username,
        userEmail: user.email,
        comments: comments.map(comment => ({
          ...comment,
          username: comment.users.username
        })),
        likes: likes.map(like => like.user_id),
        shares: shares.map(share => share.user_id)
      };
    }));

    postsWithUserInfo.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return postsWithUserInfo;
  } catch (error) {
    console.error("Erro ao obter posts com informações do usuário:", error);
    return [];
  }
};

const like = async (postId, userId) => {
  const { data: existingLike, error: likeError } = await supabase
    .from('post_likes')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (likeError && likeError.code !== 'PGRST116') {
    throw new Error(`Erro ao verificar like: ${likeError.message}`);
  }

  if (existingLike) {
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('id', existingLike.id);

    if (deleteError) throw new Error(`Erro ao remover like: ${deleteError.message}`);
  } else {
    const { error: insertError } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });

    if (insertError) throw new Error(`Erro ao adicionar like: ${insertError.message}`);
  }

  const { count, error: countError } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact' })
    .eq('post_id', postId);

  if (countError) throw new Error(`Erro ao contar likes: ${countError.message}`);

  return {
    likeCount: count,
    isLiked: !existingLike
  };
};

const share = async (postId, userId) => {
  const { data: existingShare, error: shareError } = await supabase
    .from('post_shares')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (shareError && shareError.code !== 'PGRST116') {
    throw new Error(`Erro ao verificar compartilhamento: ${shareError.message}`);
  }

  if (existingShare) {
    const { error: deleteError } = await supabase
      .from('post_shares')
      .delete()
      .eq('id', existingShare.id);

    if (deleteError) throw new Error(`Erro ao remover compartilhamento: ${deleteError.message}`);
  } else {
    const { error: insertError } = await supabase
      .from('post_shares')
      .insert({ post_id: postId, user_id: userId });

    if (insertError) throw new Error(`Erro ao adicionar compartilhamento: ${insertError.message}`);
  }

  const { count, error: countError } = await supabase
    .from('post_shares')
    .select('*', { count: 'exact' })
    .eq('post_id', postId);

  if (countError) throw new Error(`Erro ao contar compartilhamentos: ${countError.message}`);

  return {
    shareCount: count,
    isShared: !existingShare
  };
};

const addComment = async (postId, userId, comment) => {
  const { data: newComment, error: insertError } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, text: comment })
    .single();

  if (insertError) throw new Error(`Erro ao adicionar comentário: ${insertError.message}`);

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('username')
    .eq('id', userId)
    .single();

  if (userError) throw new Error(`Erro ao obter usuário: ${userError.message}`);

  return {
    ...newComment,
    username: user.username
  };
};

const create = async (userId, message, urlImage = null) => {
  const { data: result, error } = await supabase
    .from('posts')
    .insert({
      userId: userId,
      message: message,
      url_image: urlImage,
      timestamp: new Date().toISOString()
    })
    .select()
    .single();

  if (error) 
    throw new Error(`Erro ao criar post: ${error.message}`);

  return result;
};

const authenticateUser = async (email, password) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error) throw new Error(`Erro na autenticação: ${error.message}`);

  if (data && data.password === password) {
    return data;
  }

  return null;
};

const createUser = async ({ username, email, password }) => {
  debugger
  const { data: existingUsers, error: checkError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);

  if (checkError) {
    throw new Error(`Erro ao verificar usuário existente: ${checkError.message}`);
  }

  if (existingUsers && existingUsers.length > 0) {
    throw new Error('Usuário com este e-mail já existe');
  }

  const { data: newUser, error } = await supabase
    .from('users')
    .insert({ username, email, password })
    .select()
    .single();

  if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);

  return newUser;
};

export { 
  add, 
  get, 
  update, 
  remove, 
  getAlls, 
  getAllsWithUserInfo, 
  like, 
  share, 
  addComment, 
  create,
  authenticateUser,
  createUser
}