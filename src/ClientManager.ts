import http, { Server as httpServer } from 'http';

import { server as WebSocketServer } from 'websocket';
import type { connection } from 'websocket';

import type { Message } from './types';
import ScreenshotPack from './ScreenshotPack';

export interface ClientManagerConfig {
	port: number;
}

class ClientManager {
	websocketPort: number;
	httpServer: httpServer | null = null;
	wsServer: WebSocketServer | null = null;
	client: connection | null = null;
	isInitialized = false;
	screenshotPack: ScreenshotPack | null = null;

	constructor(config: ClientManagerConfig) {
		this.websocketPort = config.port;
	}

	listen(): Promise<ClientManager> {
		this.isInitialized = false;
		this.screenshotPack = null;

		return new Promise(resolve => {
			this.httpServer = http.createServer((req, resp) => {
				resp.writeHead(404);
				resp.write('Only for websocket connections for the clients');
				resp.end();
			});

			this.wsServer = new WebSocketServer({
				httpServer: this.httpServer,
				autoAcceptConnections: false
			});

			this.httpServer.listen(this.websocketPort, () => {
				resolve(this);
			});
		});
	}

	waitForConnection(): Promise<ScreenshotPack> {
		return new Promise((resolve, reject) => {
			if (!this.wsServer) {
				reject();
				return;
			}

			this.wsServer.on('request', request => {
				if (this.client) {
					request.reject();
					return;
				}

				this.client = request.accept();

				this.client.on('message', message => {
					if (!this.isInitialized) {
						this.isInitialized = true;

						const pack = new ScreenshotPack(this);

						if (message.utf8Data) {
							pack.loadFromJson(JSON.parse(message.utf8Data));
						}

						this.screenshotPack = pack;
						resolve(pack);
					}
				});

				this.client.on('close', () => {
					this.isInitialized = false;
					this.screenshotPack = null;
					this.client = null;
				});
			});
		});
	}

	executeCommand(command: Message): Promise<Message> {
		return new Promise((resolve, reject) => {
			if (!this.client) {
				reject();
				return;
			}

			this.client.send(JSON.stringify(command));
			this.client.on('message', message => {
				if (!message.utf8Data) {
					reject('Client sent invalid response');
					return;
				}

				resolve(JSON.parse(message.utf8Data));
			});
		});
	}

	shutdown(): Promise<void> {
		return new Promise(resolve => {
			if (this.client) {
				this.client.close();
				this.client = null;
			}

			if (this.wsServer) {
				this.wsServer.shutDown();
				this.wsServer = null;
			}

			if (this.httpServer) {
				this.httpServer.close(() => {
					resolve();
				});
				this.httpServer = null;
			} else {
				resolve();
			}
		});
	}
}

export default ClientManager;
