import type { AgentConfig, AgentType } from '../types';

export interface IosAgentConfig extends AgentConfig {
	type: AgentType.ios;
	devices: string[];
	time?: number;
}
