import Screenshot from './Screenshot';
import ClientManager from './ClientManager';
import { MessageType } from './types';

class ScreenshotSuite {
	name: string;
	screenshots: Screenshot[] = [];
	clientManager: ClientManager;

	constructor(name: string, clientManager: ClientManager) {
		this.name = name;
		this.clientManager = clientManager;
	}

	addScreenshot(screenshot: Screenshot): void {
		this.screenshots.push(screenshot);
	}

	prepare(): Promise<void> {
		return this.clientManager
			.executeCommand({
				type: MessageType.PrepareSuite,
				payload: this.name
			})
			.then(() => {});
	}

	done(): Promise<void> {
		return this.clientManager
			.executeCommand({ type: MessageType.SuiteDone, payload: this.name })
			.then(() => {});
	}
}

export default ScreenshotSuite;
