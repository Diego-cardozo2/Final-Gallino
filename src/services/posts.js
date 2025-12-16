// Servicio para manejar posts/publicaciones del muro
import { supabase } from "./supabase";

/**
 * Crear un nuevo post
 * @param {Object} postData - Datos del post
 * @param {string} postData.author_id - ID del autor
 * @param {string} postData.author_email - Email del autor
 * @param {string} postData.content - Contenido del post
 * @param {string} postData.title - Título del post (opcional)
 */
export async function createPost({ author_id, author_email, content, title = null }) {
    const { data, error } = await supabase
        .from('posts')
        .insert({
            author_id,
            author_email,
            content,
            title,
        })
        .select()
        .single();

    if (error) {
        console.error('[posts.js createPost] Error al crear el post:', error);
        throw new Error(error.message);
    }

    console.log('[posts.js createPost] Post creado con éxito:', data);
    return data;
}

/**
 * Obtener todos los posts ordenados por fecha de creación (más recientes primero)
 */
export async function fetchAllPosts() {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[posts.js fetchAllPosts] Error al obtener posts:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Obtener posts de un usuario específico
 * @param {string} userId - ID del usuario
 */
export async function fetchUserPosts(userId) {
    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[posts.js fetchUserPosts] Error al obtener posts del usuario:', error);
        throw new Error(error.message);
    }

    return data;
}

/**
 * Suscribirse a nuevos posts en tiempo real
 * @param {Function} callback - Función a ejecutar cuando llegue un nuevo post
 */
export function subscribeToNewPosts(callback) {
    const postsChannel = supabase.channel('posts_realtime');
    
    postsChannel.on(
        'postgres_changes',
        {
            event: 'INSERT',
            table: 'posts',
            schema: 'public',
        },
        payload => {
            callback(payload.new);
        }
    );

    postsChannel.subscribe();

    return () => {
        postsChannel.unsubscribe();
    };
}

/**
 * Eliminar un post (solo el autor puede eliminarlo)
 * @param {string} postId - ID del post
 * @param {string} userId - ID del usuario que intenta eliminar
 */
export async function deletePost(postId, userId, isAdmin = false) {
    let query = supabase
        .from('posts')
        .delete()
        .eq('id', postId);
    
    if (!isAdmin) {
        query = query.eq('author_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[posts.js deletePost] Error al eliminar el post:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function updatePost(postId, userId, { title, content, file_url }, isAdmin = false) {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (file_url !== undefined) updateData.file_url = file_url;

    let query = supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId);
    
    if (!isAdmin) {
        query = query.eq('author_id', userId);
    }

    const { data, error } = await query
        .select()
        .single();

    if (error) {
        console.error('[posts.js updatePost] Error al actualizar el post:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function uploadPostFile(file, postId) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${postId}_${Date.now()}.${fileExt}`;
    const filePath = `posts/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('post-files')
        .upload(filePath, file);

    if (uploadError) {
        console.error('[posts.js uploadPostFile] Error al subir el archivo:', uploadError);
        throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
        .from('post-files')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

export async function createComment({ post_id, author_id, author_email, content }) {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            post_id,
            author_id,
            author_email,
            content,
        })
        .select()
        .single();

    if (error) {
        console.error('[posts.js createComment] Error al crear el comentario:', error);
        throw new Error(error.message);
    }

    return data;
}

export async function fetchPostComments(postId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('[posts.js fetchPostComments] Error al obtener comentarios:', error);
        throw new Error(error.message);
    }

    return data;
}

export function subscribeToPostComments(postId, callback) {
    const commentsChannel = supabase.channel(`comments_${postId}`);
    
    commentsChannel.on(
        'postgres_changes',
        {
            event: 'INSERT',
            table: 'comments',
            schema: 'public',
            filter: `post_id=eq.${postId}`,
        },
        payload => {
            callback(payload.new);
        }
    );

    commentsChannel.on(
        'postgres_changes',
        {
            event: 'DELETE',
            table: 'comments',
            schema: 'public',
            filter: `post_id=eq.${postId}`,
        },
        payload => {
            callback({ id: payload.old.id, deleted: true });
        }
    );

    commentsChannel.subscribe();

    return () => {
        commentsChannel.unsubscribe();
    };
}

export async function deleteComment(commentId, userId, isAdmin = false) {
    let query = supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
    
    if (!isAdmin) {
        query = query.eq('author_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('[posts.js deleteComment] Error al eliminar el comentario:', error);
        throw new Error(error.message);
    }

    return data;
}

export function subscribeToPostUpdates(callback) {
    const updatesChannel = supabase.channel('posts_updates');
    
    updatesChannel.on(
        'postgres_changes',
        {
            event: 'UPDATE',
            table: 'posts',
            schema: 'public',
        },
        payload => {
            callback(payload.new);
        }
    );

    updatesChannel.on(
        'postgres_changes',
        {
            event: 'DELETE',
            table: 'posts',
            schema: 'public',
        },
        payload => {
            callback({ id: payload.old.id, deleted: true });
        }
    );

    updatesChannel.subscribe();

    return () => {
        updatesChannel.unsubscribe();
    };
}