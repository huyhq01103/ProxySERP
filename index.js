const MitmProxy = require('http-mitm-proxy');
const proxy = new MitmProxy();
const http = require('http');
const { promisify } = require('util');
const childProcess = require('child_process');
const chalk = require('chalk');
const yargs = require('yargs');
const inquirer = require('inquirer');
const genPac = require('./genpac.js');

const exec = promisify(childProcess.exec);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * Pac server
 * @param {number} port
 */
function runPacServer(port) {
	const server = http.createServer();

	server.on('request', (req, response) => {
		let host = req.headers.host.replace(/:.*$/, '');
		let pacFile = genPac({ proxyPort: 8008, host });

		console.log('somebody asked me --- ', chalk.blue(host));

		response.writeHead(200, { 'Content-Type': 'application/x-ns-proxy-autoconfig' });
		response.end(pacFile);
	});

	server.on('clientError', (err, socket) => {
		socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
	});

	server.listen(port);
}

/**
 * proxy events
 * @param {*} project
 * @param {*} composer
 */
function proxyEvent(project, composer) {
	console.log('Proxy for ', chalk.cyan(project), ' point to ', chalk.cyan(composer), ' composer.');
	console.log('');

	proxy.listen({ port: 8008, keepAlive: false });

	proxy.onError(function (ctx, err, errorKind) {
		// ctx may be null
		var url = (ctx && ctx.clientToProxyRequest) ? ctx.clientToProxyRequest.url : '';
		console.log(chalk.red(errorKind, 'in', err), chalk.yellow(url));
	});

	proxy.onRequest(function (ctx, callback) {
		const origPort = ctx.proxyToServerRequestOptions.port;
		const origAgent = ctx.proxyToServerRequestOptions.agent;

		ctx.use(MitmProxy.gunzip);

		let headers = ctx.clientToProxyRequest.headers;
		let url = ctx.clientToProxyRequest.url;

		ctx.proxyToServerRequestOptions.host = 'localhost';
		ctx.proxyToServerRequestOptions.port = 8080;

		console.log('host: ', chalk.green(headers.host), ' --- url: ', chalk.green(`${url.slice(0, 75)}...`));

		if (!headers.host.match(/coccoc.com/)) {
			return callback();
		}

		if (ctx.proxyToServerRequestOptions.agent.protocol === 'https:') {
			ctx.isSSL = false;
			ctx.proxyToServerRequestOptions.agent = proxy.httpAgent;
		}

		if (url.match(/search/) || headers.host.match(/hoctap.coccoc/)) {
			ctx.proxyToServerRequestOptions.port = 3000;
		}

		if (url.match(/\/log/)) {
			return ctx.proxyToClientResponse.end();
		}

		if (url.match(/\/composer/)) {
			let host = 'coccoc.com';
			let port = origPort;

			if (project === 'edu') {
				host = 'hoctap.coccoc.com';
			}

			if (composer === 'production') {
				ctx.isSSL = true;
				ctx.proxyToServerRequestOptions.agent = origAgent;
			} else {
				host = 'metasearcher1v.dev.itim.vn';
				port = composer;
			}

			ctx.proxyToServerRequestOptions.host = host;
			ctx.proxyToServerRequestOptions.port = port;
		}

		return callback();
	});
}

async function chooseProject() {
	const { project } = await inquirer.prompt([
		{
			type: 'list',
			name: 'project',
			message: '🏷  Which project do you want to proxy?',
			choices: ['search', 'edu']
		}
	]);

	return project;
}

async function chooseComposer() {
	const { composer } = await inquirer.prompt([
		{
			type: 'list',
			name: 'composer',
			message: '🏷  Which API port do you want to proxy?',
			choices: [
				'production',
				'9977 (knst)',
				'13521 (pchks)',
				'1215 (ducnd)',
				'61237 (duy nguyen)',
				'11175 (nam v do)',
				'2505 (minh.nguyen)',
				'2612 (long.lvt)',
				'9156 (hoanghc)',
				'7876 (son nguyen)',
				'5555 (cuong nguyen)',
				'1357 (an nguyen)'
			]
		}
	]);

	return composer;
}

async function main(argv) {
	let { project, composer } = argv;

	if (project === '@') {
		project = await chooseProject();
	}

	if (composer === '@') {
		composer = await chooseComposer();
		composer = composer.split(' ')[0];
	}

	runPacServer(8009);

	proxyEvent(project, composer);

	process.on('SIGINT', () => {
		console.log('terminating');
		exec('bash detach.sh');
		process.exit();
	});

	exec('bash attach.sh');
}

yargs
	.command({
		command: '$0',
		description: 'Proxy for search-frontend',
		builder: (command) => {
			return command.option('project', {
				default: 'search',
				describe: 'Project you are running!',
				type: 'string'
			}).option('composer', {
				default: 'production',
				describe: 'Composer port for API request!',
				type: 'string'
			});
		},
		handler: main,
	})
	.help()
	.strict(true)
	.version(false)
	.parse();
