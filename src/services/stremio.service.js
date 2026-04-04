import axios from "axios";
import { CINEMETA_URL, OPENSUBTITLES_URL, STREMIO_API_URL } from "@/common/config";

const STREMIO_URL = "http://localhost:11470";

const StremioService = {

    async isServerOpen() {
        try {
            await axios.get(`${STREMIO_URL}/stats.json`, { timeout: 3000 });
            return true;
        } catch {
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
        const { data } = await axios.get(`${STREMIO_URL}/${infoHash}/create`);
        const { files } = data;
        if (!fileIdx) fileIdx = files.indexOf(files.sort((a, b) => a.length - b.length).reverse()[0]);
        return `${STREMIO_URL}/${infoHash}/${fileIdx}`;
    },

    async getSubtitles({ type, id, url }) {
        try {
            const { data } = await axios.get(`${STREMIO_URL}/opensubHash?videoUrl=${url}`);
            const { hash } = data.result;
            const subs = await axios.get(`${OPENSUBTITLES_URL}/subtitles/${type}/${id}/videoHash=${hash}.json`);
            return subs.data.subtitles;
        } catch(_) {
            return [];
        }
    }
};

export default StremioService;
