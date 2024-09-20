document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
});

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const user = await authenticateUser(email, password);
        if (user) {
            setLoggedInUser(user);
            alert('Login bem-sucedido!');
            window.location.href = '/src/home.html';
        } else {
            alert('E-mail ou senha incorretos.');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        alert('Ocorreu um erro ao fazer login. Por favor, tente novamente.');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const newUser = await createUser({ username, email, password });
        if (newUser) {
            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            document.getElementById('signupForm').reset();
        } else {
            alert('Não foi possível realizar o cadastro. Por favor, tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        alert('Ocorreu um erro ao cadastrar. Por favor, tente novamente.');
    }
}
