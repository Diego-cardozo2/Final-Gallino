<script>
import AppH1 from '../components/AppH1.vue';
import { subscribeToAuthStateChanges, updateAuthUser, changePassword } from '../services/auth';
import { uploadProfileImage } from '../services/user-profiles';

let unsubscribeFromAuth = () => {};

export default {
    name: 'MyProfileEdit',
    components: { AppH1, },
    data() {
        return {
            formData: {
                display_name: '',
                bio: '',
                career: '',
                profile_image_url: '',
            },
            passwordData: {
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            },
            profileImageFile: null,
            loading: false,
            passwordLoading: false,
            imageLoading: false,
            successMessage: '',
            errorMessage: '',
            passwordSuccessMessage: '',
            passwordErrorMessage: '',
        }
    },
    methods: {
        handleImageChange(event) {
            this.profileImageFile = event.target.files[0];
        },
        async handleImageUpload() {
            if (!this.profileImageFile) {
                return;
            }

            try {
                this.imageLoading = true;
                const imageUrl = await uploadProfileImage(this.profileImageFile, this.user.id);
                await updateAuthUser({ profile_image_url: imageUrl });
                this.formData.profile_image_url = imageUrl;
                this.successMessage = 'Imagen de perfil actualizada';
                this.profileImageFile = null;
            } catch (error) {
                console.error('Error al subir la imagen:', error);
                this.errorMessage = 'Error al subir la imagen.';
            } finally {
                this.imageLoading = false;
            }
        },
        async handleProfileSubmit() {
            this.errorMessage = '';
            this.successMessage = '';

            if (this.formData.display_name && this.formData.display_name.length > 50) {
                this.errorMessage = 'El nombre de usuario es muy largo. Máximo 50 caracteres.';
                return;
            }

            if (this.formData.bio && this.formData.bio.length > 500) {
                this.errorMessage = 'La biografía es muy larga. Máximo 500 caracteres.';
                return;
            }

            if (this.formData.career && this.formData.career.length > 100) {
                this.errorMessage = 'La carrera es muy larga. Máximo 100 caracteres.';
                return;
            }

            try {
                this.loading = true;
                await updateAuthUser(this.formData);
                this.successMessage = 'Perfil actualizado correctamente';
                setTimeout(() => {
                    this.$router.push('/mi-perfil');
                }, 2000);
            } catch (error) {
                console.error('Error al actualizar el perfil:', error);
                this.errorMessage = 'Error al actualizar el perfil. Inténtalo de nuevo.';
            } finally {
                this.loading = false;
            }
        },
        async handlePasswordSubmit() {
            try {
                this.passwordLoading = true;
                this.passwordErrorMessage = '';
                this.passwordSuccessMessage = '';

                // Validaciones
                if (!this.passwordData.currentPassword) {
                    this.passwordErrorMessage = 'Debes ingresar tu contraseña actual';
                    return;
                }

                if (!this.passwordData.newPassword) {
                    this.passwordErrorMessage = 'Debes ingresar una nueva contraseña';
                    return;
                }

                if (this.passwordData.newPassword.length < 6) {
                    this.passwordErrorMessage = 'La nueva contraseña debe tener al menos 6 caracteres';
                    return;
                }

                if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
                    this.passwordErrorMessage = 'Las contraseñas nuevas no coinciden';
                    return;
                }

                // Cambiar la contraseña
                await changePassword(this.passwordData.newPassword);
                
                this.passwordSuccessMessage = 'Contraseña actualizada correctamente';
                
                // Limpiar el formulario
                this.passwordData = {
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                };

            } catch (error) {
                console.error('Error al cambiar la contraseña:', error);
                this.passwordErrorMessage = 'Error al cambiar la contraseña. Inténtalo de nuevo.';
            } finally {
                this.passwordLoading = false;
            }
        },
        clearMessages() {
            this.successMessage = '';
            this.errorMessage = '';
            this.passwordSuccessMessage = '';
            this.passwordErrorMessage = '';
        }
    },
    mounted() {
        unsubscribeFromAuth = subscribeToAuthStateChanges(newUserState => {
            this.user = newUserState;
            this.formData = {
                display_name: newUserState.display_name || '',
                bio: newUserState.bio || '',
                career: newUserState.career || '',
                profile_image_url: newUserState.profile_image_url || '',
            }
        });
    },
    unmounted() {
        unsubscribeFromAuth();
    }
}
</script>

