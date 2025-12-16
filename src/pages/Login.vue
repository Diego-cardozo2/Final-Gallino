<script>
import AppH1 from '../components/AppH1.vue';
import { login } from '../services/auth';

export default {
    name: 'Login',
    components: { AppH1, },
    data() {
        return {
            loading: false,
            errorMessage: '',
            user: {
                email: '',
                password: '',
            },
        }
    },
    methods: {
        async handleSubmit() {
            this.errorMessage = '';

            if (!this.user.email || !this.user.email.trim()) {
                this.errorMessage = 'El email es requerido';
                return;
            }

            if (!this.user.email.includes('@')) {
                this.errorMessage = 'El email no es válido';
                return;
            }

            if (!this.user.password || this.user.password.length < 6) {
                this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
                return;
            }

            try {
                this.loading = true;
                await login(this.user.email, this.user.password);
                this.$router.push('/mi-perfil');
            } catch (error) {
                console.error("Error: ", error);
                this.errorMessage = 'Email o contraseña incorrectos';
            } finally {
                this.loading = false;
            }
        },
    },
}
</script>

<template>
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div class="w-full max-w-md">
            <!-- Título -->
            <div class="text-center mb-8">
                <h1 class="text-4xl font-bold text-blue-800 mb-2">Ingresar a mi cuenta</h1>
                <p class="text-gray-600">Bienvenido de vuelta a UBA Network</p>
            </div>

            <!-- Card del formulario -->
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <!-- Mensaje de error -->
                <div 
                    v-if="errorMessage" 
                    class="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-fade-in"
                >
                    <span class="text-red-500 text-xl">⚠️</span>
                    <p class="text-red-700 text-sm font-medium flex-1">{{ errorMessage }}</p>
                </div>

                <!-- Formulario -->
                <form 
                    action="#"
                    @submit.prevent="handleSubmit"
                    class="space-y-6"
                >
                    <!-- Campo Email -->
                    <div class="space-y-2">
                        <label 
                            for="email" 
                            class="block text-sm font-semibold text-gray-700 mb-2"
                        >
                            📧 Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                                   transition-all duration-200 outline-none
                                   placeholder:text-gray-400 text-gray-700"
                            placeholder="tu@email.com"
                            v-model="user.email"
                        >
                    </div>

                    <!-- Campo Contraseña -->
                    <div class="space-y-2">
                        <label 
                            for="password" 
                            class="block text-sm font-semibold text-gray-700 mb-2"
                        >
                            🔒 Contraseña
                        </label>
                        <input
                            type="password"
                            id="password"
                            class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg 
                                   focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                                   transition-all duration-200 outline-none
                                   placeholder:text-gray-400 text-gray-700"
                            placeholder="••••••••"
                            v-model="user.password"
                        >
                    </div>

                    <!-- Botón de envío -->
                    <button 
                        type="submit" 
                        class="w-full py-3 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 
                               hover:from-blue-700 hover:to-blue-800 
                               focus:outline-none focus:ring-4 focus:ring-blue-300
                               text-white font-semibold text-lg
                               transition-all duration-200 transform hover:scale-[1.02] 
                               active:scale-[0.98] shadow-lg hover:shadow-xl
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        :disabled="loading"
                    >
                        <span v-if="loading" class="flex items-center justify-center gap-2">
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Ingresando...
                        </span>
                        <span v-else class="flex items-center justify-center gap-2">
                            <span>🔑</span>
                            Ingresar
                        </span>
                    </button>
                </form>
            </div>

            <!-- Link adicional (opcional, solo visual) -->
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600">
                    ¿No tienes cuenta? 
                    <RouterLink 
                        to="/crear-cuenta" 
                        class="text-blue-600 hover:text-blue-700 font-semibold underline transition-colors"
                    >
                        Crear cuenta
                    </RouterLink>
                </p>
            </div>
        </div>
    </div>
</template>