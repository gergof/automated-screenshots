export enum MessageType {
	PrepareSuite = 'prepare-suite',
	PrepareScreenshot = 'prepare-screenshot',
	Ready = 'ready',
	ScreenshotDone = 'done-screenshot',
	SuiteDone = 'done-suite'
}

export type Message = {
	type: MessageType;
	payload?: string;
};
