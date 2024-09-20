async function appendPosts() {
  const postsContainer = document.querySelector('.main-content');
  const posts = await getAllPostsWithUserInfo();
  const loggedInUser = getLoggedInUser();

  // Limpa o conteúdo existente antes de adicionar os posts
  postsContainer.innerHTML = '';

  // Adiciona a caixa de postagem no topo
  const postBox = document.createElement('div');
  postBox.className = 'post-box';
  postBox.innerHTML = `
    <textarea placeholder="O que está acontecendo?" rows="3"></textarea>
    <input type="text" placeholder="URL da imagem (opcional)" class="image-url-input">
    <div class="post-actions">
      <button class="post-button">Postar</button>
    </div>
  `;
  postsContainer.appendChild(postBox);

  // Adiciona event listener para o botão de postar
  let postButton = postBox.querySelector('.post-button');
  postButton.addEventListener('click', handleNewPost);

  // Adiciona os posts existentes
  posts.forEach(post => {
    // Garanta que post.likes e post.shares sejam arrays
    if (!Array.isArray(post.likes)) post.likes = [];
    if (!Array.isArray(post.shares)) post.shares = [];

    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.innerHTML = `
      <div class="profile-info">
        <img src="https://via.placeholder.com/40" alt="Foto de Perfil">
        <div>
          <span class="name">${post.username}</span>
          <span class="username">@${post.username.toLowerCase()} · ${getTimeAgo(post.timestamp)}</span>
        </div>
      </div>
      <div class="content">
        ${post.message}
        ${post.urlImage ? `
          <div class="post-image-container">
            <img src="${post.urlImage}" alt="Imagem do post" class="post-image" onclick="openImageModal(this.src)">
          </div>
        ` : ''}
      </div>
      <div class="actions">
        <span class="comment-button" data-post-id="${post.id}">💬 ${post.comments ? post.comments.length : 0}</span>
        <span class="share-button ${post.shares.includes(loggedInUser.id) ? 'shared' : ''}" data-post-id="${post.id}">
          <span class="share-icon">🔁</span>
          <span class="share-count">${post.shares.length}</span>
        </span>
        <span class="like-button ${post.likes.includes(loggedInUser.id) ? 'liked' : ''}" data-post-id="${post.id}">
          <span class="like-icon">❤️</span>
          <span class="like-count">${post.likes.length}</span>
        </span>
        <span>🔗</span>
      </div>
      <div class="comments-section" style="display: none;">
        <div class="comments-list"></div>
        <div class="comment-form">
          <textarea placeholder="Adicione um comentário..." rows="2"></textarea>
          <button class="comment-submit" data-post-id="${post.id}">Comentar</button>
        </div>
      </div>
    `;
    postsContainer.appendChild(postElement);

    // Adiciona os comentários existentes
    const commentsListElement = postElement.querySelector('.comments-list');
    if (post.comments && post.comments.length > 0) {
      post.comments.forEach(comment => {
        const commentElement = createCommentElement(comment, loggedInUser.id);
        commentsListElement.appendChild(commentElement);
      });
    }
  });

  // Adicionar event listeners para os botões de like e compartilhamento
  document.querySelectorAll('.like-button').forEach(button => {
    button.addEventListener('click', handleLike);
  });
  document.querySelectorAll('.share-button').forEach(button => {
    button.addEventListener('click', handleShare);
  });
  document.querySelectorAll('.comment-button').forEach(button => {
    button.addEventListener('click', toggleComments);
  });
  document.querySelectorAll('.comment-submit').forEach(button => {
    button.addEventListener('click', handleNewComment);
  });

  // Adicionar event listener para o botão de postar
  postButton = document.querySelector('.post-button');
  postButton.addEventListener('click', handleNewPost);

  // Atualizar a seção de perfil
  updateProfileSection();

  // Adicionar event listener para o botão de logout
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
}

