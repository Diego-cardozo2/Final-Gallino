<script>
import { subscribeToAuthStateChanges, isAdmin } from '../services/auth';
import { 
    fetchAllPosts, 
    createPost, 
    deletePost, 
    updatePost,
    uploadPostFile,
    subscribeToNewPosts,
    subscribeToPostUpdates,
    createComment,
    fetchPostComments,
    subscribeToPostComments,
    deleteComment
} from '../services/posts';

let unsubscribeFromPosts = () => {};
let unsubscribeFromAuth = () => {};
let unsubscribeFromUpdates = () => {};
const commentUnsubscribes = {};

export default {
    name: 'PublicChat',
    data() {
        return {
            posts: [],
            loading: false,
            editingPostId: null,
            editingPost: {
                title: '',
                content: '',
            },
            newPost: {
                title: '',
                content: '',
                file: null,
            },
            comments: {},
            newComments: {},
            showingComments: {},
            user: {
                id: null,
                email: null,
                display_name: null,
                bio: null,
                career: null,
                is_admin: false,
            },
            errorMessage: '',
            successMessage: '',
            commentLoading: {},
        }
    },
    methods: {
        handleFileChange(event) {
            const file = event.target.files[0];
            if (file && file.size > 5 * 1024 * 1024) {
                this.errorMessage = 'El archivo es muy grande. Máximo 5MB.';
                event.target.value = '';
                return;
            }
            this.newPost.file = file;
            this.errorMessage = '';
        },
        async handleSubmit() {
            this.errorMessage = '';
            this.successMessage = '';

            if (!this.newPost.content || !this.newPost.content.trim()) {
                this.errorMessage = 'El contenido del post no puede estar vacío';
                return;
            }

            if (this.newPost.content.length > 2000) {
                this.errorMessage = 'El contenido es muy largo. Máximo 2000 caracteres.';
                return;
            }

            try {
                this.loading = true;
                
                let fileUrl = null;
                if (this.newPost.file) {
                    const tempPost = await createPost({
                        author_id: this.user.id,
                        author_email: this.user.email,
                        content: this.newPost.content,
                        title: this.newPost.title || null,
                    });
                    
                    fileUrl = await uploadPostFile(this.newPost.file, tempPost.id);
                    await updatePost(tempPost.id, this.user.id, { file_url: fileUrl }, isAdmin());
                } else {
                    await createPost({
                        author_id: this.user.id,
                        author_email: this.user.email,
                        content: this.newPost.content,
                        title: this.newPost.title || null,
                    });
                }

                this.successMessage = 'Publicación creada correctamente';
                this.newPost.title = '';
                this.newPost.content = '';
                this.newPost.file = null;
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';
                
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            } catch (error) {
                console.error('Error al crear el post:', error);
                this.errorMessage = 'Error al crear el post. Inténtalo de nuevo.';
            } finally {
                this.loading = false;
            }
        },
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
        },
        getCharacterCount() {
            return this.newPost.content ? this.newPost.content.length : 0;
        },
        async deletePostHandler(postId) {
            if (!confirm('¿Estás seguro de que quieres eliminar este post?')) {
                return;
            }

            try {
                this.loading = true;
                await deletePost(postId, this.user.id, isAdmin());
                this.posts = this.posts.filter(p => p.id !== postId);
                if (this.comments[postId]) {
                    delete this.comments[postId];
                }
                if (this.showingComments[postId]) {
                    delete this.showingComments[postId];
                }
                this.successMessage = 'Post eliminado correctamente';
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            } catch (error) {
                console.error('Error al eliminar el post:', error);
                this.errorMessage = 'Error al eliminar el post.';
            } finally {
                this.loading = false;
            }
        },
        startEdit(post) {
            this.editingPostId = post.id;
            this.editingPost.title = post.title || '';
            this.editingPost.content = post.content;
        },
        cancelEdit() {
            this.editingPostId = null;
            this.editingPost.title = '';
            this.editingPost.content = '';
        },
        async saveEdit(postId) {
            if (!this.editingPost.content || !this.editingPost.content.trim()) {
                this.errorMessage = 'El contenido no puede estar vacío';
                return;
            }

            if (this.editingPost.content.length > 2000) {
                this.errorMessage = 'El contenido es muy largo. Máximo 2000 caracteres.';
                return;
            }

            try {
                this.loading = true;
                await updatePost(postId, this.user.id, {
                    title: this.editingPost.title || null,
                    content: this.editingPost.content,
                }, isAdmin());
                
                const postIndex = this.posts.findIndex(p => p.id === postId);
                if (postIndex !== -1) {
                    this.posts[postIndex].title = this.editingPost.title;
                    this.posts[postIndex].content = this.editingPost.content;
                }
                
                this.cancelEdit();
                this.successMessage = 'Post actualizado correctamente';
                setTimeout(() => {
                    this.successMessage = '';
                }, 3000);
            } catch (error) {
                console.error('Error al actualizar el post:', error);
                this.errorMessage = 'Error al actualizar el post.';
            } finally {
                this.loading = false;
            }
        },
        async toggleComments(postId) {
            if (this.showingComments[postId]) {
                this.showingComments[postId] = false;
                if (commentUnsubscribes[postId]) {
                    commentUnsubscribes[postId]();
                    delete commentUnsubscribes[postId];
                }
            } else {
                this.showingComments[postId] = true;
                if (!this.comments[postId]) {
                    this.comments[postId] = await fetchPostComments(postId);
                }
                
                commentUnsubscribes[postId] = subscribeToPostComments(postId, (comment) => {
                    if (!this.comments[postId]) {
                        this.comments[postId] = [];
                    }
                    if (comment.deleted) {
                        this.comments[postId] = this.comments[postId].filter(c => c.id !== comment.id);
                    } else {
                        this.comments[postId].push(comment);
                    }
                });
            }
        },
        async addComment(postId) {
            const commentText = this.newComments[postId];
            if (!commentText || !commentText.trim()) {
                this.errorMessage = 'El comentario no puede estar vacío';
                return;
            }

            if (commentText.length > 500) {
                this.errorMessage = 'El comentario es muy largo. Máximo 500 caracteres.';
                return;
            }

            try {
                this.commentLoading[postId] = true;
                await createComment({
                    post_id: postId,
                    author_id: this.user.id,
                    author_email: this.user.email,
                    content: commentText,
                });
                this.newComments[postId] = '';
                this.errorMessage = '';
            } catch (error) {
                console.error('Error al crear el comentario:', error);
                this.errorMessage = 'Error al crear el comentario.';
            } finally {
                this.commentLoading[postId] = false;
            }
        },
        async deleteCommentHandler(commentId, postId) {
            if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
                return;
            }

            try {
                await deleteComment(commentId, this.user.id, isAdmin());
                if (this.comments[postId]) {
                    this.comments[postId] = this.comments[postId].filter(c => c.id !== commentId);
                }
            } catch (error) {
                console.error('Error al eliminar el comentario:', error);
                this.errorMessage = 'Error al eliminar el comentario.';
            }
        },
    },
    async mounted() {
        try {
            unsubscribeFromAuth = subscribeToAuthStateChanges(newUserState => this.user = newUserState);

            unsubscribeFromPosts = subscribeToNewPosts(async newPost => {
                this.posts.unshift(newPost);
            });

            unsubscribeFromUpdates = subscribeToPostUpdates((updatedPost) => {
                if (updatedPost.deleted) {
                    this.posts = this.posts.filter(p => p.id !== updatedPost.id);
                } else {
                    const index = this.posts.findIndex(p => p.id === updatedPost.id);
                    if (index !== -1) {
                        this.posts[index] = updatedPost;
                    }
                }
            });

            this.posts = await fetchAllPosts();
        } catch (error) {
            console.error('Error al cargar los posts:', error);
        }
    },
    unmounted() {
        unsubscribeFromPosts();
        unsubscribeFromAuth();
        unsubscribeFromUpdates();
        Object.values(commentUnsubscribes).forEach(unsub => unsub());
    }
}
</script>

