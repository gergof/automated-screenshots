export enum AgentType {
	android = 'android',
	ios = 'ios',
	web = 'web',
	dummy = 'dummy'
}

export interface AgentConfig {
	type: AgentType;
	output: string;
	startAppCommand: string;
	startAppTimeout: number;
	asyncStartApp: boolean;
}