// Função para lidar com novos posts
async function handleNewPost() {
  const postBox = document.querySelector('.post-box');
  const textarea = postBox.querySelector('textarea');
  const imageUrlInput = postBox.querySelector('.image-url-input');
  const message = textarea.value.trim();
  const imageUrl = imageUrlInput.value.trim();
  const loggedInUser = getLoggedInUser();

  if (message) {
    try {
      const newPost = await createPost(loggedInUser.id, message, imageUrl);
      
      // Limpa o textarea e o input de URL da imagem
      textarea.value = '';
      imageUrlInput.value = '';

      // Adiciona o novo post à lista de posts
      const postElement = createPostElement(newPost, loggedInUser);
      const firstPost = document.querySelector('.post');
      if (firstPost) {
        firstPost.parentNode.insertBefore(postElement, firstPost);
      } else {
        document.querySelector('.main-content').appendChild(postElement);
      }

      // Adiciona os event listeners para o novo post
      addPostEventListeners(postElement);

    } catch (error) {
      console.error("Erro ao criar novo post:", error);
      alert("Ocorreu um erro ao criar o post. Por favor, tente novamente.");
    }
  }
}

function createPostElement(post, loggedInUser) {
  const postElement = document.createElement('div');
  postElement.className = 'post';
  postElement.innerHTML = `
    <div class="profile-info">
      <img src="https://via.placeholder.com/40" alt="Foto de Perfil">
      <div>
        <span class="name">${post.username || loggedInUser.username}</span>
        <span class="username">@${(post.username || loggedInUser.username).toLowerCase()} · ${getTimeAgo(post.timestamp)}</span>
      </div>
    </div>
    <div class="content">
      ${post.message}
      ${post.urlImage ? `
        <div class="post-image-container">
          <img src="${post.urlImage}" alt="Imagem do post" class="post-image" onclick="openImageModal(this.src)">
        </div>
      ` : ''}
    </div>
    <div class="actions">
      <span class="comment-button" data-post-id="${post.id}">💬 0</span>
      <span class="share-button" data-post-id="${post.id}">
        <span class="share-icon">🔁</span>
        <span class="share-count">0</span>
      </span>
      <span class="like-button" data-post-id="${post.id}">
        <span class="like-icon">❤️</span>
        <span class="like-count">0</span>
      </span>
      <span>🔗</span>
    </div>
    <div class="comments-section" style="display: none;">
      <div class="comments-list"></div>
      <div class="comment-form">
        <textarea placeholder="Adicione um comentário..." rows="2"></textarea>
        <button class="comment-submit" data-post-id="${post.id}">Comentar</button>
      </div>
    </div>
  `;
  return postElement;
}

function addPostEventListeners(postElement) {
  const likeButton = postElement.querySelector('.like-button');
  const shareButton = postElement.querySelector('.share-button');
  const commentButton = postElement.querySelector('.comment-button');
  const commentSubmit = postElement.querySelector('.comment-submit');

  likeButton.addEventListener('click', handleLike);
  shareButton.addEventListener('click', handleShare);
  commentButton.addEventListener('click', toggleComments);
  commentSubmit.addEventListener('click', handleNewComment);
}

// Função auxiliar para fazer upload de imagem (simulada)
async function uploadImage(file) {
  // Aqui você implementaria a lógica real de upload de imagem para um servidor
  // Por enquanto, vamos apenas simular retornando uma URL falsa
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`https://fake-image-url.com/${file.name}`);
    }, 1000);
  });
}

async function handleLike(event) {
  const likeButton = event.currentTarget;
  const postId = likeButton.dataset.postId;
  const likeCountElement = likeButton.querySelector('.like-count');
  const loggedInUser = getLoggedInUser();
  
  if (!likeCountElement) {
    console.error("Elemento de contagem de likes não encontrado");
    return;
  }

  try {
    const result = await likePost(parseInt(postId), loggedInUser.id);
    likeCountElement.textContent = result.likeCount;
    
    if (result.isLiked) {
      likeButton.classList.add('liked');
    } else {
      likeButton.classList.remove('liked');
    }
  } catch (error) {
    console.error("Erro ao dar/remover like no post:", error);
  }
}

