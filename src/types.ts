export enum MessageType {
	PrepareSuite = 'prepare-suite',
	PrepareScreenshot = 'prepare-screenshot',
	Ready = 'ready',
	ScreenshotDone = 'done-screenshot',
	SuiteDone = 'done-suite',

	InputText = 'input-text',
	InputTouch = 'input-touch'
}

export type Message = {
	type: MessageType;
	payload?: string;
};
