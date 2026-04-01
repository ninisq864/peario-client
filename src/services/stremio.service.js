import axios from "axios";
import { CINEMETA_URL, OPENSUBTITLES_URL, STREMIO_API_URL } from "@/common/config";
import StorageService from "@/services/storage.service";

// URLs à tester dans l'ordre
const CANDIDATE_URLS = [
    'http://localhost:11470',
    'http://127.0.0.1:11470',
];

const StremioService = {

    _serverUrl: null,

    // Retourne l'URL en cache, ou celle sauvegardée, ou le défaut
    getServerUrl() {
        if (this._serverUrl) return this._serverUrl;
        const saved = StorageService.get('streamingServer');
        if (saved) {
            this._serverUrl = saved;
            return saved;
        }
        return CANDIDATE_URLS[0];
    },

    // Teste une URL et retourne true si Stremio répond
    async _pingUrl(url) {
        try {
            await axios.get(`${url}/stats.json`, { timeout: 2000 });
            return true;
        } catch {
            return false;
        }
    },

    // Détection automatique : teste les URLs dans l'ordre, prend la première qui marche
    async autoDetect() {
        // Si une URL custom est sauvegardée, on la teste en priorité
        const saved = StorageService.get('streamingServer');
        if (saved && await this._pingUrl(saved)) {
            this._serverUrl = saved;
            return { url: saved, found: true };
        }

        for (const url of CANDIDATE_URLS) {
            if (await this._pingUrl(url)) {
                this._serverUrl = url;
                StorageService.set('streamingServer', url);
                return { url, found: true };
            }
        }

        return { url: null, found: false };
    },

    async isServerOpen() {
        return this._pingUrl(this.getServerUrl());
    },

    async getMetaSeries(imdbId) {
        const { data } = await axios.get(`${CINEMETA_URL}/meta/series/${imdbId}.json`);
        return data.meta;
    },

    async getMetaMovie(imdbId) {
        const { data } = await axios.get(`${CINEMETA_URL}/meta/movie/${imdbId}.json`);
        return data.meta;
    },

    async searchMovies(title) {
        const { data } = await axios.get(`${CINEMETA_URL}/catalog/movie/top/search=${title}.json`);
        return data.metas;
    },

    async searchSeries(title) {
        const { data } = await axios.get(`${CINEMETA_URL}/catalog/series/top/search=${title}.json`);
        return data.metas;
    },

    async getAddons() {
        const { data } = await axios.get(`${STREMIO_API_URL}/addonscollection.json`);
        return data;
    },

    async createTorrentStream(stream) {
        let { infoHash, fileIdx = null } = stream;
        const server = this.getServerUrl();
        const { data } = await axios.get(`${server}/${infoHash}/create`);
        const { files } = data;
        if (!fileIdx) fileIdx = files.indexOf(files.sort((a, b) => a.length - b.length).reverse()[0]);
        return `${server}/${infoHash}/${fileIdx}`;
    },

    async getStats(streamUrl) {
        const { data } = await axios.get(`${streamUrl}/stats.json`);
        return data;
    },

    async getSubtitles({ type, id, url }) {
        try {
            const { hash } = await getOpenSubInfo(url);
            return queryOpenSubtitles({ type, id, videoHash: hash });
        } catch(_) {
            return [];
        }
    }

};

async function getOpenSubInfo(streamUrl) {
    const { data } = await axios.get(`${StremioService.getServerUrl()}/opensubHash?videoUrl=${streamUrl}`);
    const { result } = data;
    return result;
}

async function queryOpenSubtitles({ type, id, videoHash }) {
    const { data } = await axios.get(`${OPENSUBTITLES_URL}/subtitles/${type}/${id}/videoHash=${videoHash}.json`);
    const { subtitles } = data;
    return subtitles;
}

export default StremioService;
