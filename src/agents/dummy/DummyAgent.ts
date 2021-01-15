import BaseAgent from '../BaseAgent';
import { AgentConfig } from '../types';
import Screenshot from '../../Screenshot';
import type { Message } from '../../types';

class DummyAgent extends BaseAgent {
	constructor(config: AgentConfig, port: number) {
		super(config, port);
		this.agentName = 'DummyAgent';
	}

	boot(): Promise<DummyAgent> {
		this.log('info', 'Agent booted');

		return this.startApp()
			.then(() => this.connectToClient())
			.then(() => this);
	}

	takeScreenshots(): Promise<DummyAgent> {
		return this.capturePack().then(() => this);
	}

	halt(): Promise<DummyAgent> {
		return this.stopClientManager().then(() => {
			this.log('done', 'Agent finished');
			return this;
		});
	}

	protected takeScreenshot(screenshot: Screenshot): Promise<void> {
		this.log(
			'warn',
			'Screenshot taken for:',
			`${screenshot.suite.name}/${screenshot.name}`
		);

		return Promise.resolve();
	}

	protected executeCommand(command: Message): Promise<void> {
		console.log('Execute command:', command);

		return Promise.resolve();
	}
}

export default DummyAgent;
