let db;
const dbName = "ZenDatabase";
const usersTableName = "users";
const postsTableName = "posts";

const dbVersion = 3; // Aumentamos a versão do banco de dados

const initDB = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => reject("Erro ao abrir o banco de dados");

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            const oldVersion = event.oldVersion;

            if (oldVersion < 1) {
                const userObjectStore = db.createObjectStore(usersTableName, { keyPath: "id", autoIncrement: true });
                userObjectStore.createIndex("email", "email", { unique: true });

                db.createObjectStore(postsTableName, { keyPath: "id", autoIncrement: true });
            }

            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains("metadata")) {
                    db.createObjectStore("metadata", { keyPath: "key" });
                }
            }
        };
    });
};

const defaultUsers = [
    { username: "joao123", email: "joao@exemplo.com", password: "senha123", postIds: [] },
    { username: "maria456", email: "maria@exemplo.com", password: "senha456", postIds: [] },
    { username: "carlos789", email: "carlos@exemplo.com", password: "senha789", postIds: [] },
];

const defaultPosts = [
    {
        message: "Olá, mundo!",
        urlImage: "https://exemplo.com/imagem1.jpg",
        likes: 10,
        shares: 5,
        comments: [
            { userId: 2, text: "Ótimo post!" },
            { userId: 3, text: "Muito legal!" }
        ],
        userId: 1
    },
    {
        message: "Bom dia a todos!",
        urlImage: "https://exemplo.com/imagem2.jpg",
        likes: 15,
        shares: 3,
        comments: [
            { userId: 1, text: "Bom dia!" },
            { userId: 3, text: "Tenha um ótimo dia!" }
        ],
        userId: 2
    },
];

const insertDefaultData = async () => {
    const db = await initDB();
    
    // Verifica se os dados padrão já foram inseridos
    const metadataTransaction = db.transaction(["metadata"], "readwrite");
    const metadataStore = metadataTransaction.objectStore("metadata");
    const defaultDataInserted = await new Promise(resolve => {
        const request = metadataStore.get("defaultDataInserted");
        request.onsuccess = (event) => resolve(event.target.result);
    });

    if (defaultDataInserted) {
        console.log("Dados padrão já foram inseridos anteriormente.");
        return;
    }

    // Usa uma única transação para todas as operações
    const transaction = db.transaction([usersTableName, postsTableName, "metadata"], "readwrite");
    const userStore = transaction.objectStore(usersTableName);
    const postStore = transaction.objectStore(postsTableName);

    for (const user of defaultUsers) {
        userStore.add(user);
    }

    for (const post of defaultPosts) {
        const request = postStore.add(post);
        request.onsuccess = (event) => {
            const postId = event.target.result;
            const userRequest = userStore.get(post.userId);
            userRequest.onsuccess = (event) => {
                const user = event.target.result;
                user.postIds.push(postId);
                userStore.put(user);
            };
        };
    }

    // Marca que os dados padrão foram inseridos
    metadataStore.put({ key: "defaultDataInserted", value: true });
};

const migrateExistingPosts = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([postsTableName], "readwrite");
        const objectStore = transaction.objectStore(postsTableName);
        const request = objectStore.getAll();

        request.onerror = (event) => reject("Erro ao obter posts para migração");
        request.onsuccess = (event) => {
            const posts = event.target.result;
            let migratedCount = 0;

            posts.forEach(post => {
                if (!Array.isArray(post.likes)) post.likes = [];
                if (!Array.isArray(post.shares)) post.shares = [];

                const updateRequest = objectStore.put(post);
                updateRequest.onsuccess = () => {
                    migratedCount++;
                    if (migratedCount === posts.length) {
                        resolve("Migração concluída");
                    }
                };
                updateRequest.onerror = () => reject("Erro ao migrar post");
            });
        };
    });
};