<template>
    <div class="max-w-4xl mx-auto">
        <AppH1>✏️ Editar mi perfil</AppH1>

        <!-- Formulario de datos del perfil -->
        <div class="card mb-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">👤 Información personal</h2>

            <div class="mb-6">
                <label class="block mb-2 font-medium text-gray-700">Imagen de perfil</label>
                <div class="flex items-center gap-4">
                    <div v-if="formData.profile_image_url" class="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200">
                        <img :src="formData.profile_image_url" alt="Imagen de perfil" class="w-full h-full object-cover">
                    </div>
                    <div v-else class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                        <span class="text-blue-600 text-2xl">👤</span>
                    </div>
                    <div class="flex-1">
                        <input
                            type="file"
                            @change="handleImageChange"
                            accept="image/*"
                            class="mb-2"
                        >
                        <button 
                            @click="handleImageUpload"
                            :disabled="!profileImageFile || imageLoading"
                            class="btn-secondary text-sm"
                        >
                            <span v-if="imageLoading">⏳ Subiendo...</span>
                            <span v-else>📤 Subir imagen</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Mensajes de éxito y error -->
            <div v-if="successMessage" class="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800">
                ✅ {{ successMessage }}
            </div>
            <div v-if="errorMessage" class="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
                ❌ {{ errorMessage }}
            </div>

            <form @submit.prevent="handleProfileSubmit">
                <div class="grid md:grid-cols-2 gap-6">
                    <div>
                        <label for="display_name" class="block mb-2 font-medium text-gray-700">
                            👤 Nombre de usuario
                        </label>
                        <input
                            type="text"
                            id="display_name"
                            class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            v-model="formData.display_name"
                            placeholder="Tu nombre de usuario..."
                        >
                        <p class="text-sm text-gray-500 mt-1">Este será tu nombre visible en la plataforma</p>
                    </div>

                    <div>
                        <label for="career" class="block mb-2 font-medium text-gray-700">
                            🎓 Carrera
                        </label>
                        <input
                            type="text"
                            id="career"
                            class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            v-model="formData.career"
                            placeholder="Tu carrera o especialización..."
                        >
                        <p class="text-sm text-gray-500 mt-1">Ej: Ingeniería en Sistemas, Medicina, etc.</p>
                    </div>
                </div>

                <div class="mt-6">
                    <label for="bio" class="block mb-2 font-medium text-gray-700">
                        📝 Biografía
                    </label>
                    <textarea
                        id="bio"
                        class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                        rows="4"
                        v-model="formData.bio"
                        placeholder="Cuéntanos sobre ti, tus intereses académicos, proyectos..."
                    ></textarea>
                    <p class="text-sm text-gray-500 mt-1">Comparte información sobre ti con la comunidad UBA</p>
                </div>

                <div class="flex justify-end mt-6">
                    <button 
                        type="submit" 
                        class="btn-primary"
                        :disabled="loading"
                    >
                        <span v-if="loading">⏳ Actualizando...</span>
                        <span v-else>💾 Guardar cambios</span>
                    </button>
                </div>
            </form>
        </div>

        <!-- Formulario de cambio de contraseña -->
        <div class="card mb-6">
            <h2 class="text-xl font-semibold mb-4 text-blue-800">🔒 Cambiar contraseña</h2>
            
            <!-- Mensajes de éxito y error para contraseña -->
            <div v-if="passwordSuccessMessage" class="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800">
                ✅ {{ passwordSuccessMessage }}
            </div>
            <div v-if="passwordErrorMessage" class="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800">
                ❌ {{ passwordErrorMessage }}
            </div>

            <form @submit.prevent="handlePasswordSubmit">
                <div class="space-y-4">
                    <div>
                        <label for="currentPassword" class="block mb-2 font-medium text-gray-700">
                            🔑 Contraseña actual
                        </label>
                        <input
                            type="password"
                            id="currentPassword"
                            class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            v-model="passwordData.currentPassword"
                            placeholder="Ingresa tu contraseña actual..."
                        >
                    </div>

                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <label for="newPassword" class="block mb-2 font-medium text-gray-700">
                                🔐 Nueva contraseña
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                v-model="passwordData.newPassword"
                                placeholder="Nueva contraseña..."
                            >
                        </div>

                        <div>
                            <label for="confirmPassword" class="block mb-2 font-medium text-gray-700">
                                🔐 Confirmar contraseña
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                class="w-full p-3 border border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none"
                                v-model="passwordData.confirmPassword"
                                placeholder="Confirma tu nueva contraseña..."
                            >
                        </div>
                    </div>

                    <div class="bg-blue-50 p-3 rounded-lg">
                        <h4 class="font-medium text-blue-800 mb-2">ℹ️ Requisitos de contraseña:</h4>
                        <ul class="text-sm text-blue-700 space-y-1">
                            <li>• Mínimo 6 caracteres</li>
                            <li>• Debe ser diferente a la contraseña actual</li>
                            <li>• Se recomienda usar letras, números y símbolos</li>
                        </ul>
                    </div>
                </div>

                <div class="flex justify-end mt-6">
                    <button 
                        type="submit" 
                        class="btn-secondary"
                        :disabled="passwordLoading"
                    >
                        <span v-if="passwordLoading">⏳ Cambiando...</span>
                        <span v-else>🔒 Cambiar contraseña</span>
                    </button>
                </div>
            </form>
        </div>

        <!-- Información adicional -->
        <div class="card bg-gray-50 border-gray-200">
            <h3 class="font-semibold mb-2 text-gray-800">ℹ️ Información importante</h3>
            <ul class="text-sm text-gray-600 space-y-1">
                <li>• Los cambios en tu perfil se reflejarán inmediatamente</li>
                <li>• Tu email no se puede cambiar por seguridad</li>
                <li>• La contraseña se actualiza de forma segura</li>
                <li>• Puedes editar tu perfil en cualquier momento</li>
            </ul>
        </div>
    </div>
</template>