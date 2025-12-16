<script>
// import Home from './pages/Home.vue';
import { logout, subscribeToAuthStateChanges } from './services/auth';

export default {
    name: 'App',
    data() {
        return {
            user: {
                id: null,
                email: null,
            },
        }
    },
    methods: {
        handleLogout() {
            logout();

            // Redireccionamos al usuario al login.
            // Esto requiere usar la instanacia de Router de Vue Router.
            // La tenemos disponible en la propiedad especial $router.
            this.$router.push('/ingresar');
        },
    },
    mounted() {
        // Nos suscribimos para recibir los cambios en el estado de autenticación.
        subscribeToAuthStateChanges(newUserState => this.user = newUserState);
    }
    // La propiedad "components" de Vue indica qué componentes usamos en el template.
    // components: { Home, },
}
</script>

<template>
    <!-- 
    En Tailwind, cada clase representa un valor de un estilo.
    La mayoría de estas clases llevan la nomenclatura de:
        <estilo>-<valor>
            
    Por ejemplo:
        .p-4                padding: 1rem;
        .text-xl            font-size: 1.25rem;
        .border-0           border: 0;

    Hay ciertos casos que pueden tener 3 segmentos. Por ejemplo, manejo de colores:
        .text-red-700
        .bg-slate-500
    
    Por último, hay algunas clases (como display o text-decoration) donde el nombre
    de la clase hace referencia solo al valor del estilo.
    Por ejemplo:
        .flex               display: flex;
        .grid               display: grid;
        .underline          text-decoration: underline;
    -->
    <nav class="flex items-center justify-between p-4 bg-blue-50 border-b-2 border-blue-200">
        <!-- Logo y navegación principal -->
        <div class="flex items-center gap-8">
            <p class="text-xl font-bold text-blue-800">UBA Network</p>
            
            <!-- Navegación principal -->
            <ul class="flex gap-6">
                <li>
                    <RouterLink to="/" class="flex items-center gap-2 hover:text-blue-600 transition-colors">
                        <span class="text-lg">🏠</span>
                        <span>Home</span>
                    </RouterLink>
                </li>
                
                <template v-if="user.id === null">
                    <li>
                        <RouterLink to="/ingresar" class="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <span class="text-lg">🔑</span>
                            <span>Ingresar</span>
                        </RouterLink>
                    </li>
                    <li>
                        <RouterLink to="/crear-cuenta" class="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <span class="text-lg">📝</span>
                            <span>Crear cuenta</span>
                        </RouterLink>
                    </li>
                </template>
                
                <template v-else>
                    <li>
                        <RouterLink to="/muro" class="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <span class="text-lg">📋</span>
                            <span>Muro</span>
                        </RouterLink>
                    </li>
                    <li>
                        <RouterLink to="/chat" class="flex items-center gap-2 hover:text-blue-600 transition-colors">
                            <span class="text-lg">💬</span>
                            <span>Chat</span>
                        </RouterLink>
                    </li>
                </template>
            </ul>
        </div>
        
        <!-- Sección de usuario (derecha) -->
        <template v-if="user.id !== null">
            <div class="flex items-center gap-4">
                <RouterLink to="/mi-perfil" class="flex items-center gap-2 hover:text-blue-600 transition-colors">
                    <span class="text-lg">👤</span>
                    <span>Mi perfil</span>
                </RouterLink>
                
                <div class="h-6 w-px bg-blue-300"></div>
                
                <form action="#" @submit.prevent="handleLogout">
                    <button 
                        type="submit" 
                        class="group flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 hover:border-red-300 transition-all duration-200 hover:shadow-sm"
                        title="Cerrar sesión"
                    >
                        <span class="text-lg group-hover:scale-110 transition-transform duration-200">🎓</span>
                        <div class="flex flex-col items-start">
                            <span class="text-xs text-gray-500 group-hover:text-gray-600 transition-colors">
                                {{ user.email }}
                            </span>
                            <span class="text-sm font-medium text-red-700 group-hover:text-red-800 transition-colors">
                                Cerrar sesión
                            </span>
                        </div>
                    </button>
                </form>
            </div>
        </template>
    </nav>
    <main class="container p-4 mx-auto">
        <!--
        RouterView es un componete que registra globalmente el use(router) (en main.js).
        Esto define dónde queremos que se monte los componentes de las vistas que 
        correspondan a la URL.
        -->
        <RouterView />
    </main>
    <footer class="flex justify-center items-center h-25 bg-blue-900 text-white">
        <p>UBA Network &copy; 2025 - Universidad de Buenos Aires</p>
    </footer>
</template>