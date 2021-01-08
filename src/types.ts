export enum MessageType {
	PrepareScreenshot = 'prepare',
	Ready = 'ready',
	ScreenshotDone = 'done'
}

export type Message = {
	type: MessageType;
	payload: string;
};
