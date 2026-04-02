<template>
    <div :class="['room', { 'chat-open': isChatOpen }]">
        <Loading type="room" v-if="!roomData"></Loading>

        <div class="now-watching" v-if="roomData">
            <div class="background">
                <div class="blur"></div>
                <div class="image" :style="`background-image: url(${roomData.meta?.background})`" v-if="roomData.meta?.background"></div>
            </div>

            <div class="content">
                <UsersList
                    :show="true"
                    :roomOwner="roomOwner"
                    :isUserOwner="isUserOwner"
                    :users="usersList"
                    :isPlayerPaused="true"
                    @onUpdateOwnership="onUpdateOwnership"
                />

                <div class="movie-info">
                    <img class="logo" :src="roomData.meta?.logo" v-if="roomData.meta?.logo">
                    <div class="title" v-else>{{ roomData.meta?.name }}</div>
                    <div class="year" v-if="roomData.meta?.year">{{ roomData.meta.year }}</div>
                </div>

                <div class="actions">
                    <button class="open-btn" @click="openInStremio">
                        <ion-icon name="play-circle-outline"></ion-icon>
                        Ouvrir dans Stremio
                    </button>

                    <div class="sync-actions">
                        <button class="sync-btn" @click="sendSync('play')">
                            <ion-icon name="play-outline"></ion-icon>
                            Sync Play
                        </button>
                        <button class="sync-btn" @click="sendSync('pause')">
                            <ion-icon name="pause-outline"></ion-icon>
                            Sync Pause
                        </button>
                    </div>

                    <div class="sync-message" v-if="syncMessage">{{ syncMessage }}</div>

                    <div class="share" v-if="isUserOwner">
                        <div class="share-label">Invite tes amis :</div>
                        <div class="share-url" @click="copyUrl">{{ shareUrl }}</div>
                    </div>
                </div>
            </div>

            <div class="chat-toggle">
                <Button clear icon="close" v-if="isChatOpen" @click="isChatOpen = false"></Button>
                <Button clear icon="chatbubbles-outline" v-else @click="isChatOpen = true">Chat</Button>
            </div>

            <transition name="fade">
                <Chat v-if="isChatOpen"></Chat>
            </transition>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import router from '@/router';
import store from '@/store';

import Loading from "@/components/Loading.vue";
import Button from "@/components/ui/Button.vue";
import Chat from "@/components/Chat.vue";
import UsersList from './UsersList/UsersList.vue';
import ClientService from "@/services/client.service";
import { onBeforeRouteLeave } from 'vue-router';

const roomData = ref(null);
const isChatOpen = ref(false);
const syncMessage = ref('');

const clientState = computed(() => store.state.client);
const clientRoomState = computed(() => store.state.client.room);

const roomOwner = computed(() => roomData.value?.owner || null);
const usersList = computed(() => roomData.value?.users || []);
const isUserOwner = computed(() => clientState.value?.user?.id && roomOwner.value === clientState.value.user.id);
const shareUrl = computed(() => window.location.href);

const openInStremio = () => {
    const { meta, stream } = clientState.value.room;
    
    let stremioUrl = null;

    if (meta?.type && meta?.id) {
        stremioUrl = `stremio://detail/${meta.type}/${meta.id}`;
    } else if (stream?.infoHash) {
        stremioUrl = `stremio://detail/movie/${stream.infoHash}`;
    }

    if (stremioUrl) {
        // Créer un lien invisible et le cliquer — seule méthode fiable pour stremio://
        const a = document.createElement('a');
        a.href = stremioUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => document.body.removeChild(a), 100);
    } else if (stream?.url) {
        window.open(stream.url, '_blank');
    }
};

const copyUrl = () => {
    navigator.clipboard.writeText(shareUrl.value);
};

let syncTimeout = null;
const sendSync = (action) => {
    ClientService.send('player.sync', {
        paused: action === 'pause',
        buffering: false,
        time: 0,
    });
    syncMessage.value = action === 'play' ? '▶ Signal Play envoyé !' : '⏸ Signal Pause envoyé !';
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => syncMessage.value = '', 3000);
};

const onUpdateOwnership = (userId) => {
    ClientService.send('room.updateOwnership', { userId });
};

watch(clientRoomState, (newVal) => {
    if (newVal) roomData.value = newVal;
});

onMounted(() => {
    const { id } = router.currentRoute.value.params;

    if (clientState.value.ready) {
        ClientService.send('room.join', { id });
    } else {
        ClientService.events.once('ready', () => {
            ClientService.send('room.join', { id });
        });
    }
});

onUnmounted(() => {
    clearTimeout(syncTimeout);
});

onBeforeRouteLeave(() => {
    store.commit('client/updateError', null);
});
</script>

<style lang="scss" scoped>
.room {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
}

.now-watching {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    .background {
        z-index: -1;
        position: fixed;
        top: 0; bottom: 0; left: 0; right: 0;

        .blur, .image {
            position: absolute;
            height: 100%;
            width: 100%;
        }

        .blur {
            z-index: 1;
            backdrop-filter: blur(80px);
            background-color: rgba(#0d0d0d, 0.7);
        }

        .image {
            background-size: cover;
            background-position: center;
        }
    }

    .content {
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 25px;
        padding: 20px;
        max-width: 500px;
        width: 100%;

        .movie-info {
            text-align: center;
            color: white;

            .logo {
                max-width: 280px;
                max-height: 100px;
                object-fit: contain;
            }

            .title {
                font-family: 'Montserrat-Bold';
                font-size: 28px;
                color: white;
            }

            .year {
                font-family: 'Montserrat-Regular';
                font-size: 14px;
                opacity: 0.6;
                color: white;
                margin-top: 5px;
            }
        }

        .actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            width: 100%;

            .open-btn {
                display: flex;
                align-items: center;
                gap: 10px;
                background-color: #6fffb0;
                color: #0d0d0d;
                border: none;
                border-radius: 10px;
                padding: 15px 30px;
                font-family: 'Montserrat-SemiBold';
                font-size: 16px;
                cursor: pointer;
                width: 100%;
                justify-content: center;
                transition: opacity 0.2s;

                &:hover { opacity: 0.85; }

                ion-icon { font-size: 22px; }
            }

            .sync-actions {
                display: flex;
                gap: 10px;
                width: 100%;

                .sync-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background-color: rgba(white, 0.1);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    padding: 12px 20px;
                    font-family: 'Montserrat-Medium';
                    font-size: 14px;
                    cursor: pointer;
                    flex: 1;
                    justify-content: center;
                    transition: background-color 0.2s;

                    &:hover { background-color: rgba(white, 0.2); }

                    ion-icon { font-size: 18px; }
                }
            }

            .sync-message {
                color: #6fffb0;
                font-family: 'Montserrat-Medium';
                font-size: 14px;
            }

            .share {
                width: 100%;
                text-align: center;

                .share-label {
                    color: white;
                    opacity: 0.6;
                    font-size: 12px;
                    font-family: 'Montserrat-Regular';
                    margin-bottom: 5px;
                }

                .share-url {
                    background-color: rgba(white, 0.1);
                    color: white;
                    padding: 10px 15px;
                    border-radius: 8px;
                    font-size: 12px;
                    font-family: 'Montserrat-Regular';
                    cursor: pointer;
                    word-break: break-all;

                    &:hover { background-color: rgba(white, 0.2); }
                }
            }
        }
    }

    .chat-toggle {
        position: absolute;
        top: 0.75rem;
        right: 1rem;
        z-index: 97;
    }
}
</style>