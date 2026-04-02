import axios from "axios";
import { CINEMETA_URL, OPENSUBTITLES_URL, STREMIO_API_URL } from "@/common/config";

const LOCAL_SERVER = 'http://localhost:11470';
let remoteHttpsServer = null;

const StremioService = {

    // Récupère l'URL HTTPS distante générée par Stremio
    async detectServer() {
        try {
            const { data } = await axios.get(`${LOCAL_SERVER}/settings`, { timeout: 3000 });
            if (data && data.remoteHttps) {
                remoteHttpsServer = data.remoteHttps.replace(/\/$/, '');
                console.log('[Stremio] URL HTTPS détectée:', remoteHttpsServer);
                return remoteHttpsServer;
            }
        } catch(_) {}
        // Fallback sur localhost
        remoteHttpsServer = null;
        return LOCAL_SERVER;
    },

    getServer() {
        return remoteHttpsServer || LOCAL_SERVER;
    },

    async isServerOpen() {
        const url = await this.detectServer();
        try {
            await axios.get(`${url}/stats.json`, { timeout: 3000 });
            return true;
        } catch(_) {
            return false;
        }
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
    return data.result;
}

async function queryOpenSubtitles({ type, id, videoHash }) {
    const { data } = await axios.get(`${OPENSUBTITLES_URL}/subtitles/${type}/${id}/videoHash=${videoHash}.json`);
    return data.subtitles;
}

export default StremioService;