async function handleShare(event) {
  const shareButton = event.currentTarget;
  const postId = shareButton.dataset.postId;
  const shareCountElement = shareButton.querySelector('.share-count');
  const loggedInUser = getLoggedInUser();
  
  if (!shareCountElement) {
    console.error("Elemento de contagem de compartilhamentos não encontrado");
    return;
  }

  try {
    const result = await sharePost(parseInt(postId), loggedInUser.id);
    shareCountElement.textContent = result.shareCount;
    
    if (result.isShared) {
      shareButton.classList.add('shared');
    } else {
      shareButton.classList.remove('shared');
    }
  } catch (error) {
    console.error("Erro ao compartilhar/descompartilhar o post:", error);
  }
}

function getTimeAgo(timestamp) {
  // Implementação simples para exibir o tempo decorrido
  const now = new Date();
  const postDate = new Date(timestamp);
  const diffInMinutes = Math.floor((now - postDate) / (1000 * 60));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}h`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}d`;
  }
}

function createCommentElement(comment, loggedInUserId) {
  const commentElement = document.createElement('div');
  commentElement.className = `comment ${comment.userId === loggedInUserId ? 'user-comment' : ''}`;
  commentElement.innerHTML = `
    <div class="comment-content">
      <span class="comment-username">@${comment.username || 'Usuário desconhecido'}</span>
      <span class="comment-text">${comment.text}</span>
    </div>
    <span class="comment-timestamp">${getTimeAgo(comment.timestamp)}</span>
  `;
  return commentElement;
}

function toggleComments(event) {
  const postElement = event.target.closest('.post');
  const commentsSection = postElement.querySelector('.comments-section');
  commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
}

async function handleNewComment(event) {
  const postId = event.target.dataset.postId;
  const postElement = event.target.closest('.post');
  const commentTextarea = postElement.querySelector('.comment-form textarea');
  const commentText = commentTextarea.value.trim();
  
  if (commentText) {
    const loggedInUser = getLoggedInUser();
    try {
      const newComment = await addComment(parseInt(postId), loggedInUser.id, commentText);
      const commentElement = createCommentElement(newComment, loggedInUser.id);
      const commentsListElement = postElement.querySelector('.comments-list');
      commentsListElement.appendChild(commentElement);
      
      // Atualiza o contador de comentários
      const commentButton = postElement.querySelector('.comment-button');
      const commentCount = parseInt(commentButton.textContent.match(/\d+/)[0]) + 1;
      commentButton.textContent = `💬 ${commentCount}`;
      
      commentTextarea.value = '';
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    }
  }
}

// Chama a função para adicionar os posts quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', appendPosts);

function openImageModal(imageSrc) {
  const modal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImage');
  modal.style.display = "block";
  modalImg.src = imageSrc;
}

function closeImageModal() {
  const modal = document.getElementById('imageModal');
  modal.style.display = "none";
}

// Adicione estes event listeners quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('imageModal');
  const closeBtn = document.getElementsByClassName('close')[0];

  closeBtn.onclick = closeImageModal;

  window.onclick = function(event) {
    if (event.target == modal) {
      closeImageModal();
    }
  }
});

function updateProfileSection() {
  const loggedInUser = getLoggedInUser();
  if (loggedInUser) {
    document.getElementById('profile-fullname').textContent = loggedInUser.username;
    document.getElementById('profile-username').textContent = `@${loggedInUser.username.toLowerCase()}`;
    // Se você tiver uma URL de foto de perfil, você pode definí-la aqui
    // document.getElementById('profile-picture').src = loggedInUser.profilePictureUrl;
  }
}

function handleLogout() {
  // Limpar as informações do usuário do localStorage
  localStorage.removeItem('loggedInUser');
  // Redirecionar para a página de login
  window.location.href = '/src/login.html';
}

document.addEventListener('DOMContentLoaded', function() {
  // ... código existente ...

  // Atualizar a seção de perfil
  updateProfileSection();

  // Adicionar event listener para o botão de logout
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', handleLogout);
  }
});
