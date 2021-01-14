import { spawn, ChildProcess } from 'child_process';
import stream from 'stream';

import chalk from 'chalk';
import kill from 'tree-kill';

import ClientManager from '../ClientManager';
import ScreenshotPack from '../ScreenshotPack';
import Screenshot from '../Screenshot';
import ScreenshotSuite from '../ScreenshotSuite';

import { AgentConfig } from './types';

abstract class BaseAgent {
	agentName: string;
	config: AgentConfig;
	port: number;
	clientManager: ClientManager;

	constructor(config: AgentConfig, port: number) {
		this.config = config;
		this.port = port;
		this.clientManager = new ClientManager({ port });
		this.agentName = 'base';
	}

	protected startApp(): Promise<BaseAgent> {
		this.log('info', 'Starting application');
		return new Promise((resolve, reject) => {
			const proc = this.cmdSpawn(this.config.startAppCommand, []);

			const killTimeout = setTimeout(() => {
				if (proc.exitCode === null) {
					this.log('error', 'Stating application exceeded timeout');
					reject(new Error('startAppTimeout exceeded'));
					kill(proc.pid);
				}
			}, this.config.startAppTimeout);

			proc.on('exit', code => {
				clearTimeout(killTimeout);
				if (code != 0) {
					this.log(
						'error',
						'Failed to start application. Non-zero exit code:',
						code?.toString() || 'unknown'
					);
					reject(
						new Error(
							'Process exited with non-zero status code: ' +
								code?.toString()
						)
					);
					return;
				}

				resolve(this);
			});

			proc.on('error', error => {
				this.log(
					'error',
					'Failed to start application:',
					error.message
				);
			});
		});
	}

	protected connectToClient(): Promise<ScreenshotPack> {
		this.log('info', 'Connecting to client');
		return this.clientManager
			.listen()
			.then(cm => cm.waitForConnection())
			.then(cm => {
				this.log('info', 'Connected to client');
				return cm;
			})
			.catch(e => {
				this.log(
					'error',
					'Failed to initialize connection:',
					e.message
				);
				throw e;
			});
	}

	protected stopClientManager(): Promise<void> {
		this.log('info', 'Stopping client manager');
		return this.clientManager.shutdown();
	}

	protected log(
		level: 'info' | 'error' | 'done' | 'warn',
		...message: string[]
	): void {
		const levels = {
			info: chalk.blue.bold('[INFO ]'),
			error: chalk.red.bold('[ERROR]'),
			done: chalk.green.bold('[DONE ]'),
			warn: chalk.yellow.bold('[WARN ]')
		};

		console.log(
			levels[level],
			chalk.gray('[' + this.agentName + ']'),
			...message
		);
	}

	protected cmdExec(
		command: string,
		args: string[],
		yes = false
	): Promise<number> {
		return new Promise(resolve => {
			const proc = spawn(command, args, {
				shell: true,
				stdio: ['pipe', 'ignore', 'pipe']
			});

			if (yes) {
				this.cmdYes(proc.stdio[0]);
			}

			proc.stdio[2].on('data', chunk => {
				this.log(
					'warn',
					'Subprocess (' + command + '):',
					chunk.toString('utf-8').trim()
				);
			});

			proc.on('close', code => {
				resolve(code || 0);
			});
		});
	}

	protected cmdExecOutput(command: string, args: string[]): Promise<string> {
		return new Promise(resolve => {
			const proc = this.cmdSpawn(command, args, true);

			let output = '';

			proc.stdio[1]?.on('data', chunk => {
				output = output + chunk.toString('utf-8');
			});

			proc.on('close', () => {
				resolve(output);
			});
		});
	}

	protected cmdSpawn(
		command: string,
		args: string[],
		output = false
	): ChildProcess {
		const proc = spawn(command, args, {
			shell: true,
			stdio: ['ignore', output ? 'pipe' : 'ignore', 'pipe']
		});

		proc.stdio[2]?.on('data', chunk => {
			this.log(
				'warn',
				'Subprocess (' + command + '):',
				chunk.toString('utf-8').trim()
			);
		});

		return proc;
	}

	protected cmdYes(pipe: stream.Writable): void {
		for (let i = 0; i < 30; i++) {
			pipe.write('y');
		}
	}

	protected capturePack(): Promise<void> {
		if (this.clientManager.screenshotPack) {
			return this.clientManager.screenshotPack.suites.reduce(
				(p: Promise<void>, suite: ScreenshotSuite) => {
					return p.then(() => this.captureSuite(suite));
				},
				Promise.resolve()
			);
		}
		return Promise.resolve();
	}

	protected captureSuite(suite: ScreenshotSuite): Promise<void> {
		this.log('info', 'Capturing suite:', suite.name);
		return suite
			.prepare()
			.then(() => {
				return suite.screenshots.reduce(
					(p: Promise<void>, screenshot: Screenshot) => {
						return p.then(() => this.captureScreenshot(screenshot));
					},
					Promise.resolve()
				);
			})
			.then(() => suite.done())
			.then(() => this.log('done', 'Suite done:', suite.name));
	}

	protected captureScreenshot(screenshot: Screenshot): Promise<void> {
		this.log('info', 'Taking screenshot:', screenshot.name);
		return screenshot
			.prepare()
			.then(() => this.takeScreenshot(screenshot))
			.then(() => screenshot.done());
	}

	abstract boot(): Promise<BaseAgent>;
	abstract takeScreenshots(): Promise<BaseAgent>;
	abstract halt(): Promise<BaseAgent>;
	protected abstract takeScreenshot(screenshot: Screenshot): Promise<void>;
}

export default BaseAgent;
