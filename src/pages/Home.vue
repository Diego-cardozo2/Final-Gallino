<script>
import AppH1 from '../components/AppH1.vue';
import { subscribeToAuthStateChanges } from '../services/auth';

let unsubscribeFromAuth = () => {};

export default {
    name: 'Home',
    components: { AppH1, },
    data() {
        return {
            user: {
                id: null,
                email: null,
                display_name: null,
                bio: null,
                career: null,
            },
        }
    },
    mounted() {
        unsubscribeFromAuth = subscribeToAuthStateChanges(newUserState => this.user = newUserState);
    },
    unmounted() {
        unsubscribeFromAuth();
    }
}
</script>

<template>
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 rounded-lg mb-8">
        <div class="max-w-4xl mx-auto text-center px-4">
            <div class="mb-6">
                <span class="text-6xl">🎓</span>
            </div>
            <h1 class="text-4xl md:text-5xl font-bold mb-4">
                ¡Bienvenido a UBA Network!
            </h1>
            <p class="text-xl md:text-2xl mb-6 opacity-90">
                La red social de la Universidad de Buenos Aires
            </p>
            <p class="text-lg opacity-80 max-w-2xl mx-auto">
                Conecta con estudiantes, docentes y personal de todas las facultades. 
                Comparte ideas, participa en debates y forma parte de la comunidad universitaria más grande del país.
            </p>
        </div>
    </section>

    <!-- Estado del usuario -->
    <div v-if="user.id" class="card mb-8 bg-green-50 border-green-200">
        <div class="flex items-center gap-3">
            <span class="text-2xl">👋</span>
            <div>
                <h3 class="font-semibold text-green-800">¡Hola, {{ user.email }}!</h3>
                <p class="text-green-600">Ya estás conectado a la comunidad UBA</p>
            </div>
        </div>
    </div>

    <!-- Características principales -->
    <section class="mb-8">
        <h2 class="text-2xl font-bold text-blue-800 mb-6 text-center">🌟 ¿Qué puedes hacer en UBA Network?</h2>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Muro de publicaciones -->
            <div class="card text-center hover:shadow-lg transition-shadow">
                <div class="text-4xl mb-4">📋</div>
                <h3 class="text-xl font-semibold mb-3 text-blue-800">Muro de Publicaciones</h3>
                <p class="text-gray-600 mb-4">
                    Comparte ideas, anuncios importantes, eventos y contenido académico con toda la comunidad.
                </p>
                <RouterLink 
                    to="/muro" 
                    class="btn-secondary inline-block"
                >
                    Ver Muro
                </RouterLink>
            </div>

            <!-- Chat global -->
            <div class="card text-center hover:shadow-lg transition-shadow">
                <div class="text-4xl mb-4">💬</div>
                <h3 class="text-xl font-semibold mb-3 text-blue-800">Chat Global</h3>
                <p class="text-gray-600 mb-4">
                    Conversa en tiempo real con estudiantes y docentes de todas las facultades de la UBA.
                </p>
                <RouterLink 
                    to="/chat" 
                    class="btn-secondary inline-block"
                >
                    Ir al Chat
                </RouterLink>
            </div>

            <!-- Perfil -->
            <div class="card text-center hover:shadow-lg transition-shadow">
                <div class="text-4xl mb-4">👤</div>
                <h3 class="text-xl font-semibold mb-3 text-blue-800">Mi Perfil</h3>
                <p class="text-gray-600 mb-4">
                    Personaliza tu perfil, comparte tu carrera y conecta con otros miembros de la comunidad.
                </p>
                <RouterLink 
                    to="/mi-perfil" 
                    class="btn-secondary inline-block"
                >
                    Mi Perfil
                </RouterLink>
            </div>
        </div>
    </section>

    <!-- Estadísticas de la comunidad -->
    <section class="mb-8">
        <div class="card bg-blue-50 border-blue-200">
            <h2 class="text-2xl font-bold text-blue-800 mb-6 text-center">📊 Comunidad UBA</h2>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                    <div class="text-3xl font-bold text-blue-600">13</div>
                    <div class="text-sm text-gray-600">Facultades</div>
                </div>
                <div>
                    <div class="text-3xl font-bold text-blue-600">300K+</div>
                    <div class="text-sm text-gray-600">Estudiantes</div>
                </div>
                <div>
                    <div class="text-3xl font-bold text-blue-600">100+</div>
                    <div class="text-sm text-gray-600">Carreras</div>
                </div>
                <div>
                    <div class="text-3xl font-bold text-blue-600">1</div>
                    <div class="text-sm text-gray-600">Red Social</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Llamadas a la acción -->
    <section class="mb-8">
        <div v-if="user.id === null" class="text-center">
            <div class="card bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <h2 class="text-2xl font-bold text-blue-800 mb-4">🚀 ¡Únete a la comunidad!</h2>
                <p class="text-gray-600 mb-6">
                    Crea tu cuenta y comienza a conectar con la comunidad universitaria más grande de Argentina.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <RouterLink 
                        to="/crear-cuenta" 
                        class="btn-primary"
                    >
                        📝 Crear Cuenta
                    </RouterLink>
                    <RouterLink 
                        to="/ingresar" 
                        class="btn-secondary"
                    >
                        🔑 Iniciar Sesión
                    </RouterLink>
                </div>
            </div>
        </div>

        <div v-else class="text-center">
            <div class="card bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <h2 class="text-2xl font-bold text-green-800 mb-4">🎉 ¡Ya eres parte de la comunidad!</h2>
                <p class="text-gray-600 mb-6">
                    Explora todas las funcionalidades y conecta con otros miembros de la UBA.
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <RouterLink 
                        to="/muro" 
                        class="btn-primary"
                    >
                        📋 Ver Muro
                    </RouterLink>
                    <RouterLink 
                        to="/chat" 
                        class="btn-secondary"
                    >
                        💬 Ir al Chat
                    </RouterLink>
                </div>
            </div>
        </div>
    </section>

    <!-- Información adicional -->
    <section class="mb-8">
        <div class="grid md:grid-cols-2 gap-6">
            <div class="card">
                <h3 class="text-xl font-semibold mb-3 text-blue-800">🏛️ Sobre la UBA</h3>
                <p class="text-gray-600 mb-4">
                    La Universidad de Buenos Aires es la universidad más grande de Argentina y una de las más prestigiosas de América Latina.
                </p>
                <ul class="text-sm text-gray-600 space-y-1">
                    <li>• Fundada en 1821</li>
                    <li>• 13 facultades</li>
                    <li>• Más de 300,000 estudiantes</li>
                    <li>• Educación pública y gratuita</li>
                </ul>
            </div>

            <div class="card">
                <h3 class="text-xl font-semibold mb-3 text-blue-800">🔒 Privacidad y Seguridad</h3>
                <p class="text-gray-600 mb-4">
                    Tu privacidad es importante para nosotros. Solo miembros verificados de la comunidad UBA pueden acceder a la plataforma.
                </p>
                <ul class="text-sm text-gray-600 space-y-1">
                    <li>• Acceso solo para comunidad UBA</li>
                    <li>• Datos protegidos y seguros</li>
                    <li>• Moderación activa</li>
                    <li>• Ambiente académico respetuoso</li>
                </ul>
            </div>
        </div>
    </section>
</template>