import type { AgentConfig, AgentType } from '../types';

export interface Config extends AgentConfig {
	type: AgentType.android;
	paths: {
		adb: string;
		emulator: string;
		sdkManager: string;
		avdManager: string;
	};

	devices: [string];

	time?: string;
	clearNotifications?: boolean;
}
