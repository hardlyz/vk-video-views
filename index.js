import axios from "axios"

const CONFIG = {
    videoLink: process.argv[2],
    cookie: ""
};

class Util {
    static queryStringify(object = {}) {
        return Object.entries(object).map(
            ([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        ).join("&");
    }

    static parseVideoData(videoLink = "") {
        let matchArray = videoLink.match(/video(-?[0-9]+)_([0-9]+)/i);

        return {
            ownerId: matchArray[1],
            videoId: matchArray[2]
        };
    }

    static sleep(ms = 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class VideoPayload {
    constructor(payloadObject = []) {
        this.status = payloadObject[0];
        this.payload = payloadObject[1];

        this.videoPlayerWeb = {
            title: this.payload[0],
            boxHTML: this.payload[1],
            playerJS: this.payload[2],
            playerHTML: this.payload[3]
        };

        this.videoData = this.payload[4];
        this.videoInfo = this.videoData.mvData;
        this.playerParams = this.videoData.player.params[0];
    }
}


class ScriptError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.name = this.constructor.name;

        Error.captureStackTrace(this, this.constructor);
    }
}

class CheatVideoViews {
    startTime = Date.now();
    requestCount = 0;

    constructor(options = {}) {
        this.videoId = options.videoId;
        this.ownerId = options.ownerId;
    }

    async request(url, options = {}) {
        try {
            let stringifyOptions = Util.queryStringify(options);
            let response = await axios.post(url, stringifyOptions, {
                headers: {
                    "cookie": CONFIG.cookie,
                    "user-agent": `Mozilla/5.0 (Windows NT 10.0) AppleWebKit/${~~(Math.random() * 600)}.36 (KHTML, like Gecko) Chrome/${~~(Math.random() * 59)}.0.3029.110 Safari/${~~(Math.random() * 1000)}.36`,
                    "sec-fetch-mode": "cors",
                    "referer": "https://vk.com",
                    "X-Requested-With": "XMLHttpRequest",
                    "content-type": "application/x-www-form-urlencoded"
                }
            });

            if (response.data.payload[0] != 0)
                throw new Error(response.data.payload[1][0]);

            return response.data;
        } catch (error) {
            throw new ScriptError(error.message);
        }
    }

    async requestToShowVideo() {
        let response = await this.request("https://vk.com/al_video.php", {
            al: 1,
            act: "show",
            video: `${this.ownerId}_${this.videoId}`
        });

        return new VideoPayload(response.payload);
    }

    async requestToIncrementViewCounter(hash) {
		try {
			let response = await this.request("https://vk.com/al_video.php", {
				act: "video_view_started",
				al: 1,
				oid: this.ownerId,
				vid: this.videoId,
				hash
			});


			return response;
		} catch(error) {
			throw new ScriptError(error.message);
		}
    }

    async start() {
        while (true) {
            let videoPayload = await this.requestToShowVideo();
            console.log("Просмотров на видео: %i. Прошло времени: %s. Запросов сделано: %i", videoPayload.videoInfo.info[10], ~~((Date.now() - script.startTime) / 1000) + " sec", this.requestCount);
            this.requestToIncrementViewCounter(videoPayload.playerParams.view_hash);
            this.requestCount++;
			await this.sleep(10);
        }
    }
	
	async sleep(time) {
	   new Promise(
		   resolve => setTimeout(_=>resolve(), time)
	   );
	}
}

let script = new CheatVideoViews(Util.parseVideoData(CONFIG.videoLink));

for (let i = 0; i < process.argv[3]; i++) script.start().catch(console.error);