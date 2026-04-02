<template>
    <div class="modal" v-if="show">
        <div class="backdrop" @click="close()"></div>

        <div class="inner">
            <ATitle icon="settings-outline" type="secondary" translate="components.settings.title" />

            <div class="settings">
                <div class="setting">
                    <div class="label">
                        <ion-icon name="language"></ion-icon>
                        {{ $t('components.settings.lang') }}
                    </div>
                    <ASelect v-model="settings.locale" :options="localesOptions" />
                </div>
                <div class="setting">
                    <div class="label">
                        <ion-icon name="person"></ion-icon>
                        Username
                    </div>
                    <ATextInput :value="settings.username || client.user.name" @change="updateUsername($event)" />
                </div>
                <div class="setting">
                    <div class="label">
                        <ion-icon name="server-outline"></ion-icon>
                        Stremio Streaming Server URL
                    </div>
                    <ATextInput 
                        :value="settings.streamingServer || ''" 
                        placeholder="https://192-168-x-x..."
                        @change="updateStreamingServer($event)" 
                    />
                    <div class="hint">
                        Stremio → Paramètres → Lecteur vidéo → Streaming → copie l'URL distante HTTPS
                    </div>
                </div>
                <div class="setting">
                    <div class="label">
                        <ion-icon name="link"></ion-icon>
                        {{ $t('components.settings.links.title') }}
                    </div>
                    <ALink href="https://github.com/tymmesyde/peario-client/issues">{{ $t('components.settings.links.report') }}</ALink>
                </div>
            </div>

            <AButton clear large translate="components.settings.button" @click="close()" />
        </div>
    </div>
</template>

<script>
import { ref, watchEffect } from 'vue';

import { where } from 'langs';
import ATitle from './ui/Title.vue';
import AButton from './ui/Button.vue';
import ASelect from './ui/Select.vue';
import ATextInput from './ui/TextInput.vue';
import ALink from './ui/Link.vue';
import ClientService from '../services/client.service';

import store from '../store';

export default {
    components: {
        ATitle,
        AButton,
        ASelect,
        ATextInput,
        ALink
    },
    props: {
        show: Boolean
    },
    computed: {
        client: () => store.state.client,
        settings: () => store.state.settings,
        localesOptions() {
            return this.settings.locales.map(locale => ({
                name: this.getLocaleName(locale),
                value: locale
            }));
        }
    },
    watch: {
        'settings.locale'(value) {
            store.dispatch('settings/updateLocale', value);
            this.$i18n.locale = value;
        }
    },
    methods: {
        getLocaleName(locale) {
            return where('1', locale).local;
        },
        updateUsername({ target }) {
            const username = target.value.slice(0, 25);
            if (username.length > 0) {
                store.dispatch('settings/updateUsername', username);
                ClientService.send('user.update', { username });
            }
        },
        updateStreamingServer({ target }) {
            const url = target.value.trim().replace(/\/$/, '');
            if (url.length > 0) {
                store.dispatch('settings/updateStreamingServer', url);
            }
        },
        close() {
            this.$emit('update:show', !this.show);
        }
    }
}
</script>

<style lang="scss" scoped>
.modal {
    z-index: 99;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .backdrop {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        backdrop-filter: blur(5px);
        background-color: rgba(0, 0, 0, 0.8);
        cursor: pointer;
    }

    .inner {
        z-index: 99;
        display: flex;
        flex-direction: column;
        gap: 20px;
        max-height: 95%;
        width: 90%;
        padding: 25px;
        border-radius: 15px;
        background-color: $primary-color;
        box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
        overflow-y: auto;
    }
}

.settings {
    flex: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;

    .setting {
        .label {
            display: flex;
            align-items: center;
            gap: 10px;
            height: 40px;
            font-family: 'Montserrat-SemiBold';
            color: $text-color;
        }

        .hint {
            margin-top: 5px;
            font-size: 12px;
            opacity: 0.6;
            color: $text-color;
            font-family: 'Montserrat-Regular';
        }

        input {
            width: 100%;
        }
    }
}

@media only screen and (orientation: landscape) {
    .modal {
        .inner {
            max-height: 100%;
            width: 100% !important;
        }
    }
}

@media only screen and (min-width: 768px) and (min-height: 768px) {
    .modal {
        .inner {
            width: auto !important;
            min-width: 350px;
        }
    }
}
</style>
