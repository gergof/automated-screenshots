import { exec } from 'child_process';
import { AgentConfig } from './types';

abstract class BaseAgent {
	config: AgentConfig;

	constructor(config: AgentConfig) {
		this.config = config;
	}

	startApp(): Promise<BaseAgent> {
		return new Promise((resolve, reject) => {
			exec(
				this.config.startAppCommand,
				{
					timeout: this.config.startAppTimeout,
					killSignal: 'SIGKILL'
				},
				error => {
					if (error) {
						reject(error.message);
					}

					return this;
				}
			);
		});
	}

	abstract boot(): Promise<BaseAgent>;
}

export default BaseAgent;
