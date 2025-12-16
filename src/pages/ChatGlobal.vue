<script>
import AppH1 from '../components/AppH1.vue';
import { subscribeToAuthStateChanges } from '../services/auth';
import { fetchLastGlobalChatMessages, sendNewGlobalChatMessage, subscribeToNewGlobalChatMessages } from '../services/global-chat';

let unsubscribeFromChat = () => {};
let unsubscribeFromAuth = () => {};

export default {
    name: 'ChatGlobal',
    components: { AppH1, },
    data() {
        return {
            messages: [],
            loading: false,

            newMessage: {
                content: '',
            },

            user: {
                id: null,
                email: null,
                display_name: null,
                bio: null,
                career: null,
            },
        }
    },
    methods: {
        async handleSubmit() {
            if (!this.newMessage.content.trim()) {
                alert('El mensaje no puede estar vacío');
                return;
            }

            try {
                this.loading = true;
                
                await sendNewGlobalChatMessage({
                    sender_id: this.user.id,
                    email: this.user.email,
                    content: this.newMessage.content,
                });

                // Limpiamos el campo del contenido
                this.newMessage.content = "";
            } catch (error) {
                console.error('Error al enviar el mensaje:', error);
                alert('Error al enviar el mensaje. Inténtalo de nuevo.');
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
                second: '2-digit', 
                hour12: false,
            });
            
            return dateFormatter.format(date).replace(',', '');
        },
    },
    async mounted() {
        try {
            // Suscribirse a cambios de autenticación
            unsubscribeFromAuth = subscribeToAuthStateChanges(newUserState => this.user = newUserState);

            // Suscribirse a nuevos mensajes en tiempo real
            unsubscribeFromChat = subscribeToNewGlobalChatMessages(async newMessage => {
                this.messages.push(newMessage);

                // Mover el scroll al final
                await this.$nextTick();
                this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
            });

            // Cargar mensajes existentes
            this.messages = await fetchLastGlobalChatMessages();

            // Mover el scroll al final después de cargar
            await this.$nextTick();
            this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
        } catch (error) {
            console.error('Error al cargar los mensajes:', error);
        }
    },
    unmounted() {
        unsubscribeFromChat();
        unsubscribeFromAuth();
    }
}
</script>

<template>
    <AppH1>💬 Chat Global UBA</AppH1>

    <div class="max-w-6xl mx-auto">
        <div class="flex gap-6">
            <!-- Panel de chat -->
            <section 
                ref="chatContainer" 
                class="flex-1 h-[600px] p-4 border border-blue-200 rounded-lg bg-white overflow-y-auto shadow-sm"
            >
                <h2 class="sr-only">Lista de mensajes del chat global</h2>
                
                <div v-if="messages.length === 0" class="text-center text-gray-500 py-8">
                    <p>💬 Aún no hay mensajes. ¡Sé el primero en saludar!</p>
                </div>

                <div v-else class="space-y-4">
                    <div
                        v-for="message in messages"
                        :key="message.id"
                        class="flex items-start gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                    >
                        <div class="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span class="text-blue-600 text-sm font-semibold">👤</span>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 mb-1">
                                <RouterLink 
                                    :to="`/usuario/${message.sender_id}`"
                                    class="font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                                >
                                    {{ message.email }}
                                </RouterLink>
                                <span class="text-gray-500 text-sm">dijo:</span>
                            </div>
                            
                            <p class="text-gray-800 mb-2 whitespace-pre-wrap">{{ message.content }}</p>
                            
                            <p class="text-xs text-gray-500">{{ formatDate(message.created_at) }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Panel de envío -->
            <section class="w-80">
                <div class="card">
                    <h2 class="text-lg font-semibold mb-4 text-blue-800">✍️ Enviar mensaje</h2>
                    
                    <div v-if="user.id" class="space-y-4">
                        <div class="p-3 bg-blue-50 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">Conectado como:</p>
                            <p class="font-medium text-blue-800">{{ user.email }}</p>
                        </div>
                        
                        <form @submit.prevent="handleSubmit">
                            <div class="mb-4">
                                <label for="content" class="block mb-2 font-medium text-gray-700">
                                    Mensaje
                                </label>
                                <textarea
                                    id="content"
                                    class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                                    rows="4"
                                    v-model="newMessage.content"
                                    placeholder="Escribe tu mensaje aquí..."
                                    required
                                ></textarea>
                            </div>
                            
                            <button 
                                type="submit" 
                                class="w-full btn-primary"
                                :disabled="loading || !newMessage.content.trim()"
                            >
                                <span v-if="loading">⏳ Enviando...</span>
                                <span v-else>📤 Enviar mensaje</span>
                            </button>
                        </form>
                    </div>

                    <!-- Mensaje para usuarios no autenticados -->
                    <div v-else class="text-center">
                        <div class="p-4 bg-gray-50 rounded-lg">
                            <p class="text-gray-600 mb-3">
                                🔐 Necesitas iniciar sesión para participar en el chat
                            </p>
                            <RouterLink 
                                to="/ingresar" 
                                class="btn-primary inline-block"
                            >
                                🚪 Iniciar sesión
                            </RouterLink>
                        </div>
                    </div>
                </div>

                <!-- Información del chat -->
                <div class="card mt-4">
                    <h3 class="font-semibold mb-2 text-blue-800">ℹ️ Sobre el chat</h3>
                    <ul class="text-sm text-gray-600 space-y-1">
                        <li>• 💬 Conversación en tiempo real</li>
                        <li>• 🌍 Visible para toda la comunidad UBA</li>
                        <li>• ⚡ Los mensajes aparecen instantáneamente</li>
                        <li>• 👥 Conecta con estudiantes y docentes</li>
                    </ul>
                </div>
            </section>
        </div>
    </div>
</template>
