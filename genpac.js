module.exports = function (options) {
	const { proxyPort = 8008, host = 'localhost' } = options;

	const hosts = [
		'cdn1.coccoc.com',
		'coccoc.com',
		'www.coccoc.com',
		'qccoccocmedia.vn',
		'localhost',
		'hoctap.coccoc.com'
	];

	const urls = [
		'http://coccoc.com/search',
		'http://coccoc.com/search-static/*',
		'http://coccoc.com/*',
		'http://hoctap.coccoc.com',
		'http://hoctap.coccoc.com/*'
	];

	if (Array.isArray(options.hosts)) {
		hosts = options.hosts;
	}

	if (Array.isArray(options.urls)) {
		urls = options.urls;
	}

	const allowedHostsCond = hosts.map((host) => {
		return `shExpMatch(host, '${host}')`;
	}).join(' || ');

	const allowedUrlCond = urls.map((url) => {
		return `shExpMatch(url, '${url}')`;
	}).join(' || ');

	return `
		function FindProxyForURL(url, host) {
			if (${allowedHostsCond}) {
				return 'PROXY ${host}:${proxyPort}; DIRECT';
			}
			if (${allowedUrlCond}) {
				return 'PROXY ${host}:${proxyPort}; DIRECT';
			}
			return 'DIRECT';
		}
	`;
};
