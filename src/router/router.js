import { createRouter, createWebHistory } from 'vue-router';
import { subscribeToAuthStateChanges } from '../services/auth';
import Home from '../pages/Home.vue';
import PublicChat from '../pages/PublicChat.vue';
import ChatGlobal from '../pages/ChatGlobal.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';
import MyProfile from '../pages/MyProfile.vue';
import MyProfileEdit from '../pages/MyProfileEdit.vue';
import UserProfile from '../pages/UserProfile.vue';

// Definimos la lista de rutas de nuestra aplicación.
// Esto es, un array de objetos de "ruta".
const routes = [
    { path: '/',                    component: Home, },
    { path: '/ingresar',            component: Login, },
    { path: '/crear-cuenta',        component: Register, },
    { path: '/muro',                component: PublicChat,  meta: { requiresAuth: false, }, },
    { path: '/chat',                component: ChatGlobal,  meta: { requiresAuth: false, }, },
    { path: '/mi-perfil',           component: MyProfile,   meta: { requiresAuth: true, }, },
    { path: '/mi-perfil/editar',    component: MyProfileEdit,   meta: { requiresAuth: true, }, },
    { path: '/usuario/:id',         component: UserProfile,     meta: { requiresAuth: true, }, },
];

const router = createRouter({

    routes,
    history: createWebHistory(),
});


let user = {
    id: null,
    email: null,
}
subscribeToAuthStateChanges(newUserState => user = newUserState);


router.beforeEach((to, from) => {
    if(to.meta.requiresAuth && user.id === null) {
        return '/ingresar';
    }

    // Tanto "to" como "from" son objetos con la data de la ruta.
    // console.group('🚦 Rutas');
    // console.log("Navegando desde: ", from);
    // console.log("Navegando hacia: ", to);
    // console.groupEnd();
});

export default router;