<template>
    <div class="max-w-4xl mx-auto space-y-6">
        <!-- Mensajes de estado -->
        <div 
            v-if="errorMessage" 
            class="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3 animate-fade-in shadow-sm"
        >
            <span class="text-red-500 text-xl">⚠️</span>
            <p class="text-red-700 text-sm font-medium flex-1">{{ errorMessage }}</p>
        </div>
        
        <div 
            v-if="successMessage" 
            class="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-start gap-3 animate-fade-in shadow-sm"
        >
            <span class="text-green-500 text-xl">✅</span>
            <p class="text-green-700 text-sm font-medium flex-1">{{ successMessage }}</p>
        </div>

        <!-- Formulario de creación -->
        <div v-if="user.id" class="card mb-6 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div class="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <span class="text-white text-xl">✍️</span>
                </div>
                <h2 class="text-2xl font-bold text-blue-800">Crear nueva publicación</h2>
            </div>
            
            <form @submit.prevent="handleSubmit" class="space-y-5">
                <div>
                    <label for="title" class="block mb-2 text-sm font-semibold text-gray-700">
                        📝 Título (opcional)
                    </label>
                    <input
                        type="text"
                        id="title"
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                               transition-all duration-200 outline-none
                               placeholder:text-gray-400 text-gray-700"
                        v-model="newPost.title"
                        placeholder="Título de tu publicación..."
                    >
                </div>
                
                <div>
                    <label for="content" class="block mb-2 text-sm font-semibold text-gray-700">
                        💬 Contenido <span class="text-red-500">*</span>
                    </label>
                    <textarea
                        id="content"
                        class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg 
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                               transition-all duration-200 outline-none resize-none
                               placeholder:text-gray-400 text-gray-700"
                        rows="5"
                        v-model="newPost.content"
                        placeholder="¿Qué quieres compartir con la comunidad UBA?"
                        required
                    ></textarea>
                    <p class="mt-1 text-xs" :class="getCharacterCount() > 2000 ? 'text-red-500 font-semibold' : 'text-gray-500'">
                        {{ getCharacterCount() }}/2000 caracteres
                    </p>
                </div>

                <div>
                    <label for="file" class="block mb-2 text-sm font-semibold text-gray-700">
                        🖼️ Imagen (opcional)
                    </label>
                    <div class="relative">
                        <input
                            type="file"
                            id="file"
                            class="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg 
                                   hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 
                                   transition-all duration-200 outline-none cursor-pointer
                                   file:mr-4 file:py-2 file:px-4 file:rounded-lg 
                                   file:border-0 file:text-sm file:font-semibold
                                   file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            @change="handleFileChange"
                            accept="image/*"
                        >
                    </div>
                    <p class="mt-1 text-xs text-gray-500">Máximo 5MB. Formatos: JPG, PNG, GIF</p>
                </div>
                
                <div class="flex justify-end pt-2">
                    <button 
                        type="submit" 
                        class="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 
                               hover:from-blue-700 hover:to-blue-800 
                               focus:outline-none focus:ring-4 focus:ring-blue-300
                               text-white font-semibold rounded-lg
                               transition-all duration-200 transform hover:scale-[1.02] 
                               active:scale-[0.98] shadow-lg hover:shadow-xl
                               disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                               flex items-center gap-2"
                        :disabled="loading || !newPost.content.trim()"
                    >
                        <span v-if="loading" class="flex items-center gap-2">
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Publicando...
                        </span>
                        <span v-else class="flex items-center gap-2">
                            <span>🚀</span>
                            Publicar
                        </span>
                    </button>
                </div>
            </form>
        </div>

        <!-- Mensaje para usuarios no autenticados -->
        <div v-else class="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-center shadow-md">
            <div class="py-6">
                <div class="text-4xl mb-3">🔐</div>
                <p class="text-gray-700 mb-4">
                    <RouterLink 
                        to="/ingresar" 
                        class="text-blue-600 hover:text-blue-800 font-semibold underline transition-colors"
                    >
                        Inicia sesión
                    </RouterLink> 
                    para crear publicaciones y participar en la comunidad UBA
                </p>
            </div>
        </div>

        <!-- Lista de publicaciones -->
        <div class="space-y-6">
            <div class="flex items-center gap-3 mb-2">
                <div class="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                <h2 class="text-2xl font-bold text-blue-800 px-4">📋 Publicaciones recientes</h2>
                <div class="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
            </div>
            
            <div v-if="posts.length === 0" class="card text-center py-12 bg-gray-50 border-dashed border-2 border-gray-200">
                <div class="text-5xl mb-4">📭</div>
                <p class="text-gray-600 text-lg font-medium">Aún no hay publicaciones</p>
                <p class="text-gray-500 text-sm mt-2">¡Sé el primero en compartir algo con la comunidad!</p>
            </div>

            <article 
                v-for="post in posts" 
                :key="post.id"
                class="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500"
            >
                <!-- Header del post -->
                <header class="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                    <div class="flex items-center gap-4">
                        <RouterLink 
                            :to="`/usuario/${post.author_id}`"
                            class="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                                <span class="text-white font-semibold text-lg">👤</span>
                            </div>
                            <div>
                                <p class="font-semibold text-blue-700 hover:text-blue-900 transition-colors">
                                    {{ post.author_email }}
                                </p>
                                <p class="text-xs text-gray-500 mt-0.5">
                                    📅 {{ formatDate(post.created_at) }}
                                </p>
                            </div>
                        </RouterLink>
                    </div>
                    
                    <div v-if="user.id === post.author_id || user.is_admin" class="flex gap-2">
                        <button 
                            @click="startEdit(post)"
                            class="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Editar publicación"
                        >
                            ✏️
                        </button>
                        <button 
                            @click="deletePostHandler(post.id)"
                            class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Eliminar publicación"
                        >
                            🗑️
                        </button>
                    </div>
                </header>

                <!-- Modo edición -->
                <div v-if="editingPostId === post.id" class="mb-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                    <input
                        type="text"
                        class="w-full px-4 py-2 border-2 border-blue-200 rounded-lg mb-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        v-model="editingPost.title"
                        placeholder="Título (opcional)"
                    >
                    <textarea
                        class="w-full px-4 py-2 border-2 border-blue-200 rounded-lg mb-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none"
                        rows="4"
                        v-model="editingPost.content"
                    ></textarea>
                    <div class="flex gap-3 justify-end">
                        <button 
                            @click="cancelEdit" 
                            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            @click="saveEdit(post.id)" 
                            class="px-4 py-2 btn-primary"
                        >
                            💾 Guardar
                        </button>
                    </div>
                </div>

                <!-- Contenido del post -->
                <div v-else class="content space-y-4">
                    <h3 v-if="post.title" class="text-xl font-bold text-gray-800 mb-2">
                        {{ post.title }}
                    </h3>
                    <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">{{ post.content }}</p>
                    <img 
                        v-if="post.file_url" 
                        :src="post.file_url" 
                        alt="Imagen del post" 
                        class="mt-4 w-full rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
                    >
                </div>

                <!-- Sección de comentarios -->
                <div class="mt-6 pt-4 border-t border-gray-100">
                    <button 
                        @click="toggleComments(post.id)"
                        class="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors mb-4"
                    >
                        <span class="text-lg">💬</span>
                        <span>{{ showingComments[post.id] ? 'Ocultar' : 'Ver' }} comentarios</span>
                        <span v-if="comments[post.id]" class="text-gray-500">
                            ({{ comments[post.id].length }})
                        </span>
                    </button>

                    <div v-if="showingComments[post.id]" class="space-y-4 mt-4">
                        <!-- Formulario de comentario -->
                        <div v-if="user.id" class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <textarea
                                class="w-full px-4 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none resize-none text-sm"
                                rows="3"
                                v-model="newComments[post.id]"
                                placeholder="Escribe un comentario..."
                            ></textarea>
                            <button 
                                @click="addComment(post.id)"
                                class="mt-3 px-4 py-2 btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                :disabled="commentLoading[post.id]"
                            >
                                <span v-if="commentLoading[post.id]" class="flex items-center gap-2">
                                    <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Comentando...
                                </span>
                                <span v-else>💬 Comentar</span>
                            </button>
                        </div>

                        <!-- Lista de comentarios -->
                        <div v-if="comments[post.id] && comments[post.id].length > 0" class="space-y-3">
                            <div 
                                v-for="comment in comments[post.id]" 
                                :key="comment.id"
                                class="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                                <div class="flex justify-between items-start gap-3">
                                    <div class="flex-1">
                                        <div class="flex items-center gap-2 mb-2">
                                            <span class="font-semibold text-sm text-blue-700">
                                                {{ comment.author_email }}
                                            </span>
                                            <span class="text-xs text-gray-500">•</span>
                                            <span class="text-xs text-gray-500">{{ formatDate(comment.created_at) }}</span>
                                        </div>
                                        <p class="text-sm text-gray-700 leading-relaxed">{{ comment.content }}</p>
                                    </div>
                                    <button 
                                        v-if="user.id === comment.author_id || user.is_admin"
                                        @click="deleteCommentHandler(comment.id, post.id)"
                                        class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-all duration-200 flex-shrink-0"
                                        title="Eliminar comentario"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-6 text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <span class="text-2xl block mb-2">💭</span>
                            No hay comentarios aún. ¡Sé el primero en comentar!
                        </div>
                    </div>
                </div>
            </article>
        </div>
    </div>
</template>
