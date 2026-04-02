import axios from "axios";
import { CINEMETA_URL, OPENSUBTITLES_URL, STREMIO_API_URL } from "@/common/config";

// On essaie d'abord de récupérer l'URL HTTPS distante de Stremio
// Si ça échoue, on tombe sur localhost
let detectedServer = null;

const StremioService = {

    async detectServer() {
        // Essaie de lire l'URL HTTPS distante depuis Stremio
        try {
            const { data } = await axios.get('http://localhost:11470/settings', { timeout: 3000 });
            if (data && data.remoteHttps) {
                detectedServer = data.remoteHttps.replace(/\/$/, '');
                console.log('[Stremio] URL HTTPS distante détectée:', detectedServer);
                return detectedServer;
            }
        } catch(_) {}

        // Fallback localhost
        try {
            await axios.get('http://localhost:11470/stats.json', { timeout: 3000 });
            detectedServer = 'http://localhost:11470';
            console.log('[Stremio] Fallback localhost');
            return detectedServer;
        } catch(_) {}

        // Fallback 127.0.0.1
        try {
            await axios.get('http://127.0.0.1:11470/stats.json', { timeout: 3000 });
            detectedServer = 'http://127.0.0.1:11470';
            return detectedServer;
        } catch(_) {}

        detectedServer = null;
        return null;
    },

    getServer() {
        return detectedServer || 'http://localhost:11470';
    },

    async isServerOpen() {
        const url = await this.detectServer();
        return url !== null;
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
        const server = this.getServer();
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
    const { data } = await axios.get(`${StremioService.getServer()}/opensubHash?videoUrl=${streamUrl}`);
    const { result } = data;
    return result;
}

async function queryOpenSubtitles({ type, id, videoHash }) {
    const { data } = await axios.get(`${OPENSUBTITLES_URL}/subtitles/${type}/${id}/videoHash=${videoHash}.json`);
    const { subtitles } = data;
    return subtitles;
}

export default StremioService;