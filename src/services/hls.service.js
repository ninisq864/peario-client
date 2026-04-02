import Hls from 'hls.js';
import hat from 'hat';
import StorageService from '@/services/storage.service';

const HlsService = {

    hls: null,

    getServerUrl() {
        return StorageService.get('streamingServer') || 'https://localhost:12470';
    },

    init() {
        this.hls = new Hls({
            startLevel: 0,
            abrMaxWithRealBitrate: true
        });
    },

    async createPlaylist(mediaURL) {
        const id = hat();
        const server = this.getServerUrl();

        const queryParams = new URLSearchParams([
            ['mediaURL', mediaURL],
            ['videoCodecs', 'h264'],
            ['videoCodecs', 'vp9'],
            ['audioCodecs', 'aac'],
            ['audioCodecs', 'mp3'],
            ['audioCodecs', 'opus'],
            ['maxAudioChannels', 2],
        ]);

        return `${server}/hlsv2/${id}/master.m3u8?${queryParams.toString()}`;
    },

    loadHls(playlistUrl, videoElement) {
        return new Promise(resolve => {
            this.hls.loadSource(playlistUrl);
            this.hls.attachMedia(videoElement);
            this.hls.on(Hls.Events.MEDIA_ATTACHED, resolve());
        });
    },

    clear() {
        this.hls.detachMedia();
        this.hls.destroy();
    }

};

export default HlsService;
