export const AUTH_TRANSLATIONS = {
  en: {
    // Common
    email: 'Email',
    password: 'Password',
    username: 'Username',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    logo: 'Logo',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'Enter your email address',
    passwordPlaceholder: 'Enter your password',
    usernamePlaceholder: 'Choose a username',
    resetEmailPlaceholder: 'Your email address',
    
    // Login page
    loginTitle: 'Welcome Back',
    loginSubtitle: 'Access your account',
    loginButton: 'Sign In',
    loginLoading: 'Signing in...',
    rememberMe: 'Remember me',
    forgotPassword: 'Request',
    passwordReset: 'Password Reset',
    forgotPasswordQuestion: 'Forgot your password?',
    noAccount: "Don't have an account?",
    createAccount: 'Create one',
    backToLogin: 'Back to Login',
    
    // Register page
    registerTitle: 'Create Account',
    registerSubtitle: 'Join our platform',
    registerButton: 'Register',
    registerLoading: 'Registering...',
    confirmPassword: 'Confirm Password',
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    
    // Register Free Trial page
    registerFreeTrialTitle: 'Register and Start Free Trial',
    registerFreeTrialSubtitle: 'Create your account and begin.',
    welcomeTitle: 'Welcome',
    freeTrialButton: 'Start Free Trial',
    freeTrialLoading: 'Creating account...',
    
    // Reset Password page
    resetPasswordTitle: 'Reset Password',
    resetPasswordSubtitle: 'Secure your account',
    resetPasswordButton: 'Confirm',
    resetPasswordLoading: 'Sending...',
    resetPasswordSuccess: 'Password reset email sent! Check your inbox.',
    resetPasswordInstructions: 'Enter your email address and we\'ll send you a link to reset your password.',
    
    // Password visibility
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    show: 'Show',
    hide: 'Hide',
    
    // Validation messages
    fillAllFields: 'Please fill in all fields.',
    passwordTooShort: 'Password must be at least 8 characters long.',
    usernameTooShort: 'Username must be at least 3 characters long.',
    passwordsDoNotMatch: 'Passwords do not match.',
    invalidEmail: 'Please enter a valid email address.',
    
    // Success messages
    registrationSuccessful: 'Registration successful!',
    loginSuccessful: 'Login successful!',
    redirectingToProfile: 'Redirecting to profile...',
    redirectingToLogin: 'Redirecting to login...',
    checkEmail: 'Please check your email to confirm your account.',
    
    // Error messages
    emailAlreadyExists: 'This email is already in use. Please try a different email.',
    invalidCredentials: 'Invalid email or password.',
    accountNotFound: 'Account not found.',
    serverError: 'Server error. Please try again later.',
    registrationFailed: 'Registration failed. Please try again.',
    loginFailed: 'Login failed. Please try again.',
    unexpectedError: 'An unexpected error occurred. Please try again.',
    
    // Dynamic strings
    registerWith: (siteName: string) => `Register and Start Free Trial with ${siteName}`,
    welcomeTo: (siteName: string) => `Welcome to ${siteName}`,
    loginTo: (siteName: string) => `Login to ${siteName}`,
  },
  es: {
    // Common
    email: 'Correo electrónico',
    password: 'Contraseña',
    username: 'Nombre de usuario',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    contact: 'Contacto',
    privacy: 'Privacidad',
    terms: 'Términos',
    logo: 'Logo',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'Ingrese su correo electrónico',
    passwordPlaceholder: 'Ingrese su contraseña',
    usernamePlaceholder: 'Elija un nombre de usuario',
    resetEmailPlaceholder: 'Su correo electrónico',
    
    // Login page
    loginTitle: 'Bienvenido de nuevo',
    loginSubtitle: 'Accede a tu cuenta',
    loginButton: 'Iniciar sesión',
    loginLoading: 'Iniciando sesión...',
    rememberMe: 'Recordarme',
    forgotPassword: 'Solicitar',
    passwordReset: 'Restablecimiento de Contraseña',
    forgotPasswordQuestion: '¿Olvidaste tu contraseña?',
    noAccount: '¿No tienes una cuenta?',
    createAccount: 'Crear una',
    backToLogin: 'Volver al login',
    
    // Register page
    registerTitle: 'Crear cuenta',
    registerSubtitle: 'Únete a nuestra plataforma',
    registerButton: 'Registrarse',
    registerLoading: 'Registrando...',
    confirmPassword: 'Confirmar contraseña',
    haveAccount: '¿Ya tienes una cuenta?',
    signIn: 'Iniciar sesión',
    
    // Register Free Trial page
    registerFreeTrialTitle: 'Regístrate e inicia prueba gratuita',
    registerFreeTrialSubtitle: 'Crea tu cuenta y comienza.',
    welcomeTitle: 'Bienvenido',
    freeTrialButton: 'Iniciar prueba gratuita',
    freeTrialLoading: 'Creando cuenta...',
    
    // Reset Password page
    resetPasswordTitle: 'Restablecer contraseña',
    resetPasswordSubtitle: 'Asegura tu cuenta',
    resetPasswordButton: 'Confirmar',
    resetPasswordLoading: 'Enviando...',
    resetPasswordSuccess: '¡Correo de restablecimiento enviado! Revisa tu bandeja de entrada.',
    resetPasswordInstructions: 'Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.',
    
    // Password visibility
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
    show: 'Mostrar',
    hide: 'Ocultar',
    
    // Validation messages
    fillAllFields: 'Por favor, completa todos los campos.',
    passwordTooShort: 'La contraseña debe tener al menos 8 caracteres.',
    usernameTooShort: 'El nombre de usuario debe tener al menos 3 caracteres.',
    passwordsDoNotMatch: 'Las contraseñas no coinciden.',
    invalidEmail: 'Por favor, ingresa un correo electrónico válido.',
    
    // Success messages
    registrationSuccessful: '¡Registro exitoso!',
    loginSuccessful: '¡Inicio de sesión exitoso!',
    redirectingToProfile: 'Redirigiendo al perfil...',
    redirectingToLogin: 'Redirigiendo al inicio de sesión...',
    checkEmail: 'Por favor, revisa tu correo electrónico para confirmar tu cuenta.',
    
    // Error messages
    emailAlreadyExists: 'Este correo electrónico ya está en uso. Por favor, prueba con uno diferente.',
    invalidCredentials: 'Correo electrónico o contraseña inválidos.',
    accountNotFound: 'Cuenta no encontrada.',
    serverError: 'Error del servidor. Por favor, inténtalo más tarde.',
    registrationFailed: 'El registro falló. Por favor, inténtalo de nuevo.',
    loginFailed: 'El inicio de sesión falló. Por favor, inténtalo de nuevo.',
    unexpectedError: 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.',
    
    // Dynamic strings
    registerWith: (siteName: string) => `Regístrate e inicia prueba gratuita con ${siteName}`,
    welcomeTo: (siteName: string) => `Bienvenido a ${siteName}`,
    loginTo: (siteName: string) => `Iniciar sesión en ${siteName}`,
  },
  fr: {
    // Common
    email: 'E-mail',
    password: 'Mot de passe',
    username: "Nom d'utilisateur",
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    contact: 'Contact',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    logo: 'Logo',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'Entrez votre adresse e-mail',
    passwordPlaceholder: 'Entrez votre mot de passe',
    usernamePlaceholder: "Choisissez un nom d'utilisateur",
    resetEmailPlaceholder: 'Votre adresse e-mail',
    
    // Login page
    loginTitle: 'Bon retour',
    loginSubtitle: 'Connectez-vous à votre compte',
    loginButton: 'Se connecter',
    loginLoading: 'Connexion...',
    rememberMe: 'Se souvenir de moi',
        forgotPassword: 'Demander',
    passwordReset: 'Réinitialisation du Mot de Passe',
    forgotPasswordQuestion: 'Mot de passe oublié ?',
    noAccount: 'Pas de compte ?',
    createAccount: 'En créer un',
    backToLogin: 'Retour à la connexion',
    
    // Register page
    registerTitle: 'Créer un compte',
    registerSubtitle: 'Rejoignez-nous aujourd\'hui',
    registerButton: "S'inscrire",
    registerLoading: 'Inscription...',
    confirmPassword: 'Confirmer le mot de passe',
    haveAccount: 'Vous avez déjà un compte ?',
    signIn: 'Se connecter',
    
    // Register Free Trial page
    registerFreeTrialTitle: "S'inscrire et commencer l'essai gratuit avec",
    registerFreeTrialSubtitle: "Commencez votre parcours d'apprentissage en toute simplicité.",
    welcomeTitle: 'Bienvenue',
    freeTrialButton: "Commencer l'essai gratuit",
    freeTrialLoading: 'Création du compte...',
    
    // Reset Password page
    resetPasswordTitle: 'Réinitialiser le mot de passe',
    resetPasswordSubtitle: 'Entrez votre e-mail pour réinitialiser votre mot de passe',
    resetPasswordButton: 'Confirmer',
    resetPasswordLoading: 'Envoi...',
    resetPasswordSuccess: 'E-mail de réinitialisation envoyé ! Vérifiez votre boîte de réception.',
    resetPasswordInstructions: 'Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.',
    
    // Password visibility
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
    show: 'Afficher',
    hide: 'Masquer',
    
    // Validation messages
    fillAllFields: 'Veuillez remplir tous les champs.',
    passwordTooShort: 'Le mot de passe doit comporter au moins 8 caractères.',
    usernameTooShort: "Le nom d'utilisateur doit comporter au moins 3 caractères.",
    passwordsDoNotMatch: 'Les mots de passe ne correspondent pas.',
    invalidEmail: 'Veuillez entrer une adresse e-mail valide.',
    
    // Success messages
    registrationSuccessful: 'Inscription réussie !',
    loginSuccessful: 'Connexion réussie !',
    redirectingToProfile: 'Redirection vers le profil...',
    redirectingToLogin: 'Redirection vers la connexion...',
    checkEmail: 'Veuillez vérifier votre e-mail pour confirmer votre compte.',
    
    // Error messages
    emailAlreadyExists: 'Cet e-mail est déjà utilisé. Veuillez essayer avec un autre e-mail.',
    invalidCredentials: 'E-mail ou mot de passe invalide.',
    accountNotFound: 'Compte non trouvé.',
    serverError: 'Erreur du serveur. Veuillez réessayer plus tard.',
    registrationFailed: "L'inscription a échoué. Veuillez réessayer.",
    loginFailed: 'La connexion a échoué. Veuillez réessayer.',
    unexpectedError: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    
    // Dynamic strings
    registerWith: (siteName: string) => `S'inscrire et commencer l'essai gratuit avec ${siteName}`,
    welcomeTo: (siteName: string) => `Bienvenue sur ${siteName}`,
    loginTo: (siteName: string) => `Se connecter à ${siteName}`,
  },
  de: {
    // Common
    email: 'E-Mail',
    password: 'Passwort',
    username: 'Benutzername',
    loading: 'Laden...',
    error: 'Fehler',
    success: 'Erfolg',
    contact: 'Kontakt',
    privacy: 'Datenschutz',
    terms: 'Bedingungen',
    logo: 'Logo',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'Geben Sie Ihre E-Mail-Adresse ein',
    passwordPlaceholder: 'Geben Sie Ihr Passwort ein',
    usernamePlaceholder: 'Wählen Sie einen Benutzernamen',
    resetEmailPlaceholder: 'Ihre E-Mail-Adresse',
    
    // Login page
    loginTitle: 'Willkommen zurück',
    loginSubtitle: 'Melden Sie sich in Ihrem Konto an',
    loginButton: 'Anmelden',
    loginLoading: 'Anmeldung läuft...',
    rememberMe: 'Angemeldet bleiben',
    forgotPassword: 'Anfordern',
    passwordReset: 'Passwort Zurücksetzen',
    forgotPasswordQuestion: 'Passwort vergessen?',
    noAccount: 'Noch kein Konto?',
    createAccount: 'Erstellen',
    backToLogin: 'Zurück zur Anmeldung',
    
    // Register page
    registerTitle: 'Konto erstellen',
    registerSubtitle: 'Werden Sie heute Mitglied',
    registerButton: 'Registrieren',
    registerLoading: 'Registrierung läuft...',
    confirmPassword: 'Passwort bestätigen',
    haveAccount: 'Bereits ein Konto?',
    signIn: 'Anmelden',
    
    // Register Free Trial page
    registerFreeTrialTitle: 'Registrieren und kostenlose Testversion starten mit',
    registerFreeTrialSubtitle: 'Beginnen Sie Ihre Lernreise mit Leichtigkeit.',
    welcomeTitle: 'Willkommen',
    freeTrialButton: 'Kostenlose Testversion starten',
    freeTrialLoading: 'Konto wird erstellt...',
    
    // Reset Password page
    resetPasswordTitle: 'Passwort zurücksetzen',
    resetPasswordSubtitle: 'Geben Sie Ihre E-Mail ein, um Ihr Passwort zurückzusetzen',
    resetPasswordButton: 'Bestätigen',
    resetPasswordLoading: 'Wird gesendet...',
    resetPasswordSuccess: 'Passwort-Reset-E-Mail gesendet! Überprüfen Sie Ihren Posteingang.',
    resetPasswordInstructions: 'Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.',
    
    // Password visibility
    showPassword: 'Passwort anzeigen',
    hidePassword: 'Passwort verbergen',
    show: 'Anzeigen',
    hide: 'Verbergen',
    
    // Validation messages
    fillAllFields: 'Bitte füllen Sie alle Felder aus.',
    passwordTooShort: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    usernameTooShort: 'Der Benutzername muss mindestens 3 Zeichen lang sein.',
    passwordsDoNotMatch: 'Die Passwörter stimmen nicht überein.',
    invalidEmail: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
    
    // Success messages
    registrationSuccessful: 'Registrierung erfolgreich!',
    loginSuccessful: 'Anmeldung erfolgreich!',
    redirectingToProfile: 'Weiterleitung zum Profil...',
    redirectingToLogin: 'Weiterleitung zur Anmeldung...',
    checkEmail: 'Bitte überprüfen Sie Ihre E-Mail, um Ihr Konto zu bestätigen.',
    
    // Error messages
    emailAlreadyExists: 'Diese E-Mail wird bereits verwendet. Bitte versuchen Sie es mit einer anderen E-Mail.',
    invalidCredentials: 'Ungültige E-Mail oder Passwort.',
    accountNotFound: 'Konto nicht gefunden.',
    serverError: 'Serverfehler. Bitte versuchen Sie es später erneut.',
    registrationFailed: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.',
    loginFailed: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.',
    unexpectedError: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    
    // Dynamic strings
    registerWith: (siteName: string) => `Registrieren und kostenlose Testversion starten mit ${siteName}`,
    welcomeTo: (siteName: string) => `Willkommen bei ${siteName}`,
    loginTo: (siteName: string) => `Anmelden bei ${siteName}`,
  },
  ru: {
    // Common
    email: 'Электронная почта',
    password: 'Пароль',
    username: 'Имя пользователя',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успех',
    contact: 'Контакт',
    privacy: 'Конфиденциальность',
    terms: 'Условия',
    logo: 'Логотип',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'Введите ваш адрес электронной почты',
    passwordPlaceholder: 'Введите ваш пароль',
    usernamePlaceholder: 'Выберите имя пользователя',
    resetEmailPlaceholder: 'Ваш адрес электронной почты',
    
    // Login page
    loginTitle: 'Добро пожаловать обратно',
    loginSubtitle: 'Войдите в свою учетную запись',
    loginButton: 'Войти',
    loginLoading: 'Вход в систему...',
    rememberMe: 'Запомнить меня',
    forgotPassword: 'Запросить',
    passwordReset: 'Сброс Пароля',
    forgotPasswordQuestion: 'Забыли пароль?',
    noAccount: 'Нет учетной записи?',
    createAccount: 'Создать',
    backToLogin: 'Назад к входу',
    
    // Register page
    registerTitle: 'Создать учетную запись',
    registerSubtitle: 'Присоединяйтесь к нам сегодня',
    registerButton: 'Зарегистрироваться',
    registerLoading: 'Регистрация...',
    confirmPassword: 'Подтвердить пароль',
    haveAccount: 'Уже есть учетная запись?',
    signIn: 'Войти',
    
    // Register Free Trial page
    registerFreeTrialTitle: 'Зарегистрируйтесь и начните бесплатную пробную версию с',
    registerFreeTrialSubtitle: 'Начните свое путешествие в обучении с легкостью.',
    welcomeTitle: 'Добро пожаловать',
    freeTrialButton: 'Начать бесплатную пробную версию',
    freeTrialLoading: 'Создание учетной записи...',
    
    // Reset Password page
    resetPasswordTitle: 'Сбросить пароль',
    resetPasswordSubtitle: 'Введите свой email для сброса пароля',
    resetPasswordButton: 'Подтвердить',
    resetPasswordLoading: 'Отправка...',
    resetPasswordSuccess: 'Письмо для сброса пароля отправлено! Проверьте свою почту.',
    resetPasswordInstructions: 'Введите свой адрес электронной почты, и мы отправим вам ссылку для сброса пароля.',
    
    // Password visibility
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    show: 'Показать',
    hide: 'Скрыть',
    
    // Validation messages
    fillAllFields: 'Пожалуйста, заполните все поля.',
    passwordTooShort: 'Пароль должен содержать не менее 8 символов.',
    usernameTooShort: 'Имя пользователя должно содержать не менее 3 символов.',
    passwordsDoNotMatch: 'Пароли не совпадают.',
    invalidEmail: 'Пожалуйста, введите действительный адрес электронной почты.',
    
    // Success messages
    registrationSuccessful: 'Регистрация прошла успешно!',
    loginSuccessful: 'Вход выполнен успешно!',
    redirectingToProfile: 'Перенаправление в профиль...',
    redirectingToLogin: 'Перенаправление на вход...',
    checkEmail: 'Пожалуйста, проверьте свою электронную почту для подтверждения учетной записи.',
    
    // Error messages
    emailAlreadyExists: 'Этот адрес электронной почты уже используется. Пожалуйста, попробуйте другой.',
    invalidCredentials: 'Неверный адрес электронной почты или пароль.',
    accountNotFound: 'Учетная запись не найдена.',
    serverError: 'Ошибка сервера. Пожалуйста, попробуйте позже.',
    registrationFailed: 'Регистрация не удалась. Пожалуйста, попробуйте еще раз.',
    loginFailed: 'Вход не удался. Пожалуйста, попробуйте еще раз.',
    unexpectedError: 'Произошла неожиданная ошибка. Пожалуйста, попробуйте еще раз.',
    
    // Dynamic strings
    registerWith: (siteName: string) => `Зарегистрируйтесь и начните бесплатную пробную версию с ${siteName}`,
    welcomeTo: (siteName: string) => `Добро пожаловать в ${siteName}`,
    loginTo: (siteName: string) => `Войти в ${siteName}`,
  },
  it: {
    // Common
    email: 'Email',
    password: 'Password',
    username: 'Nome utente',
    loading: 'Caricamento...',
    error: 'Errore',
    success: 'Successo',
    contact: 'Contatto',
    privacy: 'Privacy',
    terms: 'Termini',
    logo: 'Logo',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'Inserisci il tuo indirizzo email',
    passwordPlaceholder: 'Inserisci la tua password',
    usernamePlaceholder: 'Scegli un nome utente',
    resetEmailPlaceholder: 'Il tuo indirizzo email',
    
    // Login page
    loginTitle: 'Bentornato',
    loginSubtitle: 'Accedi al tuo account',
    loginButton: 'Accedi',
    loginLoading: 'Accesso in corso...',
    rememberMe: 'Ricordami',
    forgotPassword: 'Richiedi',
    passwordReset: 'Reset della Password',
    forgotPasswordQuestion: 'Password dimenticata?',
    noAccount: 'Non hai un account?',
    createAccount: 'Creane uno',
    backToLogin: 'Torna al login',
    
    // Register page
    registerTitle: 'Crea account',
    registerSubtitle: 'Unisciti a noi oggi',
    registerButton: 'Registrati',
    registerLoading: 'Registrazione...',
    confirmPassword: 'Conferma password',
    haveAccount: 'Hai già un account?',
    signIn: 'Accedi',
    
    // Register Free Trial page
    registerFreeTrialTitle: 'Registrati e inizia la prova gratuita con',
    registerFreeTrialSubtitle: 'Inizia il tuo percorso di apprendimento con facilità.',
    welcomeTitle: 'Benvenuto',
    freeTrialButton: 'Inizia prova gratuita',
    freeTrialLoading: 'Creazione account...',
    
    // Reset Password page
    resetPasswordTitle: 'Reimposta password',
    resetPasswordSubtitle: 'Inserisci la tua email per reimpostare la password',
    resetPasswordButton: 'Conferma',
    resetPasswordLoading: 'Invio in corso...',
    resetPasswordSuccess: 'Email di reset password inviata! Controlla la tua casella di posta.',
    resetPasswordInstructions: 'Inserisci il tuo indirizzo email e ti invieremo un link per reimpostare la tua password.',
    
    // Password visibility
    showPassword: 'Mostra password',
    hidePassword: 'Nascondi password',
    show: 'Mostra',
    hide: 'Nascondi',
    
    // Validation messages
    fillAllFields: 'Compila tutti i campi.',
    passwordTooShort: 'La password deve essere di almeno 8 caratteri.',
    usernameTooShort: 'Il nome utente deve essere di almeno 3 caratteri.',
    passwordsDoNotMatch: 'Le password non corrispondono.',
    invalidEmail: 'Inserisci un indirizzo email valido.',
    
    // Success messages
    registrationSuccessful: 'Registrazione completata!',
    loginSuccessful: 'Accesso completato!',
    redirectingToProfile: 'Reindirizzamento al profilo...',
    redirectingToLogin: 'Reindirizzamento al login...',
    checkEmail: 'Controlla la tua email per confermare il tuo account.',
    
    // Error messages
    emailAlreadyExists: 'Questa email è già in uso. Prova con un\'email diversa.',
    invalidCredentials: 'Email o password non validi.',
    accountNotFound: 'Account non trovato.',
    serverError: 'Errore del server. Riprova più tardi.',
    registrationFailed: 'Registrazione fallita. Riprova.',
    loginFailed: 'Accesso fallito. Riprova.',
    unexpectedError: 'Si è verificato un errore inaspettato. Riprova.',
    
    // Dynamic strings
    registerWith: (siteName: string) => `Registrati e inizia la prova gratuita con ${siteName}`,
    welcomeTo: (siteName: string) => `Benvenuto su ${siteName}`,
    loginTo: (siteName: string) => `Accedi a ${siteName}`,
  },
  pt: {
    // Common
    email: 'E-mail',
    password: 'Senha',
    username: 'Nome de usuário',
    loading: 'Carregando...',
    error: 'Erro',
    success: 'Sucesso',
    contact: 'Contato',
    privacy: 'Privacidade',
    terms: 'Termos',
    logo: 'Logo',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'Digite seu endereço de e-mail',
    passwordPlaceholder: 'Digite sua senha',
    usernamePlaceholder: 'Escolha um nome de usuário',
    resetEmailPlaceholder: 'Seu endereço de e-mail',
    
    // Login page
    loginTitle: 'Bem-vindo de volta',
    loginSubtitle: 'Entre na sua conta',
    loginButton: 'Entrar',
    loginLoading: 'Entrando...',
    rememberMe: 'Lembrar de mim',
    forgotPassword: 'Solicitar',
    passwordReset: 'Redefinição de Senha',
    forgotPasswordQuestion: 'Esqueceu sua senha?',
    noAccount: 'Não tem uma conta?',
    createAccount: 'Criar uma',
    backToLogin: 'Voltar ao login',
    
    // Register page
    registerTitle: 'Criar conta',
    registerSubtitle: 'Junte-se a nós hoje',
    registerButton: 'Registrar',
    registerLoading: 'Registrando...',
    confirmPassword: 'Confirmar senha',
    haveAccount: 'Já tem uma conta?',
    signIn: 'Entrar',
    
    // Register Free Trial page
    registerFreeTrialTitle: 'Registre-se e inicie o teste gratuito com',
    registerFreeTrialSubtitle: 'Comece sua jornada de aprendizado com facilidade.',
    welcomeTitle: 'Bem-vindo',
    freeTrialButton: 'Iniciar teste gratuito',
    freeTrialLoading: 'Criando conta...',
    
    // Reset Password page
    resetPasswordTitle: 'Redefinir senha',
    resetPasswordSubtitle: 'Digite seu e-mail para redefinir sua senha',
    resetPasswordButton: 'Confirmar',
    resetPasswordLoading: 'Enviando...',
    resetPasswordSuccess: 'E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.',
    resetPasswordInstructions: 'Digite seu endereço de e-mail e enviaremos um link para redefinir sua senha.',
    
    // Password visibility
    showPassword: 'Mostrar senha',
    hidePassword: 'Ocultar senha',
    show: 'Mostrar',
    hide: 'Ocultar',
    
    // Validation messages
    fillAllFields: 'Por favor, preencha todos os campos.',
    passwordTooShort: 'A senha deve ter pelo menos 8 caracteres.',
    usernameTooShort: 'O nome de usuário deve ter pelo menos 3 caracteres.',
    passwordsDoNotMatch: 'As senhas não coincidem.',
    invalidEmail: 'Por favor, digite um endereço de e-mail válido.',
    
    // Success messages
    registrationSuccessful: 'Registro bem-sucedido!',
    loginSuccessful: 'Login bem-sucedido!',
    redirectingToProfile: 'Redirecionando para o perfil...',
    redirectingToLogin: 'Redirecionando para o login...',
    checkEmail: 'Verifique seu e-mail para confirmar sua conta.',
    
    // Error messages
    emailAlreadyExists: 'Este e-mail já está em uso. Tente um e-mail diferente.',
    invalidCredentials: 'E-mail ou senha inválidos.',
    accountNotFound: 'Conta não encontrada.',
    serverError: 'Erro do servidor. Tente novamente mais tarde.',
    registrationFailed: 'Registro falhou. Tente novamente.',
    loginFailed: 'Login falhou. Tente novamente.',
    unexpectedError: 'Ocorreu um erro inesperado. Tente novamente.',
    
    // Dynamic strings
    registerWith: (siteName: string) => `Registre-se e inicie o teste gratuito com ${siteName}`,
    welcomeTo: (siteName: string) => `Bem-vindo ao ${siteName}`,
    loginTo: (siteName: string) => `Entrar no ${siteName}`,
  },
  pl: {
    // Common
    email: 'E-mail',
    password: 'Hasło',
    username: 'Nazwa użytkownika',
    loading: 'Ładowanie...',
    error: 'Błąd',
    success: 'Sukces',
    contact: 'Kontakt',
    privacy: 'Prywatność',
    terms: 'Warunki',
    logo: 'Logo',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'Wprowadź swój adres e-mail',
    passwordPlaceholder: 'Wprowadź swoje hasło',
    usernamePlaceholder: 'Wybierz nazwę użytkownika',
    resetEmailPlaceholder: 'Twój adres e-mail',
    
    // Login page
    loginTitle: 'Witamy ponownie',
    loginSubtitle: 'Zaloguj się do swojego konta',
    loginButton: 'Zaloguj się',
    loginLoading: 'Logowanie...',
    rememberMe: 'Zapamiętaj mnie',
    forgotPassword: 'Poproś',
    passwordReset: 'Reset Hasła',
    forgotPasswordQuestion: 'Zapomniałeś hasła?',
    noAccount: 'Nie masz konta?',
    createAccount: 'Utwórz',
    backToLogin: 'Powrót do logowania',
    
    // Register page
    registerTitle: 'Utwórz konto',
    registerSubtitle: 'Dołącz do nas dziś',
    registerButton: 'Zarejestruj się',
    registerLoading: 'Rejestracja...',
    confirmPassword: 'Potwierdź hasło',
    haveAccount: 'Masz już konto?',
    signIn: 'Zaloguj się',
    
    // Register Free Trial page
    registerFreeTrialTitle: 'Zarejestruj się i rozpocznij bezpłatny okres próbny z',
    registerFreeTrialSubtitle: 'Rozpocznij swoją podróż edukacyjną z łatwością.',
    welcomeTitle: 'Witamy',
    freeTrialButton: 'Rozpocznij bezpłatny okres próbny',
    freeTrialLoading: 'Tworzenie konta...',
    
    // Reset Password page
    resetPasswordTitle: 'Resetuj hasło',
    resetPasswordSubtitle: 'Wprowadź swój e-mail, aby zresetować hasło',
    resetPasswordButton: 'Potwierdź',
    resetPasswordLoading: 'Wysyłanie...',
    resetPasswordSuccess: 'E-mail z resetem hasła został wysłany! Sprawdź swoją skrzynkę odbiorczą.',
    resetPasswordInstructions: 'Wprowadź swój adres e-mail, a wyślemy Ci link do resetowania hasła.',
    
    // Password visibility
    showPassword: 'Pokaż hasło',
    hidePassword: 'Ukryj hasło',
    show: 'Pokaż',
    hide: 'Ukryj',
    
    // Validation messages
    fillAllFields: 'Proszę wypełnić wszystkie pola.',
    passwordTooShort: 'Hasło musi mieć co najmniej 8 znaków.',
    usernameTooShort: 'Nazwa użytkownika musi mieć co najmniej 3 znaki.',
    passwordsDoNotMatch: 'Hasła nie są zgodne.',
    invalidEmail: 'Proszę wprowadzić prawidłowy adres e-mail.',
    
    // Success messages
    registrationSuccessful: 'Rejestracja udana!',
    loginSuccessful: 'Logowanie udane!',
    redirectingToProfile: 'Przekierowanie do profilu...',
    redirectingToLogin: 'Przekierowanie do logowania...',
    checkEmail: 'Sprawdź swój e-mail, aby potwierdzić konto.',
    
    // Error messages
    emailAlreadyExists: 'Ten e-mail jest już używany. Spróbuj innego e-maila.',
    invalidCredentials: 'Nieprawidłowy e-mail lub hasło.',
    accountNotFound: 'Konto nie zostało znalezione.',
    serverError: 'Błąd serwera. Spróbuj ponownie później.',
    registrationFailed: 'Rejestracja nie powiodła się. Spróbuj ponownie.',
    loginFailed: 'Logowanie nie powiodło się. Spróbuj ponownie.',
    unexpectedError: 'Wystąpił nieoczekiwany błąd. Spróbuj ponownie.',
    
    // Dynamic strings
    registerWith: (siteName: string) => `Zarejestruj się i rozpocznij bezpłatny okres próbny z ${siteName}`,
    welcomeTo: (siteName: string) => `Witamy w ${siteName}`,
    loginTo: (siteName: string) => `Zaloguj się do ${siteName}`,
  },
  zh: {
    // Common
    email: '电子邮件',
    password: '密码',
    username: '用户名',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    contact: '联系',
    privacy: '隐私',
    terms: '条款',
    logo: '标志',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: '输入您的电子邮件地址',
    passwordPlaceholder: '输入您的密码',
    usernamePlaceholder: '选择用户名',
    resetEmailPlaceholder: '您的电子邮件地址',
    
    // Login page
    loginTitle: '欢迎回来',
    loginSubtitle: '登录您的账户',
    loginButton: '登录',
    loginLoading: '登录中...',
    rememberMe: '记住我',
    forgotPassword: '请求',
    passwordReset: '密码重置',
    forgotPasswordQuestion: '忘记密码？',
    noAccount: '没有账户？',
    createAccount: '创建一个',
    backToLogin: '返回登录',
    
    // Register page
    registerTitle: '创建账户',
    registerSubtitle: '今天加入我们',
    registerButton: '注册',
    registerLoading: '注册中...',
    confirmPassword: '确认密码',
    haveAccount: '已有账户？',
    signIn: '登录',
    
    // Register Free Trial page
    registerFreeTrialTitle: '注册并开始免费试用',
    registerFreeTrialSubtitle: '轻松开始您的学习之旅。',
    welcomeTitle: '欢迎',
    freeTrialButton: '开始免费试用',
    freeTrialLoading: '创建账户中...',
    
    // Reset Password page
    resetPasswordTitle: '重置密码',
    resetPasswordSubtitle: '输入您的邮箱以重置密码',
    resetPasswordButton: '确认',
    resetPasswordLoading: '发送中...',
    resetPasswordSuccess: '密码重置邮件已发送！请检查您的收件箱。',
    resetPasswordInstructions: '输入您的电子邮件地址，我们将向您发送重置密码的链接。',
    
    // Password visibility
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    show: '显示',
    hide: '隐藏',
    
    // Validation messages
    fillAllFields: '请填写所有字段。',
    passwordTooShort: '密码至少需要8个字符。',
    usernameTooShort: '用户名至少需要3个字符。',
    passwordsDoNotMatch: '密码不匹配。',
    invalidEmail: '请输入有效的电子邮件地址。',
    
    // Success messages
    registrationSuccessful: '注册成功！',
    loginSuccessful: '登录成功！',
    redirectingToProfile: '跳转到个人资料...',
    redirectingToLogin: '跳转到登录...',
    checkEmail: '请检查您的电子邮件以确认您的账户。',
    
    // Error messages
    emailAlreadyExists: '此电子邮件已被使用。请尝试其他电子邮件。',
    invalidCredentials: '无效的电子邮件或密码。',
    accountNotFound: '账户未找到。',
    serverError: '服务器错误。请稍后再试。',
    registrationFailed: '注册失败。请重试。',
    loginFailed: '登录失败。请重试。',
    unexpectedError: '发生意外错误。请重试。',
    
    // Dynamic strings
    registerWith: (siteName: string) => `注册并开始免费试用 ${siteName}`,
    welcomeTo: (siteName: string) => `欢迎来到 ${siteName}`,
    loginTo: (siteName: string) => `登录到 ${siteName}`,
  },
  ja: {
    // Common
    email: 'メール',
    password: 'パスワード',
    username: 'ユーザー名',
    loading: '読み込み中...',
    error: 'エラー',
    success: '成功',
    contact: '連絡先',
    privacy: 'プライバシー',
    terms: '利用規約',
    logo: 'ロゴ',
    
    // Placeholders (informative text for empty fields)
    emailPlaceholder: 'メールアドレスを入力してください',
    passwordPlaceholder: 'パスワードを入力してください',
    usernamePlaceholder: 'ユーザー名を選択してください',
    resetEmailPlaceholder: 'あなたのメールアドレス',
    
    // Login page
    loginTitle: 'お帰りなさい',
    loginSubtitle: 'アカウントにサインインしてください',
    loginButton: 'サインイン',
    loginLoading: 'サインイン中...',
    rememberMe: 'ログイン状態を保持',
    forgotPassword: 'リクエスト',
    passwordReset: 'パスワードリセット',
    forgotPasswordQuestion: 'パスワードを忘れましたか？',
    noAccount: 'アカウントをお持ちではありませんか？',
    createAccount: '作成する',
    backToLogin: 'ログインに戻る',
    
    // Register page
    registerTitle: 'アカウント作成',
    registerSubtitle: '今日から始めましょう',
    registerButton: '登録',
    registerLoading: '登録中...',
    confirmPassword: 'パスワード確認',
    haveAccount: 'すでにアカウントをお持ちですか？',
    signIn: 'サインイン',
    
    // Register Free Trial page
    registerFreeTrialTitle: '登録して無料トライアルを開始',
    registerFreeTrialSubtitle: '簡単に学習の旅を始めましょう。',
    welcomeTitle: 'ようこそ',
    freeTrialButton: '無料トライアルを開始',
    freeTrialLoading: 'アカウント作成中...',
    
    // Reset Password page
    resetPasswordTitle: 'パスワードリセット',
    resetPasswordSubtitle: 'パスワードをリセットするためにメールアドレスを入力してください',
    resetPasswordButton: '確認',
    resetPasswordLoading: '送信中...',
    resetPasswordSuccess: 'パスワードリセットメールを送信しました！受信箱をご確認ください。',
    resetPasswordInstructions: 'メールアドレスを入力していただければ、パスワードリセット用のリンクをお送りします。',
    
    // Password visibility
    showPassword: 'パスワードを表示',
    hidePassword: 'パスワードを非表示',
    show: '表示',
    hide: '非表示',
    
    // Validation messages
    fillAllFields: 'すべてのフィールドを入力してください。',
    passwordTooShort: 'パスワードは8文字以上である必要があります。',
    usernameTooShort: 'ユーザー名は3文字以上である必要があります。',
    passwordsDoNotMatch: 'パスワードが一致しません。',
    invalidEmail: '有効なメールアドレスを入力してください。',
    
    // Success messages
    registrationSuccessful: '登録が完了しました！',
    loginSuccessful: 'ログインが完了しました！',
    redirectingToProfile: 'プロフィールにリダイレクト中...',
    redirectingToLogin: 'ログインにリダイレクト中...',
    checkEmail: 'アカウントを確認するためにメールをご確認ください。',
    
    // Error messages
    emailAlreadyExists: 'このメールアドレスは既に使用されています。別のメールアドレスをお試しください。',
    invalidCredentials: '無効なメールアドレスまたはパスワードです。',
    accountNotFound: 'アカウントが見つかりません。',
    serverError: 'サーバーエラーです。後でもう一度お試しください。',
    registrationFailed: '登録に失敗しました。もう一度お試しください。',
    loginFailed: 'ログインに失敗しました。もう一度お試しください。',
    unexpectedError: '予期しないエラーが発生しました。もう一度お試しください。',
    
    // Dynamic strings
    registerWith: (siteName: string) => `${siteName} で登録して無料トライアルを開始`,
    welcomeTo: (siteName: string) => `${siteName} へようこそ`,
    loginTo: (siteName: string) => `${siteName} にログイン`,
  },
};
