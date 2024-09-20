// Create (Criar)
const addUser = (user) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([usersTableName], "readwrite");
    const objectStore = transaction.objectStore(usersTableName);
    const request = objectStore.add(user);

    request.onerror = (event) => reject("Erro ao adicionar usuário");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Read (Ler)
const getUser = (id) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([usersTableName], "readonly");
    const objectStore = transaction.objectStore(usersTableName);
    const request = objectStore.get(id);

    request.onerror = (event) => reject("Erro ao obter usuário");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Update (Atualizar)
const updateUser = (user) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([usersTableName], "readwrite");
    const objectStore = transaction.objectStore(usersTableName);
    const request = objectStore.put(user);

    request.onerror = (event) => reject("Erro ao atualizar usuário");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// Delete (Excluir)
const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([usersTableName], "readwrite");
    const objectStore = transaction.objectStore(usersTableName);
    const request = objectStore.delete(id);

    request.onerror = (event) => reject("Erro ao excluir usuário");
    request.onsuccess = (event) => resolve("Usuário excluído com sucesso");
  });
};

// Listar todos os usuários
const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([usersTableName], "readonly");
    const objectStore = transaction.objectStore(usersTableName);
    const request = objectStore.getAll();

    request.onerror = (event) => reject("Erro ao obter todos os usuários");
    request.onsuccess = (event) => resolve(event.target.result);
  });
};

const authenticateUser = async (email, password) => {
  db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([usersTableName], "readonly");
    const objectStore = transaction.objectStore(usersTableName);
    const emailIndex = objectStore.index("email");
    const request = emailIndex.get(email);

    request.onerror = (event) => reject("Erro ao buscar usuário");
    request.onsuccess = (event) => {
      const user = event.target.result;
      if (user && user.password === password) {
        // Remova a senha antes de retornar o usuário
        const { password, ...userWithoutPassword } = user;
        resolve(userWithoutPassword);
      } else {
        resolve(null);
      }
    };
  });
};

const createUser = async (userData) => {
  db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([usersTableName], "readwrite");
    const objectStore = transaction.objectStore(usersTableName);
    const request = objectStore.add(userData);

    request.onerror = (event) => reject("Erro ao criar usuário");
    request.onsuccess = (event) => {
      const { password, ...userWithoutPassword } = userData;
      resolve(userWithoutPassword);
    };
  });
};

