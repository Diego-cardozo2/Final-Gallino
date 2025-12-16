<script>
import AppH1 from '../components/AppH1.vue';
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
    components: { AppH1, },
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
    <AppH1>Muro de UBA Network</AppH1>

    <div class="max-w-4xl mx-auto">
        <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-800">
            {{ errorMessage }}
        </div>
        <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-800">
            {{ successMessage }}
        </div>
        <div v-if="user.id" class="card mb-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">📝 Crear nueva publicación</h2>
            
            <form @submit.prevent="handleSubmit">
                <div class="mb-4">
                    <label for="title" class="block mb-2 font-medium">Título (opcional)</label>
                    <input
                        type="text"
                        id="title"
                        class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                        v-model="newPost.title"
                        placeholder="Título de tu publicación..."
                    >
                </div>
                
                <div class="mb-4">
                    <label for="content" class="block mb-2 font-medium">Contenido *</label>
                    <textarea
                        id="content"
                        class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                        rows="4"
                        v-model="newPost.content"
                        placeholder="¿Qué quieres compartir con la comunidad UBA?"
                        required
                    ></textarea>
                </div>

                <div class="mb-4">
                    <label for="file" class="block mb-2 font-medium">Imagen o archivo (opcional)</label>
                    <input
                        type="file"
                        id="file"
                        class="w-full p-2 border border-blue-200 rounded-lg"
                        @change="handleFileChange"
                        accept="image/*"
                    >
                </div>
                
                <div class="flex justify-end">
                    <button 
                        type="submit" 
                        class="btn-primary"
                        :disabled="loading || !newPost.content.trim()"
                    >
                        <span v-if="loading">⏳ Publicando...</span>
                        <span v-else>🚀 Publicar</span>
                    </button>
                </div>
            </form>
        </div>

        <div v-else class="card mb-6 text-center">
            <p class="text-gray-600">
                🔐 <RouterLink to="/ingresar" class="text-blue-600 hover:text-blue-800">Inicia sesión</RouterLink> 
                para crear publicaciones y participar en la comunidad UBA
            </p>
        </div>

        <div class="space-y-4">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">📋 Publicaciones recientes</h2>
            
            <div v-if="posts.length === 0" class="card text-center text-gray-500">
                <p>📭 Aún no hay publicaciones. ¡Sé el primero en compartir algo!</p>
            </div>

            <article 
                v-for="post in posts" 
                :key="post.id"
                class="card hover:shadow-md transition-shadow"
            >
                <header class="flex justify-between items-start mb-3">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span class="text-blue-600 font-semibold text-lg">👤</span>
                        </div>
                        <div>
                            <RouterLink 
                                :to="`/usuario/${post.author_id}`"
                                class="font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                            >
                                {{ post.author_email }}
                            </RouterLink>
                            <p class="text-sm text-gray-500">{{ formatDate(post.created_at) }}</p>
                        </div>
                    </div>
                    
                    <div v-if="user.id === post.author_id || user.is_admin" class="flex gap-2">
                        <button 
                            @click="startEdit(post)"
                            class="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Editar publicación"
                        >
                            ✏️
                        </button>
                        <button 
                            @click="deletePostHandler(post.id)"
                            class="text-red-500 hover:text-red-700 transition-colors"
                            title="Eliminar publicación"
                        >
                            🗑️
                        </button>
                    </div>
                </header>

                <div v-if="editingPostId === post.id" class="mb-4 p-4 bg-gray-50 rounded-lg">
                    <input
                        type="text"
                        class="w-full p-2 border border-blue-200 rounded mb-2"
                        v-model="editingPost.title"
                        placeholder="Título (opcional)"
                    >
                    <textarea
                        class="w-full p-2 border border-blue-200 rounded mb-2"
                        rows="3"
                        v-model="editingPost.content"
                    ></textarea>
                    <div class="flex gap-2">
                        <button @click="saveEdit(post.id)" class="btn-primary text-sm">Guardar</button>
                        <button @click="cancelEdit" class="btn-secondary text-sm">Cancelar</button>
                    </div>
                </div>

                <div v-else class="content">
                    <h3 v-if="post.title" class="text-lg font-semibold mb-2 text-gray-800">
                        {{ post.title }}
                    </h3>
                    <p class="text-gray-700 whitespace-pre-wrap">{{ post.content }}</p>
                    <img v-if="post.file_url" :src="post.file_url" alt="Imagen del post" class="mt-4 max-w-full rounded-lg">
                </div>

                <div class="mt-4 pt-4 border-t border-gray-200">
                    <button 
                        @click="toggleComments(post.id)"
                        class="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        💬 {{ showingComments[post.id] ? 'Ocultar' : 'Ver' }} comentarios
                    </button>

                    <div v-if="showingComments[post.id]" class="mt-4">
                        <div v-if="user.id" class="mb-4">
                            <textarea
                                class="w-full p-2 border border-blue-200 rounded text-sm"
                                rows="2"
                                v-model="newComments[post.id]"
                                placeholder="Escribe un comentario..."
                            ></textarea>
                            <button 
                                @click="addComment(post.id)"
                                class="mt-2 btn-secondary text-sm"
                                :disabled="commentLoading[post.id]"
                            >
                                <span v-if="commentLoading[post.id]">⏳ Comentando...</span>
                                <span v-else>Comentar</span>
                            </button>
                        </div>

                        <div v-if="comments[post.id] && comments[post.id].length > 0" class="space-y-2 mt-4">
                            <div 
                                v-for="comment in comments[post.id]" 
                                :key="comment.id"
                                class="p-3 bg-gray-50 rounded"
                            >
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <span class="font-semibold text-sm text-blue-700">{{ comment.author_email }}</span>
                                        <p class="text-sm text-gray-700 mt-1">{{ comment.content }}</p>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs text-gray-500">{{ formatDate(comment.created_at) }}</span>
                                        <button 
                                            v-if="user.id === comment.author_id || user.is_admin"
                                            @click="deleteCommentHandler(comment.id, post.id)"
                                            class="text-red-500 hover:text-red-700 text-xs"
                                            title="Eliminar comentario"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-sm text-gray-500 mt-2">
                            No hay comentarios aún
                        </div>
                    </div>
                </div>
            </article>
        </div>
    </div>
</template>
