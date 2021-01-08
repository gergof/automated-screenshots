export enum AgentType {
	android = 'android',
	ios = 'ios',
	web = 'web'
}

export interface AgentConfig {
	type: AgentType;
	output: string;
	startAppCommand: string;
	startAppTimeout: number;
}
