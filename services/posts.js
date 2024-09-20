// Create (Criar)
const addPost = (post) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([postsTableName], "readwrite");
    const objectStore = transaction.objectStore(postsTableName);
    const request = objectStore.add(post);

    request.onerror = (event) => reject("Erro ao adicionar usuário");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Read (Ler)
const getPost = (id) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([postsTableName], "readonly");
    const objectStore = transaction.objectStore(postsTableName);
    const request = objectStore.get(id);

    request.onerror = (event) => reject("Erro ao obter usuário");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Update (Atualizar)
const updatePost = (post) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([postsTableName], "readwrite");
    const objectStore = transaction.objectStore(postsTableName);
    const request = objectStore.put(post);

    request.onerror = (event) => reject("Erro ao atualizar usuário");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Delete (Excluir)
const deletePost = (id) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([postsTableName], "readwrite");
    const objectStore = transaction.objectStore(postsTableName);
    const request = objectStore.delete(id);

    request.onerror = (event) => reject("Erro ao excluir usuário");
    request.onsuccess = (event) => resolve("Usuário excluído com sucesso");
  });
};

// Listar todos os usuários
const getAllPosts = () => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([postsTableName], "readonly");
    const objectStore = transaction.objectStore(postsTableName);
    const request = objectStore.getAll();

    request.onerror = (event) => reject("Erro ao obter todos os usuários");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Função para coletar todos os posts
const getAllPostsWithUserInfo = async () => {
  try {
    db = await initDB();

    const posts = await getAllPosts();
    const postsWithUserInfo = await Promise.all(posts.map(async (post) => {
      const user = await getUser(post.userId);
      // Ensure that post.likes and post.shares are arrays
      if (!Array.isArray(post.likes)) post.likes = [];
      if (!Array.isArray(post.shares)) post.shares = [];
      // Add username to comments
      if (Array.isArray(post.comments)) {
        post.comments = await Promise.all(post.comments.map(async (comment) => {
          const commentUser = await getUser(comment.userId);
          return {
            ...comment,
            username: commentUser ? commentUser.username : 'Unknown User'
          };
        }));
      } else {
        post.comments = [];
      }
      return {
        ...post,
        username: user ? user.username : 'Unknown User',
        userEmail: user ? user.email : ''
      };
    }));

    // Sort posts by timestamp in descending order (newest first)
    postsWithUserInfo.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return postsWithUserInfo;
  } catch (error) {
    console.error("Error getting posts with user information:", error);
    return [];
  }
};

// Função para like um post
const likePost = async (postId, userId) => {
  db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([postsTableName], "readwrite");
    const objectStore = transaction.objectStore(postsTableName);
    const request = objectStore.get(postId);

    request.onerror = (event) => reject("Erro ao obter o post");
    request.onsuccess = (event) => {
      const post = event.target.result;
      if (post) {
        // Garanta que post.likes seja um array
        if (!Array.isArray(post.likes)) post.likes = [];
        
        const userLikeIndex = post.likes.indexOf(userId);
        if (userLikeIndex === -1) {
          post.likes.push(userId);
        } else {
          post.likes.splice(userLikeIndex, 1);
        }
        
        const updateRequest = objectStore.put(post);
        updateRequest.onerror = (event) => reject("Erro ao atualizar o post");
        updateRequest.onsuccess = (event) => resolve({
          likeCount: post.likes.length,
          isLiked: userLikeIndex === -1
        });
      } else {
        reject("Post não encontrado");
      }
    };
  });
};

// Função para compartilhar um post
const sharePost = async (postId, userId) => {
  db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([postsTableName], "readwrite");
    const objectStore = transaction.objectStore(postsTableName);
    const request = objectStore.get(postId);

    request.onerror = (event) => reject("Erro ao obter o post");
    request.onsuccess = (event) => {
      const post = event.target.result;
      if (post) {
        // Garanta que post.shares seja um array
        if (!Array.isArray(post.shares)) post.shares = [];
        
        const userShareIndex = post.shares.indexOf(userId);
        if (userShareIndex === -1) {
          post.shares.push(userId);
        } else {
          post.shares.splice(userShareIndex, 1);
        }
        
        const updateRequest = objectStore.put(post);
        updateRequest.onerror = (event) => reject("Erro ao atualizar o post");
        updateRequest.onsuccess = (event) => resolve({
          shareCount: post.shares.length,
          isShared: userShareIndex === -1
        });
      } else {
        reject("Post não encontrado");
      }
    };
  });
};

// Função para adicionar comentários
const addComment = async (postId, userId, comment) => {
  db = await initDB();
  
  return new Promise(async (resolve, reject) => {
    const transaction = db.transaction([postsTableName, usersTableName], "readwrite");
    const postStore = transaction.objectStore(postsTableName);
    const userStore = transaction.objectStore(usersTableName);
    
    try {
      const post = await new Promise((resolve, reject) => {
        const request = postStore.get(postId);
        request.onerror = () => reject("Erro ao obter o post");
        request.onsuccess = () => resolve(request.result);
      });

      const user = await new Promise((resolve, reject) => {
        const request = userStore.get(userId);
        request.onerror = () => reject("Erro ao obter o usuário");
        request.onsuccess = () => resolve(request.result);
      });

      if (post && user) {
        if (!Array.isArray(post.comments)) post.comments = [];
        
        const newComment = {
          id: Date.now(),
          userId: userId,
          username: user.username,
          text: comment,
          timestamp: new Date().toISOString()
        };
        
        post.comments.push(newComment);
        const updateRequest = postStore.put(post);
        updateRequest.onerror = () => reject("Erro ao adicionar comentário");
        updateRequest.onsuccess = () => resolve(newComment);
      } else {
        reject("Post ou usuário não encontrado");
      }
    } catch (error) {
      reject(error);
    }
  });
};

const createPost = async (userId, message, urlImage = null) => {
  db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([postsTableName], "readwrite");
    const objectStore = transaction.objectStore(postsTableName);
    
    const newPost = {
      userId: userId,
      message: message,
      urlImage: urlImage,
      timestamp: new Date().toISOString(),
      likes: [],
      shares: [],
      comments: []
    };
    
    const request = objectStore.add(newPost);

    request.onerror = (event) => reject("Error creating post");
    request.onsuccess = (event) => {
      newPost.id = event.target.result;
      resolve(newPost);
    };
  });
};