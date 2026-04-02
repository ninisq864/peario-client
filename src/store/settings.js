import StorageService from '@/services/storage.service';
import locales from '../common/locales';

export default {
    namespaced: true,
    state: {
        locale: 'en',
        locales: Object.keys(locales),
        username: null,
        streamingServer: null
    },
    mutations: {
        updateLocale(state, value) {
            state.locale = value;
        },
        updateUsername(state, value) {
            state.username = value;
        },
        updateStreamingServer(state, value) {
            state.streamingServer = value;
        }
    },
    actions: {
        load({ commit }) {
            const storedLocale = StorageService.get('locale');
            const storedUsername = StorageService.get('username');
            const storedServer = StorageService.get('streamingServer');
            if (storedLocale) commit('updateLocale', storedLocale);
            if (storedUsername) commit('updateUsername', storedUsername);
            if (storedServer) commit('updateStreamingServer', storedServer);
        },
        updateLocale({ commit }, value) {
            commit('updateLocale', value);
            StorageService.set('locale', value);
        },
        updateUsername({ commit }, value) {
            commit('updateUsername', value);
            StorageService.set('username', value);
        },
        updateStreamingServer({ commit }, value) {
            commit('updateStreamingServer', value);
            StorageService.set('streamingServer', value);
        }
    }
};
