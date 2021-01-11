import ClientManager from './ClientManager';
import ScreenshotSuite from './ScreenshotSuite';
import { MessageType } from './types';

class Screenshot {
	name: string;
	clientManager: ClientManager;
	suite: ScreenshotSuite;

	constructor(
		name: string,
		suite: ScreenshotSuite,
		clientManager: ClientManager
	) {
		this.name = name;
		this.suite = suite;
		this.clientManager = clientManager;
	}

	prepare(): Promise<void> {
		return this.clientManager
			.executeCommand({
				type: MessageType.PrepareScreenshot,
				payload: `${this.suite.name}/${this.name}`
			})
			.then(() => {});
	}

	done(): Promise<void> {
		return this.clientManager
			.executeCommand({
				type: MessageType.ScreenshotDone,
				payload: `${this.suite.name}/${this.name}`
			})
			.then(() => {});
	}
}

export default Screenshot;
