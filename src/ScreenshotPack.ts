import ScreenshotSuite from './ScreenshotSuite';
import Screenshot from './Screenshot';

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

	loadFromJson(json: ScreenshotPackJson): ScreenshotPack {
		this.suites = json.suites.map(suite => {
			const screenshots: Screenshot[] = suite.screenshots.map(
				screenshot => new Screenshot(screenshot.name)
			);
			return new ScreenshotSuite(screenshots);
		});

		return this;
	}
}

export default ScreenshotPack;
