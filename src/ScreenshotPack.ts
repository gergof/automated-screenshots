import ScreenshotSuite from './ScreenshotSuite';
import Screenshot from './Screenshot';
import ClientManager from './ClientManager';

interface ScreenshotPackJson {
	suites: [
		{
			name: string;
			screenshots: [
				{
					name: string;
				}
			];
		}
	];
}

class ScreenshotPack {
	suites: ScreenshotSuite[] = [];
	clientManager: ClientManager;

	constructor(clientManager: ClientManager) {
		this.clientManager = clientManager;
	}

	loadFromJson(json: ScreenshotPackJson): ScreenshotPack {
		this.suites = json.suites.map(suite => {
			const screenshotSuite = new ScreenshotSuite(
				suite.name,
				this.clientManager
			);

			suite.screenshots.forEach(screenshot => {
				screenshotSuite.addScreenshot(
					new Screenshot(
						screenshot.name,
						screenshotSuite,
						this.clientManager
					)
				);
			});

			return screenshotSuite;
		});

		return this;
	}
}

export default ScreenshotPack;
