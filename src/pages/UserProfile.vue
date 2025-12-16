<script>
import { RouterLink } from 'vue-router';
import AppH1 from '../components/AppH1.vue';
import { fetchUserProfileById } from '../services/user-profiles';
import { fetchUserPosts } from '../services/posts';

export default {
    name: 'UserProfile',
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
            posts: [],
            loading: false,
            postsLoading: false,
        }
    },
    async mounted() {
        try {
            this.loading = true;

            // Obtener datos del usuario
            this.user = await fetchUserProfileById(this.$route.params.id);
            
            // Obtener publicaciones del usuario
            this.postsLoading = true;
            this.posts = await fetchUserPosts(this.user.id);
        } catch (error) {
            console.error('Error al cargar el perfil:', error);
        } finally {
            this.loading = false;
            this.postsLoading = false;
        }
    },
    methods: {
        formatDate(dateString) {
            const date = new Date(dateString);

            const dateFormatter = new Intl.DateTimeFormat('es-AR', {
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false,
            });
            
            return dateFormatter.format(date);
        }
    }
}
</script>

<template>
    <div class="max-w-4xl mx-auto">
        <!-- Header del perfil -->
        <div class="card mb-6">
            <div class="flex items-center gap-4 mb-4">
                <div v-if="user.profile_image_url" class="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-200">
                    <img :src="user.profile_image_url" alt="Imagen de perfil" class="w-full h-full object-cover">
                </div>
                <div v-else class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-blue-600 font-semibold text-2xl">👤</span>
                </div>
                <div>
                    <h1 class="text-2xl font-bold text-blue-800">{{ user.display_name || user.email }}</h1>
                    <p class="text-gray-600">{{ user.email }}</p>
                </div>
            </div>

            <!-- Información del usuario -->
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h3 class="font-semibold text-blue-800 mb-2">📝 Biografía</h3>
                    <p class="text-gray-700 italic">{{ user.bio || 'Sin especificar...' }}</p>
                </div>
                
                <div>
                    <h3 class="font-semibold text-blue-800 mb-2">🎓 Carrera</h3>
                    <p class="text-gray-700">{{ user.career || 'Sin especificar...' }}</p>
                </div>
            </div>
        </div>

        <!-- Estadísticas -->
        <div class="card mb-6 bg-blue-50 border-blue-200">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">📊 Estadísticas</h2>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                    <div class="text-2xl font-bold text-blue-600">{{ posts.length }}</div>
                    <div class="text-sm text-gray-600">Publicaciones</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-blue-600">🏛️</div>
                    <div class="text-sm text-gray-600">UBA</div>
                </div>
                <div>
                    <div class="text-2xl font-bold text-blue-600">👥</div>
                    <div class="text-sm text-gray-600">Comunidad</div>
                </div>
            </div>
        </div>

        <!-- Publicaciones del usuario -->
        <div class="card">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">📋 Publicaciones</h2>
            
            <div v-if="postsLoading" class="text-center py-8">
                <p class="text-gray-500">⏳ Cargando publicaciones...</p>
            </div>

            <div v-else-if="posts.length === 0" class="text-center py-8 text-gray-500">
                <p>📭 Este usuario aún no ha publicado nada</p>
            </div>

            <div v-else class="space-y-4">
                <article 
                    v-for="post in posts" 
                    :key="post.id"
                    class="border border-blue-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                    <header class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <span class="text-sm text-gray-500">{{ formatDate(post.created_at) }}</span>
                        </div>
                    </header>

                    <div class="content">
                        <h3 v-if="post.title" class="text-lg font-semibold mb-2 text-gray-800">
                            {{ post.title }}
                        </h3>
                        <p class="text-gray-700 whitespace-pre-wrap">{{ post.content }}</p>
                    </div>
                </article>
            </div>
        </div>
    </div>
</template>